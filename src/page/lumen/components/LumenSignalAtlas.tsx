import type { CognitiveResult } from "../../../engines/cognitive/cognitiveEngine";
import type { CognitiveGrowthAnalytics } from "../../../engines/history/cognitiveGrowthAnalytics";

type Props = {
  cognitive: CognitiveResult;
  growth: CognitiveGrowthAnalytics | null;
};

const CORE_CODES = ["SCI", "MAS", "CSL", "CRI"] as const;
const RISK_CODES = ["GVI", "BDI", "FRI"] as const;
const LABELS: Record<string, string> = {
  SCI: "Nhất quán hành động",
  MAS: "Động lực tự báo cáo",
  CSL: "Chiến lược học",
  CRI: "Chỉ số tổng hợp",
  GVI: "Biến động mục tiêu",
  BDI: "Biến động hành vi",
  FRI: "Tín hiệu quá tải",
};
const SHORT: Record<string, string> = {
  SCI: "SCI", MAS: "MAS", CSL: "CSL", CRI: "CRI",
  GVI: "GVI", BDI: "BDI", FRI: "FRI",
};
const RISK_SET = new Set<string>(RISK_CODES);

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function RadarFigure({ values }: { values: Array<{ code: string; value: number }> }) {
  const cx = 160;
  const cy = 132;
  const radius = 88;
  const count = values.length;
  const point = (value: number, index: number, outer = radius) => {
    const angle = (-Math.PI / 2) + (index * Math.PI * 2) / count;
    const r = (Math.max(0, Math.min(100, value)) / 100) * outer;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  };
  const polygon = values.map((item, index) => {
    const p = point(item.value, index);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className="cla-radar-svg" viewBox="0 0 320 270" role="img" aria-label="Biểu đồ 4 chỉ báo học tập đang có dữ liệu, trong đó CRI là giá trị tổng hợp">
      <defs>
        <linearGradient id="claRadarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity=".34" />
          <stop offset="100%" stopColor="rgb(var(--tc-fl-2563eb))" stopOpacity=".10" />
        </linearGradient>
      </defs>
      {[25, 50, 75, 100].map((tick) => (
        <circle key={tick} cx={cx} cy={cy} r={(radius * tick) / 100} className="cla-radar-grid" />
      ))}
      {values.map((item, index) => {
        const p = point(100, index);
        const label = point(100, index, radius + 25);
        return (
          <g key={item.code}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} className="cla-radar-axis" />
            <text x={label.x} y={label.y + 4} textAnchor="middle" className="cla-radar-label">{item.code}</text>
          </g>
        );
      })}
      <polygon points={polygon} fill="url(#claRadarFill)" stroke="rgb(var(--tc-sk-2563eb))" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((item, index) => {
        const p = point(item.value, index);
        return <circle key={item.code} cx={p.x} cy={p.y} r="4.5" className="cla-radar-point"><title>{item.code}: {item.value}/100</title></circle>;
      })}
      <text x={cx} y="258" textAnchor="middle" className="cla-radar-scale">THANG 0–100 · CHỈ BÁO THỬ NGHIỆM</text>
    </svg>
  );
}

function CoverageRing({ coverage, observed }: { coverage: number; observed: number }) {
  const safe = Math.max(0, Math.min(100, coverage));
  const circumference = 2 * Math.PI * 43;
  return (
    <div className="cla-coverage-ring" aria-label={`Độ bao phủ dữ liệu ${safe} phần trăm, ${observed} trên 7 chiều có dữ liệu`}>
      <svg viewBox="0 0 112 112" role="img" aria-hidden="true">
        <circle cx="56" cy="56" r="43" className="cla-ring-track" />
        <circle cx="56" cy="56" r="43" className="cla-ring-value" strokeDasharray={`${(safe / 100) * circumference} ${circumference}`} />
      </svg>
      <div><strong>{safe}%</strong><span>{observed}/7 chiều</span></div>
    </div>
  );
}

export default function LumenSignalAtlas({ cognitive, growth, mode="all" }: Props & {mode?: "all"|"indices"|"history"}) {
  const dimensions = cognitive.dimensions ?? [];
  const coreValues = CORE_CODES.flatMap((code) => {
    const item = dimensions.find((dimension) => dimension.code === code);
    return item?.available === true && Number.isFinite(item.value)
      ? [{ code, value: item.value }]
      : [];
  });
  const riskSignals = RISK_CODES.flatMap((code) => {
    const item = dimensions.find((dimension) => dimension.code === code);
    return item?.available === true && Number.isFinite(item.value)
      ? [{ code, value: item.value }]
      : [];
  });
  const observed = cognitive.vector?.availableDimensions?.length ?? dimensions.filter((item) => item.available === true).length;
  const coverage = cognitive.dataCoverageScore ?? cognitive.vector?.dataCoverageScore ?? 0;
  const hasGrowth = Boolean(growth && growth.overall.previous !== null && growth.dimensions.length > 0);
  const changes = hasGrowth ? growth!.dimensions : [];

  return (
    <section className="cla-signal-atlas" aria-labelledby="cla-signal-atlas-title">
      <div className="cla-signal-atlas-heading">
        <div>
          <span className="lumen-eyebrow">LUMEN · GIẢI THÍCH CÁC CHỈ SỐ</span>
          <h2 id="cla-signal-atlas-title">{mode === "history" ? "Biến động giữa các lần đo" : "Bản đồ tín hiệu người học"}</h2>
          <p>{mode === "history" ? "So sánh giữa các lần ghi nhận hợp lệ." : "Biểu diễn các phép đo đã có và tín hiệu còn thiếu. CRI là chỉ số tổng hợp, không phải một phép đo độc lập với SCI, MAS, CSL."}</p>
        </div>
        <span className="cla-visual-stamp">DỰA TRÊN DỮ LIỆU ĐÃ CÓ</span>
      </div>

      {mode !== "history" && <div className="cla-signal-grid">
        <article className="cla-visual-card cla-radar-card">
          <div className="cla-visual-card-head">
            <div><span>01 / BỐN CHỈ BÁO NỀN TẢNG VÀ TỔNG HỢP</span><h3>Hình dạng bộ chỉ số học tập</h3></div>
            <span className="cla-visual-tag">{coreValues.length}/4 chỉ báo</span>
          </div>
          {coreValues.length >= 3 ? (
            <>
              <RadarFigure values={coreValues} />
              <div className="cla-radar-legend">
                {coreValues.map((item) => <div key={item.code}><span>{SHORT[item.code]}</span><strong>{Math.round(item.value)}</strong></div>)}
              </div>
            </>
          ) : (
            <div className="cla-chart-empty"><strong>Chưa đủ chiều để dựng hình radar</strong><p>Cần ít nhất ba chỉ số lõi có phép đo hợp lệ. Các chiều thiếu không được thay bằng 0.</p></div>
          )}
        </article>

        <article className="cla-visual-card cla-signal-quality-card">
          <div className="cla-visual-card-head">
            <div><span>02 / CÓ ĐỦ DỮ LIỆU HAY CHƯA?</span><h3>Mức độ đầy đủ của dữ liệu</h3></div>
            <span className="cla-visual-tag">{cognitive.mappingVersion ?? "UNVERSIONED"}</span>
          </div>
          <div className="cla-coverage-layout">
            <CoverageRing coverage={coverage} observed={observed} />
            <div className="cla-coverage-copy">
              <strong>{observed === 7 ? "Đã ghi nhận đủ 7 chiều" : `Còn thiếu ${Math.max(0, 7 - observed)} chiều`}</strong>
              <p>Ví dụ 7/7 = có số ở cả 7 ô, <strong>không phải AI chính xác 100%</strong>. Dữ liệu có thể tự khai báo hoặc do hệ thống tính; hãy kiểm tra nguồn tại SEED.</p>
            </div>
          </div>
          <div className="cla-signal-bars">
            <div className="cla-signal-bars-title"><span>03 / TÍN HIỆU BIẾN ĐỘNG VÀ HÀNH VI</span><small>Giá trị cao = cần xem xét thêm</small></div>
            {riskSignals.length ? riskSignals.map((item) => (
              <div className="cla-signal-bar-row" key={item.code}>
                <span>{item.code}</span><div className="cla-signal-track"><i style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }} /></div><strong>{Math.round(item.value)}</strong>
              </div>
            )) : <p className="cla-signal-muted">Chưa có tín hiệu GVI, BDI hoặc FRI đủ điều kiện hiển thị.</p>}
          </div>
        </article>
      </div>}

      {mode !== "indices" && <article className="cla-visual-card cla-change-field">
        <div className="cla-visual-card-head">
          <div><span>04 / THAY ĐỔI QUA CÁC LẦN GHI NHẬN</span><h3>So sánh chỉ số giữa hai lần</h3></div>
          <span className={`cla-visual-tag ${hasGrowth ? "is-observed" : ""}`}>{hasGrowth ? `${growth!.observationDays} ngày quan sát` : "Chưa có hai lần đo"}</span>
        </div>
        {hasGrowth ? (
          <div className="cla-delta-chart">
            {changes.map((item) => {
              const width = Math.min(48, Math.abs(item.delta) / 50 * 48);
              const favorableDelta = RISK_SET.has(item.code) ? -item.delta : item.delta;
              const status = favorableDelta > 2 ? "positive" : favorableDelta < -2 ? "negative" : "neutral";
              return (
                <div className="cla-delta-row" key={item.code}>
                  <div className="cla-delta-label"><strong>{item.code}</strong><span>{LABELS[item.code]}</span></div>
                  <div className="cla-delta-axis"><i className="cla-delta-zero" /><i className={`cla-delta-fill is-${status}`} style={{ width: `${width}%`, left: item.delta >= 0 ? "50%" : `calc(50% - ${width}%)` }} /></div>
                  <strong className={`cla-delta-value is-${status}`}>{signed(item.delta)}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="cla-chart-empty cla-change-empty"><strong>Đang chờ lần đo tiếp theo</strong><p>Biểu đồ chỉ xuất hiện khi có hai lần ghi nhận hợp lệ theo cùng phiên bản quy tắc. Một lần ghi nhận không đủ để kết luận xu hướng.</p></div>
        )}
        <p className="cla-chart-footnote">GVI, BDI và FRI cần đọc theo bối cảnh; số tăng hay giảm không tự động là tốt hoặc xấu. So sánh này mô tả biến động quan sát, không chứng minh tác động của CLA.</p>
      </article>}

      {mode !== "history" && <div className="cla-evidence-path" aria-label="Trạng thái đường đi dữ liệu">
        <div className="cla-evidence-path-head"><span>04 / CÁC BƯỚC KIỂM CHỨNG</span><strong>Thông tin đang ở bước nào?</strong></div>
        <div className="cla-evidence-nodes">
          <div className="is-ready"><i>01</i><strong>Hồ sơ</strong><small>Hồ sơ đã tải</small></div>
          <b aria-hidden="true">→</b>
          <div className={observed > 0 ? "is-ready" : "is-waiting"}><i>02</i><strong>Tính chỉ số</strong><small>{observed}/7 chiều có dữ liệu</small></div>
          <b aria-hidden="true">→</b>
          <div className={hasGrowth ? "is-ready" : "is-waiting"}><i>03</i><strong>Đo lại</strong><small>{hasGrowth ? "Đã có hai lần ghi nhận" : "Đang chờ lần đo 2"}</small></div>
          <b aria-hidden="true">→</b>
          <div className="is-limited"><i>04</i><strong>Kiểm định</strong><small>Chưa kiểm định thực nghiệm</small></div>
        </div>
      </div>}
    </section>
  );
}
