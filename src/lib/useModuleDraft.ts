import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type ModuleDraftName = "orion" | "pulse" | "haven";
type DraftStatus = "loading" | "empty" | "ready" | "signed-out" | "error";

/** Explicitly saved student-owned inputs; no implicit writes on mount or typing. */
export function useModuleDraft<T extends Record<string, unknown>>(moduleName: ModuleDraftName) {
  const [draft, setDraft] = useState<T | null>(null);
  const [status, setStatus] = useState<DraftStatus>("loading");
  const [error, setError] = useState("");
  const [uid, setUid] = useState("");

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
      unsubscribeDoc?.();
      unsubscribeDoc = undefined;
      setDraft(null);
      setError("");
      setUid(user?.uid ?? "");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      unsubscribeDoc = onSnapshot(doc(db, "module_drafts", user.uid), snap => {
        const saved = snap.exists() ? snap.data()[moduleName] : undefined;
        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
          setDraft(saved as T);
          setStatus("ready");
        } else {
          setDraft(null);
          setStatus("empty");
        }
      }, err => {
        setStatus("error");
        setError(err.code === "permission-denied" ? "Firestore không cho phép đọc bản nháp này." : "Không thể tải bản nháp từ Firestore.");
      });
    }, () => { setStatus("error"); setError("Lỗi xác thực Firebase."); });
    return () => { unsubscribeDoc?.(); unsubscribeAuth(); };
  }, [moduleName]);

  async function save(value: T): Promise<void> {
    if (!uid || auth.currentUser?.uid !== uid || status === "loading" || status === "error") {
      throw new Error("Chưa xác minh được tài khoản hoặc dữ liệu hiện tại. Không ghi đè bản nháp.");
    }
    await setDoc(doc(db, "module_drafts", uid), {
      userId: uid,
      schemaVersion: 1,
      [moduleName]: value,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  return { draft, status, error, save };
}
