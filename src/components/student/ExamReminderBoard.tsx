import { pushAppNotice } from "../../lib/appNotices";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { EXAM_CALENDAR_UPDATED, examCalendarKey } from "../../lib/examCalendarStorage";
import {
  EXAM_CATALOG, EXAM_CALENDAR_MAX_ITEMS, createExamReminder, daysUntil, examAlerts,
  formatExamDate, isExamCalendarDocument, isExamReminder, isValidDay, localDayKey,
  safeExamUrl, upsertExamReminder,
  type ExamCode, type ExamReminder, type ExamCalendarDocument,
} from "../../lib/examCalendar";

const storageKey = examCalendarKey;
const catalogFor = (code: ExamCode) => EXAM_CATALOG.find(e => e.code === code);
const makeId = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
  ? crypto.randomUUID() : `exam_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

export default function ExamReminderBoard() {
  const [uid, setUid] = useState("");
  const [ready, setReady] = useState(false);
  const [blockedStorage, setBlockedStorage] = useState(false);
  const [events, setEvents] = useState<ExamReminder[]>([]);
  const [notice, setNotice] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExamReminder | null>(null);
  const [today, setToday] = useState(() => localDayKey(new Date()));

  useEffect(() => {
    const interval = window.setInterval(() => setToday(localDayKey(new Date())), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setReady(false); setUid(""); setEvents([]); setEditId(null); setDraft(null); setNotice(""); setBlockedStorage(false);
      if (!user) { setReady(true); return; }
      const key = storageKey(user.uid);
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const data: unknown = JSON.parse(raw);
          if (isExamCalendarDocument(data, user.uid)) setEvents(data.events);
          else {setBlockedStorage(true);setNotice("Lịch đã lưu không đúng định dạng; CLA không tự ghi đè. Nếu muốn bắt đầu lại, hãy xác nhận xóa lịch lỗi.");}
        }
      } catch {
        setNotice("Không đọc được lịch đã lưu trên trình duyệt. Kiểm tra chế độ riêng tư hoặc dung lượng bộ nhớ.");
      }
      setUid(user.uid); setReady(true);
    });
    return unsubscribe;
  }, []);

  function persist(next: ExamReminder[], message = "Đã lưu lịch trên trình duyệt này."): boolean {
    if (!uid || auth.currentUser?.uid !== uid) { setNotice("Cần đăng nhập đúng tài khoản học sinh."); return false; }
    if (blockedStorage) { setNotice("Lịch lưu bị lỗi. Xác nhận xóa dữ liệu lỗi trước khi thêm hoặc sửa."); return false; }
    const data: ExamCalendarDocument = {schemaVersion: 1, userId: uid, events: next};
    if (!isExamCalendarDocument(data, uid)) { setNotice("Dữ liệu lịch không hợp lệ; chưa lưu."); return false; }
    try {
      window.localStorage.setItem(storageKey(uid), JSON.stringify(data));
      window.dispatchEvent(new Event(EXAM_CALENDAR_UPDATED));
      setEvents(next); setNotice(message);
      pushAppNotice({kind:"success", title:"Đã cập nhật lịch thi", detail:message});
      return true;
    } catch { setNotice("Trình duyệt không cho lưu dữ liệu. Không thể lưu lịch trên thiết bị này."); return false; }
  }

  function add(code: ExamCode) {
    try {
      const item = createExamReminder(code, makeId());
      const next = upsertExamReminder(events, item);
      if (persist(next, "Đã thêm kỳ thi. Hãy nhập ngày theo thông báo của đơn vị tổ chức.")) {setEditId(item.id);setDraft(item);}
    } catch (e) { setNotice(e instanceof Error ? e.message : "Không thêm được kỳ thi."); }
  }

  function edit(item: ExamReminder) {
    if (editId === item.id) { setEditId(null); setDraft(null); return; }
    setEditId(item.id);
    setDraft({...item});
    setNotice("");
  }

  // Save every valid edit immediately so navigating away never discards a completed field.
  // Invalid intermediate values stay in the editor and are not written over the last valid record.
  function updateDraft(nextDraft: ExamReminder) {
    setDraft(nextDraft);
    if (!uid || auth.currentUser?.uid !== uid || blockedStorage || !isExamReminder(nextDraft)) return;
    try {
      const next = upsertExamReminder(events, nextDraft);
      const data: ExamCalendarDocument = {schemaVersion: 1, userId: uid, events: next};
      if (!isExamCalendarDocument(data, uid)) return;
      const serialized = JSON.stringify(data);
      if (window.localStorage.getItem(storageKey(uid)) === serialized) return;
      window.localStorage.setItem(storageKey(uid), serialized);
      window.dispatchEvent(new Event(EXAM_CALENDAR_UPDATED));
      setEvents(next);
      setNotice("Đã tự động lưu thay đổi trên trình duyệt này.");
    } catch {
      setNotice("Không thể tự lưu lịch thi. Hãy kiểm tra bộ nhớ trình duyệt và thử lại.");
    }
  }

  function saveDraft() {
    if (!draft) return;
    if (!isExamReminder(draft)) {
      setNotice("Chưa lưu: kiểm tra tên, ngày thi, hạn đăng ký (không sau ngày thi) và đường dẫn phải bắt đầu bằng HTTPS.");
      return;
    }
    try {
      if (persist(upsertExamReminder(events, draft))) {setEditId(null);setDraft(null);}
    } catch (e) { setNotice(e instanceof Error ? e.message : "Không lưu được thay đổi."); }
  }

  function remove(item: ExamReminder) {
    if (persist(events.filter(x => x.id !== item.id), `Đã ẩn ${item.title} khỏi lịch của bạn.`)) {setEditId(null);setDraft(null);}
  }

  const sorted = useMemo(() => [...events].sort((a,b) => {
    const aDay = [a.registrationDone ? "" : a.registrationDeadline,a.examDate].filter(isValidDay).filter(d => d >= today).sort()[0] ?? "9999-12-31";
    const bDay = [b.registrationDone ? "" : b.registrationDeadline,b.examDate].filter(isValidDay).filter(d => d >= today).sort()[0] ?? "9999-12-31";
    return aDay.localeCompare(bDay) || a.title.localeCompare(b.title);
  }), [events,today]);
  const alerts = useMemo(() => examAlerts(events,today), [events,today]);

  // At most once per milestone / day / signed-in UID in this browser tab.
  useEffect(() => {
    if (!ready || !uid || auth.currentUser?.uid !== uid || !alerts.length) return;
    const next = alerts[0];
    const key = `cla-exam-notice-v1:${uid}:${today}:${next.eventId}:${next.kind}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch { /* Storage blocked: in-memory notification dedupe still applies. */ }
    pushAppNotice({
      kind:"reminder", title:"Có mốc thi sắp đến",
      detail:`${next.days === 0 ? "Hôm nay" : `Còn ${next.days} ngày`}: ${next.label.toLowerCase()} — ${next.title}. Hãy đối chiếu lịch với đơn vị tổ chức.`,
      dedupeKey:key,
    });
  }, [ready, uid, today, alerts]);

  return <section id="cla-exam-reminders" className="cla-exam-board" aria-labelledby="cla-exam-title">
    <div className="cla-exam-heading">
      <div>
        <span className="cla-exam-eyebrow">EXAM HORIZON / PERSONAL SETTINGS</span>
        <h2 id="cla-exam-title">Thiết lập lịch thi</h2>
        <p>Chọn kỳ thi, cập nhật ngày thi và hạn đăng ký. Những mốc sắp đến sẽ tự xuất hiện trên trang tổng quan.</p>
      </div>
      <div className="cla-exam-settings-meta" aria-label="Số kỳ thi đang theo dõi">
        <strong>{events.length}</strong><span>/ {EXAM_CALENDAR_MAX_ITEMS} KỲ THI ĐÃ CHỌN</span>
      </div>
    </div>
    <a className="cla-exam-back-home" href="/student">← Xem lịch thi trên tổng quan</a>
    {!ready && <p role="status">Đang tải lịch thi theo tài khoản…</p>}
    {ready && !uid && <p role="status">Đăng nhập tài khoản học sinh để chọn và lưu lịch thi.</p>}
    {ready && uid && <>
      {events.length === 0 && <div className="cla-exam-empty">Chưa theo dõi kỳ thi nào. Bạn có thể chọn HSA, V-ACT, TSA, V-SAT hoặc chứng chỉ bên dưới.</div>}
      {events.length > 0 && <div className="cla-exam-items">
        {sorted.map(item => {
          const examRemaining = daysUntil(item.examDate,today);
          const registrationRemaining = item.registrationDone ? null : daysUntil(item.registrationDeadline,today);
          const active = editId === item.id;
          const officialPortal = catalogFor(item.code)?.portal ?? "";
          return <article key={item.id} className={`cla-exam-item ${examRemaining !== null && examRemaining <= 7 && examRemaining >= 0 ? "is-soon" : ""}`}>
            <div className="cla-exam-item-top">
              <div><strong>{item.title}</strong><small>{catalogFor(item.code)?.detail}</small></div>
              <span className="cla-exam-time">{examRemaining === null ? "Chưa đặt ngày" : examRemaining === 0 ? "Thi hôm nay" : examRemaining > 0 ? `Còn ${examRemaining} ngày` : `Đã qua ${-examRemaining} ngày`}</span>
            </div>
            <div className="cla-exam-item-meta">
              <span>Ngày thi: <b>{formatExamDate(item.examDate)}</b></span>
              <span>Hạn đăng ký: <b>{item.registrationDone ? "Đã đăng ký" : formatExamDate(item.registrationDeadline)}</b>
                {registrationRemaining !== null && registrationRemaining >= 0 && !item.registrationDone ? ` · còn ${registrationRemaining} ngày` : registrationRemaining !== null && registrationRemaining < 0 && !item.registrationDone ? " · mốc đã qua, cần kiểm tra lại" : ""}</span>
            </div>
            <div className="cla-exam-actions">
              <button type="button" onClick={() => edit(item)} aria-expanded={active}>{active ? "Thu gọn" : "Sửa lịch / đợt thi"}</button>
              <button type="button" className="cla-exam-remove" onClick={() => remove(item)} aria-label={`Ẩn ${item.title}`}>Ẩn khỏi bảng</button>
              {officialPortal && <a href={officialPortal} target="_blank" rel="noopener noreferrer">Tra cứu cổng kỳ thi</a>}
              {safeExamUrl(item.sourceUrl) && <a href={safeExamUrl(item.sourceUrl)} target="_blank" rel="noopener noreferrer">Mở nguồn bạn lưu</a>}
            </div>
            {active && draft && <div className="cla-exam-editor">
              <label>Tên đợt thi / tên kỳ thi<input aria-label={`Tên kỳ thi ${item.title}`} value={draft.title} maxLength={100} onChange={e => updateDraft({...draft,title:e.target.value})} /></label>
              <label>Ngày thi theo giấy báo / thông báo<input aria-label={`Ngày thi ${item.title}`} type="date" min="2020-01-01" max="2099-12-31" value={draft.examDate} onChange={e => updateDraft({...draft,examDate:e.target.value})}/></label>
              <label>Hạn đăng ký (nếu có)<input aria-label={`Hạn đăng ký ${item.title}`} type="date" min="2020-01-01" max="2099-12-31" value={draft.registrationDeadline} onChange={e => updateDraft({...draft,registrationDeadline:e.target.value})}/></label>
              <label>Link thông báo (HTTPS, nếu có)<input aria-label={`Nguồn ${item.title}`} type="url" placeholder="https://..." maxLength={600} value={draft.sourceUrl} onChange={e => updateDraft({...draft,sourceUrl:e.target.value})}/></label>
              <label className="cla-exam-done"><input type="checkbox" checked={draft.registrationDone} onChange={e => updateDraft({...draft,registrationDone:e.target.checked})}/> Đã hoàn tất đăng ký kỳ thi này</label>
              <div className="cla-exam-editor-actions"><button type="button" onClick={saveDraft}>Lưu thay đổi</button><button type="button" className="cancel" onClick={() => {setEditId(null);setDraft(null);}}>Hủy</button></div>
              <p className="cla-exam-help">Các thay đổi hợp lệ được tự động lưu trên trình duyệt này. Bạn vẫn có thể bấm “Lưu thay đổi” để hoàn tất chỉnh sửa. Ngày và link do bạn nhập, chưa được CLA xác minh. Nếu thi nhiều đợt, hãy thêm nhiều lần cùng loại kỳ thi.</p>
            </div>}
          </article>;
        })}
      </div>}
      <details className="cla-exam-chooser" open={events.length === 0 ? true : undefined}>
        <summary>+ Thêm kỳ thi / đợt thi cần theo dõi ({events.length}/{EXAM_CALENDAR_MAX_ITEMS})</summary>
        <div className="cla-exam-catalog">
          {EXAM_CATALOG.map(option => <button type="button" key={option.code} disabled={events.length >= EXAM_CALENDAR_MAX_ITEMS} onClick={() => add(option.code)}>
            <strong>+ {option.label}</strong><small>{option.detail}</small>
          </button>)}
        </div>
      </details>
      {notice && <p role="status" className="cla-exam-notice">{notice}</p>}
      {blockedStorage && <button type="button" className="cla-exam-reset" onClick={() => {
        if (!window.confirm("Xóa bản lịch thi lỗi trên thiết bị này? Hành động không khôi phục được.")) return;
        try {window.localStorage.removeItem(storageKey(uid));window.dispatchEvent(new Event(EXAM_CALENDAR_UPDATED));setBlockedStorage(false);setNotice("Đã xóa bản lịch lỗi. Bạn có thể bắt đầu lại.");}
        catch {setNotice("Không thể xóa dữ liệu lỗi trên trình duyệt này.");}
      }}>Xóa lịch lỗi và bắt đầu lại</button>}
      <p className="cla-exam-privacy">Lịch cá nhân V1 lưu riêng theo tài khoản <strong>trên trình duyệt này</strong>, chưa đồng bộ nhiều thiết bị. CLA chỉ nhắc khi bạn mở trang; <strong>chưa gửi push nền cho lịch thi</strong>. Ngày thi/hạn đăng ký có thể thay đổi theo đợt và địa điểm — đối chiếu thông báo chính thức trước khi đăng ký.</p>
    </>}
  </section>;
}
