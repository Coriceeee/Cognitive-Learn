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

  useEffect(() => {
    let unsubscribeDoc: Unsubscribe | undefined;
    let unsubscribeLegacy: Unsubscribe | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      unsubscribeDoc?.(); unsubscribeLegacy?.();
      unsubscribeDoc = undefined; unsubscribeLegacy = undefined;
      setData(null); setError(""); setSource(null);
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const uid = user.uid;
      const show = (raw: Record<string, unknown>, origin: Exclude<Source, null>) => {
        setSource(origin);
        const view = buildTranscriptView(raw);
        const hasScores = view.terms.some(term => term.subjects.some(subject => subject.provisional !== null));
        setData(view);
        setStatus(hasScores ? "ready" : "empty");
      };
      const fail = (e: { code?: string }) => {
        setData(null); setSource(null); setStatus("error");
        setError(e.code === "permission-denied"
          ? "Firestore từ chối đọc kho bảng điểm. Hãy kiểm tra Rules của student_transcripts."
          : "Không thể tải bảng điểm từ Firestore.");
      };
      unsubscribeDoc = onSnapshot(doc(db, "student_transcripts", uid), snap => {
        unsubscribeLegacy?.(); unsubscribeLegacy = undefined;
        if (snap.exists()) { show(snap.data(), "student_transcripts"); return; }

        unsubscribeLegacy = onSnapshot(doc(db, "learning_profiles", uid), legacy => {
          if (!legacy.exists() || !legacy.data().transcript) {
            setData(null); setSource(null); setStatus("empty"); return;
          }
          show(legacy.data(), "legacy");
        }, fail);
      }, fail);
    }, () => { setStatus("error"); setError("Không đọc được trạng thái đăng nhập."); });
    return () => { unsubscribeDoc?.(); unsubscribeLegacy?.(); stopAuth(); };
  }, []);

  return { data, status, error, source };
}
