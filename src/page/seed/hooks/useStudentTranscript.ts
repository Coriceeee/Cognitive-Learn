import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { buildTranscriptView, type TranscriptView } from "../services/transcriptData";

type Status = "loading" | "signed-out" | "empty" | "ready" | "error";
type Source = "student_transcripts" | "legacy" | null;


export function useStudentTranscript() {
  const [data, setData] = useState<TranscriptView | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [source, setSource] = useState<Source>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: Unsubscribe | undefined;
    let unsubscribeLegacy: Unsubscribe | undefined;
    let activeUid: string | null = null;
    const stopAuth = onAuthStateChanged(auth, user => {
      unsubscribeDoc?.(); unsubscribeLegacy?.();
      unsubscribeDoc = undefined; unsubscribeLegacy = undefined;
      activeUid = user?.uid ?? null;
      setUserId(activeUid);
      setData(null); setError(""); setSource(null);
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const uid = user.uid;
      const show = (raw: Record<string, unknown>, origin: Exclude<Source, null>) => {
        if (activeUid !== uid) return;
        setSource(origin);
        const view = buildTranscriptView(raw);
        const hasScores = view.terms.some(term => term.subjects.some(subject => subject.provisional !== null));
        setData(view);
        setStatus(hasScores ? "ready" : "empty");
      };
      const fail = (e: { code?: string }) => {
        if (activeUid !== uid) return;
        setData(null); setSource(null); setStatus("error");
        setError(e.code === "permission-denied"
          ? "Không thể đọc bảng điểm đã lưu. Hãy kiểm tra kết nối hoặc liên hệ hỗ trợ."
          : "Không thể tải bảng điểm từ Firestore.");
      };
      unsubscribeDoc = onSnapshot(doc(db, "student_transcripts", uid), snap => {
        if (activeUid !== uid) return;
        unsubscribeLegacy?.(); unsubscribeLegacy = undefined;
        if (snap.exists()) { show(snap.data(), "student_transcripts"); return; }

        unsubscribeLegacy = onSnapshot(doc(db, "learning_profiles", uid), legacy => {
          if (activeUid !== uid) return;
          if (!legacy.exists() || !legacy.data().transcript) {
            setData(null); setSource(null); setStatus("empty"); return;
          }
          show(legacy.data(), "legacy");
        }, fail);
      }, fail);
    }, () => { activeUid = null; setUserId(null); setData(null); setSource(null); setStatus("error"); setError("Không đọc được trạng thái đăng nhập."); });
    return () => { activeUid = null; unsubscribeDoc?.(); unsubscribeLegacy?.(); stopAuth(); };
  }, []);

  return { data, status, error, source, userId };
}
