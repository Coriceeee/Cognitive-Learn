/** CP62 — a connected action/evidence visualization instead of two dashboard tiles.
 * All statuses are derived from verified data supplied by StudentPage.
 */
import { countAvailableSignals, studentDataSignals } from "../../../lib/studentSignalRail";

type NextAction = { title: string; detail: string; href: string };

type Props = {
  actions: readonly NextAction[];
  hasProfile: boolean;
  hasCognitiveScore: boolean;
  hasComparableGrowth: boolean;
  riskText: string;
  growthNote: string;
};

export default function StudentActionSignalRail({
  actions, hasProfile, hasCognitiveScore, hasComparableGrowth, riskText, growthNote,
}: Props) {
  const signals = studentDataSignals({ hasProfile, hasCognitiveScore, hasComparableGrowth });
  const available = countAvailableSignals(signals);
  const plotLabel = signals.map((signal) => `${signal.label}: ${signal.status}`).join("; ");

  return (
    <section className="cla-action-signal" aria-labelledby="cla-action-signal-title">
      <header className="cla-action-signal-heading">
        <div>
          <span className="cla-action-signal-eyebrow">HÀNH ĐỘNG HỌC TẬP / EVIDENCE ROUTE</span>
          <h2 id="cla-action-signal-title">Việc tiếp theo, dựa trên dữ liệu hiện có</h2>
          <p>Hành động và nguồn quan sát nằm trên cùng một lộ trình — không phải hai bảng điểm độc lập.</p>
        </div>
        <span className="cla-action-signal-counter"><b>{String(available).padStart(2, "0")}</b><span>/ 03 nguồn<br />có dữ liệu</span></span>
      </header>
      <div className="cla-action-signal-body">
        <div className="cla-action-signal-steps">
          <div className="cla-action-signal-subheading"><span>01 / ƯU TIÊN THỰC HIỆN</span><small>Tối đa 3 hành động</small></div>
          <ol className="cla-action-signal-path">
            {actions.slice(0, 3).map((action, index) => (
              <li key={`${index}-${action.href}-${action.title}`}>
                <span className="cla-action-signal-marker" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <a href={action.href}>
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                  <span className="cla-action-signal-link">Mở công việc <span aria-hidden="true">↗</span></span>
                </a>
              </li>
            ))}
          </ol>
        </div>
        <aside className="cla-action-signal-evidence" aria-label="Tín hiệu nguồn dữ liệu">
          <div className="cla-action-signal-subheading"><span>02 / CÁC NGUỒN ĐANG CÓ</span><small>Không phải điểm năng lực</small></div>
          <svg className="cla-action-signal-plot" viewBox="0 0 450 148" role="img" aria-label={plotLabel}>
            <line className="cla-action-signal-baseline" x1="40" x2="410" y1="117" y2="117" />
            {signals.map((signal, index) => {
              const x = 84 + index * 141;
              return (
                <g key={signal.id}>
                  <rect className="cla-action-signal-plot-track" x={x - 20} y="20" width="40" height="97" rx="10" />
                  {signal.available ? (
                    <rect className="cla-action-signal-plot-present" x={x - 20} y="20" width="40" height="97" rx="10" />
                  ) : (
                    <path className="cla-action-signal-plot-unavailable" d={`M ${x - 12} 106 L ${x + 12} 106`} />
                  )}
                  <text className="cla-action-signal-plot-symbol" x={x} y="77" textAnchor="middle">{signal.available ? "✓" : "—"}</text>
                  <text className="cla-action-signal-plot-label" x={x} y="138" textAnchor="middle">{index === 0 ? "SEED" : index === 1 ? "COGNITIVE" : "GROWTH"}</text>
                </g>
              );
            })}
          </svg>
          <ul className="cla-action-signal-legend">
            {signals.map((signal) => (
              <li key={signal.id}>
                <span className={`cla-action-signal-dot${signal.available ? " is-available" : ""}`} aria-hidden="true" />
                <div><strong>{signal.label}</strong><small>{signal.detail}</small></div>
                <span className="cla-action-signal-state">{signal.status}</span>
              </li>
            ))}
          </ul>
          <div className="cla-action-signal-risk"><strong>Theo dõi:</strong> {hasProfile ? riskText : "Chưa có dữ liệu"}</div>
          <p className="cla-action-signal-note">{growthNote}</p>
        </aside>
      </div>
      <footer className="cla-action-signal-footer">
        <span>03 nguồn = kiểm tra tình trạng dữ liệu, không phải chỉ số khoa học.</span>
        <a href="/student/profile">Cập nhật hồ sơ <span aria-hidden="true">↗</span></a>
      </footer>
    </section>
  );
}
