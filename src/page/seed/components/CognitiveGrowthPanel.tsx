import type {
  CognitiveGrowthAnalytics,
} from "../../../engines/history/cognitiveGrowthAnalytics";
import type {
  CognitiveDimensionCode,
} from "../../../engines/history/cognitiveHistoryTypes";

type Props = {
  analytics: CognitiveGrowthAnalytics | null;
};

const labels: Record<CognitiveDimensionCode, string> = {
  SCI: "SCI",
  MAS: "MAS",
  CSL: "CSL",
  GVI: "GVI",
  BDI: "BDI",
  FRI: "FRI",
  CRI: "CRI",
};

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? `${value}`
    : value.toFixed(1);
}

function formatDelta(delta: number) {
  const value = formatNumber(delta);

  if (delta > 0) {
    return `+${value}`;
  }

  return value;
}

function beneficialDirection(
  code: CognitiveDimensionCode,
  direction: "UP" | "DOWN" | "STABLE"
): "UP" | "DOWN" | "STABLE" {
  if (!["GVI", "BDI", "FRI"].includes(code) || direction === "STABLE") {
    return direction;
  }
  return direction === "UP" ? "DOWN" : "UP";
}

function directionLabel(
  direction: "UP" | "DOWN" | "STABLE"
) {
  if (direction === "UP") {
    return "Giá trị tăng";
  }

  if (direction === "DOWN") {
    return "Cần xem nguyên nhân";
  }

  return "Ít thay đổi";
}

export default function CognitiveGrowthPanel({
  analytics,
}: Props) {
  // No genuine comparison must never be rendered as a flat 0-point trend.
  if (
    !analytics ||
    analytics.overall.previous === null ||
    analytics.observationDays <= 0 ||
    analytics.dimensions.length === 0
  ) {
    return (
      <section className="cognitive-growth-panel">
        <div className="cognitive-growth-empty">
          <span>THEO DÕI QUA CÁC LẦN GHI NHẬN</span>
          <h3>Chưa có đủ hai lần ghi nhận để so sánh</h3>
          <p>
            Hệ thống cần ít nhất hai lần đo hợp lệ để
            xác định thay đổi theo thời gian.
          </p>
        </div>
      </section>
    );
  }

  const overall = analytics.overall;

  return (
    <section className="cognitive-growth-panel">
      <div className="cognitive-growth-header">
        <div>
          <span>THEO DÕI QUA CÁC LẦN GHI NHẬN</span>
          <h3>Bạn đã thay đổi như thế nào?</h3>
          <p>
            So sánh trạng thái hiện tại với lần đo trước
            thay vì chỉ nhìn vào một điểm số tĩnh.
          </p>
        </div>

        <div
          className={`cognitive-growth-overall is-${overall.direction.toLowerCase()}`}
        >
          <small>Chênh lệch điểm tổng hợp</small>
          <strong>{formatDelta(overall.delta)}</strong>
          <em>{directionLabel(overall.direction)}</em>
        </div>
      </div>

      <div className="cognitive-growth-meta">
        <div>
          <span>Khoảng thời gian có dữ liệu</span>
          <strong>{analytics.observationDays} ngày</strong>
        </div>

        <div>
          <span>Mức thay đổi trung bình mỗi ngày</span>
          <strong>
            {formatDelta(overall.velocityPerDay)} / ngày
          </strong>
        </div>

        <div>
          <span>Mức dữ liệu theo quy tắc</span>
          <strong>{({SUFFICIENT:"Có đủ khoảng quan sát",EMERGING:"Đang hình thành",LIMITED:"Còn hạn chế"} as Record<string,string>)[analytics.dataQuality] ?? "Chưa rõ"}</strong>
        </div>
      </div>

      <div className="cognitive-growth-grid">
        {analytics.dimensions.map((item) => (
          <article key={item.code}>
            <div className="cognitive-growth-card-top">
              <div>
                <span>{labels[item.code]}</span>
                <strong>{formatNumber(item.current)}</strong>
              </div>

              <b className={`is-${beneficialDirection(item.code, item.direction).toLowerCase()}`}>
                {formatDelta(item.delta)}
              </b>
            </div>

            <div className="cognitive-growth-bar">
              <i
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, item.current)
                  )}%`,
                }}
              />
            </div>

            <div className="cognitive-growth-card-bottom">
              <span>
                Lần trước: {formatNumber(item.previous)}
              </span>
              <em>{directionLabel(beneficialDirection(item.code, item.direction))}</em>
            </div>
          </article>
        ))}
      </div>

      <div className="cognitive-growth-insights">
        <article>
          <span>Chỉ báo tăng nhiều nhất</span>
          <strong>
            {analytics.strongestImprovement
              ? labels[analytics.strongestImprovement.code]
              : "--"}
          </strong>
          <p>
            {analytics.strongestImprovement
              ? `${formatDelta(
                  analytics.strongestImprovement.delta
                )} điểm`
              : "Chưa có tín hiệu tăng rõ ràng."}
          </p>
        </article>

        <article>
          <span>Chỉ báo giảm nhiều nhất</span>
          <strong>
            {analytics.strongestDecline
              ? labels[analytics.strongestDecline.code]
              : "--"}
          </strong>
          <p>
            {analytics.strongestDecline
              ? `${formatDelta(
                  analytics.strongestDecline.delta
                )} điểm`
              : "Chưa có tín hiệu giảm rõ ràng."}
          </p>
        </article>

        <article>
          <span>Tổng số chỉ báo tăng / giảm</span>
          <strong>
            {analytics.improving.length} ↑ /{" "}
            {analytics.declining.length} ↓
          </strong>
          <p>
            {analytics.stable.length} chỉ báo ít thay đổi
          </p>
        </article>
      </div>

      <div className="cognitive-growth-note">
        <span>Giới hạn của kết quả</span>
        <p>
          {analytics.dataQuality === "SUFFICIENT"
            ? "Đã có khoảng thời gian quan sát đủ dài để phân tích xu hướng. Đây vẫn là dữ liệu quan sát, chưa phải bằng chứng nhân quả."
            : analytics.dataQuality === "EMERGING"
              ? "Dữ liệu đang hình thành. Có thể quan sát xu hướng ban đầu nhưng chưa nên đưa ra kết luận mạnh."
              : "Mới có dữ liệu hạn chế. Cần thêm các lần đo trước khi diễn giải thay đổi theo thời gian."}
        </p>
      </div>
    </section>
  );
}
