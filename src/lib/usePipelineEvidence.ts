import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDocFromServer, getDocs, limit, orderBy, query, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { buildPipelineEvidence, type OwnDocuments, type PipelineEvidence } from "./pipelineEvidence";
import { buildPersistedPipelineEvidence } from "./pipelineEvidenceRecord";

/** Read-only, on-demand, own-UID Firestore check. No writes and no external AI calls. */
export function usePipelineEvidence() {
  const [result, setResult] = useState<PipelineEvidence | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const currentRequest = useRef(0);
  const checkedUid = useRef<string | null>(null);
  const recordPending = useRef(false);
  const [recordStatus, setRecordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [recordMessage, setRecordMessage] = useState("");

  useEffect(() => onAuthStateChanged(auth, () => {
    currentRequest.current += 1;
    checkedUid.current = null;
    setRecordStatus("idle");
    setRecordMessage("");
    setResult(null);
    setStatus("idle");
    setError("");
  }), []);

  const refresh = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    const request = ++currentRequest.current;
    checkedUid.current = null;
    setRecordStatus("idle");
    setRecordMessage("");
    setResult(null);
    setError("");
    if (!uid) {
      setStatus("error");
      setError("Cần đăng nhập trước khi kiểm tra dữ liệu liên thông.");
      return;
    }
    setStatus("loading");
    try {
      const accountSnap = await getDocFromServer(doc(db, "users", uid));
      const account = accountSnap.exists() ? accountSnap.data() : null;
      if (!account || account.active !== true || !["student", "admin"].includes(account.role)) {
        throw new Error("Tài khoản chưa kích hoạt hoặc không có quyền xem dữ liệu học sinh theo UID.");
      }
      const keys = ["learning_profiles", "student_transcripts", "orion_drafts", "pulse_drafts"] as const;
      const snapshots = await Promise.all(keys.map(key => getDocFromServer(doc(db, key, uid))));
      const documents: OwnDocuments = {};
      keys.forEach((key, i) => { if (snapshots[i].exists()) documents[key] = snapshots[i].data(); });
      const historyDocs = await getDocs(query(
        collection(db, "learning_profiles", uid, "cognitive_history"),
        orderBy("createdAt", "desc"), limit(10)
      ));
      // Keep only minimal metadata in memory: no scores, names, or raw records.
      documents.cognitive_history = historyDocs.docs.map(snapshot => {
        const data = snapshot.data();
        const time = data.createdAt;
        return {
          studentId: data.studentId,
          scoreAvailable: data.scoreAvailable,
          mappingVersion: data.mappingVersion,
          createdAt: time instanceof Timestamp ? time.toDate().toISOString() : time,
        };
      });
      if (currentRequest.current !== request || auth.currentUser?.uid !== uid) return;
      const evidence = buildPipelineEvidence(uid, documents, new Date().toISOString());
      checkedUid.current = uid;
      setResult(evidence);
      setStatus("idle");
    } catch (cause) {
      if (currentRequest.current !== request || auth.currentUser?.uid !== uid) return;
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Không thể xác minh dữ liệu Firestore từ máy chủ.");
    }
  }, []);

  const persist = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || checkedUid.current !== uid || status !== "idle" || !result || recordPending.current) {
      setRecordStatus("error");
      setRecordMessage("Hãy kiểm tra lại nguồn theo đúng tài khoản trước khi lưu minh chứng.");
      return;
    }
    // Validation is performed before any Firestore write. No user data is copied.
    let safeRecord: ReturnType<typeof buildPersistedPipelineEvidence>;
    try { safeRecord = buildPersistedPipelineEvidence(result); }
    catch (cause) {
      setRecordStatus("error");
      setRecordMessage(cause instanceof Error ? cause.message : "Minh chứng không hợp lệ.");
      return;
    }
    recordPending.current = true;
    setRecordStatus("saving");
    setRecordMessage("");
    try {
      const saved = await addDoc(collection(db, "pipeline_evidence", uid, "checks"), {
        ...safeRecord, createdAt: serverTimestamp(),
      });
      const verified = await getDocFromServer(saved);
      if (!verified.exists() || verified.data().recordType !== "technical-lineage") {
        throw new Error("Không thể xác nhận đã đọc lại Evidence Record từ Firestore.");
      }
      if (auth.currentUser?.uid !== uid || checkedUid.current !== uid) return;
      setRecordStatus("saved");
      setRecordMessage("Đã ghi và đọc lại bản ghi nguồn dữ liệu từ Firestore; không phải kết quả nghiên cứu.");
    } catch (cause) {
      if (auth.currentUser?.uid !== uid) return;
      setRecordStatus("error");
      setRecordMessage(cause instanceof Error ? cause.message : "Không thể lưu Evidence Record.");
    } finally {
      recordPending.current = false;
    }
  }, [result, status]);

  return { result, status, error, refresh, persist, recordStatus, recordMessage };
}
