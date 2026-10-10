type CareerStrength = {
  label: string;
  score: number;
  source?: string;
};

type CareerGap = {
  label: string;
  score: number;
  priority: string;
  type?: string;
};

type LearningIntelligence = {
  prediction: any;
  simulation: any;
  optimization: any;
  career: {
    primaryCareer?: {
      career?: {
        name?: string;
        description?: string;
      };
      compatibility?: number;
      readiness?: number;
      readinessLevel?: string;
      strengths?: CareerStrength[];
      gaps?: CareerGap[];
      explanation?: string;
    };
    currentReadiness?: number;
    summary?: string;
    nextActions?: string[];
    confidence?: number;
  };
};

interface Props {
  intelligence: LearningIntelligence;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatReadinessLevel(value: string) {
  const labels: Record<string, string> = {
    EXPLORING: "Khám phá",
    DEVELOPING: "Đang phát triển",
    READY: "Sẵn sàng",
    HIGHLY_READY: "Sẵn sàng cao",
  };

  return labels[value] ?? value;
}

function formatScore(value: unknown) {
  return typeof value === "number" ? Math.round(value) : "--";
}

function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    HIGH: "Ưu tiên cao",
    MEDIUM: "Cần cải thiện",
    LOW: "Theo dõi",
  };

  return labels[priority] ?? priority;
}

export default function LearningIntelligencePanel({
  intelligence,
}: Props) {
  const {
    prediction,
    simulation,
    optimization,
    career,
  } = intelligence;

  const primaryCareer = career?.primaryCareer;
  const careerName = primaryCareer?.career?.name ?? "--";
  const careerDescription =
    primaryCareer?.career?.description ??
    "Hệ thống đang phân tích hồ sơ để xác định hướng phát triển phù hợp.";

  const compatibility =
    typeof primaryCareer?.compatibility === "number"
      ? clamp(primaryCareer.compatibility)
      : null;

  const readiness =
    typeof primaryCareer?.readiness === "number"
      ? clamp(primaryCareer.readiness)
      : typeof career?.currentReadiness === "number"
        ? clamp(career.currentReadiness)
        : null;

  const confidence =
    typeof career?.confidence === "number"
      ? clamp(career.confidence)
      : null;

  const readinessLevel =
    primaryCareer?.readinessLevel ?? "EXPLORING";

  const strengths = primaryCareer?.strengths ?? [];
  const gaps = primaryCareer?.gaps ?? [];
  const nextActions = career?.nextActions ?? [];

  const journeyProgress = readiness ?? 0;
  const scenarioCount =
    simulation?.scenarios?.length ??
    (Array.isArray(simulation) ? simulation.length : 0);

  const skillItems = strengths.slice(0, 5);

  return (
    <section className="student-intelligence-section">
      <div className="student-intelligence-hero">
        <div className="student-intelligence-hero-main">
          <div className="student-intelligence-eyebrow">
            <span className="student-intelligence-dot" />
            Learning Intelligence
            <span className="student-intelligence-live">LIVE PROFILE</span>
          </div>

          <h2>
            Biến dữ liệu học tập thành
            <span> lộ trình nghề nghiệp.</span>
          </h2>

          <p>
            Cognitive Learn kết nối trạng thái nhận thức, hành vi học tập
            và mục tiêu nghề nghiệp để biến dữ liệu hiện tại thành những
            quyết định phát triển có thể hành động.
          </p>

          <div className="student-intelligence-hero-meta">
            <div>
              <span>Primary direction</span>
              <strong>{careerName}</strong>
            </div>
            <div>
              <span>Readiness</span>
              <strong>{readiness !== null ? `${readiness}%` : "--"}</strong>
            </div>
          </div>
        </div>

        <div className="student-readiness-orbit">
          <div className="student-readiness-ring">
            <div className="student-readiness-ring-inner">
              <strong>{readiness !== null ? `${readiness}%` : "--"}</strong>
              <span>readiness</span>
            </div>
          </div>
          <div className="student-readiness-label">
            <span>Current state</span>
            <strong>{formatReadinessLevel(readinessLevel)}</strong>
          </div>
        </div>
      </div>

      <div className="student-career-focus">
        <div className="student-career-focus-copy">
          <div className="student-section-kicker">01 · Career Focus</div>
          <h3>{careerName}</h3>
          <p>{careerDescription}</p>
          {career?.summary && (
            <div className="student-career-insight">
              <span>System interpretation</span>
              <p>{career.summary}</p>
            </div>
          )}
        </div>

        <div className="student-career-score-stack">
          <div className="student-career-score-card student-career-score-primary">
            <span>Compatibility</span>
            <strong>
              {compatibility !== null ? `${compatibility}%` : "--"}
            </strong>
            <div className="student-score-line">
              <i style={{ width: `${compatibility ?? 0}%` }} />
            </div>
          </div>

          <div className="student-career-score-card">
            <span>Confidence</span>
            <strong>
              {confidence !== null ? `${confidence}%` : "--"}
            </strong>
            <div className="student-score-line">
              <i style={{ width: `${confidence ?? 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="student-journey-section">
        <div className="student-section-heading">
          <div>
            <div className="student-section-kicker">02 · Career Journey</div>
            <h3>Từ hiện tại đến mục tiêu</h3>
          </div>
          <span>{readiness !== null ? `${readiness}% ready` : "Building profile"}</span>
        </div>

        <div className="student-journey-track">
          <div className="student-journey-line">
            <i style={{ width: `${journeyProgress}%` }} />
          </div>

          <div className="student-journey-nodes">
            <div className="is-complete">
              <b>01</b>
              <strong>Current State</strong>
              <span>Hiểu bản thân</span>
            </div>
            <div className={journeyProgress >= 50 ? "is-active" : ""}>
              <b>02</b>
              <strong>Career Fit</strong>
              <span>Đối chiếu hướng đi</span>
            </div>
            <div className={journeyProgress >= 70 ? "is-active" : ""}>
              <b>03</b>
              <strong>Development</strong>
              <span>Lấp khoảng trống</span>
            </div>
            <div className={journeyProgress >= 85 ? "is-active" : ""}>
              <b>04</b>
              <strong>Readiness</strong>
              <span>Sẵn sàng tiến bước</span>
            </div>
          </div>
        </div>
      </div>

      <div className="student-skills-section">
        <div className="student-section-heading">
          <div>
            <div className="student-section-kicker">03 · Skill Profile</div>
            <h3>Năng lực đang tạo lợi thế</h3>
          </div>
          <span>{skillItems.length} signals</span>
        </div>

        {skillItems.length > 0 ? (
          <div className="student-skill-grid">
            {skillItems.map((item, index) => {
              const score = clamp(item.score);

              return (
                <article className="student-skill-card" key={`${item.label}-${index}`}>
                  <div className="student-skill-card-top">
                    <div className="student-skill-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <strong>{item.label}</strong>
                    <b>{score}</b>
                  </div>

                  <div className="student-skill-bar">
                    <i style={{ width: `${score}%` }} />
                  </div>

                  <div className="student-skill-card-bottom">
                    <span>
                      {score >= 85
                        ? "Core strength"
                        : score >= 70
                          ? "Strong signal"
                          : "Developing"}
                    </span>
                    <span>{item.source ?? "COGNITIVE"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="student-empty-state">
            Chưa có đủ dữ liệu để tạo skill profile.
          </div>
        )}
      </div>

      <div className="student-intelligence-split">
        <article className="student-panel-card student-gap-panel">
          <div className="student-section-heading">
            <div>
              <div className="student-section-kicker">04 · Development Gaps</div>
              <h3>Khoảng cách cần xử lý</h3>
            </div>
            <span>{gaps.length} priorities</span>
          </div>

          {gaps.length > 0 ? (
            <div className="student-gap-list">
              {gaps.map((item, index) => {
                const score = clamp(item.score);

                return (
                  <div className="student-gap-item" key={`${item.label}-${index}`}>
                    <div className="student-gap-top">
                      <div>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{item.label}</strong>
                      </div>
                      <em>{getPriorityLabel(item.priority)}</em>
                    </div>

                    <div className="student-gap-bar">
                      <i style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="student-empty-state">
              Chưa phát hiện khoảng cách ưu tiên.
            </div>
          )}
        </article>

        <article className="student-panel-card student-action-panel">
          <div className="student-section-heading">
            <div>
              <div className="student-section-kicker">05 · Next Actions</div>
              <h3>Hành động tiếp theo</h3>
            </div>
            <span>Priority path</span>
          </div>

          {nextActions.length > 0 ? (
            <ol className="student-action-list">
              {nextActions.slice(0, 4).map((item, index) => (
                <li key={`${item}-${index}`}>
                  <b>{index + 1}</b>
                  <p>{item}</p>
                  <span>→</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="student-empty-state">
              Chưa có hành động ưu tiên.
            </div>
          )}
        </article>
      </div>

      <div className="student-intelligence-engine-grid">
        <article>
          <div className="student-engine-icon">↗</div>
          <div>
            <span>Future Prediction</span>
            <strong>{prediction?.predictedScore ?? "--"}</strong>
            <p>
              Achievement probability{" "}
              {prediction?.achievementProbability ?? "--"}%
            </p>
          </div>
        </article>

        <article>
          <div className="student-engine-icon">◇</div>
          <div>
            <span>ORION Simulation</span>
            <strong>{scenarioCount}</strong>
            <p>Intervention scenarios evaluated</p>
          </div>
        </article>

        <article>
          <div className="student-engine-icon">◈</div>
          <div>
            <span>CHRONOS Strategy</span>
            <strong>
              {optimization?.recommendedStrategy?.name ?? "--"}
            </strong>
            <p>Current recommended learning strategy</p>
          </div>
        </article>
      </div>
    </section>
  );
}
