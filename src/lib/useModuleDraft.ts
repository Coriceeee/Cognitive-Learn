import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "./firebase";

export type ModuleDraftName = "orion" | "pulse" | "haven";
type DraftStatus = "loading" | "empty" | "ready" | "signed-out" | "error";
const collections: Record<ModuleDraftName, string> = {
  orion: "orion_drafts", pulse: "pulse_drafts", haven: "haven_drafts",
};

export function useModuleDraft<T extends Record<string, unknown>>(moduleName: ModuleDraftName) {
  const [draft, setDraft] = useState<T | null>(null);
  const [status, setStatus] = useState<DraftStatus>("loading");
  const [error, setError] = useState("");
  const [uid, setUid] = useState("");

  useEffect(() => {
    let stopPrimary: Unsubscribe | undefined;
    let stopLegacy: Unsubscribe | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      stopPrimary?.(); stopLegacy?.();
      stopPrimary = undefined; stopLegacy = undefined;
      setUid(user?.uid ?? ""); setDraft(null); setError("");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const readValue = (value: unknown) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          setDraft(value as T); setStatus("ready");
        } else { setDraft(null); setStatus("empty"); }
      };
      const fail = (err: { code?: string }) => {
        setStatus("error");
        setError(err.code === "permission-denied"
          ? `Firestore từ chối truy cập ${collections[moduleName]}. Kiểm tra Security Rules.`
          : "Không thể tải bản nháp từ Firestore.");
      };
      stopPrimary = onSnapshot(doc(db, collections[moduleName], user.uid), snap => {
        stopLegacy?.(); stopLegacy = undefined;
        if (snap.exists()) { readValue(snap.data().data); return; }
        stopLegacy = onSnapshot(doc(db, "module_drafts", user.uid), legacy => {
          readValue(legacy.exists() ? legacy.data()[moduleName] : null);
        }, fail);
      }, fail);
    }, () => { setStatus("error"); setError("Lỗi xác thực Firebase."); });
    return () => { stopPrimary?.(); stopLegacy?.(); stopAuth(); };
  }, [moduleName]);

  async function save(value: T): Promise<void> {
    if (!uid || auth.currentUser?.uid !== uid || status === "loading" || status === "error") {
      throw new Error("Chưa xác minh được tài khoản hoặc dữ liệu hiện tại. Không ghi đè bản nháp.");
    }
    await setDoc(doc(db, collections[moduleName], uid), {
      userId: uid, schemaVersion: 1, data: value, updatedAt: serverTimestamp(),
    });
  }
  return { draft, status, error, save };
}
