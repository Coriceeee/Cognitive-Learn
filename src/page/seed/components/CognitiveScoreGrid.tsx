import type { CognitiveResult } from "../types";

type CognitiveScoreGridProps = {
  cognitive: CognitiveResult;
};

function getRiskLabel(riskLevel: CognitiveResult["riskLevel"]) {
  if (riskLevel === "LOW") return "Rủi ro thấp";
  if (riskLevel === "MEDIUM") return "Cần theo dõi";
  if (riskLevel === "HIGH") return "Rủi ro cao";
  return "Chưa đủ dữ liệu";
}

export default function CognitiveScoreGrid({
  cognitive,
}: CognitiveScoreGridProps) {
  return (
    <section className="student-cognitive-section">
      <div className="student-cognitive-head">
        <div>
          <span>LUMEN INTELLIGENCE</span>
          <h2>Chỉ số nhận thức học tập</h2>
        </div>

        <div className={`student-risk-pill ${cognitive.riskLevel.toLowerCase()}`}>
          {getRiskLabel(cognitive.riskLevel)}
        </div>
      </div>

      <div className="student-overview-grid">
        {cognitive.dimensions.map((item) => (
          <article key={item.code} className="student-score-card">
            <div>
              <span>{item.code}</span>
              <p>{item.name}</p>
            </div>

            <strong>{item.available === false ? "—" : item.value}</strong>

            <div className="student-progress">
              <i style={{ width: `${item.available === false ? 0 : item.value}%` }}></i>
            </div>

            <p>{item.available === false ? "Chưa có phép đo hợp lệ cho chỉ số này." : item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}