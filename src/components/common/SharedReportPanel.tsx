import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type Mode = "student" | "teacher" | "parent";
type ViewerRole = "teacher" | "parent";
type Link = {
  id: string;
  studentId: string;
  viewerId: string;
  viewerRole: ViewerRole;
  studentName: string;
};
type SharedReport = {
  studentId: string;
  viewerId: string;
  viewerRole: ViewerRole;
  title: string;
  summary: string;
  nextStep: string;
  createdAt?: Timestamp;
  status: "shared" | "reviewed";
  feedback: string;
  reviewedAt?: Timestamp | null;
};
type State = "loading" | "ready" | "error" | "signed-out";

function getError(error: unknown): string {
  const code = error !== null && typeof error === "object" && "code" in error
    ? String(error.code) : "";
  if (code === "permission-denied") {
    return "Firestore đã từ chối quyền. Hãy kiểm tra Rules cho student_shared_reports và student_links.";
  }
  if (code === "failed-precondition") {
    return "Truy vấn Firestore cần index hoặc Rules phù hợp.";
  }
  return "Không thể đồng bộ báo cáo. Kiểm tra kết nối hoặc thử lại.";
}

function readLink(record: { id: string; data: () => Record<string, unknown> }): Link | null {
  const data = record.data();
  if (typeof data.studentId !== "string" || typeof data.viewerId !== "string") return null;
  if (data.viewerRole !== "teacher" && data.viewerRole !== "parent") return null;
  return {
    id: record.id,
    studentId: data.studentId,
    viewerId: data.viewerId,
    viewerRole: data.viewerRole,
    studentName: typeof data.studentName === "string" ? data.studentName : "Học sinh",
  };
}

function readReport(data: Record<string, unknown>, link: Link): SharedReport | null {
  if (data.studentId !== link.studentId || data.viewerId !== link.viewerId) return null;
  if (data.viewerRole !== link.viewerRole) return null;
  if (data.status !== "shared" && data.status !== "reviewed") return null;
  if (typeof data.title !== "string" || typeof data.summary !== "string") return null;
  return {
    studentId: link.studentId,
    viewerId: link.viewerId,
    viewerRole: link.viewerRole,
    title: data.title,
    summary: data.summary,
    nextStep: typeof data.nextStep === "string" ? data.nextStep : "",
    createdAt: data.createdAt as Timestamp | undefined,
    status: data.status,
    feedback: typeof data.feedback === "string" ? data.feedback : "",
    reviewedAt: (data.reviewedAt ?? null) as Timestamp | null,
  };
}

function formatTime(value: Timestamp | null | undefined): string {
  try {
    return value?.toDate().toLocaleString("vi-VN") ?? "Chưa đồng bộ thời gian";
  } catch {
    return "Chưa đồng bộ thời gian";
  }
}

/**
 * Reports are explicitly authored by a student; no Cognitive/Growth data is
 * automatically sent to teacher or parent. The report document ID equals
 * student_links/{studentId}_{viewerId}, so readers use get/onSnapshot on one
 * known document; no broad report collection queries are required.
 */
export default function SharedReportPanel({ mode, preview = false }: { mode: Mode; preview?: boolean }) {
  const [uid, setUid] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [state, setState] = useState<State>("loading");
  const [reportState, setReportState] = useState<"loading" | "ready" | "error">("loading");
  const [report, setReport] = useState<SharedReport | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (preview) {
      setState("ready");
      setUid("");
      setLinks([]);
      return;
    }
    let active = true;
    let version = 0;
    let cancelLinks: (() => void) | undefined;
    const cancelAuth = onAuthStateChanged(auth, (user) => {
      const current = ++version;
      cancelLinks?.();
      cancelLinks = undefined;
      if (!active) return;
      setUid(user?.uid ?? "");
      setLinks([]);
      setSelectedId("");
      setReport(null);
      setNotice("");
      if (!user) {
        setState("signed-out");
        return;
      }
      setState("loading");
      const field = mode === "student" ? "studentId" : "viewerId";
      const q = query(collection(db, "student_links"), where(field, "==", user.uid), limit(40));
      cancelLinks = onSnapshot(q, (snapshot) => {
        if (!active || current !== version) return;
        const loaded = snapshot.docs
          .map((item) => readLink(item))
          .filter((item): item is Link => item !== null)
          .filter((item) => mode === "student" || item.viewerRole === mode);
        setLinks(loaded);
        setSelectedId((prior) => loaded.some((item) => item.id === prior) ? prior : (loaded[0]?.id ?? ""));
        setState("ready");
      }, (error) => {
        if (!active || current !== version) return;
        setState("error");
        setNotice(getError(error));
      });
    });
    return () => {
      active = false;
      version += 1;
      cancelLinks?.();
      cancelAuth();
    };
  }, [mode, preview]);

  const selected = links.find((link) => link.id === selectedId) ?? null;
  const ownsSelection = selected !== null && (
    mode === "student" ? selected.studentId === uid : selected.viewerId === uid && selected.viewerRole === mode
  );

  useEffect(() => {
    setReport(null);
    setFeedback("");
    if (!selected || !ownsSelection || preview) {
      setReportState("ready");
      return;
    }
    setReportState("loading");
    const cancel = onSnapshot(doc(db, "student_shared_reports", selected.id), (snapshot) => {
      const parsed = snapshot.exists() ? readReport(snapshot.data(), selected) : null;
      if (snapshot.exists() && !parsed) {
        setReportState("error");
        setNotice("Báo cáo có cấu trúc không hợp lệ. Không hiển thị để tránh nhầm dữ liệu.");
        return;
      }
      setReport(parsed);
      setReportState("ready");
    }, (error) => {
      setReportState("error");
      setNotice(getError(error));
    });
    return () => cancel();
  }, [selectedId, selected?.id, selected?.studentId, selected?.viewerId, selected?.viewerRole, ownsSelection, preview]);

  async function shareReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode !== "student" || !selected || selected.studentId !== uid || report || reportState !== "ready") return;
    const cleanTitle = title.trim();
    const cleanSummary = summary.trim();
    const cleanNext = nextStep.trim();
    if (cleanTitle.length < 5 || cleanTitle.length > 70 || cleanSummary.length < 10 || cleanSummary.length > 900 || cleanNext.length > 400) {
      setNotice("Tiêu đề 5–70 ký tự; tóm tắt 10–900; bước tiếp theo tối đa 400 ký tự.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      await setDoc(doc(db, "student_shared_reports", selected.id), {
        studentId: uid,
        viewerId: selected.viewerId,
        viewerRole: selected.viewerRole,
        title: cleanTitle,
        summary: cleanSummary,
        nextStep: cleanNext,
        status: "shared",
        feedback: "",
        reviewedAt: null,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setSummary("");
      setNextStep("");
      setNotice("Đã chia sẻ báo cáo do bạn tự viết với đúng tài khoản đã liên kết.");
    } catch (error) {
      setNotice(getError(error));
    } finally {
      setBusy(false);
    }
  }

  async function removeReport() {
    if (mode !== "student" || !selected || selected.studentId !== uid || !report || busy) return;
    if (!window.confirm("Thu hồi báo cáo này? Nhận xét đã lưu trong báo cáo cũng sẽ bị xóa.")) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, "student_shared_reports", selected.id));
      setNotice("Đã thu hồi báo cáo. Liên kết tài khoản vẫn được giữ.");
    } catch (error) {
      setNotice(getError(error));
    } finally {
      setBusy(false);
    }
  }

  async function reviewReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "student" || !selected || selected.viewerId !== uid || selected.viewerRole !== mode) return;
    if (!report || report.status !== "shared" || busy) return;
    const cleanFeedback = feedback.trim();
    if (cleanFeedback.length < 5 || cleanFeedback.length > 600) {
      setNotice("Nhận xét phải dài 5–600 ký tự.");
      return;
    }
    setBusy(true);
    try {
      await updateDoc(doc(db, "student_shared_reports", selected.id), {
        feedback: cleanFeedback,
        status: "reviewed",
        reviewedAt: serverTimestamp(),
      });
      setFeedback("");
      setNotice("Đã lưu nhận xét cho học sinh. Đây không phải chứng nhận đánh giá khoa học.");
    } catch (error) {
      setNotice(getError(error));
    } finally {
      setBusy(false);
    }
  }

  function exportText() {
    if (!report || !selected || !ownsSelection) return;
    const contents = [
      "COGNITIVE LEARN AI — BÁO CÁO CHỦ ĐỘNG CHIA SẺ",
      "Nội dung do học sinh tự viết; chưa phải báo cáo AI hay đánh giá chuẩn hóa.",
      `Tiêu đề: ${report.title}`,
      `Người xem: ${report.viewerRole === "teacher" ? "Giáo viên" : "Phụ huynh"}`,
      `Tạo lúc: ${formatTime(report.createdAt)}`,
      `Trạng thái: ${report.status === "reviewed" ? "Đã nhận xét" : "Chờ nhận xét"}`,
      "", "TÓM TẮT", report.summary,
      "", "BƯỚC TIẾP THEO", report.nextStep || "Chưa có",
      "", "NHẬN XÉT", report.feedback || "Chưa có",
      "", "Chỉ nên sử dụng trong phạm vi người được học sinh chia sẻ.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", contents], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "CLA-bao-cao-chia-se.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="cla-report-panel" aria-labelledby={`cla-report-title-${mode}`}>
      <div className="cla-report-head">
        <span className="cla-report-eyebrow">CLA · CHIA SẺ CÓ CHỦ ĐÍCH</span>
        <h2 id={`cla-report-title-${mode}`}>{mode === "student" ? "Chia sẻ bản cập nhật học tập" : "Báo cáo học sinh gửi cho bạn"}</h2>
        <p>
          {mode === "student"
            ? "Bạn tự chọn nội dung muốn chia sẻ cho một giáo viên hoặc phụ huynh đã liên kết. CLA không tự gửi điểm, chỉ số Cognitive hoặc lịch sử học tập."
            : "Chỉ xem bản cập nhật do học sinh chủ động gửi. Bạn có thể ghi một nhận xét, không thay đổi nội dung của học sinh."}
        </p>
      </div>
      {preview ? (
        <p className="cla-report-message">Chế độ xem thử của quản trị viên — không tải báo cáo riêng tư.</p>
      ) : state === "signed-out" ? (
        <p className="cla-report-message" role="alert">Bạn cần đăng nhập để xem báo cáo.</p>
      ) : state === "loading" ? (
        <p className="cla-report-message" role="status">Đang tải liên kết…</p>
      ) : state === "error" ? (
        <p className="cla-report-message" role="alert">Không thể tải liên kết. Kiểm tra Firestore Rules.</p>
      ) : links.length === 0 ? (
        <p className="cla-report-message">Chưa có học sinh/người xem được liên kết. Hãy hoàn tất bước liên kết ở phía trên.</p>
      ) : (
        <>
          <label className="cla-report-select">
            <span>{mode === "student" ? "Chọn người nhận" : "Chọn học sinh"}</span>
            <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setNotice(""); }}>
              {links.map(link => (
                <option key={link.id} value={link.id}>
                  {mode === "student"
                    ? `${link.viewerRole === "teacher" ? "Giáo viên" : "Phụ huynh"} · ${link.viewerId.slice(0, 10)}…`
                    : `${link.studentName} · ${link.studentId.slice(0, 10)}…`}
                </option>
              ))}
            </select>
          </label>
          {reportState === "loading" ? <p className="cla-report-message">Đang đọc báo cáo được chia sẻ…</p> : null}
          {reportState === "error" ? <p className="cla-report-message" role="alert">Chưa đọc được báo cáo từ Firestore. Kiểm tra quyền và thử lại.</p> : null}
          {reportState === "ready" && !report && mode === "student" && (
            <form className="cla-report-form" onSubmit={(event) => { void shareReport(event); }}>
              <label>Tiêu đề báo cáo
                <input maxLength={70} minLength={5} required value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Tổng kết việc học trong tuần" />
              </label>
              <label>Tóm tắt do bạn tự viết
                <textarea rows={4} minLength={10} maxLength={900} required value={summary} onChange={event => setSummary(event.target.value)} placeholder="Điều đã thực hiện, khó khăn và điểm bạn muốn trao đổi" />
              </label>
              <label>Bước tiếp theo (không bắt buộc)
                <textarea rows={3} maxLength={400} value={nextStep} onChange={event => setNextStep(event.target.value)} placeholder="Một hành động cụ thể cho tuần tới" />
              </label>
              <button type="submit" disabled={busy || !ownsSelection}>{busy ? "Đang lưu…" : "Tạo và chia sẻ báo cáo"}</button>
            </form>
          )}
          {reportState === "ready" && !report && mode !== "student" && (
            <p className="cla-report-message">Học sinh chưa gửi bản cập nhật nào cho tài khoản này.</p>
          )}
          {reportState === "ready" && report && (
            <article className="cla-report-document">
              <div className="cla-report-document-head">
                <div><span className="cla-report-eyebrow">BÁO CÁO TỪ HỌC SINH</span><h3>{report.title}</h3></div>
                <span className="cla-report-status">{report.status === "reviewed" ? "Đã nhận xét" : "Chờ nhận xét"}</span>
              </div>
              <small>Được chia sẻ: {formatTime(report.createdAt)}</small>
              <h4>Tóm tắt</h4><p className="cla-report-text">{report.summary}</p>
              <h4>Bước tiếp theo</h4><p className="cla-report-text">{report.nextStep || "Chưa có bước tiếp theo."}</p>
              {report.status === "reviewed" && (
                <div className="cla-report-feedback"><h4>Nhận xét của người được liên kết</h4><p>{report.feedback}</p><small>{formatTime(report.reviewedAt)}</small></div>
              )}
              <div className="cla-report-actions">
                <button type="button" className="cla-report-secondary" onClick={exportText}>Xuất TXT</button>
                {mode === "student" && <button type="button" className="cla-report-danger" disabled={busy} onClick={() => { void removeReport(); }}>Thu hồi báo cáo</button>}
              </div>
              {mode !== "student" && report.status === "shared" && (
                <form className="cla-report-form" onSubmit={(event) => { void reviewReport(event); }}>
                  <label>Nhận xét gửi học sinh
                    <textarea rows={3} minLength={5} maxLength={600} required value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="Góp ý ngắn gọn, mang tính hỗ trợ" />
                  </label>
                  <button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Gửi nhận xét"}</button>
                </form>
              )}
            </article>
          )}
        </>
      )}
      {notice && <p className="cla-report-message" role="status">{notice}</p>}
      <p className="cla-report-footnote">Đây là bản trao đổi do học sinh tự viết, không phải kết quả ML, LLM hoặc đánh giá đã được kiểm chứng.</p>
    </section>
  );
}
