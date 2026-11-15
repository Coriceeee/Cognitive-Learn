import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, runTransaction, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { auth, db } from "./firebase";
import { readProductConsent } from "./studentConsentPolicy";
import { STUDENT_CONSENT_GATE_ENABLED } from "./studentConsentConfig";
import { DEFAULT_COMPANION, isCompanionData, recordDailyCheckIn, type DailyCompanionData } from "./dailyCompanion";

type Status = "loading" | "empty" | "ready" | "error" | "signed-out" | "preview";
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

  useEffect(() => {
    if (!STUDENT_CONSENT_GATE_ENABLED) { setStatus("preview"); return; }
    let stopDoc: Unsubscribe | undefined;
    let stopConsent: Unsubscribe | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      stopDoc?.(); stopDoc = undefined;
      stopConsent?.(); stopConsent = undefined;
      setConsentAccepted(false);
      const currentUid = user?.uid ?? "";
      setUid(currentUid); setSettings(null); setError("");
      if (!currentUid) { setStatus("signed-out"); return; }
      setStatus("loading");
      stopConsent = onSnapshot(doc(db, "student_consents", currentUid), {includeMetadataChanges:true}, snapshot => {
        if (auth.currentUser?.uid !== currentUid) return;
        setConsentAccepted(!snapshot.metadata.fromCache
          && readProductConsent(snapshot.exists() ? snapshot.data() : null, currentUid) === "accepted");
      }, () => { if (auth.currentUser?.uid === currentUid) setConsentAccepted(false); });
      stopDoc = onSnapshot(docFor(currentUid), snapshot => {
        if (auth.currentUser?.uid !== currentUid) return;
        if (!snapshot.exists()) { setSettings(null); setStatus("empty"); setError(""); return; }
        const data = snapshot.data();
        if (!isCompanionData(data, currentUid)) {
          setSettings(null); setStatus("error"); setError("Dữ liệu Companion sai phiên bản; hệ thống không tự ghi đè."); return;
        }
        setSettings(data); setStatus("ready"); setError("");
      }, reason => {
        if (auth.currentUser?.uid !== currentUid) return;
        setSettings(null); setStatus("error"); setError(errorText(reason));
      });
    }, reason => { setSettings(null); setStatus("error"); setError(errorText(reason)); });
    return () => { stopDoc?.(); stopConsent?.(); stopAuth(); };
  }, []);

  async function update(transform: (current: DailyCompanionData) => DailyCompanionData) {
    if (busyRef.current) throw new Error("Có thay đổi đang được lưu.");
    if (!STUDENT_CONSENT_GATE_ENABLED || !consentAccepted) {
      throw new Error("Daily Companion chưa được kích hoạt hoặc bạn chưa đồng ý dùng dữ liệu sản phẩm.");
    }
    if (!uid || auth.currentUser?.uid !== uid || !["empty", "ready"].includes(status)) {
      throw new Error("Chưa xác minh được tài khoản hoặc dữ liệu, không thể ghi.");
    }
    busyRef.current = true; setBusy(true); setError("");
    try {
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(docFor(uid));
        if (snapshot.exists() && !isCompanionData(snapshot.data(), uid)) throw new Error("Dữ liệu đã lưu không đúng định dạng.");
        const current: DailyCompanionData = snapshot.exists()
          ? snapshot.data() as DailyCompanionData
          : { ...DEFAULT_COMPANION, schedule: {...DEFAULT_COMPANION.schedule}, completedDays: [], userId: uid };
        const next = transform(current);
        if (!isCompanionData(next, uid)) throw new Error("Cấu hình Companion không hợp lệ.");
        if (auth.currentUser?.uid !== uid) throw new Error("Tài khoản đã thay đổi, không lưu dữ liệu.");
        transaction.set(docFor(uid), { ...next, updatedAt: serverTimestamp() });
      });
    } catch (reason) {
      setError((reason as {code?: string})?.code ? errorText(reason) : reason instanceof Error ? reason.message : errorText(reason));
      throw reason;
    } finally { busyRef.current = false; setBusy(false); }
  }
  const saveSettings = (next: Pick<DailyCompanionData, "enabled" | "schedule" | "quietStart" | "quietEnd">) =>
    update(current => ({ ...current, ...next, schedule: {...next.schedule} }));
  const checkInToday = (today: string) =>
    update(current => ({...current, completedDays: recordDailyCheckIn(current.completedDays, today)}));
  return {uid, status, settings, error, busy, consentAccepted, saveSettings, checkInToday};
}
