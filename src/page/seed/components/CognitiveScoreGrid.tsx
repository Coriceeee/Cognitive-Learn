import type { CognitiveResult } from "../types";

type CognitiveScoreGridProps = {
  cognitive: CognitiveResult;
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export default function CognitiveScoreGrid({
  cognitive,
}: CognitiveScoreGridProps) {
  const cognitiveScores = [
    {
      label: "SCI",
      name: "Self Coherence Index",
      value: clampScore(cognitive.SCI),
      desc: "Mức nhất quán giữa mục tiêu, kế hoạch và hành động.",
    },
    {
      label: "MAS",
      name: "Meaning Alignment Score",
      value: clampScore(cognitive.MAS),
      desc: "Mức gắn kết giữa động lực học tập và mục tiêu cá nhân.",
    },
    {
      label: "CSL",
      name: "Cognitive Stability Level",
      value: clampScore(cognitive.CSL),
      desc: "Độ ổn định hành vi, khả năng tập trung và giữ nhịp học.",
    },
  ];

  return (
    <section className="student-overview-grid">
      {cognitiveScores.map((item) => (
        <article key={item.label} className="student-score-card">
          <div>
            <span>{item.label}</span>
            <p>{item.name}</p>
          </div>

          <strong>{item.value}</strong>

          <div className="student-progress">
            <i style={{ width: `${item.value}%` }}></i>
          </div>

          <p>{item.desc}</p>
        </article>
      ))}
    </section>
  );
}