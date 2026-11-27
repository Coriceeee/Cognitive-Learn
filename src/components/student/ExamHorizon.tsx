/** CP46 — read-only student dashboard horizon. Dates are always student supplied. */
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import {
  examMilestones, formatExamDate, isExamCalendarDocument, localDayKey,
  type ExamReminder,
} from "../../lib/examCalendar";
import { EXAM_CALENDAR_UPDATED, examCalendarKey } from "../../lib/examCalendarStorage";

type CalendarView = { ready: boolean; uid: string; events: ExamReminder[]; damaged: boolean };
const emptyView: CalendarView = { ready: false, uid: "", events: [], damaged: false };

export default function ExamHorizon() {
  const [calendar, setCalendar] = useState<CalendarView>(emptyView);
  const [today, setToday] = useState(() => localDayKey(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDayKey(new Date())), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let activeUid = "";
    function readCalendar(uid: string) {
      if (!uid || auth.currentUser?.uid !== uid) { setCalendar({ ready: true, uid: "", events: [], damaged: false }); return; }
      try {
        const raw = window.localStorage.getItem(examCalendarKey(uid));
        if (!raw) { setCalendar({ ready: true, uid, events: [], damaged: false }); return; }
        const data: unknown = JSON.parse(raw);
        if (isExamCalendarDocument(data, uid)) setCalendar({ ready: true, uid, events: data.events, damaged: false });
        else setCalendar({ ready: true, uid, events: [], damaged: true });
      } catch { setCalendar({ ready: true, uid, events: [], damaged: true }); }
    }
    const unsub = onAuthStateChanged(auth, user => {
      activeUid = user?.uid ?? "";
      setCalendar(emptyView);
      readCalendar(activeUid);
    });
    const onStorage = (event: StorageEvent) => {
      if (activeUid && (event.key === examCalendarKey(activeUid) || event.key === null)) readCalendar(activeUid);
    };
    const onLocalUpdate = () => { if (activeUid) readCalendar(activeUid); };
    const onVisible = () => { if (document.visibilityState === "visible" && activeUid) readCalendar(activeUid); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EXAM_CALENDAR_UPDATED, onLocalUpdate);
    document.addEventListener("visibilitychange", onVisible);
    return () => { unsub(); window.removeEventListener("storage", onStorage); window.removeEventListener(EXAM_CALENDAR_UPDATED, onLocalUpdate); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  const upcoming = useMemo(() => examMilestones(calendar.events, today).filter(m => m.days >= 0).slice(0, 3), [calendar.events, today]);
  const next = upcoming[0];
  const undated = calendar.events.filter(e => !e.examDate).length;
  return (
    <section className="cla-horizon" aria-labelledby="cla-horizon-title">
      <div className="cla-horizon-head">
        <div><span className="cla-horizon-overline"><span className="cla-horizon-live" aria-hidden="true" /> LỊCH TRÌNH CÁ NHÂN / EXAM HORIZON</span>
          <h2 id="cla-horizon-title">Mốc thi phía trước</h2>
          <p>Mốc do bạn nhập · không phải lịch công bố tự động</p>
        </div>
        <a className="cla-horizon-settings" href="/student/exams">Thiết lập lịch thi <span aria-hidden="true">↗</span></a>
      </div>
      <div className="cla-horizon-main">
        <div className="cla-horizon-countdown" aria-live="polite">
          <span className="cla-horizon-count-label">{!calendar.ready ? "ĐANG ĐỌC DỮ LIỆU" : next ? "MỐC GẦN NHẤT" : "CHƯA CÓ MỐC ĐẾM NGƯỢC"}</span>
          <div className="cla-horizon-digits">{next ? <>{next.days === 0 ? "00" : next.days}<small>{next.days === 0 ? "Hôm nay" : "ngày nữa"}</small></> : <>—<small>{!calendar.ready ? "Đang tải" : "Chưa xác định"}</small></>}</div>
          <strong>{next ? `${next.title} · ${next.label}` : calendar.damaged ? "Lịch đã lưu cần kiểm tra" : calendar.uid ? "Hãy chọn kỳ thi bạn theo dõi" : "Đăng nhập để tạo lịch thi"}</strong>
          <span className="cla-horizon-source">{next ? formatExamDate(next.day) : calendar.uid ? `${calendar.events.length} kỳ thi được theo dõi` : "Lịch riêng của từng tài khoản"}</span>
        </div>
        <div className="cla-horizon-track" aria-label="Những mốc thi sắp tới">
          <div className="cla-horizon-track-heading"><span>UPCOMING MILESTONES</span><span>{upcoming.length ? `${upcoming.length} mốc tiếp theo` : "CHỜ DỮ LIỆU"}</span></div>
          {upcoming.length ? <ol className="cla-horizon-milestones">{upcoming.map((milestone, index) => (
            <li key={`${milestone.eventId}-${milestone.kind}-${milestone.day}`} className={index === 0 ? "is-next" : ""}>
              <span className="cla-horizon-track-index">{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{milestone.title}</strong><span>{milestone.label} · {formatExamDate(milestone.day)}</span></div>
              <b>{milestone.days === 0 ? "Hôm nay" : `${milestone.days} ngày`}</b>
            </li>
          ))}</ol> : <div className="cla-horizon-empty">
            <div className="cla-horizon-placeholder-lines" aria-hidden="true"><span/><span/><span/></div>
            <strong>{calendar.damaged ? "Không thể đọc lịch đã lưu" : "Chưa có ngày thi được thiết lập"}</strong>
            <p>{calendar.damaged ? "Mở thiết lập để xem và xử lý bản lưu lỗi. CLA sẽ không tự ghi đè dữ liệu." : "Chọn kỳ thi và nhập ngày theo thông báo chính thức. Các mốc sẽ xuất hiện tại đây."}</p>
          </div>}
          {undated > 0 && <a href="/student/exams" className="cla-horizon-undated">{undated} kỳ thi chưa có ngày xác nhận · Bổ sung lịch ↗</a>}
        </div>
      </div>
      <div className="cla-horizon-foot"><span>LOCAL CALENDAR V1</span><span>Tự động lưu trên trình duyệt này · chưa đồng bộ đa thiết bị hoặc gửi nhắc nền.</span></div>
    </section>
  );
}
