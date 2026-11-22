import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { buildTranscriptView, type TranscriptView } from "../services/transcriptData";
import { isServerConfirmedSnapshot, isMatchingAccountRecord } from "../services/realtimeReadPolicy";
import { assessLegacyTranscript } from "../services/legacyTranscriptPolicy";

type Status = "loading" | "syncing" | "signed-out" | "empty" | "ready" | "error";
type Source = "student_transcripts" | "legacy" | null;

/**
 * CP30: never render offline-cache/pending data as a verified school transcript.
 * Session epochs also invalidate already-queued Firestore callbacks, including A -> B -> A.
 * This is a presentation/read guard; Firestore Rules remain the authority for access.
 */
export function useStudentTranscript() {
  const [data, setData] = useState<TranscriptView | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [source, setSource] = useState<Source>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [retryGeneration, setRetryGeneration] = useState(0);

  useEffect(() => {
    let unsubscribeDoc: Unsubscribe | undefined;
    let unsubscribeLegacy: Unsubscribe | undefined;
    let activeUid: string | null = null;
    let sessionEpoch = 0;
    let legacyEpoch = 0;
    const clearVisible = () => { setData(null); setSource(null); };
    const stopLegacy = () => { ++legacyEpoch; unsubscribeLegacy?.(); unsubscribeLegacy = undefined; };

    const stopAuth = onAuthStateChanged(auth, user => {
      ++sessionEpoch;
      const currentEpoch = sessionEpoch;
      unsubscribeDoc?.(); unsubscribeDoc = undefined;
      stopLegacy();
      activeUid = user?.uid ?? null;
      setUserId(activeUid);
      clearVisible(); setError("");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const uid = user.uid;
      const isCurrent = () => activeUid === uid && currentEpoch === sessionEpoch
        && auth.currentUser?.uid === uid;
      const show = (raw: Record<string, unknown>, origin: Exclude<Source, null>) => {
        if (!isCurrent()) return;
        if (!isMatchingAccountRecord(raw, uid)) {
          fail({ code: "invalid-owner" }); return;
        }
        const view = buildTranscriptView(raw);
        const hasScores = view.terms.some(term => term.subjects.some(subject => subject.provisional !== null));
        setSource(origin);
        setData(view);
        setStatus(hasScores ? "ready" : "empty");
      };
      const fail = (e: { code?: string }) => {
        if (!isCurrent()) return;
        stopLegacy();
        clearVisible(); setStatus("error");
        setError(e.code === "permission-denied"
          ? "Không có quyền đọc bảng điểm. Hãy kiểm tra tài khoản hoặc consent."
          : e.code === "invalid-owner"
            ? "Dữ liệu bảng điểm không khớp tài khoản đăng nhập. Đã ngừng hiển thị để bảo vệ dữ liệu."
            : e.code === "legacy-invalid"
              ? "Bảng điểm cũ có tổ hợp môn hoặc điểm không hợp lệ. Cần đối soát trước khi hiển thị; không tự chuyển dữ liệu cũ."
              : "Không thể xác minh bảng điểm từ Firestore. Hãy kiểm tra mạng và thử lại.");
      };
      unsubscribeDoc = onSnapshot(doc(db, "student_transcripts", uid),
        { includeMetadataChanges: true }, snap => {
          if (activeUid !== uid) return;
          if (!isCurrent()) return;
          if (!isServerConfirmedSnapshot(snap.metadata)) {
            // An unverified primary snapshot invalidates its legacy fallback.
            stopLegacy();
            clearVisible(); setStatus("syncing"); return;
          }
          if (snap.exists()) {
            // The canonical document now exists; a late legacy callback must
            // not overwrite it, even if that callback was already queued.
            stopLegacy();
            show(snap.data(), "student_transcripts"); return;
          }
          // Firestore can emit repeated, server-confirmed "missing" metadata
          // events. Keep the existing legacy listener and verified view rather
          // than resubscribing, flashing loading, and consuming extra reads.
          if (unsubscribeLegacy) return;
          clearVisible(); setStatus("loading");
          const capturedLegacyEpoch = legacyEpoch;
          unsubscribeLegacy = onSnapshot(doc(db, "learning_profiles", uid),
            { includeMetadataChanges: true }, legacy => {
              if (!isCurrent() || capturedLegacyEpoch !== legacyEpoch) return;
              if (!isServerConfirmedSnapshot(legacy.metadata)) {
                clearVisible(); setStatus("syncing"); return;
              }
              if (!legacy.exists() || !legacy.data().transcript) {
                clearVisible(); setStatus("empty"); return;
              }
              const assessment = assessLegacyTranscript(legacy.data(), uid);
              if (!assessment.readable) { fail({ code: "legacy-invalid" }); return; }
              show(legacy.data(), "legacy");
            }, fail);
        }, fail);
    }, () => {
      ++sessionEpoch; activeUid = null;
      unsubscribeDoc?.(); stopLegacy();
      setUserId(null); clearVisible(); setStatus("error");
      setError("Không đọc được trạng thái đăng nhập.");
    });
    return () => {
      ++sessionEpoch; activeUid = null;
      unsubscribeDoc?.(); stopLegacy(); stopAuth();
    };
  }, [retryGeneration]);

  const retry = () => {
    clearValueOnRetry();
    setRetryGeneration(value => value + 1);
  };
  function clearValueOnRetry() {
    setData(null); setSource(null); setError(""); setStatus("loading");
  }
  return { data, status, error, source, userId, retry };
}
