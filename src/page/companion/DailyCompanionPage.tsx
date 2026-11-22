import { useEffect, useMemo, useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { enableCompanionWebPush, disableCompanionWebPush, localPushOwner, webPushAvailable, webPushConfigured } from "../../lib/companionWebPush";
import { useClosedLoopJourney } from "../../lib/useClosedLoopJourney";
import { useDailyCompanion } from "../../lib/useDailyCompanion";
import { DEFAULT_COMPANION, REMINDER_LABELS, isClock, localDateKey, recentDailyDates, reminderDue,
  type DailyCompanionData, type ReminderKind } from "../../lib/dailyCompanion";
import "../../styles.css";

const kinds: ReminderKind[] = ["morning", "study", "checkIn"];
const today = () => localDateKey(new Date());
const notificationStatus = () => typeof Notification === "undefined" ? "unsupported" : Notification.permission;

export default function DailyCompanionPage() {
  const companion = useDailyCompanion();
  const journey = useClosedLoopJourney();
  const [draft, setDraft] = useState<Pick<DailyCompanionData,"enabled"|"schedule"|"quietStart"|"quietEnd">>({
    enabled: DEFAULT_COMPANION.enabled, schedule: {...DEFAULT_COMPANION.schedule},
    quietStart: DEFAULT_COMPANION.quietStart, quietEnd: DEFAULT_COMPANION.quietEnd,
  });
  const [notice, setNotice] = useState("");
  const [browserPermission, setBrowserPermission] = useState(notificationStatus());
  const [clock, setClock] = useState(() => new Date());
  const [pushActive, setPushActive] = useState(false);
  useEffect(() => {setPushActive(!!companion.uid && localPushOwner(companion.uid));}, [companion.uid]);
  useEffect(() => {
    if (companion.status === "ready" && !companion.consentAccepted && pushActive) {
      void disableCompanionWebPush(companion.uid).finally(()=>setPushActive(false));
    }
  }, [companion.uid, companion.status, companion.consentAccepted, pushActive]);
  useEffect(() => {
    const stored = companion.settings ?? DEFAULT_COMPANION;
    setDraft({enabled: stored.enabled, schedule: {...stored.schedule}, quietStart: stored.quietStart, quietEnd: stored.quietEnd});
  }, [companion.uid, companion.settings]);
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!companion.settings || companion.status !== "ready" || !companion.uid || !companion.consentAccepted) return;
    const due = reminderDue(companion.settings, clock);
    for (const kind of due) {
      // A small per-device marker prevents duplicates across reloads/tabs; no grades or private messages stored.
      const key = `cla-companion-reminder-v1-${companion.uid}-${kind}`;
      const marker = `${localDateKey(clock)}:${companion.settings.schedule[kind]}`;
      try {
        if (window.localStorage.getItem(key) === marker) continue;
        window.localStorage.setItem(key, marker);
      } catch { /* Private browsing may disable localStorage. */ }
      setNotice(REMINDER_LABELS[kind]);
      if (notificationStatus() === "granted" && !pushActive) {
        const body = "Mở CLA để xem kế hoạch và ghi nhận tiến độ. Nội dung cá nhân không xuất hiện trên màn hình khóa.";
        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.getRegistration("/").then(registration => {
            if (registration) return registration.showNotification("CLA · Daily Companion", {body, tag: `cla-daily-${kind}`});
            if (typeof Notification !== "undefined") new Notification("CLA · Daily Companion", {body, tag: `cla-daily-${kind}`});
          }).catch(() => {});
        } else {
          try { new Notification("CLA · Daily Companion", {body, tag: `cla-daily-${kind}`}); } catch { /* mobile without worker */ }
        }
      }
    }
  }, [clock, companion.settings, companion.status, companion.uid, companion.consentAccepted, pushActive]);

  const dates = useMemo(() => recentDailyDates(clock), [clock]);
  const completed = companion.settings?.completedDays ?? [];
  const doneToday = completed.includes(today());
  const currentPlan = journey.current;
  const save = async () => {
    setNotice("");
    if (![...kinds.map(kind => draft.schedule[kind]), draft.quietStart, draft.quietEnd].every(isClock)) {
      setNotice("Giờ nhắc không hợp lệ, cần định dạng HH:mm."); return;
    }
    try {
      await companion.saveSettings(draft);
      setNotice("Đã lưu lịch nhắc và đồng bộ với tài khoản Firebase.");
    } catch { setNotice("Lưu chưa thành công; kiểm tra cảnh báo Firestore phía dưới."); }
  };
  const checkIn = async () => {
    setNotice("");
    try {
      await companion.checkInToday(today());
      setNotice("Đã ghi nhận check-in hôm nay (tự báo cáo). Có thể cập nhật chi tiết tại Pulse.");
    } catch { setNotice("Chưa lưu được check-in. Kiểm tra quyền dữ liệu và kết nối."); }
  };
  const requestBrowserPermission = async () => {
    if (!companion.consentAccepted) { setNotice("Cần kích hoạt Consent Gate và xác nhận quyền dữ liệu trước khi bật thông báo."); return; }
    if (typeof Notification === "undefined" || !window.isSecureContext) {
      setNotice("Trình duyệt này chưa hỗ trợ thông báo hoặc trang chưa chạy qua HTTPS/localhost."); return;
    }
    // Explicit user gesture only: never ask for notification permission on page load.
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission !== "granted") { setNotice("Trình duyệt chưa cấp quyền. Bạn vẫn có thể xem lời nhắc trong trang khi đang mở."); return; }
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/cla-companion-sw.js", {scope: "/"});
      }
      setNotice("Đã cấp quyền thông báo trên thiết bị này. Cần bật lịch nhắc và mở CLA tại giờ đã chọn.");
    } catch { setNotice("Thiết bị không thể đăng ký thông báo. Có thể tiếp tục dùng check-in trên web."); }
  };

  const startBackgroundPush = async () => {
    setNotice("");
    try {
      await enableCompanionWebPush(companion.uid, companion.consentAccepted, !!companion.settings?.enabled);
      setPushActive(true);
      setBrowserPermission(notificationStatus());
      setNotice("Đã đăng ký Web Push cho thiết bị này. Nhắc nền chỉ chạy sau khi dịch vụ Cloud Functions được triển khai và bật an toàn.");
    } catch(error) {setNotice(error instanceof Error ? error.message : "Không đăng ký được Web Push.");}
  };
  const stopBackgroundPush = async () => {
    setNotice("");
    try {await disableCompanionWebPush(companion.uid);setNotice("Đã tắt Web Push trên thiết bị này.");}
    catch(error){setNotice(error instanceof Error ? error.message : "Chưa đồng bộ được việc tắt nhắc nền.");}
    finally {setPushActive(false);}
  };

  return <main className="cla-companion-page">
    <header className="cla-companion-top"><a href="/student" aria-label="Về không gian học sinh"><img src={appLogo} alt="Cognitive Learn AI" /></a><UserMenu /></header>
    <div className="cla-companion-container">
      <section className="cla-companion-hero">
        <span className="cla-companion-kicker">COGNITIVE LEARN AI / DAILY COMPANION · V1</span>
        <h1>Học mỗi ngày, có CLA đồng hành.</h1>
        <p>Lập kế hoạch ở Orion, ghi hành động tại Pulse, xem tiến bộ trong Lumen. Daily Companion giúp bạn nhớ thời điểm và ghi nhận việc đã làm — không tạo áp lực bằng những thông báo liên tục.</p>
        <div className="cla-companion-links"><a href="/orion/scenarios#cla-closed-loop">Kế hoạch Orion</a><a href="/pulse/checkin#cla-closed-loop">Theo dõi Pulse</a><a href="/lumen/evidence#cla-closed-loop">Đánh giá Lumen</a><a href="/student/exams#cla-exam-reminders">Lịch thi & đếm ngược</a></div>
      </section>
      {(["loading", "syncing"].includes(companion.status) || journey.status === "loading") && <p role="status">Đang đồng bộ kế hoạch và quyền dữ liệu…</p>}
      {companion.status === "preview" && <p className="cla-companion-notice" role="status">Daily Companion đang ở chế độ xem trước. Để lưu và nhắc học, cần kiểm thử Rules bằng Emulator, triển khai đúng Rules ứng viên rồi bật <code>VITE_CLA_STUDENT_CONSENT_GATE=true</code> và xác nhận quyền dữ liệu ở Seed. Không tự động bật để tránh làm gián đoạn tài khoản hiện tại.</p>}
      {companion.status !== "preview" && !companion.consentAccepted && !["loading", "syncing"].includes(companion.status) && <p className="cla-companion-alert" role="status">Chưa xác nhận được đồng ý sử dụng dữ liệu. Hệ thống dừng lịch nhắc và thao tác ghi. <a href="/student/consent">Xem quyền dữ liệu</a>.</p>}
      {companion.status === "signed-out" && <p role="alert">Cần đăng nhập tài khoản học sinh để lưu lịch.</p>}
      {companion.error && <p role="alert" className="cla-companion-alert">{companion.error}</p>}
      {notice && <p role="status" className="cla-companion-notice">{notice}</p>}
      <div className="cla-companion-grid">
        <section className="cla-companion-card">
          <span className="cla-companion-kicker">01 / HÔM NAY</span>
          <h2>{new Intl.DateTimeFormat("vi-VN", {weekday:"long", day:"numeric", month:"long"}).format(clock)}</h2>
          <p>{currentPlan
            ? `Bạn có chu kỳ ${currentPlan.scenarioTitle} (${currentPlan.weeksLeft} tuần). Đã ghi ${currentPlan.checkIns.length} check-in theo tuần ở Pulse.`
            : "Bạn chưa có chu kỳ đang thực hiện. Có thể bắt đầu bằng cách chọn chiến lược trong Orion."}</p>
          <div className="cla-companion-checkins" aria-label="7 ngày gần nhất">
            {dates.map(date => <div key={date} className={completed.includes(date) ? "done" : ""}>
              <span>{date.slice(8)}</span><strong aria-label={completed.includes(date) ? "Đã check-in" : "Chưa check-in"}>{completed.includes(date) ? "✓" : "·"}</strong>
            </div>)}
          </div>
          <button type="button" disabled={companion.busy || companion.status !== "ready" || !companion.consentAccepted || doneToday}
            onClick={() => void checkIn()}>{doneToday ? "Đã ghi nhận hôm nay" : "Tôi đã học hôm nay"}</button>
          <p className="cla-companion-small">Lưu lịch nhắc một lần trước khi check-in. Check-in này chỉ xác nhận học sinh tự báo cáo đã học. Số giờ, nhiệm vụ và điểm đo lại tiếp tục ghi ở <a href="/pulse/checkin#cla-closed-loop">Pulse</a>.</p>
        </section>
        <section className="cla-companion-card">
          <span className="cla-companion-kicker">02 / NHỊP SINH HOẠT</span>
          <h2>Lịch nhắc theo giờ của bạn</h2>
          <label className="cla-companion-toggle"><input type="checkbox" checked={draft.enabled} onChange={e=>setDraft(previous=>({...previous,enabled:e.target.checked}))} /> <strong>Bật lịch nhắc học</strong></label>
          <div className="cla-companion-fields">
            {kinds.map(kind => <label key={kind}>{REMINDER_LABELS[kind]}<input type="time" value={draft.schedule[kind]}
              onChange={e => setDraft(previous=>({...previous,schedule:{...previous.schedule,[kind]:e.target.value}}))}/></label>)}
            <label>Bắt đầu giờ yên lặng<input type="time" value={draft.quietStart} onChange={e=>setDraft(previous=>({...previous,quietStart:e.target.value}))}/></label>
            <label>Kết thúc giờ yên lặng<input type="time" value={draft.quietEnd} onChange={e=>setDraft(previous=>({...previous,quietEnd:e.target.value}))}/></label>
          </div>
          <div className="cla-companion-actions"><button type="button" disabled={companion.busy || !companion.consentAccepted || !["ready","empty"].includes(companion.status)} onClick={()=>void save()}>Lưu lịch nhắc</button>
          <button className="secondary" type="button" disabled={!companion.consentAccepted} onClick={()=>void requestBrowserPermission()}>Cho phép thông báo thiết bị</button></div>
          <div className="cla-companion-actions">
            <button type="button" disabled={!companion.consentAccepted || companion.status!=="ready" || !companion.settings?.enabled || pushActive || !webPushConfigured() || !webPushAvailable()}
              onClick={()=>void startBackgroundPush()}>Bật nhắc nền trên thiết bị</button>
            <button className="secondary" type="button" disabled={!pushActive} onClick={()=>void stopBackgroundPush()}>Tắt nhắc nền</button>
          </div>
          <p className="cla-companion-small">Web Push: <strong>{pushActive ? "Thiết bị đã đăng ký" : !webPushConfigured() ? "Chưa cấu hình VAPID" : "Chưa đăng ký"}</strong>. Gửi nền từ máy chủ mặc định tắt; chỉ hoạt động sau khi nghiệm thu Rules, triển khai Cloud Functions và bật dịch vụ. Trên iPhone cần thử PWA đã thêm vào màn hình chính.</p>
          <p className="cla-companion-small">Quyền trình duyệt: <strong>{browserPermission === "granted" ? "Đã cho phép" : browserPermission === "denied" ? "Đã từ chối" : browserPermission === "unsupported" ? "Không hỗ trợ" : "Chưa cấp"}</strong>. Giờ tính theo múi giờ của thiết bị. Nếu giờ nhắc rơi vào khoảng yên lặng, CLA bỏ qua. Bạn có thể tắt nhắc bất kỳ lúc nào.</p>
        </section>
      </div>
      <section className="cla-companion-explainer">
        <h2>Cùng một CLA trên website và điện thoại</h2>
        <div><article><strong>Web · Phân tích</strong><p>Hồ sơ Seed, tổ hợp Atlas và chiến lược Orion.</p></article><article><strong>Companion · Hành động</strong><p>Lịch nhắc, check-in nhanh, cập nhật kế hoạch hằng ngày.</p></article><article><strong>Pulse & Lumen · Phản hồi</strong><p>Theo dõi tiến độ có nguồn tự báo cáo, không khẳng định tác động nhân quả.</p></article></div>
        <p className="cla-companion-small"><strong>Giới hạn V2:</strong> thông báo trong trang vẫn cần mở tab. Đã có mã đăng ký Web Push và dịch vụ gửi theo lịch, nhưng chưa thể khẳng định nhắc khi đóng ứng dụng trước khi Cloud Functions được triển khai, có VAPID và kiểm thử thiết bị. Chưa có APK/iOS native. Lịch và check-in chỉ đồng bộ sau khi Rules mới được kiểm thử và triển khai. Không đưa điểm số hoặc dữ liệu nhạy cảm vào màn hình khóa.</p>
        <a href="/student/consent">Quản lý quyền dữ liệu</a>
      </section>
    </div>
  </main>;
}
