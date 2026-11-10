import type { PulseMetric } from "../../lib/pulseReportEngine";

type Props = { metrics: PulseMetric[]; overallScore: number };

function metricClass(score: number) {
  if (score >= 76) return "is-good";
  if (score >= 55) return "is-watch";
  return "is-risk";
}

export default function PulseMetricOrbit({ metrics, overallScore }: Props) {
  const width = 280;
  const center = 140;
  const radii = [118, 103, 88, 73, 58, 43];
  const rows = metrics.slice(0, radii.length);

  return (
    <section className="pulse-metric-orbit" aria-labelledby="pulse-orbit-title">
      <div className="pulse-orbit-heading">
        <div>
          <span>PULSE · MULTI-DIMENSIONAL FIELD</span>
          <h2 id="pulse-orbit-title">Quỹ đạo tiến độ sáu chiều</h2>
          <p>Mỗi vòng biểu diễn mức đạt so với mục tiêu của một chỉ số. Vòng chưa đầy không đồng nghĩa thất bại; cần đọc cùng giá trị và mục tiêu ở bảng bên cạnh.</p>
        </div>
        <span className="pulse-orbit-stamp">TARGET-NORMALIZED</span>
      </div>
      <div className="pulse-orbit-layout">
        <div className="pulse-orbit-visual">
          <svg viewBox={`0 0 ${width} ${width}`} role="img" aria-label="Sáu vòng tiến độ tương ứng sáu chỉ số Pulse">
            <defs>
              <filter id="pulseOrbitGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {rows.map((metric, index) => {
              const radius = radii[index];
              const circumference = 2 * Math.PI * radius;
              const score = Math.max(0, Math.min(100, metric.score));
              return (
                <g key={metric.id} transform={`rotate(-90 ${center} ${center})`}>
                  <circle cx={center} cy={center} r={radius} className="pulse-orbit-track" />
                  <circle cx={center} cy={center} r={radius} className={`pulse-orbit-value ${metricClass(score)}`} strokeDasharray={`${(score / 100) * circumference} ${circumference}`} filter="url(#pulseOrbitGlow)">
                    <title>{metric.label}: {score}% mục tiêu</title>
                  </circle>
                </g>
              );
            })}
            <circle cx={center} cy={center} r="30" className="pulse-orbit-core" />
            <text x={center} y="136" textAnchor="middle" className="pulse-orbit-score">{overallScore.toFixed(0)}</text>
            <text x={center} y="151" textAnchor="middle" className="pulse-orbit-score-label">PULSE</text>
          </svg>
          <div className="pulse-orbit-scale"><span>0%</span><span>50%</span><span>100%</span></div>
        </div>
        <div className="pulse-orbit-legend">
          {rows.map((metric, index) => (
            <div className="pulse-orbit-row" key={metric.id}>
              <span className={`pulse-orbit-index ${metricClass(metric.score)}`}>{String(index + 1).padStart(2, "0")}</span>
              <div className="pulse-orbit-row-main">
                <strong>{metric.label}</strong>
                <small>{metric.value}{metric.unit} · mục tiêu {metric.target}{metric.unit}</small>
              </div>
              <b className={metricClass(metric.score)}>{Math.round(metric.score)}%</b>
            </div>
          ))}
        </div>
      </div>
      <p className="pulse-orbit-note">Điểm tổng là trung bình các mức đạt mục tiêu theo công thức Pulse hiện tại. Chỉ số nhập tay hoặc dữ liệu mô phỏng không phải outcome nghiên cứu; thiếu lần đo trước thì không thể kết luận xu hướng dài hạn.</p>
    </section>
  );
}
