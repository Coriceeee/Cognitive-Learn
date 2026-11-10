import { verifiedPrograms } from "../../../data/verifiedAdmissionPrograms";

const MIN_SCORE = 22;
const MAX_SCORE = 27;
const WIDTH = 1040;
const LEFT = 286;
const PLOT_WIDTH = 510;
const RIGHT = 230;
const TOP = 54;
const ROW = 36;
const HEIGHT = TOP + verifiedPrograms.length * ROW + 58;

function x(value: number) {
  return LEFT + ((value - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * PLOT_WIDTH;
}

export default function AtlasCutoffField() {
  const rows = [...verifiedPrograms].sort((a, b) => b.historicalCutoffs[1].cutoff - a.historicalCutoffs[1].cutoff);
  return (
    <section className="atlas-cutoff-field" aria-labelledby="atlas-cutoff-field-title">
      <div className="atlas-cutoff-field-heading">
        <div><span>ATLAS · ADMISSION EVIDENCE MAP</span><h2 id="atlas-cutoff-field-title">Trường điểm chuẩn 2024 → 2025</h2><p>So sánh điểm THPT đã đối chiếu cho 10 ngành tại PTIT – cơ sở Hà Nội (BVH). Mỗi đường nối hai mốc công bố của cùng ngành.</p></div>
        <span className="atlas-cutoff-stamp">SOURCE-VERIFIED · BVH</span>
      </div>
      <div className="atlas-cutoff-legend"><span><i className="is-2024" />2024</span><span><i className="is-2025" />2025</span><span><i className="is-down" />Giảm so với 2024</span><span><i className="is-up" />Tăng so với 2024</span></div>
      <div className="atlas-cutoff-chart-wrap">
        <svg className="atlas-cutoff-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Biểu đồ slopegraph điểm chuẩn THPT 2024 và 2025 của 10 ngành PTIT cơ sở Hà Nội">
          {[22, 23, 24, 25, 26, 27].map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} y1={TOP - 18} x2={x(tick)} y2={HEIGHT - 42} className="atlas-cutoff-gridline" />
              <text x={x(tick)} y={TOP - 28} textAnchor="middle" className="atlas-cutoff-tick">{tick}</text>
            </g>
          ))}
          <text x={LEFT - 18} y="18" textAnchor="end" className="atlas-cutoff-axis-label">NGÀNH / MÃ</text>
          <text x={LEFT + PLOT_WIDTH + 18} y="18" className="atlas-cutoff-axis-label">CHÊNH LỆCH</text>
          {rows.map((program, index) => {
            const y = TOP + index * ROW;
            const previous = program.historicalCutoffs.find((item) => item.year === 2024)!;
            const current = program.historicalCutoffs.find((item) => item.year === 2025)!;
            const delta = Math.round((current.cutoff - previous.cutoff) * 100) / 100;
            const isDown = delta < 0;
            return (
              <g key={program.code} className="atlas-cutoff-row">
                <line x1={LEFT - 12} y1={y + 16} x2={WIDTH - RIGHT + 16} y2={y + 16} className="atlas-cutoff-rowline" />
                <text x={LEFT - 20} y={y + 5} textAnchor="end" className="atlas-cutoff-major">{program.major}</text>
                <text x={LEFT - 20} y={y + 19} textAnchor="end" className="atlas-cutoff-code">{program.code}</text>
                <line x1={x(previous.cutoff)} y1={y + 10} x2={x(current.cutoff)} y2={y + 10} className={`atlas-cutoff-connector ${isDown ? "is-down" : "is-up"}`} />
                <circle cx={x(previous.cutoff)} cy={y + 10} r="5.5" className="atlas-cutoff-dot is-2024"><title>{program.major}, 2024: {previous.cutoff.toFixed(2)}</title></circle>
                <circle cx={x(current.cutoff)} cy={y + 10} r="6.5" className="atlas-cutoff-dot is-2025"><title>{program.major}, 2025: {current.cutoff.toFixed(2)}</title></circle>
                <text x={WIDTH - RIGHT + 18} y={y + 5} className="atlas-cutoff-values">{previous.cutoff.toFixed(2)} → {current.cutoff.toFixed(2)}</text>
                <text x={WIDTH - RIGHT + 18} y={y + 20} className={`atlas-cutoff-delta ${isDown ? "is-down" : "is-up"}`}>{delta > 0 ? "+" : ""}{delta.toFixed(2)} điểm</text>
              </g>
            );
          })}
          <text x={LEFT + PLOT_WIDTH / 2} y={HEIGHT - 12} textAnchor="middle" className="atlas-cutoff-axis-label">ĐIỂM THPT · THANG 30</text>
        </svg>
      </div>
      <div className="atlas-cutoff-source-row">
        <span>Đối chiếu nguồn gốc:</span>
        <a href="https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-2024/" target="_blank" rel="noopener noreferrer">Điểm trúng tuyển 2024 ↗</a>
        <a href="https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-nam-2025/" target="_blank" rel="noopener noreferrer">Điểm trúng tuyển 2025 ↗</a>
      </div>
      <p className="atlas-cutoff-method-note">Không có điểm chuẩn THPT 2026 trong biểu đồ này vì dữ liệu đã nhập chưa được chuẩn hóa và đối chiếu từng dòng theo ngành/phương thức. Các điểm lịch sử không phải xác suất trúng tuyển cho năm tiếp theo.</p>
    </section>
  );
}
