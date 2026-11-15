import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AlertCircle, Bell, CheckCircle2, Info, X } from "lucide-react";
import {
  dismissAppToast, getAppNotices, getAppNoticesServer, markAppNoticesRead,
  pushAppNotice, subscribeAppNotices,
  type AppNotice, type AppNoticeKind,
} from "../../lib/appNotices";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  reminder: Bell,
  info: Info,
} as const;
const labels: Record<AppNoticeKind, string> = {
  success: "Hoàn tất", error: "Cần chú ý", reminder: "Nhắc nhở", info: "Thông tin",
};

function NotificationIcon({kind}: {kind: AppNoticeKind}) {
  const Symbol = icons[kind];
  return <Symbol size={19} aria-hidden="true" />;
}

/** Floating feedback remains under the top navigation, away from analysis content. */
export default function AppNotificationCenter() {
  const notices = useSyncExternalStore(subscribeAppNotices, getAppNotices, getAppNoticesServer);
  const active = notices.filter(item => item.visible).slice(0, 3);
  const toastTimers = useRef(new Map<number, number>());
  useEffect(() => {
    const offline = () => pushAppNotice({kind: "error", title: "Không có kết nối mạng",
      detail: "Một số phân tích và thao tác đồng bộ sẽ không hoạt động. Kiểm tra Internet rồi thử lại.", dedupeKey: "network-offline"});
    const online = () => pushAppNotice({kind: "success", title: "Đã kết nối lại",
      detail: "Kết nối mạng đã khôi phục. Hãy thử lại thao tác bị gián đoạn nếu cần.", dedupeKey: "network-online"});
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    if (!navigator.onLine) offline();
    return () => {
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);
  useEffect(() => {
    // Stable per-id timers: newer notifications do not extend earlier ones.
    const visible = new Set(active.map(item => item.id));
    for (const [id, handle] of toastTimers.current) {
      if (!visible.has(id)) { window.clearTimeout(handle); toastTimers.current.delete(id); }
    }
    for (const item of active) {
      if (!toastTimers.current.has(item.id)) {
        toastTimers.current.set(item.id, window.setTimeout(() => dismissAppToast(item.id), item.kind === "error" ? 9000 : 6500));
      }
    }
  }, [notices]);
  useEffect(() => () => {
    for (const handle of toastTimers.current.values()) window.clearTimeout(handle);
    toastTimers.current.clear();
  }, []);

  if (!active.length) return null;
  return <div className="cla-toast-viewport" role="region" aria-label="Thông báo mới" aria-live="polite" aria-relevant="additions">
    {active.map(item => <article key={item.id} className={`cla-toast is-${item.kind}`} role={item.kind === "error" ? "alert" : "status"}>
      <span className="cla-toast-icon"><NotificationIcon kind={item.kind}/></span>
      <div className="cla-toast-copy"><small>{labels[item.kind]}</small><strong>{item.title}</strong><p>{item.detail}</p></div>
      <button type="button" onClick={() => dismissAppToast(item.id)} aria-label={`Đóng thông báo ${item.title}`} title="Đóng"><X size={16}/></button>
    </article>)}
  </div>;
}

/** Compact inbox is available on all authorized pages in the existing UserMenu. */
export function NotificationBell() {
  const notices = useSyncExternalStore(subscribeAppNotices, getAppNotices, getAppNoticesServer);
  const [open, setOpen] = useState(false);
  const unread = notices.filter(item => !item.seen).length;
  return <div className="cla-notification-bell-wrap">
    <button type="button" className="cla-notification-bell" aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ""}`}
      aria-expanded={open} aria-controls="cla-notification-inbox" onClick={() => {
        setOpen(prev => !prev);
        if (!open) markAppNoticesRead();
      }}>
      <Bell size={18} strokeWidth={2.1} aria-hidden="true"/>
      {unread > 0 && <span className="cla-notification-badge">{unread > 9 ? "9+" : unread}</span>}
      <small>Thông báo</small>
    </button>
    {open && <div id="cla-notification-inbox" className="cla-notification-inbox" role="region" aria-label="Thông báo gần đây">
      <div className="cla-notification-inbox-head"><strong>Thông báo gần đây</strong><button type="button" onClick={() => setOpen(false)} aria-label="Đóng danh sách thông báo"><X size={16}/></button></div>
      {notices.length ? <ul>{notices.slice(0, 12).map((item: AppNotice) => <li key={item.id} className={`is-${item.kind}`}>
        <NotificationIcon kind={item.kind}/><div><strong>{item.title}</strong><p>{item.detail}</p></div>
      </li>)}</ul> : <p className="cla-notification-empty">Chưa có thông báo trong phiên này. Khi phân tích hoặc lưu dữ liệu xong, thông báo sẽ xuất hiện ở đây.</p>}
      <p className="cla-notification-session-note">Thông báo trong phiên mở trang, không phải thông báo đẩy khi đóng ứng dụng.</p>
    </div>}
  </div>;
}
