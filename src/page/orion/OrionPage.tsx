import { useMemo, useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import {
  runOrionStrategy,
  type OrionRiskLevel,
  type OrionSubjectScore,
} from "../../lib/orionStrategyEngine";
import "../../styles.css";

type ScoreKey =
  | "math"
  | "literature"
  | "english"
  | "physics"
  | "chemistry"
  | "biology";

const subjectLabels: Record<ScoreKey, string> = {
  math: "Toán",
  literature: "Văn",
  english: "Anh",
  physics: "Lý",
  chemistry: "Hóa",
  biology: "Sinh",
};

const defaultScores: Record<ScoreKey, string> = {
  math: "8",
  literature: "7",
  english: "8",
  physics: "7.5",
  chemistry: "7.5",
  biology: "7",
};

const defaultTargets: Record<ScoreKey, string> = {
  math: "8.8",
  literature: "8",
  english: "8.8",
  physics: "8.4",
  chemistry: "8.2",
  biology: "7.8",
};

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed)) return 0;

  return Math.min(10, Math.max(0, parsed));
}

function getRiskLabel(riskLevel: OrionRiskLevel) {
  if (riskLevel === "LOW") return "Ổn định";
  if (riskLevel === "MEDIUM") return "Cần tăng tốc";
  return "Rủi ro cao";
}

function getRiskClass(riskLevel: OrionRiskLevel) {
  if (riskLevel === "LOW") return "low";
  if (riskLevel === "MEDIUM") return "medium";
  return "high";
}

export default function OrionPage() {
  const [targetMajor, setTargetMajor] = useState("Công nghệ thông tin");
  const [weeksLeft, setWeeksLeft] = useState("16");
  const [scores, setScores] = useState<Record<ScoreKey, string>>(defaultScores);
  const [targets, setTargets] =
    useState<Record<ScoreKey, string>>(defaultTargets);

  const subjects: OrionSubjectScore[] = useMemo(() => {
    return (Object.keys(subjectLabels) as ScoreKey[]).map((key) => ({
      subject: key,
      label: subjectLabels[key],
      currentScore: toNumber(scores[key]),
      targetScore: toNumber(targets[key]),
      importance:
        key === "math" || key === "english"
          ? 1.2
          : key === "physics" || key === "chemistry"
            ? 1.1
            : 1,
    }));
  }, [scores, targets]);

  const strategy = useMemo(() => {
    return runOrionStrategy({
      subjects,
      weeksLeft: Math.max(1, Number(weeksLeft) || 1),
      targetMajor,
    });
  }, [subjects, weeksLeft, targetMajor]);

  function updateScore(key: ScoreKey, value: string) {
    setScores((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTarget(key: ScoreKey, value: string) {
    setTargets((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <main className="orion-page">
      <header className="orion-floating-header">
        <a
          className="orion-home-logo"
          href="/student"
          aria-label="Về trang học sinh"
        >
          <img src={appLogo} alt="Cognitive Learn" />
        </a>

        <UserMenu />
      </header>

      <section className="orion-shell">
        <section className="orion-hero">
          <div>
            <span>ORION STRATEGY</span>
            <h1>Mô phỏng chiến lược học tập và xét tuyển</h1>
            <p>
              Orion dùng điểm hiện tại, điểm mục tiêu và thời gian còn lại để
              tạo chiến lược tăng điểm, phân tích rủi ro và đề xuất lộ trình
              hành động theo tuần.
            </p>
          </div>

          <aside>
            <span>Readiness</span>
            <strong>{strategy.readinessScore}/100</strong>
            <em className={`orion-risk ${getRiskClass(strategy.riskLevel)}`}>
              {getRiskLabel(strategy.riskLevel)}
            </em>
          </aside>
        </section>

        <section className="orion-control-panel">
          <div className="orion-control-head">
            <div>
              <span>INPUT</span>
              <h2>Dữ liệu mô phỏng</h2>
              <p>
                Hiện tại nhập nhanh để demo. Sau này Orion sẽ tự lấy điểm từ
                Seed Profile và dữ liệu ngành từ Atlas.
              </p>
            </div>
          </div>

          <div className="orion-form-grid">
            <label>
              <span>Ngành mục tiêu</span>
              <input
                value={targetMajor}
                onChange={(event) => setTargetMajor(event.target.value)}
                placeholder="Ví dụ: Công nghệ thông tin"
              />
            </label>

            <label>
              <span>Số tuần còn lại</span>
              <input
                value={weeksLeft}
                onChange={(event) => setWeeksLeft(event.target.value)}
                placeholder="Ví dụ: 16"
              />
            </label>
          </div>

          <div className="orion-score-table">
            {(Object.keys(subjectLabels) as ScoreKey[]).map((key) => (
              <div key={key}>
                <strong>{subjectLabels[key]}</strong>

                <label>
                  <span>Hiện tại</span>
                  <input
                    value={scores[key]}
                    onChange={(event) => updateScore(key, event.target.value)}
                  />
                </label>

                <label>
                  <span>Mục tiêu</span>
                  <input
                    value={targets[key]}
                    onChange={(event) => updateTarget(key, event.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="orion-result-grid">
          <article className="orion-summary-card">
            <span>KẾT QUẢ ORION</span>
            <h2>{strategy.bestScenario.title}</h2>
            <p>{strategy.summary}</p>

            <div className="orion-metrics">
              <div>
                <span>Khoảng cách điểm</span>
                <strong>{strategy.overallGap}</strong>
              </div>

              <div>
                <span>Giờ/tuần đề xuất</span>
                <strong>{strategy.bestScenario.weeklyHours}</strong>
              </div>

              <div>
                <span>Khả thi</span>
                <strong>{strategy.bestScenario.feasibility}%</strong>
              </div>
            </div>
          </article>

          <article className="orion-focus-card">
            <span>FOCUS</span>
            <h2>Môn cần ưu tiên</h2>

            <div className="orion-focus-list">
              {strategy.focusSubjects.slice(0, 4).map((subject) => (
                <div key={subject.subject}>
                  <strong>{subject.label}</strong>
                  <span>
                    {subject.currentScore} → {subject.targetScore}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="orion-section">
          <div className="orion-section-head">
            <div>
              <span>SCENARIOS</span>
              <h2>3 chiến lược có thể chọn</h2>
            </div>
          </div>

          <div className="orion-scenario-grid">
            {strategy.scenarios.map((scenario) => (
              <article className="orion-scenario-card" key={scenario.id}>
                <div>
                  <span>{scenario.feasibility}% khả thi</span>
                  <h3>{scenario.title}</h3>
                  <p>{scenario.description}</p>
                </div>

                <div className="orion-chip-row">
                  <span>+{scenario.expectedGain} điểm</span>
                  <span>{scenario.weeklyHours} giờ/tuần</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="orion-section">
          <div className="orion-section-head">
            <div>
              <span>ROADMAP</span>
              <h2>Lộ trình hành động</h2>
            </div>
          </div>

          <div className="orion-timeline">
            {strategy.milestones.map((milestone) => (
              <article className="orion-timeline-card" key={milestone.week}>
                <span>Tuần {milestone.week}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.target}</p>

                <ul>
                  {milestone.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {strategy.warnings.length > 0 && (
          <section className="orion-warning">
            <strong>Lưu ý từ Orion</strong>
            <ul>
              {strategy.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}