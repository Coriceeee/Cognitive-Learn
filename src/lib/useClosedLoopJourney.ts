import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDocsFromServer, onSnapshot, orderBy, query, limit, where, runTransaction, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "./firebase";
import { appendJourneyCheckIn, createJourneyCycle, isJourneyCycle, reassessJourneyCycle, isJourneyLock, type JourneyCycle, type JourneyScenarioId, type JourneySubject } from "./closedLoopJourney";

type JourneyStatus = "loading" | "ready" | "empty" | "signed-out" | "error";
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
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // synchronous guard for rapid double clicks

  useEffect(() => {
    let stopFirestore: Unsubscribe | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      stopFirestore?.(); stopFirestore = undefined;
      setCycles([]); setUid(user?.uid ?? ""); setError("");
      if (!user) { setStatus("signed-out"); return; }
      setStatus("loading");
      const currentUid = user.uid;
      stopFirestore = onSnapshot(query(cyclesPath(currentUid), orderBy("startedAt", "desc"), limit(8)), snapshot => {
        if (auth.currentUser?.uid !== currentUid) return;
        const items = snapshot.docs.map(record => record.data());
        if (!items.every(isJourneyCycle)) {
          setStatus("error"); setError("Dữ liệu chu kỳ không đúng phiên bản, chưa tự động ghi đè."); return;
        }
        setCycles(items);
        setError("");
        setStatus(items.length ? "ready" : "empty");
      }, error => {
        if (auth.currentUser?.uid !== currentUid) return;
        setStatus("error"); setError(errorMessage(error));
      });
    }, () => { setStatus("error"); setError("Không xác minh được phiên đăng nhập Firebase."); });
    return () => { stopFirestore?.(); stopAuth(); };
  }, []);

  const assertOwner = () => {
    if (!uid || auth.currentUser?.uid !== uid || !["ready", "empty"].includes(status)) {
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
    subjects: JourneySubject[]; plannedWeeklyHours: number; weeksLeft: number;
  }) {
    return execute(async () => {
      const owner = assertOwner();
      if (cycles.some(c => c.status === "ACTIVE")) throw new Error("Cần tổng kết chu kỳ đang diễn ra trước khi bắt đầu chu kỳ mới.");
      // Detect v1 ACTIVE cycles outside the most-recent-eight UI window.
      // The fixed metadata lock below remains authoritative for concurrent creates.
      const existingActive = await getDocsFromServer(query(cyclesPath(owner), where("status", "==", "ACTIVE"), limit(1)));
      if (!existingActive.empty) throw new Error("Tài khoản vẫn có chu kỳ ACTIVE (có thể là dữ liệu bản cũ). Hãy tổng kết chu kỳ đó trước.");
      const reference = doc(cyclesPath(owner));
      const cycle = createJourneyCycle({ ...input, id: reference.id, startedAt: new Date().toISOString() });
      if (auth.currentUser?.uid !== owner) throw new Error("Tài khoản đã thay đổi.");
      const stateReference = lockPath(owner);
      await runTransaction(db, async transaction => {
        const state = await transaction.get(stateReference);
        if (state.exists() && !isJourneyLock(state.data(), owner))
          throw new Error("Trạng thái chu kỳ không hợp lệ. Không ghi đè dữ liệu.");
        if (state.exists() && state.data().activeCycleId !== null)
          throw new Error("Tài khoản đang có một chu kỳ ACTIVE trên thiết bị khác.");
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
        if (!isJourneyCycle(previous.data()) || previous.data()?.status !== "ACTIVE")
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
        if (!isJourneyCycle(current)) throw new Error("Không tìm thấy chu kỳ hợp lệ.");
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
  return { cycles, current: cycles.find(c => c.status === "ACTIVE") ?? null,
    latest: cycles[0] ?? null, status, error, busy, start, checkIn, reassess };
}
