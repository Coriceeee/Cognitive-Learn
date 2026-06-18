import { learningPlans } from "../data/studentDashboardData";

export default function StudentPlanPanel() {
  return (
    <article className="student-panel dark">
      <div className="student-panel-head">
        <div>
          <span>CHIẾN LƯỢC</span>
          <h2>14 ngày tới</h2>
        </div>
      </div>

      <div className="student-plan-list">
        {learningPlans.map((item, index) => (
          <div key={item.content} className="student-plan-item">
            <strong>{index + 1}</strong>
            <p>{item.content}</p>
          </div>
        ))}
      </div>
    </article>
  );
}