import type { AtlasStats } from "../../../lib/atlasKnowledgeBase";

type AtlasKnowledgeStatsProps = {
  stats: AtlasStats;
};

export default function AtlasKnowledgeStats({
  stats,
}: AtlasKnowledgeStatsProps) {
  const items = [
    {
      label: "Trường",
      value: stats.totalUniversities,
      desc: "Cơ sở đào tạo trong Knowledge Base",
    },
    {
      label: "Ngành",
      value: stats.totalPrograms,
      desc: "Chương trình đào tạo đang theo dõi",
    },
    {
      label: "Nguồn",
      value: stats.totalSources,
      desc: "Nguồn tuyển sinh đã nhập",
    },
    {
      label: "Chờ duyệt",
      value: stats.pendingSources,
      desc: "Nguồn cần CLA AI Verification",
    },
  ];

  return (
    <section className="atlas-stat-grid">
      {items.map((item) => (
        <article key={item.label} className="atlas-stat-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.desc}</p>
        </article>
      ))}
    </section>
  );
}