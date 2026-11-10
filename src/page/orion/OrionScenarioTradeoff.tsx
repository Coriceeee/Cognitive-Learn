import type { OrionScenario } from "../../lib/orionStrategyEngine";

type Props = { scenarios: OrionScenario[] };

const RISK_LABEL: Record<OrionScenario["riskLevel"], string> = {
  LOW: "Rủi ro thấp",
  MEDIUM: "Cần cân nhắc",
  HIGH: "Áp lực cao",
};

export default function OrionScenarioTradeoff({ scenarios }: Props) {
  if (!scenarios.length) return null;
  const width = 760;
  const height = 370;
  const left = 72;
  const right = 28;
  const top = 30;
  const bottom = 68;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxGain = Math.max(2.5, ...scenarios.map((item) => item.expectedGain));
  const x = (value: number) => left + (Math.max(0, Math.min(100, value)) / 100) * plotWidth;
  const y = (value: number) => top + plotHeight - (Math.max(0, value) / maxGain) * plotHeight;
  const ordered = [...scenarios].sort((a, b) => a.feasibility - b.feasibility);
  const frontier = ordered.map((item) => `${x(item.feasibility)},${y(item.expectedGain)}`).join(" ");

  return (
    <section className="orion-tradeoff-panel" aria-labelledby="orion-tradeoff-title">
      <div className="orion-tradeoff-heading">
        <div><span>ORION · STRATEGY TOPOLOGY</span><h2 id="orion-tradeoff-title">Bản đồ đánh đổi chiến lược</h2><p>Mỗi điểm là một phương án; vị trí thể hiện mức khả thi và mức tăng điểm giả định do bộ quy tắc Orion tạo ra.</p></div>
        <span className="orion-tradeoff-stamp">RULE-BASED MODEL</span>
      </div>
      <div className="orion-tradeoff-chart-wrap">
        <svg className="orion-tradeoff-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ đánh đổi giữa mức khả thi và mức tăng điểm giả định của ba chiến lược Orion">
          {[0, 0.5, 1, 1.5, 2, 2.5].map((tick) => (
            <g key={tick}>
              <line x1={left} y1={y(tick)} x2={width - right} y2={y(tick)} className="orion-chart-gridline" />
              <text x={left - 14} y={y(tick) + 4} textAnchor="end" className="orion-chart-tick">{tick.toFixed(1)}</text>
            </g>
          ))}
          {[40, 60, 80, 100].map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} y1={top} x2={x(tick)} y2={top + plotHeight} className="orion-chart-gridline is-vertical" />
              <text x={x(tick)} y={top + plotHeight + 24} textAnchor="middle" className="orion-chart-tick">{tick}%</text>
            </g>
          ))}
          <line x1={left} y1={top + plotHeight} x2={width - right} y2={top + plotHeight} className="orion-chart-axis" />
          <line x1={left} y1={top} x2={left} y2={top + plotHeight} className="orion-chart-axis" />
          <polyline points={frontier} className="orion-frontier-line" />
          {scenarios.map((scenario) => {
            const cx = x(scenario.feasibility);
            const cy = y(scenario.expectedGain);
            const radius = 10 + Math.max(0, Math.min(20, scenario.weeklyHours)) * 0.45;
            const color = scenario.id === "balanced" ? "#0f9f91" : scenario.id === "focused" ? "#3478e5" : "#e28a38";
            return (
              <g key={scenario.id} className={`orion-tradeoff-point is-${scenario.id}`}>
                <circle cx={cx} cy={cy} r={radius + 7} fill={color} opacity=".10" />
                <circle cx={cx} cy={cy} r={radius} fill={color} stroke="#fff" strokeWidth="3"><title>{scenario.title}: khả thi {scenario.feasibility}%, tăng điểm giả định {scenario.expectedGain}, {scenario.weeklyHours} giờ/tuần</title></circle>
                <text x={cx} y={cy - radius - 13} textAnchor="middle" className="orion-chart-point-label">{scenario.id === "balanced" ? "CÂN BẰNG" : scenario.id === "focused" ? "TẬP TRUNG" : "BỨT PHÁ"}</text>
              </g>
            );
          })}
          <text x={left + plotWidth / 2} y={height - 12} textAnchor="middle" className="orion-chart-axis-label">MỨC KHẢ THI THEO QUY TẮC (%) →</text>
          <text x="18" y={top + plotHeight / 2} textAnchor="middle" transform={`rotate(-90 18 ${top + plotHeight / 2})`} className="orion-chart-axis-label">MỨC TĂNG ĐIỂM GIẢ ĐỊNH</text>
        </svg>
      </div>
      <div className="orion-tradeoff-legend">
        {scenarios.map((scenario) => <div key={scenario.id}><strong>{scenario.title}</strong><span>{scenario.expectedGain.toFixed(1)} điểm giả định · {scenario.weeklyHours} giờ/tuần</span><em>{RISK_LABEL[scenario.riskLevel]}</em></div>)}
      </div>
      <p className="orion-tradeoff-note">Lưu ý phương pháp: “mức tăng điểm” và “khả thi” là đầu ra heuristic của engine hiện tại, không phải xác suất đỗ, dự báo ML đã hiệu chuẩn hay hiệu quả can thiệp đã quan sát.</p>
    </section>
  );
}
