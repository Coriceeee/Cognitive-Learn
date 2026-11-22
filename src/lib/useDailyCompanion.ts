import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, runTransaction, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "./firebase";
import { readProductConsent } from "./studentConsentPolicy";
import { STUDENT_CONSENT_GATE_ENABLED } from "./studentConsentConfig";
import { DEFAULT_COMPANION, isCompanionData, recordDailyCheckIn, type DailyCompanionData } from "./dailyCompanion";
import { isServerConfirmedSnapshot } from "../page/seed/services/realtimeReadPolicy";

type Status = "loading" | "syncing" | "empty" | "ready" | "error" | "signed-out" | "preview";
const docFor = (uid: string) => doc(db, "daily_companion", uid);
const errorText = (error: unknown) => {
  const code = (error as {code?: string})?.code;
  return code === "permission-denied"
    ? "Không thể lưu Daily Companion: kiểm tra Rules ứng viên, quyền học sinh và đồng ý sử dụng dữ liệu. Chưa triển khai Rules thì chức năng đồng bộ bị khóa."
    : "Chưa thể đồng bộ Daily Companion với Firestore. Kiểm tra kết nối và thử lại.";
};

export function useDailyCompanion() {
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [settings, setSettings] = useState<DailyCompanionData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const busyRef = useRef(false);
  const authEpoch = useRef(0);

  useEffect(() => {
    if (!STUDENT_CONSENT_GATE_ENABLED) { setStatus("preview"); return; }
    let mounted = true;
    let stopDoc: Unsubscribe | undefined;
    let stopConsent: Unsubscribe | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      if (!mounted || (user?.uid ?? null) !== (auth.currentUser?.uid ?? null)) return;
      stopDoc?.(); stopDoc = undefined;
      stopConsent?.(); stopConsent = undefined;
      const epoch = ++authEpoch.current;
      const currentUid = user?.uid ?? "";
      const current = () => mounted && epoch === authEpoch.current && auth.currentUser?.uid === currentUid;
      setConsentAccepted(false);
      setUid(currentUid); setSettings(null); setError("");
      if (!currentUid) { setStatus("signed-out"); return; }
      setStatus("loading");
      stopConsent = onSnapshot(doc(db, "student_consents", currentUid), {includeMetadataChanges:true}, snapshot => {
        if (!current()) return;
        setConsentAccepted(isServerConfirmedSnapshot(snapshot.metadata)
          && readProductConsent(snapshot.exists() ? snapshot.data() : null, currentUid) === "accepted");
      }, () => { if (current()) setConsentAccepted(false); });
      stopDoc = onSnapshot(docFor(currentUid), {includeMetadataChanges:true}, snapshot => {
        if (!current()) return;
        if (!isServerConfirmedSnapshot(snapshot.metadata)) {
          // Never treat a cached schedule or locally pending write as committed.
          setSettings(null); setStatus("syncing"); return;
        }
        if (!snapshot.exists()) { setSettings(null); setStatus("empty"); setError(""); return; }
        const data = snapshot.data();
        if (!isCompanionData(data, currentUid)) {
          setSettings(null); setStatus("error"); setError("Dữ liệu Companion sai phiên bản; hệ thống không tự ghi đè."); return;
        }
        setSettings(data); setStatus("ready"); setError("");
      }, reason => {
        if (!current()) return;
        setSettings(null); setStatus("error"); setError(errorText(reason));
      });
    }, () => { if (mounted) { setSettings(null); setStatus("error"); setError("Lỗi xác thực Firebase."); } });
    return () => { mounted = false; authEpoch.current++; stopDoc?.(); stopConsent?.(); stopAuth(); };
  }, []);

  async function update(transform: (current: DailyCompanionData) => DailyCompanionData) {
    if (busyRef.current) throw new Error("Có thay đổi đang được lưu.");
    if (!STUDENT_CONSENT_GATE_ENABLED || !consentAccepted) {
      throw new Error("Daily Companion chưa được kích hoạt hoặc bạn chưa đồng ý dùng dữ liệu sản phẩm.");
    }
    if (!uid || auth.currentUser?.uid !== uid || !["empty", "ready"].includes(status)) {
      throw new Error("Chưa xác minh được tài khoản hoặc dữ liệu, không thể ghi.");
    }
    const owner = uid;
    const epoch = authEpoch.current;
    const current = () => epoch === authEpoch.current && auth.currentUser?.uid === owner;
    busyRef.current = true; setBusy(true); setError("");
    try {
      await runTransaction(db, async transaction => {
        if (!current()) throw new Error("Phiên tài khoản đã thay đổi.");
        const consent = await transaction.get(doc(db, "student_consents", owner));
        if (!current() || !consent.exists() || readProductConsent(consent.data(), owner) !== "accepted")
          throw new Error("Chưa xác minh được đồng ý sử dụng dữ liệu trên máy chủ.");
        const snapshot = await transaction.get(docFor(owner));
        if (snapshot.exists() && !isCompanionData(snapshot.data(), owner)) throw new Error("Dữ liệu đã lưu không đúng định dạng.");
        const current: DailyCompanionData = snapshot.exists()
          ? snapshot.data() as DailyCompanionData
          : { ...DEFAULT_COMPANION, schedule: {...DEFAULT_COMPANION.schedule}, completedDays: [], userId: owner };
        const next = transform(current);
        if (!isCompanionData(next, owner)) throw new Error("Cấu hình Companion không hợp lệ.");
        if (!current()) throw new Error("Tài khoản đã thay đổi, không lưu dữ liệu.");
        transaction.set(docFor(owner), { ...next, updatedAt: serverTimestamp() });
      });
    } catch (reason) {
      if (current()) setError((reason as {code?: string})?.code ? errorText(reason) : reason instanceof Error ? reason.message : errorText(reason));
      throw reason;
    } finally { busyRef.current = false; if (current()) setBusy(false); }
  }
  const saveSettings = (next: Pick<DailyCompanionData, "enabled" | "schedule" | "quietStart" | "quietEnd">) =>
    update(current => ({ ...current, ...next, schedule: {...next.schedule} }));
  const checkInToday = (today: string) =>
    update(current => ({...current, completedDays: recordDailyCheckIn(current.completedDays, today)}));
  return {uid, status, settings, error, busy, consentAccepted, saveSettings, checkInToday};
}
