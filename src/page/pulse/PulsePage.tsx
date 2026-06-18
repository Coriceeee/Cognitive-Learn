import { useMemo, useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import {
  getPulseRiskLabel,
  getPulseTrendLabel,
  runPulseReport,
  type PulseRiskLevel,
  type PulseTrend,
} from "../../lib/pulseReportEngine";
import "../../styles.css";

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed)) return 0;

  return Math.max(0, parsed);
}

function getRiskClass(riskLevel: PulseRiskLevel) {
  if (riskLevel === "GOOD") return "good";
  if (riskLevel === "WATCH") return "watch";
  return "risk";
}

function getTrendClass(trend: PulseTrend) {
  if (trend === "UP") return "up";
  if (trend === "DOWN") return "down";
  return "stable";
}

export default function PulsePage() {
  const [cognitiveScore, setCognitiveScore] = useState("72");
  const [previousCognitiveScore, setPreviousCognitiveScore] = useState("68");
  const [admissionReadiness, setAdmissionReadiness] = useState("64");
  const [orionReadiness, setOrionReadiness] = useState("70");
  const [atlasProgramCount, setAtlasProgramCount] = useState("6");
  const [aspirationCount, setAspirationCount] = useState("5");
  const [weeklyStudyHours, setWeeklyStudyHours] = useState("9");
  const [targetWeeklyHours, setTargetWeeklyHours] = useState("12");

  const report = useMemo(() => {
    return runPulseReport({
      cognitiveScore: toNumber(cognitiveScore),
      previousCognitiveScore: toNumber(previousCognitiveScore),
      admissionReadiness: toNumber(admissionReadiness),
      orionReadiness: toNumber(orionReadiness),
      atlasProgramCount: toNumber(atlasProgramCount),
      aspirationCount: toNumber(aspirationCount),
      weeklyStudyHours: toNumber(weeklyStudyHours),
      targetWeeklyHours: toNumber(targetWeeklyHours),
    });
  }, [
    cognitiveScore,
    previousCognitiveScore,
    admissionReadiness,
    orionReadiness,
    atlasProgramCount,
    aspirationCount,
    weeklyStudyHours,
    targetWeeklyHours,
  ]);

  return (
    <main className="pulse-page">
      <header className="pulse-floating-header">
        <a
          className="pulse-home-logo"
          href="/student"
          aria-label="Về trang học sinh"
        >
          <img src={appLogo} alt="Cognitive Learn" />
        </a>

        <UserMenu />
      </header>

      <section className="pulse-shell">
        <section className="pulse-hero">
          <div>
            <span>PULSE MONITOR</span>
            <h1>Báo cáo tiến độ học tập và tuyển sinh</h1>
            <p>
              Pulse tổng hợp dữ liệu từ Seed Profile, Lumen Cognitive, Atlas
              Admission và Orion Strategy để tạo báo cáo ngắn gọn cho học sinh,
              phụ huynh và giáo viên.
            </p>
          </div>

          <aside>
            <span>Tổng quan</span>
            <strong>{report.overallScore}/100</strong>
            <em className={`pulse-risk ${getRiskClass(report.riskLevel)}`}>
              {getPulseRiskLabel(report.riskLevel)}
            </em>
            <em className={`pulse-trend ${getTrendClass(report.trend)}`}>
              {getPulseTrendLabel(report.trend)}
            </em>
          </aside>
        </section>

        <section className="pulse-control-panel">
          <div className="pulse-control-head">
            <div>
              <span>SIMULATION INPUT</span>
              <h2>Dữ liệu mô phỏng báo cáo</h2>
              <p>
                Bản hiện tại cho phép chỉnh nhanh để demo. Sau này Pulse sẽ tự
                lấy dữ liệu từ các module đã hoàn thành.
              </p>
            </div>
          </div>

          <div className="pulse-form-grid">
            <label>
              <span>Lumen hiện tại</span>
              <input
                value={cognitiveScore}
                onChange={(event) => setCognitiveScore(event.target.value)}
              />
            </label>

            <label>
              <span>Lumen kỳ trước</span>
              <input
                value={previousCognitiveScore}
                onChange={(event) =>
                  setPreviousCognitiveScore(event.target.value)
                }
              />
            </label>

            <label>
              <span>Atlas readiness</span>
              <input
                value={admissionReadiness}
                onChange={(event) =>
                  setAdmissionReadiness(event.target.value)
                }
              />
            </label>

            <label>
              <span>Orion readiness</span>
              <input
                value={orionReadiness}
                onChange={(event) => setOrionReadiness(event.target.value)}
              />
            </label>

            <label>
              <span>Số ngành Atlas</span>
              <input
                value={atlasProgramCount}
                onChange={(event) => setAtlasProgramCount(event.target.value)}
              />
            </label>

            <label>
              <span>Số nguyện vọng</span>
              <input
                value={aspirationCount}
                onChange={(event) => setAspirationCount(event.target.value)}
              />
            </label>

            <label>
              <span>Giờ học/tuần</span>
              <input
                value={weeklyStudyHours}
                onChange={(event) => setWeeklyStudyHours(event.target.value)}
              />
            </label>

            <label>
              <span>Mục tiêu giờ/tuần</span>
              <input
                value={targetWeeklyHours}
                onChange={(event) => setTargetWeeklyHours(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="pulse-metric-grid">
          {report.metrics.map((metric) => (
            <article className="pulse-metric-card" key={metric.id}>
              <div>
                <span>{metric.label}</span>
                <strong>
                  {metric.value}
                  {metric.unit}
                </strong>
              </div>

              <em className={`pulse-risk ${getRiskClass(metric.riskLevel)}`}>
                {getPulseRiskLabel(metric.riskLevel)}
              </em>

              <div className="pulse-bar">
                <i style={{ width: `${metric.score}%` }}></i>
              </div>

              <p>{metric.description}</p>
            </article>
          ))}
        </section>

        <section className="pulse-summary-grid">
          <article>
            <span>HỌC SINH</span>
            <h2>Bản tóm tắt cho học sinh</h2>
            <p>{report.studentSummary}</p>
          </article>

          <article>
            <span>PHỤ HUYNH</span>
            <h2>Bản tóm tắt cho phụ huynh</h2>
            <p>{report.parentSummary}</p>
          </article>

          <article>
            <span>GIÁO VIÊN</span>
            <h2>Bản tóm tắt cho giáo viên</h2>
            <p>{report.teacherSummary}</p>
          </article>
        </section>

        <section className="pulse-section">
          <div className="pulse-section-head">
            <div>
              <span>ACTION PLAN</span>
              <h2>Việc nên làm tiếp theo</h2>
            </div>
          </div>

          <div className="pulse-action-list">
            {report.actions.map((action) => (
              <article className="pulse-action-card" key={action.title}>
                <em>{action.priority}</em>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </article>
            ))}
          </div>
        </section>

        {report.warnings.length > 0 && (
          <section className="pulse-warning">
            <strong>Cảnh báo từ Pulse</strong>
            <ul>
              {report.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}