import { useMemo } from "react";
import { useClosedLoopJourney } from "../../../lib/useClosedLoopJourney";
import { buildStudentJourneyHandoff } from "../../../lib/studentJourneyBridge";
import "./student-journey-bridge.css";

type ModuleNode = { code: "seed" | "lumen" | "atlas" | "orion" | "pulse" | "haven"; title: string; href: string };
const nodes: readonly ModuleNode[] = [
  { code: "seed", title: "Hồ sơ", href: "/student/profile" },
  { code: "lumen", title: "Phân tích", href: "/lumen/indices" },
  { code: "atlas", title: "Ngành và trường", href: "/atlas/recommendations" },
  { code: "orion", title: "Kế hoạch", href: "/orion/inputs" },
  { code: "pulse", title: "Nhật ký", href: "/pulse/checkin" },
  { code: "haven", title: "Nguồn lực", href: "/haven/scholarships" },
];

/** Read-only navigation of the existing six modules; no invented completion percentages. */
export default function StudentJourneyBridge({ hasProfile }: { hasProfile: boolean }) {
  const journey = useClosedLoopJourney();
  const handoff = useMemo(() => buildStudentJourneyHandoff({
    uid: journey.uid,
    signedOut: journey.status === "signed-out",
    status: journey.status,
    fromServer: journey.recentFromServer,
    hasProfile,
    latest: journey.latest,
  }), [journey.uid, journey.status, journey.recentFromServer, journey.latest, hasProfile]);
  const pending = !journey.recentFromServer || (journey.status !== "ready" && journey.status !== "empty");
  return (
    <section className="cla-journey-handoff" aria-labelledby="cla-journey-handoff-title">
      <div className="cla-journey-handoff__head">
        <div>
          <span className="cla-journey-handoff__kicker">CP70 · HÀNH TRÌNH HỌC SINH</span>
          <h2 id="cla-journey-handoff-title">Tiếp tục từ nơi bạn đang học</h2>
          <p>Đi từ dữ liệu đến quyết định, thực hành và xem lại — không cần mở từng phân hệ để tìm bước tiếp theo.</p>
        </div>
        <span className={`cla-journey-handoff__stamp${pending ? " is-pending" : ""}`} role="status">
          {pending ? "CHƯA XÁC MINH" : "DỮ LIỆU ĐÃ ĐỐI CHIẾU MÁY CHỦ"}
        </span>
      </div>
      <nav className="cla-journey-handoff__route" aria-label="Đi nhanh đến sáu phân hệ học sinh">
        {nodes.map((node, index) => (
          <a key={node.code} href={node.href} className={node.code === handoff.currentModule ? "is-next" : ""}
            aria-current={node.code === handoff.currentModule ? "step" : undefined}>
            <span className="cla-journey-handoff__no">{String(index + 1).padStart(2, "0")}</span>
            <strong>{node.code.toUpperCase()}</strong>
            <small>{node.title}</small>
          </a>
        ))}
      </nav>
      <div className="cla-journey-handoff__next" aria-live="polite">
        <div className="cla-journey-handoff__copy">
          <span>BƯỚC TIẾP THEO · {handoff.phase.toUpperCase()}</span>
          <h3>{handoff.title}</h3>
          <p>{handoff.description}</p>
          {handoff.checkIns !== null && handoff.plannedWeeks !== null && (
            <div className="cla-journey-handoff__progress">
              <div className="cla-journey-handoff__progress-label">
                <strong>{handoff.checkIns} lượt check-in</strong>
                <small>trong kế hoạch {handoff.plannedWeeks} tuần (tự báo cáo)</small>
              </div>
              <div className="cla-journey-handoff__track" role="img"
                aria-label={`${handoff.checkIns} tuần đã ghi nhật ký trên ${handoff.plannedWeeks} tuần dự kiến, không phải tỷ lệ hoàn thành mục tiêu`}>
                <span style={{ width: `${Math.min(100, handoff.checkIns / Math.max(1, handoff.plannedWeeks) * 100)}%` }}/>
              </div>
            </div>
          )}
        </div>
        {handoff.primaryHref && handoff.primaryLabel && (
          <a className="cla-journey-handoff__cta" href={handoff.primaryHref}>{handoff.primaryLabel} <span aria-hidden="true">↗</span></a>
        )}
      </div>
      <p className="cla-journey-handoff__source">{handoff.sourceNote} Liên kết Atlas/Haven là hướng khám phá song song, không chứng minh đã hoàn thành các phân hệ.</p>
    </section>
  );
}
