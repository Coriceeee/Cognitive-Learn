import type { HavenResult } from "../../lib/havenSupportEngine";

type PressureKey = "tuitionPressure" | "studyPressure" | "admissionRisk" | "financialNeed";
type Props = {
  values: Record<PressureKey, number>;
  result: HavenResult;
};

const AXES: Array<{ key: PressureKey; label: string; short: string }> = [
  { key: "tuitionPressure", label: "Áp lực học phí", short: "HỌC PHÍ" },
  { key: "studyPressure", label: "Áp lực học tập", short: "HỌC TẬP" },
  { key: "admissionRisk", label: "Rủi ro tuyển sinh", short: "TUYỂN SINH" },
  { key: "financialNeed", label: "Nhu cầu tài chính", short: "TÀI CHÍNH" },
];

function pressureClass(value: number) {
  if (value >= 75) return "is-high";
  if (value >= 50) return "is-watch";
  return "is-low";
}

export default function HavenPressureTopology({ values, result }: Props) {
  const width = 780;
  const height = 286;
  const top = 38;
  const bottom = 218;
  const xs = [112, 296, 480, 664];
  const y = (value: number) => bottom - (Math.max(0, Math.min(100, value)) / 100) * (bottom - top);
  const points = AXES.map((axis, index) => ({ ...axis, value: values[axis.key], x: xs[index], y: y(values[axis.key]) }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${xs[0]},${bottom} ${line} ${xs[xs.length - 1]},${bottom}`;

  return (
    <section className="haven-pressure-topology" aria-labelledby="haven-pressure-title">
      <div className="haven-pressure-head">
        <div>
          <span>HAVEN · SUPPORT TOPOLOGY</span>
          <h2 id="haven-pressure-title">Địa hình áp lực & nhu cầu hỗ trợ</h2>
          <p>Bốn tín hiệu do người dùng tự nhập được đặt trên cùng thang 0–100. Đường nối thể hiện cấu hình đầu vào hiện tại, không phải thang đo lâm sàng hay kết luận về hoàn cảnh gia đình.</p>
        </div>
        <span className="haven-pressure-stamp">SELF-REPORTED INPUT</span>
      </div>

      <div className="haven-pressure-layout">
        <div className="haven-pressure-chart-wrap">
          <svg className="haven-pressure-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Biểu đồ tọa độ song song của bốn tín hiệu áp lực Haven">
            <defs>
              <linearGradient id="havenPressureArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#35a8dc" stopOpacity=".25" />
                <stop offset="100%" stopColor="#3476d8" stopOpacity=".035" />
              </linearGradient>
              <linearGradient id="havenPressureLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#25a7c7" />
                <stop offset="55%" stopColor="#3477df" />
                <stop offset="100%" stopColor="#7259c8" />
              </linearGradient>
            </defs>
            <rect x="56" y={y(100)} width="664" height={y(75) - y(100)} rx="9" className="haven-pressure-zone is-high" />
            <rect x="56" y={y(75)} width="664" height={y(50) - y(75)} className="haven-pressure-zone is-watch" />
            <rect x="56" y={y(50)} width="664" height={bottom - y(50)} rx="9" className="haven-pressure-zone is-low" />
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line x1="56" y1={y(tick)} x2="720" y2={y(tick)} className="haven-pressure-gridline" />
                <text x="43" y={y(tick) + 4} textAnchor="end" className="haven-pressure-tick">{tick}</text>
              </g>
            ))}
            {points.map((point) => (
              <g key={point.key}>
                <line x1={point.x} y1={top} x2={point.x} y2={bottom} className="haven-pressure-axis" />
                <line x1={point.x - 5} y1={point.y} x2={point.x + 5} y2={point.y} className="haven-pressure-marker-tick" />
                <text x={point.x} y="250" textAnchor="middle" className="haven-pressure-axis-label">{point.short}</text>
                <text x={point.x} y="267" textAnchor="middle" className={`haven-pressure-value ${pressureClass(point.value)}`}>{Math.round(point.value)}</text>
              </g>
            ))}
            <polygon points={area} fill="url(#havenPressureArea)" />
            <polyline points={line} fill="none" stroke="url(#havenPressureLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point) => (
              <g key={`point-${point.key}`}>
                <circle cx={point.x} cy={point.y} r="10" className={`haven-pressure-halo ${pressureClass(point.value)}`} />
                <circle cx={point.x} cy={point.y} r="5" className={`haven-pressure-dot ${pressureClass(point.value)}`}>
                  <title>{point.label}: {point.value}/100</title>
                </circle>
              </g>
            ))}
            <text x="58" y="18" className="haven-pressure-chart-caption">CẤU HÌNH TÍN HIỆU · THANG 0–100</text>
          </svg>
          <div className="haven-pressure-legend">
            <span><i className="is-low" /> 0–49 · Mức thấp</span>
            <span><i className="is-watch" /> 50–74 · Cần theo dõi</span>
            <span><i className="is-high" /> 75–100 · Ưu tiên xem xét</span>
          </div>
        </div>

        <aside className="haven-pressure-summary">
          <div className="haven-pressure-score-orbit">
            <svg viewBox="0 0 150 150" role="img" aria-label={`Mức sẵn sàng hỗ trợ ${result.supportReadinessScore} trên 100`}>
              <circle cx="75" cy="75" r="59" className="haven-pressure-score-track" />
              <circle cx="75" cy="75" r="59" className="haven-pressure-score-value" strokeDasharray={`${(Math.max(0, Math.min(100, result.supportReadinessScore)) / 100) * 370.7} 370.7`} />
            </svg>
            <div><strong>{result.supportReadinessScore}</strong><span>READINESS / 100</span></div>
          </div>
          <div className="haven-pressure-composite">
            <span>FAMILY PRESSURE INDEX</span>
            <strong>{result.familyPressureScore}<small>/100</small></strong>
            <em>{result.riskLevel === "LOW" ? "Ổn định theo quy tắc" : result.riskLevel === "MEDIUM" ? "Cần theo dõi" : "Cần ưu tiên hỗ trợ"}</em>
          </div>
          <div className="haven-pressure-actions">
            <span>SUPPORT ACTION VECTOR</span>
            {result.supportItems.map((item) => (
              <div key={item.id}>
                <i className={`is-${item.priority.toLowerCase()}`} />
                <div><strong>{item.title}</strong><small>{item.priority} · {item.type}</small></div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <p className="haven-pressure-note">Các chỉ số tổng hợp là kết quả của quy tắc Haven hiện tại. Các dải màu chỉ là ngưỡng trực quan, không thay ngưỡng riêng của từng hành động trong engine. “Readiness” và “Family Pressure” chưa được kiểm định tâm trắc; không dùng để kết luận đủ/không đủ điều kiện học bổng.</p>
    </section>
  );
}
