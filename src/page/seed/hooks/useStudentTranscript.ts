import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { buildTranscriptView, type TranscriptView } from "../services/transcriptData";

type Status = "loading" | "signed-out" | "empty" | "ready" | "error";

/** Live owner-only listener: Dashboard and archive share one Firestore source. */
export function useStudentTranscript() {
  const [data, setData] = useState<TranscriptView | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  useEffect(() => {
    let stopProfile: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      stopProfile?.();
      stopProfile = undefined;
      setData(null);
      setError("");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      stopProfile = onSnapshot(doc(db, "learning_profiles", user.uid), snapshot => {
        if (!snapshot.exists()) { setData(null); setStatus("empty"); return; }
        const result = buildTranscriptView(snapshot.data());
        setData(result);
        setStatus(result.subjects.length ? "ready" : "empty");
      }, err => {
        console.error("CLA transcript listener failed", err);
        setData(null);
        setStatus("error");
        setError(err.code === "permission-denied"
          ? "Firestore từ chối đọc bảng điểm. Kiểm tra vai trò tài khoản và Security Rules."
          : "Không thể đồng bộ bảng điểm. Kiểm tra kết nối Firestore.");
      });
    }, () => { setStatus("error"); setError("Không đọc được trạng thái đăng nhập."); });
    return () => { stopProfile?.(); stopAuth(); };
  }, []);
  return { data, status, error };
}
