import { useStudentTranscript } from "../hooks/useStudentTranscript";
import { getLatestSubjectGrades } from "../services/transcriptData";

type StudentSubjectPanelProps = { onUpdate: () => void };

export default function StudentSubjectPanel({ onUpdate }: StudentSubjectPanelProps) {
  const { data, status, error } = useStudentTranscript();
  const rows = data ? getLatestSubjectGrades(data) : [];
  return (
    <article className="student-panel cla-live-transcript-panel">
      <div className="student-panel-head">
        <div><span>ĐIỂM HỌC TẬP · FIRESTORE</span><h2>Bảng điểm của bạn</h2></div>
        <button type="button" onClick={onUpdate}>Nhập / cập nhật</button>
      </div>
      {status === "loading" && <p role="status">Đang đồng bộ bảng điểm…</p>}
      {status === "signed-out" && <p>Hãy đăng nhập để xem bảng điểm của bạn.</p>}
      {status === "empty" && <p>Chưa có điểm được nhập. Điểm mẫu sẽ không hiển thị ở đây.</p>}
      {status === "error" && <p role="alert">{error}</p>}
      {status === "ready" && rows.length === 0 && <p>Chưa có điểm nào được lưu trong bảng điểm.</p>}
      {rows.length > 0 && (
        <div className="student-subject-list">
          {rows.map(item => (
            <div key={item.subject} className="student-subject-row cla-live-score-row">
              <span>{item.subject}<small>{item.label}</small></span>
              <strong>{item.average ?? item.provisional ?? "—"}</strong>
              <em>{item.status === "COMPLETE" ? "Đủ dữ liệu" : "Tạm tính"}</em>
            </div>
          ))}
        </div>
      )}
      <div className="cla-transcript-actions"><a href="/student/transcript">Xem bảng điểm 3 năm và 6 học kỳ →</a></div>
      <p className="cla-transcript-hint">Điểm được lấy từ hồ sơ đã lưu; chưa có dữ liệu sẽ không tự động hiện thành 0. Điểm tạm tính không phải kết quả học kỳ chính thức.</p>
    </article>
  );
}
