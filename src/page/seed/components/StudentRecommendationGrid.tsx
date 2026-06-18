import { recommendationCards } from "../data/studentDashboardData";

export default function StudentRecommendationGrid() {
  return (
    <section className="student-recommend-grid">
      {recommendationCards.map((item) => (
        <article key={item.title} className="student-recommend-card">
          <span>{item.title}</span>
          <strong>{item.value}</strong>
          <p>{item.desc}</p>
        </article>
      ))}
    </section>
  );
}