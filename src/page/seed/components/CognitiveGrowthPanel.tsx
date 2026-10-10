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

function directionLabel(
  direction: "UP" | "DOWN" | "STABLE"
) {
  if (direction === "UP") {
    return "Improving";
  }

  if (direction === "DOWN") {
    return "Needs attention";
  }

  return "Stable";
}

export default function CognitiveGrowthPanel({
  analytics,
}: Props) {
  if (!analytics) {
    return (
      <section className="cognitive-growth-panel">
        <div className="cognitive-growth-empty">
          <span>Longitudinal Growth</span>
          <h3>Chưa đủ dữ liệu để so sánh</h3>
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
          <span>Longitudinal Growth</span>
          <h3>Bạn đã thay đổi như thế nào?</h3>
          <p>
            So sánh trạng thái hiện tại với lần đo trước
            thay vì chỉ nhìn vào một điểm số tĩnh.
          </p>
        </div>

        <div
          className={`cognitive-growth-overall is-${overall.direction.toLowerCase()}`}
        >
          <small>Overall change</small>
          <strong>{formatDelta(overall.delta)}</strong>
          <em>{directionLabel(overall.direction)}</em>
        </div>
      </div>

      <div className="cognitive-growth-meta">
        <div>
          <span>Observation window</span>
          <strong>{analytics.observationDays} days</strong>
        </div>

        <div>
          <span>Growth velocity</span>
          <strong>
            {formatDelta(overall.velocityPerDay)} / day
          </strong>
        </div>

        <div>
          <span>Data quality</span>
          <strong>{analytics.dataQuality}</strong>
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

              <b className={`is-${item.direction.toLowerCase()}`}>
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
                Previous {formatNumber(item.previous)}
              </span>
              <em>{directionLabel(item.direction)}</em>
            </div>
          </article>
        ))}
      </div>

      <div className="cognitive-growth-insights">
        <article>
          <span>Strongest improvement</span>
          <strong>
            {analytics.strongestImprovement
              ? labels[analytics.strongestImprovement.code]
              : "--"}
          </strong>
          <p>
            {analytics.strongestImprovement
              ? `${formatDelta(
                  analytics.strongestImprovement.delta
                )} points`
              : "Chưa có tín hiệu tăng rõ ràng."}
          </p>
        </article>

        <article>
          <span>Strongest decline</span>
          <strong>
            {analytics.strongestDecline
              ? labels[analytics.strongestDecline.code]
              : "--"}
          </strong>
          <p>
            {analytics.strongestDecline
              ? `${formatDelta(
                  analytics.strongestDecline.delta
                )} points`
              : "Chưa có tín hiệu giảm rõ ràng."}
          </p>
        </article>

        <article>
          <span>Profile balance</span>
          <strong>
            {analytics.improving.length} ↑ /{" "}
            {analytics.declining.length} ↓
          </strong>
          <p>
            {analytics.stable.length} dimension ổn định
          </p>
        </article>
      </div>

      <div className="cognitive-growth-note">
        <span>Evidence status</span>
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
