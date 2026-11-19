import type { PipelineEvidence, StageEvidence, StageStatus } from "../../lib/pipelineEvidence";

type Props = { evidence: PipelineEvidence };

const STAGE_LABELS: Record<StageEvidence["stage"], string> = {
  seed: "SEED",
  lumen: "LUMEN",
  orion: "ORION",
  pulse: "PULSE",
};

const STATUS_LABELS: Record<StageStatus, string> = {
  PRESENT: "CÓ DỮ LIỆU",
  LIMITED: "GIỚI HẠN",
  MISSING: "THIẾU DỮ LIỆU",
  INVALID: "KHÔNG HỢP LỆ",
};

function statusClass(status: StageStatus) {
  if (status === "PRESENT") return "is-present";
  if (status === "LIMITED") return "is-limited";
  if (status === "INVALID") return "is-invalid";
  return "is-missing";
}

export default function PulseEvidenceCircuit({ evidence }: Props) {
  const stages = evidence.stages;
  const positions = [110, 365, 620, 875];

  return (
    <section className="pulse-evidence-circuit" aria-labelledby="pulse-circuit-title">
      <div className="pulse-circuit-heading">
        <div>
          <span>PULSE · DATA LINEAGE DIAGNOSTIC</span>
          <h3 id="pulse-circuit-title">Mạch liên thông dữ liệu CLA</h3>
          <p>Trạng thái đọc metadata của các nguồn thuộc UID hiện tại, không tải điểm hoặc hồ sơ thô.</p>
        </div>
        <div className="pulse-circuit-meta">
          <span className={evidence.scope === "demo" ? "is-demo" : ""}>{evidence.scope.toUpperCase()} SCOPE</span>
          <small>{new Date(evidence.checkedAt).toLocaleString("vi-VN")}</small>
        </div>
      </div>
      <div className="pulse-circuit-visual-wrap">
        <svg className="pulse-circuit-visual" viewBox="0 0 985 190" role="img" aria-label="Mạch kiểm tra nguồn dữ liệu từ Seed qua Lumen, Orion đến Pulse">
          <defs>
            <linearGradient id="pulseCircuitLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22a7c7" />
              <stop offset="55%" stopColor="rgb(var(--tc-fl-377ce0))" />
              <stop offset="100%" stopColor="rgb(var(--tc-fl-765acb))" />
            </linearGradient>
          </defs>
          {stages.slice(0, 3).map((stage, index) => {
            const left = positions[index];
            const right = positions[index + 1];
            const connected = stage.status === "PRESENT" && stages[index + 1]?.status === "PRESENT";
            return <g key={`link-${stage.stage}`}>
              <path d={`M ${left + 44} 82 C ${left + 105} 82, ${right - 105} 82, ${right - 44} 82`} className={connected ? "pulse-circuit-link is-connected" : "pulse-circuit-link is-fragmented"} />
              <circle cx={(left + right) / 2} cy="82" r="4" className="pulse-circuit-junction" />
            </g>;
          })}
          {stages.map((stage, index) => {
            const x = positions[index];
            return <g key={stage.stage} className={`pulse-circuit-node ${statusClass(stage.status)}`}>
              <circle cx={x} cy="82" r="38" className="pulse-circuit-halo" />
              <circle cx={x} cy="82" r="27" className="pulse-circuit-ring" />
              <text x={x} y="87" textAnchor="middle" className="pulse-circuit-number">0{index + 1}</text>
              <text x={x} y="142" textAnchor="middle" className="pulse-circuit-stage">{STAGE_LABELS[stage.stage]}</text>
              <text x={x} y="158" textAnchor="middle" className="pulse-circuit-status">{STATUS_LABELS[stage.status]}</text>
            </g>;
          })}
        </svg>
      </div>
      <div className="pulse-circuit-details">
        {stages.map((stage) => (
          <article key={stage.stage} className={statusClass(stage.status)}>
            <div><strong>{STAGE_LABELS[stage.stage]}</strong><span>{STATUS_LABELS[stage.status]}</span></div>
            <small>{stage.source}</small>
            <p>{stage.reason}</p>
          </article>
        ))}
      </div>
      <div className="pulse-circuit-footer">
        <span>COGNITIVE HISTORY · {evidence.history.status} · {evidence.history.count} snapshot</span>
        <strong>LINEAGE CHECK ONLY · NOT END-TO-END</strong>
      </div>
      <p className="pulse-circuit-note">{evidence.history.reason} Bản ghi này không chứng minh outcome, tiến bộ học tập, chất lượng phép đo hoặc tác động nhân quả của CLA.</p>
    </section>
  );
}
