import { useMemo } from "react";
import { useClosedLoopJourney } from "../../../lib/useClosedLoopJourney";
import { buildStudentJourneyHandoff } from "../../../lib/studentJourneyBridge";
import "./student-journey-bridge.css";

/** Read-only verified next action; the separate LearningCircuit is the one six-module navigation. */
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
          <span className="cla-journey-handoff__kicker">HÀNH TRÌNH CỦA BẠN</span>
          <h2 id="cla-journey-handoff-title">Tiếp tục từ nơi bạn đang học</h2>
          <p>Xem một bước phù hợp để tiếp tục, dựa trên dữ liệu học tập hiện có.</p>
        </div>
        <span className={`cla-journey-handoff__stamp${pending ? " is-pending" : ""}`} role="status">
          {pending ? "CHƯA XÁC MINH" : "DỮ LIỆU ĐÃ ĐƯỢC XÁC MINH"}
        </span>
      </div>
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
