import { useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { useStudentTranscript } from "./hooks/useStudentTranscript";
import { GRADES, SEMESTERS, type GradeKey } from "./services/transcriptData";
import "../../styles.css";

export default function StudentTranscriptPage() {
  const { data, status, error } = useStudentTranscript();
  const [grade, setGrade] = useState<GradeKey>("grade12");
  const gradeName = GRADES.find(g => g.key === grade)!.name;
  return (
    <main className="profile-page cla-transcript-page">
      <div className="profile-floating-header">
        <a className="profile-home-logo" href="/student" aria-label="Về Dashboard Student"><img src={appLogo} alt="Cognitive Learn" /></a>
        <UserMenu />
      </div>
      <section className="profile-shell">
        <header className="profile-head">
          <span>KHO BẢNG ĐIỂM · FIRESTORE</span>
          <h1>Bảng điểm THPT đã lưu</h1>
          <p>Đây là trang lưu trữ và xem lại dữ liệu từ hồ sơ học tập của bạn. Chỉnh sửa điểm tại trang nhập hồ sơ; Dashboard tự đồng bộ từ cùng một nguồn Firestore.</p>
        </header>
        <div className="cla-transcript-page-actions"><a href="/student">← Dashboard</a><a href="/student/profile">Nhập / sửa bảng điểm →</a></div>
        {status === "loading" && <p role="status">Đang đọc bảng điểm từ Firestore…</p>}
        {status === "signed-out" && <p>Hãy đăng nhập bằng tài khoản học sinh để xem bảng điểm.</p>}
        {status === "empty" && <p>Chưa có bảng điểm trong hồ sơ. Hãy vào trang nhập hồ sơ để lưu dữ liệu.</p>}
        {status === "error" && <p role="alert">{error}</p>}
        {data && status === "ready" && (
          <>
            <div className="cla-transcript-meta">
              <span>Nguồn: <code>learning_profiles/UID · trường transcript</code> (trường transcript của tài liệu hồ sơ)</span>
              <span>Lần cập nhật: {data.updatedAt ? data.updatedAt.toLocaleString("vi-VN") : "Chưa xác định"}</span>
            </div>
            <nav className="profile-grade-tabs" aria-label="Chọn năm học">
              {GRADES.map(item => <button type="button" key={item.key} className={grade === item.key ? "active" : ""} onClick={() => setGrade(item.key)}>{item.name}</button>)}
            </nav>
            <div className="cla-transcript-year-status"><span>{gradeName} · Trung bình năm</span><strong>{data.yearly[grade] ?? "Chưa đủ hai học kỳ"}</strong></div>
            {SEMESTERS.map(({ key, name }) => {
              const term = data.terms.find(t => t.grade === grade && t.semester === key)!;
              return (
                <section className="cla-transcript-term" key={key} aria-label={`${gradeName} ${name}`}>
                  <div className="cla-transcript-term-head">
                    <div><h2>{name}</h2><p>{term.summary.completedSubjects}/{term.summary.expectedSubjects} môn có đủ điểm theo công thức; {term.summary.status === "COMPLETE" ? "đủ dữ liệu" : term.summary.status === "PARTIAL" ? "đang nhập dở" : "chưa có điểm"}</p></div>
                    <strong>{term.summary.gpa ?? (term.summary.provisionalAverage !== null ? `${term.summary.provisionalAverage} (tạm)` : "—")}</strong>
                  </div>
                  <div className="profile-transcript-wrapper">
                    <table className="profile-transcript-table">
                      <thead><tr><th>Môn học</th><th>TX1</th><th>TX2</th><th>TX3</th><th>TX4</th><th>TX5</th><th>Giữa kỳ</th><th>Cuối kỳ</th><th>TB môn</th></tr></thead>
                      <tbody>{term.subjects.map(({ subject, row, average, provisional }) => (
                        <tr key={subject}><td><strong>{subject}</strong></td>
                          {Array.from({ length: 5 }, (_, i) => <td key={i}>{row.regular[i] ?? "—"}</td>)}
                          <td>{row.midterm || "—"}</td><td>{row.final || "—"}</td>
                          <td><strong>{average ?? (provisional !== null ? `${provisional} (tạm)` : "—")}</strong></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </section>
              );
            })}
            <p className="cla-transcript-hint">Dữ liệu tạm tính chỉ phản ánh điểm đã nhập; không phải học bạ được nhà trường xác nhận. Các môn không có điểm sẽ hiển thị dấu —.</p>
          </>
        )}
      </section>
    </main>
  );
}
