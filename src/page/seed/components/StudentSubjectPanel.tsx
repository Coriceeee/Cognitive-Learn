import { subjectScores } from "../data/studentDashboardData";

type StudentSubjectPanelProps = {
  onUpdate: () => void;
};

export default function StudentSubjectPanel({
  onUpdate,
}: StudentSubjectPanelProps) {
  return (
    <article className="student-panel">
      <div className="student-panel-head">
        <div>
          <span>ĐIỂM HỌC TẬP</span>
          <h2>Bảng điểm</h2>
        </div>

        <button type="button" onClick={onUpdate}>
          Cập nhật
        </button>
      </div>

      <div className="student-subject-list">
        {subjectScores.map((item) => (
          <div key={item.subject} className="student-subject-row">
            <span>{item.subject}</span>
            <strong>{item.score}</strong>
            <em>{item.change}</em>
          </div>
        ))}
      </div>
    </article>
  );
}