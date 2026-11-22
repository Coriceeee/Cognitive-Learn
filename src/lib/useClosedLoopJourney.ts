import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocsFromServer, onSnapshot, orderBy, query, limit, where, startAfter, runTransaction, serverTimestamp, type Unsubscribe, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { auth, db } from "./firebase";
import { assessJourneySnapshot } from "./journeySnapshotGate";
import { auditAdaptiveDecisionTrace, sameReviewCommit } from "./adaptiveNextCycle";
import {auditJourneyArchivePage, HISTORY_MAX_DISPLAY} from "./journeyHistoryArchive";
import { appendJourneyCheckIn, createJourneyCycle, isJourneyCycle, reassessJourneyCycle, isJourneyLock, type JourneyCycle, type JourneyDecisionTrace, type JourneyScenarioId, type JourneySubject } from "./closedLoopJourney";

type JourneyStatus = "loading" | "syncing" | "ready" | "empty" | "signed-out" | "error";
const root = "learning_journeys";
const cyclesPath = (uid: string) => collection(db, root, uid, "cycles");
// The fixed document serializes creates/finalizations across browser tabs and devices.
const lockPath = (uid: string) => doc(db, root, uid, "state", "current");
const errorMessage = (error: unknown) => {
  const code = (error as {code?: string})?.code;
  return code === "permission-denied"
    ? "Firestore từ chối ghi hoặc đọc chu kỳ. Kiểm tra Rules và đồng ý sử dụng dữ liệu; chưa triển khai Rules mới thì tính năng này chưa lưu được."
    : "Không thể đồng bộ chu kỳ học tập. Kiểm tra kết nối Firebase rồi thử lại.";
};

export function useClosedLoopJourney() {
  const [uid, setUid] = useState("");
  const [cycles, setCycles] = useState<JourneyCycle[]>([]);
  const [status, setStatus] = useState<JourneyStatus>("loading");
  const [error, setError] = useState("");
  const [olderCycles, setOlderCycles] = useState<JourneyCycle[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [recentFromServer, setRecentFromServer] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState("");
  const historyCursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const recentCursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const archiveGenerationRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // synchronous guard for rapid double clicks

  useEffect(() => {
    let stopFirestore: Unsubscribe | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      stopFirestore?.(); stopFirestore = undefined;
      archiveGenerationRef.current++;
      historyCursorRef.current=null;recentCursorRef.current=null;
      setOlderCycles([]);setHasMoreOlder(false);setRecentFromServer(false);
      setLoadingOlder(false);setOlderError("");
      setCycles([]); setUid(user?.uid ?? ""); setError("");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const currentUid = user.uid;
      // Retain limit(8): deployed and candidate Rules cap a student history query at eight.
      stopFirestore = onSnapshot(query(cyclesPath(currentUid), orderBy("startedAt", "desc"), limit(8)), { includeMetadataChanges: true }, snapshot => {
        if (auth.currentUser?.uid !== currentUid) return;
        archiveGenerationRef.current++;
        historyCursorRef.current=null;
        setOlderCycles([]);setOlderError("");setLoadingOlder(false);
        const pageDocs = snapshot.docs.slice(0, 8);
        const decision = assessJourneySnapshot(currentUid,
          pageDocs.map(record => ({ id: record.id, data: record.data() })), snapshot.metadata);
        if (decision.state === "WAITING_FOR_SERVER") {
          // Never display cached or pending student cycles as an authoritative handoff.
          setCycles([]); setHasMoreOlder(false); setRecentFromServer(false);
          recentCursorRef.current = null;
          setStatus("syncing"); setError(""); return;
        }
        if (decision.state === "INVALID") {
          setCycles([]); setHasMoreOlder(false); setRecentFromServer(false);
          recentCursorRef.current = null;
          setStatus("error");
          setError("Dữ liệu chu kỳ hoặc chủ sở hữu không nhất quán. Đã ẩn dữ liệu; không tự động ghi đè."); return;
        }
        recentCursorRef.current = pageDocs[pageDocs.length - 1] ?? null;
        setHasMoreOlder(pageDocs.length === 8);
        setRecentFromServer(true);
        setCycles(decision.cycles);
        setError("");
        setStatus(decision.state === "VERIFIED" ? "ready" : "empty");
      }, error => {
        if (auth.currentUser?.uid !== currentUid) return;
        archiveGenerationRef.current++;
        setCycles([]);setOlderCycles([]);setHasMoreOlder(false);setRecentFromServer(false);
        setStatus("error"); setError(errorMessage(error));
      });
    }, () => { setStatus("error"); setError("Không xác minh được phiên đăng nhập Firebase."); });
    return () => { stopFirestore?.(); stopAuth(); };
  }, []);

  async function loadOlder() {
    if(loadingOlderRef.current)throw new Error("Đang tải trang lịch sử khác.");
    const owner=uid;
    if(!owner || auth.currentUser?.uid!==owner || status!=="ready" ||
       !recentFromServer || !hasMoreOlder || cycles.length+olderCycles.length>=HISTORY_MAX_DISPLAY)
      throw new Error("Chưa đủ điều kiện tải thêm lịch sử từ máy chủ.");
    const cursor=historyCursorRef.current??recentCursorRef.current;
    if(!cursor)throw new Error("Không có con trỏ lịch sử hợp lệ.");
    const generation=archiveGenerationRef.current;
    loadingOlderRef.current=true;setLoadingOlder(true);setOlderError("");
    try {
      const result=await getDocsFromServer(query(cyclesPath(owner),orderBy("startedAt","desc"),startAfter(cursor),limit(8)));
      if(archiveGenerationRef.current!==generation || auth.currentUser?.uid!==owner)return;
      const audit=auditJourneyArchivePage(owner,[...cycles,...olderCycles],
        result.docs.map(record=>({id:record.id,data:record.data()})),true);
      if(audit.state==="BLOCKED"){
        setOlderCycles([]);setHasMoreOlder(false);historyCursorRef.current=null;
        setOlderError(`Trang lịch sử không nhất quán (${audit.reason}); đã ẩn dữ liệu lịch sử cũ.`);return;
      }
      setOlderCycles([...olderCycles,...audit.older]);
      setHasMoreOlder(audit.hasMore);
      if(audit.older.length) historyCursorRef.current=result.docs[audit.older.length-1];
    } catch(error) {
      if(archiveGenerationRef.current===generation && auth.currentUser?.uid===owner){
        setOlderCycles([]);setHasMoreOlder(false);historyCursorRef.current=null;
        setOlderError(errorMessage(error));
      }
    } finally {
      loadingOlderRef.current=false;
      if(archiveGenerationRef.current===generation)setLoadingOlder(false);
    }
  }

  const assertOwner = () => {
    if (!uid || auth.currentUser?.uid !== uid || !recentFromServer || !["ready", "empty"].includes(status)) {
      throw new Error("Chưa xác minh được tài khoản hoặc dữ liệu chu kỳ. Không ghi đè dữ liệu.");
    }
    return uid;
  };

  async function execute(action: () => Promise<void>) {
    if (busyRef.current) throw new Error("Đang lưu một thay đổi khác.");
    busyRef.current = true; setBusy(true); setError("");
    try { await action(); }
    catch (error) { setError((error as {code?: string})?.code ? errorMessage(error) : error instanceof Error ? error.message : errorMessage(error)); throw error; }
    finally { busyRef.current = false; setBusy(false); }
  }

  async function start(input: {
    scenarioId: JourneyScenarioId; scenarioTitle: string; targetMajor: string;
    subjects: JourneySubject[]; plannedWeeklyHours: number; weeksLeft: number; decisionTrace?: JourneyDecisionTrace;
  }) {
    return execute(async () => {
      const owner = assertOwner();
      if (cycles.some(c => c.status === "ACTIVE")) throw new Error("Cần tổng kết chu kỳ đang diễn ra trước khi bắt đầu chu kỳ mới.");
      // Detect v1 ACTIVE cycles outside the most-recent-eight UI window.
      // The fixed metadata lock below remains authoritative for concurrent creates.
      const existingActive = await getDocsFromServer(query(cyclesPath(owner), where("status", "==", "ACTIVE"), limit(1)));
      if (!existingActive.empty) throw new Error("Tài khoản vẫn có chu kỳ ACTIVE (có thể là dữ liệu bản cũ). Hãy tổng kết chu kỳ đó trước.");
      const reference = doc(cyclesPath(owner));
      const cycle = { ...createJourneyCycle({ ...input, id: reference.id, startedAt: new Date().toISOString() }), userId: owner,
        ...(input.decisionTrace ? { decisionTrace: input.decisionTrace } : {}) };
      if (auth.currentUser?.uid !== owner) throw new Error("Tài khoản đã thay đổi.");
      const stateReference = lockPath(owner);
      await runTransaction(db, async transaction => {
        const state = await transaction.get(stateReference);
        if (state.exists() && !isJourneyLock(state.data(), owner))
          throw new Error("Trạng thái chu kỳ không hợp lệ. Không ghi đè dữ liệu.");
        if (state.exists() && state.data().activeCycleId !== null)
          throw new Error("Tài khoản đang có một chu kỳ ACTIVE trên thiết bị khác.");
        if (cycle.decisionTrace) {
          if (!recentFromServer || !cycles.some(c=>c.id===cycle.decisionTrace?.sourceCycleId)) throw new Error("Cần đồng bộ gợi ý từ máy chủ trước khi lưu.");
          const prior = await transaction.get(doc(cyclesPath(owner), cycle.decisionTrace.sourceCycleId));
          if (!state.exists() || !sameReviewCommit(state.data().updatedAt, prior.data()?.updatedAt))
            throw new Error("Gợi ý thuộc chu kỳ cũ hoặc thiếu xác nhận máy chủ. Hãy tải lại và chọn lại.");
          if (prior.id !== cycle.decisionTrace.sourceCycleId || auditAdaptiveDecisionTrace(cycle, prior.data(), owner, true) !== "CONSISTENT")
            throw new Error("Nguồn gợi ý không khớp. Không lưu chu kỳ; hãy chọn lại.");
        }
        if (auth.currentUser?.uid !== owner) throw new Error("Tài khoản đã thay đổi.");
        const nextState = { userId: owner, schemaVersion: 1, activeCycleId: cycle.id, updatedAt: serverTimestamp() };
        transaction.set(stateReference, nextState);
        transaction.set(reference, { ...cycle, userId: owner,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
    });
  }

  async function mutate(cycleId: string, transform: (cycle: JourneyCycle) => JourneyCycle) {
    return execute(async () => {
      const owner = assertOwner();
      const reference = doc(cyclesPath(owner), cycleId);
      const stateReference = lockPath(owner);
      // Legacy v1 cycles had no lock. Claim one under a transaction first; never
      // overwrite an existing lock belonging to another ACTIVE cycle.
      await runTransaction(db, async transaction => {
        const state = await transaction.get(stateReference);
        const previous = await transaction.get(reference);
        if (!isJourneyCycle(previous.data()) || previous.data()?.userId !== owner || previous.id !== cycleId || previous.data()?.status !== "ACTIVE")
          throw new Error("Không tìm thấy chu kỳ đang thực hiện.");
        if (state.exists() && !isJourneyLock(state.data(), owner))
          throw new Error("Dữ liệu khóa chu kỳ không đúng định dạng.");
        if (state.exists() && state.data().activeCycleId === cycleId) return;
        if (state.exists() && state.data().activeCycleId !== null)
          throw new Error("Một chu kỳ khác đã giữ quyền cập nhật. Hãy tổng kết chu kỳ đó trước.");
        if (auth.currentUser?.uid !== owner) throw new Error("Tài khoản đã thay đổi.");
        if (state.exists()) transaction.update(stateReference, {
          activeCycleId: cycleId, updatedAt: serverTimestamp(),
        });
        else transaction.set(stateReference, { userId: owner, schemaVersion: 1,
          activeCycleId: cycleId, updatedAt: serverTimestamp() });
      });
      await runTransaction(db, async transaction => {
        const state = await transaction.get(stateReference);
        const snapshot = await transaction.get(reference);
        if (!state.exists() || !isJourneyLock(state.data(), owner) || state.data().activeCycleId !== cycleId)
          throw new Error("Chu kỳ không còn giữ quyền cập nhật.");
        const current = snapshot.exists() ? snapshot.data() : null;
        if (!isJourneyCycle(current) || current.userId !== owner || current.id !== cycleId) throw new Error("Không tìm thấy chu kỳ thuộc tài khoản hiện tại.");
        const next = transform(current);
        if (auth.currentUser?.uid !== owner) throw new Error("Tài khoản đã thay đổi.");
        transaction.update(reference, {
          status: next.status, checkIns: next.checkIns, reassessment: next.reassessment,
          ...(next.status === "REVIEWED" ? { evidenceRecord: next.evidenceRecord } : {}),
          updatedAt: serverTimestamp(),
        });
        if (next.status === "REVIEWED") transaction.update(stateReference, {
          activeCycleId: null, updatedAt: serverTimestamp(),
        });
      });
    });
  }

  const checkIn = (cycleId: string, input: {
    week: number; actualHours: number; completedActions: number; plannedActions: number; note: string;
  }) => mutate(cycleId, cycle => appendJourneyCheckIn(cycle, {
    ...input, id: doc(cyclesPath(uid)).id, recordedAt: new Date().toISOString(),
  }));
  const reassess = (cycleId: string, input: {
    observations: Array<{key: string; score: number}>; note: string;
  }) => mutate(cycleId, cycle => reassessJourneyCycle(cycle, {
    ...input, recordedAt: new Date().toISOString(),
  }));
  return { uid, cycles, olderCycles, hasMoreOlder, recentFromServer, loadingOlder, olderError, loadOlder,
    current: cycles.find(c => c.status === "ACTIVE") ?? null,
    latest: cycles[0] ?? null, status, error, busy, start, checkIn, reassess };
}
