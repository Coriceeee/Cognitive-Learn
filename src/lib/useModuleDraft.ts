import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "./firebase";
import { isMatchingAccountRecord, isServerConfirmedSnapshot } from "../page/seed/services/realtimeReadPolicy";
import { createDraftWriteQueue } from "./serializedDraftWrites";
import { isLeavingDraftWorkspace, registerNavigationGuard } from "./draftNavigationGuard";
import { assertDraftRefreshUninterrupted, currentDraftListener } from "./draftAsyncGuards";
import { assertDraftUnchanged, draftPayloadSignature, draftVersion, DraftConflictError, type DraftVersion } from "./draftRevision";
import { canUseLocalOrionDraftFallback, readLocalOrionDraft, writeLocalOrionDraft, type LocalOrionDraftRecord } from "./localOrionDraftStore";

export type ModuleDraftName = "orion" | "pulse" | "haven";
type DraftStatus = "loading" | "syncing" | "empty" | "ready" | "local" | "signed-out" | "error";
const collections: Record<ModuleDraftName, string> = {
  orion: "orion_drafts", pulse: "pulse_drafts", haven: "haven_drafts",
};
const noDocument: DraftVersion = { exists: false, revision: 0, signature: "" };

function localDraftVersion(record: LocalOrionDraftRecord | null): DraftVersion {
  if (!record) return noDocument;
  const signature = draftPayloadSignature(record.data);
  return { exists: true, revision: record.revision, signature, payloadSignature: signature };
}

async function hasLocalOrionFallbackConsent(uid: string): Promise<boolean> {
  try {
    const account = await getDocFromServer(doc(db, "users", uid));
    if (!account.exists()) return false;
    const accountData = account.data();
    if (accountData.active !== true) return false;
    if (accountData.role === "admin") return true;
    if (accountData.role !== "student") return false;
    const consent = await getDocFromServer(doc(db, "student_consents", uid));
    if (!consent.exists()) return false;
    const consentData = consent.data();
    return consentData.userId === uid
      && consentData.productAccepted === true
      && consentData.noticeVersion === "cla-student-privacy-v1";
  } catch {
    return false;
  }
}

export function useModuleDraft<T extends Record<string, unknown>>(moduleName: ModuleDraftName) {
  const [draft, setDraft] = useState<T | null>(null);
  const [status, setStatus] = useState<DraftStatus>("loading");
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [uid, setUid] = useState("");
  const writeQueue = useRef(createDraftWriteQueue());
  const baseline = useRef<DraftVersion>(noDocument);
  const latestRemote = useRef<T | null>(null);
  const latestVersion = useRef<DraftVersion>(noDocument);
  const editing = useRef(false);
  const editGeneration = useRef(0);
  const session = useRef(0);
  const observerEpoch = useRef(0);
  const conflictRef = useRef(false);
  const localOnly = useRef(false);

  // CP56: a 700ms Orion autosave timer (or manual Pulse/Haven edits) can be
  // interrupted by immediate SPA navigation. Never silently discard changes.
  // Internal links, imperative navigation and browser Back share one guard;
  // beforeunload covers hard refresh/external navigation as well.
  useEffect(() => {
    const unregister = registerNavigationGuard((_from, to) => {
      if (!editing.current || !isLeavingDraftWorkspace(moduleName, to)) return true;
      return window.confirm("Bạn có thay đổi chưa lưu. Rời trang sẽ mất những thay đổi này. Bạn có muốn tiếp tục?");
    });
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!editing.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => {
      unregister();
      window.removeEventListener("beforeunload", warnBeforeUnload);
    };
  }, [moduleName]);

  useEffect(() => {
    let mounted = true;
    let stopPrimary: Unsubscribe | undefined;
    let stopLegacy: Unsubscribe | undefined;
    // Unsubscribing does not necessarily invalidate a Firestore callback that
    // has already been queued. A separate generation prevents a late legacy
    // snapshot/error from overwriting a confirmed canonical draft.
    let legacyEpoch = 0;
    const stopLegacyListener = () => {
      legacyEpoch += 1;
      stopLegacy?.();
      stopLegacy = undefined;
    };
    const stopAuth = onAuthStateChanged(auth, user => {
      if (!mounted || (user?.uid ?? null) !== (auth.currentUser?.uid ?? null)) return;
      stopPrimary?.(); stopLegacyListener();
      stopPrimary = undefined;
      session.current += 1;
      observerEpoch.current += 1;
      const listenerEpoch = observerEpoch.current;
      const currentListener = () => currentDraftListener(
        user?.uid ?? "", listenerEpoch, auth.currentUser?.uid, observerEpoch.current, mounted,
      );
      editing.current = false;
      localOnly.current = false;
      editGeneration.current = 0;
      conflictRef.current = false;
      setConflict(false);
      baseline.current = noDocument;
      latestVersion.current = noDocument;
      latestRemote.current = null;
      setUid(user?.uid ?? ""); setDraft(null); setError("");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const readValue = (value: unknown, version: DraftVersion) => {
        if (!currentListener()) return;
        setError("");
        latestVersion.current = version;
        latestRemote.current = value && typeof value === "object" && !Array.isArray(value) ? value as T : null;
        // Snapshots from another device must not replace a student's unsaved inputs.
        if (!editing.current && !conflictRef.current) {
          baseline.current = version;
          setDraft(latestRemote.current);
        }
        setStatus(latestRemote.current ? "ready" : "empty");
      };
      // Cache and locally pending writes are NOT verified Firestore data.
      // Never report them as synchronized or use their version as a CAS baseline.
      const waitForServer = () => {
        if (!currentListener()) return;
        if (!editing.current) {
          setDraft(null);
          latestRemote.current = null;
          latestVersion.current = noDocument;
          baseline.current = noDocument;
        }
        setStatus("syncing");
      };
      const fail = (err: { code?: string }) => {
        if (!currentListener()) return;
        stopLegacyListener();
        if (err.code === "permission-denied" && moduleName === "orion" && canUseLocalOrionDraftFallback()) {
          void (async () => {
            const allowed = await hasLocalOrionFallbackConsent(user.uid);
            if (!allowed || !currentListener()) return false;
            const local = await readLocalOrionDraft<T>(user.uid);
            if (!currentListener()) return false;
            localOnly.current = true;
            const value = local?.data ?? null;
            const version = localDraftVersion(local);
            latestVersion.current = version;
            latestRemote.current = value;
            baseline.current = version;
            if (local && editing.current) {
              conflictRef.current = true;
              setConflict(true);
            } else if (!editing.current) {
              setDraft(value);
            }
            setStatus("local");
            setError("");
            return true;
          })().then(activated => {
            if (activated || !currentListener()) return;
            if (!editing.current) setDraft(null);
            setStatus("error");
            setError("Firestore đang từ chối quyền Orion. Chế độ lưu local chỉ bật khi tài khoản còn hoạt động và đã chấp nhận điều khoản sản phẩm.");
          }).catch(() => {
            if (!currentListener()) return;
            if (!editing.current) setDraft(null);
            setStatus("error");
            setError("Không mở được kho Orion cục bộ. Hãy bật IndexedDB hoặc dùng trình duyệt hiện đại.");
          });
          return;
        }
        if (!editing.current) setDraft(null);
        setStatus("error");
        setError(err.code === "permission-denied"
          ? `Firestore từ chối truy cập ${collections[moduleName]}. Kiểm tra Security Rules.`
          : err.code === "invalid-owner"
            ? "Bản nháp không khớp tài khoản đăng nhập; đã ngừng đồng bộ để bảo vệ dữ liệu."
            : "Không thể tải dữ liệu đã lưu. Hãy kiểm tra kết nối và thử lại.");
      };
      stopPrimary = onSnapshot(doc(db, collections[moduleName], user.uid),
        { includeMetadataChanges: true }, snap => {
        if (!currentListener()) return;
        if (!isServerConfirmedSnapshot(snap.metadata)) {
          stopLegacyListener();
          waitForServer(); return;
        }
        if (snap.exists()) {
          stopLegacyListener();
          if (!isMatchingAccountRecord(snap.data(), user.uid)) {
            fail({code: "invalid-owner"}); return;
          }
          readValue(snap.data().data, draftVersion(snap.data())); return;
        }
        // Migration: legacy module_drafts is read-only; first CAS write creates new doc.
        // Metadata events from the primary listener must not restart this listener.
        if (stopLegacy) return;
        setStatus("loading");
        const capturedLegacyEpoch = legacyEpoch;
        stopLegacy = onSnapshot(doc(db, "module_drafts", user.uid),
          { includeMetadataChanges: true }, legacy => {
          if (!currentListener() || capturedLegacyEpoch !== legacyEpoch) return;
          if (!isServerConfirmedSnapshot(legacy.metadata)) { waitForServer(); return; }
          if (legacy.exists() && !isMatchingAccountRecord(legacy.data(), user.uid)) {
            fail({code: "invalid-owner"}); return;
          }
          readValue(legacy.exists() ? legacy.data()[moduleName] : null, noDocument);
        }, err => {
          if (!currentListener() || capturedLegacyEpoch !== legacyEpoch) return;
          fail(err);
        });
      }, fail);
    }, () => { if (mounted) { setStatus("error"); setError("Lỗi xác thực Firebase."); } });
    return () => { mounted = false; observerEpoch.current += 1; stopPrimary?.(); stopLegacyListener(); stopAuth(); session.current += 1; };
  }, [moduleName]);

  // Call before each local input mutation. This freezes the last acknowledged
  // remote version as the base for optimistic compare-and-swap.
  function markEditing() {
    editing.current = true;
    editGeneration.current += 1;
  }

  async function acceptRemote(): Promise<T | null> {
    // A remote reload is a destructive action for unsaved inputs. Serialize it
    // behind pending saves so it cannot read a stale server copy while a local
    // transaction is still committing, and cancel writes queued behind it.
    const ownerUid = uid;
    if (!ownerUid || auth.currentUser?.uid !== ownerUid) {
      throw new Error("Không thể tải bản nháp khi phiên đăng nhập đã thay đổi.");
    }
    const requestSession = session.current;
    const requestEdits = editGeneration.current;
    return writeQueue.current.enqueue(async () => {
      if (auth.currentUser?.uid !== ownerUid || session.current !== requestSession) {
        throw new Error("Phiên đã thay đổi trước khi tải bản nháp.");
      }
      assertDraftRefreshUninterrupted(requestEdits, editGeneration.current);
      if (localOnly.current) {
        const allowed = await hasLocalOrionFallbackConsent(ownerUid);
        if (!allowed) throw new Error("Không còn quyền đồng ý hoặc tài khoản hoạt động để đọc bản nháp local.");
        const local = await readLocalOrionDraft<T>(ownerUid);
        if (auth.currentUser?.uid !== ownerUid || requestSession !== session.current) {
          throw new Error("Phiên đã thay đổi trong khi tải bản nháp cục bộ.");
        }
        assertDraftRefreshUninterrupted(requestEdits, editGeneration.current);
        const value = local?.data ?? null;
        const version = localDraftVersion(local);
        session.current += 1;
        editing.current = false;
        conflictRef.current = false;
        setConflict(false);
        latestRemote.current = value;
        latestVersion.current = version;
        baseline.current = version;
        setDraft(value ? { ...value } : null);
        setStatus("local");
        setError("");
        return value;
      }

      const current = await getDocFromServer(doc(db, collections[moduleName], ownerUid));
      let value: T | null = null;
      let version = noDocument;
      if (current.exists()) {
        const data = current.data();
        if (!isMatchingAccountRecord(data, ownerUid)) {
          throw new Error("Bản nháp trên máy chủ không khớp tài khoản đăng nhập.");
        }
        version = draftVersion(data);
        value = data.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data as T : null;
      } else {
        const legacy = await getDocFromServer(doc(db, "module_drafts", ownerUid));
        if (legacy.exists() && !isMatchingAccountRecord(legacy.data(), ownerUid)) {
          throw new Error("Dữ liệu cũ không khớp tài khoản đăng nhập.");
        }
        const candidate = legacy.exists() ? legacy.data()[moduleName] : null;
        value = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate as T : null;
      }
      if (auth.currentUser?.uid !== ownerUid || requestSession !== session.current) {
        throw new Error("Phiên đã thay đổi trong khi tải bản nháp.");
      }
      assertDraftRefreshUninterrupted(requestEdits, editGeneration.current);
      session.current += 1; // cancel older queued writes; listener epoch is not changed
      editing.current = false;
      conflictRef.current = false;
      setConflict(false);
      latestRemote.current = value;
      latestVersion.current = version;
      baseline.current = version;
      setDraft(value ? { ...value } : null);
      setStatus(value ? "ready" : "empty");
      return value;
    });
  }

  async function save(value: T): Promise<void> {
    if (!uid || auth.currentUser?.uid !== uid || (status !== "ready" && status !== "empty" && status !== "local")) {
      throw new Error("Chưa xác minh được tài khoản hoặc dữ liệu hiện tại. Không ghi đè bản nháp.");
    }
    if (conflictRef.current) throw new DraftConflictError();
    const ownerUid = uid;
    const queuedSession = session.current;
    const queuedEdit = editGeneration.current;
    await writeQueue.current.enqueue(async () => {
      if (auth.currentUser?.uid !== ownerUid) {
        throw new Error("Tài khoản đã thay đổi; không ghi bản nháp vào tài khoản cũ.");
      }
      if (session.current !== queuedSession) {
        throw new Error("Phiên dữ liệu đã thay đổi; thao tác ghi bị hủy.");
      }
      if (conflictRef.current) throw new DraftConflictError();
      if (localOnly.current) {
        const allowed = await hasLocalOrionFallbackConsent(ownerUid);
        if (!allowed) throw new Error("Không còn quyền đồng ý hoặc tài khoản hoạt động để lưu bản nháp local.");
        const local = await writeLocalOrionDraft(ownerUid, value, baseline.current.revision);
        if (auth.currentUser?.uid !== ownerUid || session.current !== queuedSession) return;
        const version = localDraftVersion(local);
        baseline.current = version;
        latestVersion.current = version;
        latestRemote.current = value;
        setStatus("local");
        setError("");
        if (queuedEdit === editGeneration.current) {
          editing.current = false;
          setDraft(value);
        }
        return;
      }
      const ref = doc(db, collections[moduleName], ownerUid);
      const expected = baseline.current;
      try {
        const nextRevision = await runTransaction(db, async transaction => {
          const current = await transaction.get(ref);
          if (auth.currentUser?.uid !== ownerUid || session.current !== queuedSession) {
            throw new Error("Phiên đăng nhập đã đổi trước khi transaction được ghi.");
          }
          const stored = current.exists() ? current.data() : null;
          assertDraftUnchanged(expected, draftVersion(stored));
          const revision = expected.revision + 1;
          transaction.set(ref, {
            userId: ownerUid, schemaVersion: 1, revision,
            data: value, updatedAt: serverTimestamp(),
          });
          return revision;
        });
        if (auth.currentUser?.uid !== ownerUid || session.current !== queuedSession) return;
        // Advance our acknowledged token even when an edit arrived during save.
        // Server timestamp is not known yet; retain the acknowledged payload
        // so an out-of-band writer reusing the revision cannot pass CAS.
        baseline.current = {
          exists: true, revision: nextRevision, signature: "",
          payloadSignature: draftPayloadSignature(value),
        };
        if (queuedEdit === editGeneration.current) {
          editing.current = false;
          setDraft(value);
        }
      } catch (err) {
        if (err instanceof DraftConflictError && session.current === queuedSession) {
          conflictRef.current = true;
          setConflict(true);
        }
        const errorCode = err && typeof err === "object" && "code" in err
          ? (err as { code?: unknown }).code
          : undefined;
        if (errorCode === "permission-denied" && moduleName === "orion" && canUseLocalOrionDraftFallback()) {
          const allowed = await hasLocalOrionFallbackConsent(ownerUid);
          if (allowed && auth.currentUser?.uid === ownerUid && session.current === queuedSession) {
            const local = await readLocalOrionDraft<T>(ownerUid);
            if (auth.currentUser?.uid === ownerUid && session.current === queuedSession) {
              localOnly.current = true;
              const localVersion = localDraftVersion(local);
              baseline.current = localVersion;
              latestVersion.current = localVersion;
              latestRemote.current = local?.data ?? null;
              setStatus("local");
              setError("");
              if (local) {
                if (!editing.current) setDraft(local.data);
                conflictRef.current = true;
                setConflict(true);
                throw new DraftConflictError();
              }
              const saved = await writeLocalOrionDraft(ownerUid, value, 0);
              if (auth.currentUser?.uid !== ownerUid || session.current !== queuedSession) return;
              const version = localDraftVersion(saved);
              baseline.current = version;
              latestVersion.current = version;
              latestRemote.current = value;
              if (queuedEdit === editGeneration.current) {
                editing.current = false;
                setDraft(value);
              }
              return;
            }
          }
        }
        if (errorCode === "permission-denied") {
          throw new Error(
            `Firestore Rules đang từ chối ghi ${collections[moduleName]}. Không mở quyền công khai. Kiểm tra tài khoản đang hoạt động, đúng UID sở hữu bản nháp và quyền đồng ý sử dụng sản phẩm trên máy chủ (student_consents.productAccepted=true, noticeVersion=cla-student-privacy-v1). Nếu các điều kiện đã đúng, Rules Production cần được bổ sung quyền owner-only cho ${collections[moduleName]}.`,
          );
        }
        throw err;
      }
    });
  }
  return { draft, status, error, uid, conflict, save, markEditing, acceptRemote, isLocalOnly: () => localOnly.current };
}
