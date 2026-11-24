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
    rubricVersion?: string;
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

// Only translate display names; keep upstream career IDs and rule calculations unchanged.
function careerNameVi(name: string): string {
  const names: Record<string, string> = {
    "Software Engineer": "Kỹ sư phần mềm",
    "Data Scientist": "Chuyên gia khoa học dữ liệu",
    "Data Analyst": "Chuyên viên phân tích dữ liệu",
    "Business Analyst": "Chuyên viên phân tích nghiệp vụ",
    "Doctor": "Bác sĩ", "Teacher": "Giáo viên", "Designer": "Nhà thiết kế",
    "AI Engineer": "Kỹ sư trí tuệ nhân tạo", "Cybersecurity Analyst": "Chuyên viên an ninh mạng",
    "Product Manager": "Quản lý sản phẩm", "Marketing Specialist": "Chuyên viên tiếp thị",
  };
  return names[name] ?? name;
}
function sourceNameVi(name: string): string {
  return ({ COGNITIVE: "Chỉ báo học tập", BEHAVIOR: "Hành vi", ACADEMIC: "Học lực" } as Record<string, string>)[name] ?? name;
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
  const careerName = careerNameVi(primaryCareer?.career?.name ?? "--");
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
            Phân tích dữ liệu học tập
            <span className="student-intelligence-live">CHỈ SỐ THỬ NGHIỆM</span>
          </div>

          <h2>
            Biến dữ liệu học tập thành
            <span> lộ trình nghề nghiệp.</span>
          </h2>

          <p>
            Cognitive Learn kết nối trạng thái nhận thức, hành vi học tập
            và mục tiêu nghề nghiệp để hiển thị các chỉ số theo quy tắc thử nghiệm
            và gợi ý bước bạn có thể tự lựa chọn.
          </p>

          <div className="student-intelligence-hero-meta">
            <div>
              <span>Hướng tham khảo theo rubric cũ</span>
              <strong>{careerName}</strong>
            </div>
            <div>
              <span>Chỉ số sẵn sàng (quy tắc)</span>
              <strong>{readiness !== null ? `${readiness}/100` : "--"}</strong>
            </div>
          </div>
        </div>

        <div className="student-readiness-orbit">
          <div className="student-readiness-ring">
            <div className="student-readiness-ring-inner">
              <strong>{readiness !== null ? `${readiness}/100` : "--"}</strong>
              <span>chỉ số thử nghiệm</span>
            </div>
          </div>
          <div className="student-readiness-label">
            <span>Trạng thái hiện tại</span>
            <strong>{formatReadinessLevel(readinessLevel)}</strong>
          </div>
        </div>
      </div>

      <p className="student-dash-research-note" role="note">Các điểm phù hợp, sẵn sàng và hỗ trợ dữ liệu chỉ là chỉ số quy tắc thử nghiệm trên hồ sơ hiện có; không phải xác suất trúng tuyển, dự báo nghề nghiệp đã kiểm định hoặc kết luận thay cho học sinh. Phiên bản: {career?.rubricVersion ?? "chưa xác định"}. Chỉ số rubric cũ có dùng Cognitive proxy và không nên dùng để loại ngành nghề. <a href="/atlas/recommendations#atlas-personalized-discovery">Khám phá sở thích và môn học riêng tại Atlas ↗</a></p>

      <div className="student-career-focus">
        <div className="student-career-focus-copy">
          <div className="student-section-kicker">01 · NGHỀ NGHIỆP ĐANG QUAN TÂM</div>
          <h3>{careerName}</h3>
          <p>{careerDescription}</p>
          {career?.summary && (
            <div className="student-career-insight">
              <span>CLA diễn giải từ dữ liệu đã có</span>
              <p>{career.summary}</p>
            </div>
          )}
        </div>

        <div className="student-career-score-stack">
          <div className="student-career-score-card student-career-score-primary">
            <span>Điểm rubric nghề nghiệp (thử nghiệm)</span>
            <strong>
              {compatibility !== null ? `${compatibility}/100` : "--"}
            </strong>
            <div className="student-score-line">
              <i style={{ width: `${compatibility ?? 0}%` }} />
            </div>
          </div>

          <div className="student-career-score-card">
            <span>Độ hỗ trợ dữ liệu (ước lượng)</span>
            <strong>
              {confidence !== null ? `${confidence}/100` : "--"}
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
            <div className="student-section-kicker">02 · CÁC BƯỚC TỪ HIỆN TẠI ĐẾN MỤC TIÊU</div>
            <h3>Từ hiện tại đến mục tiêu</h3>
          </div>
          <span>{readiness !== null ? `${readiness}/100 · Điểm quy tắc` : "Đang bổ sung hồ sơ"}</span>
        </div>

        <div className="student-journey-track">
          <div className="student-journey-line">
            <i style={{ width: `${journeyProgress}%` }} />
          </div>

          <div className="student-journey-nodes">
            <div className="is-complete">
              <b>01</b>
              <strong>Hiện tại</strong>
              <span>Hiểu bản thân</span>
            </div>
            <div className={journeyProgress >= 50 ? "is-active" : ""}>
              <b>02</b>
              <strong>Đối chiếu nghề</strong>
              <span>Đối chiếu hướng đi</span>
            </div>
            <div className={journeyProgress >= 70 ? "is-active" : ""}>
              <b>03</b>
              <strong>Cải thiện</strong>
              <span>Lấp khoảng trống</span>
            </div>
            <div className={journeyProgress >= 85 ? "is-active" : ""}>
              <b>04</b>
              <strong>Sẵn sàng</strong>
              <span>Sẵn sàng tiến bước</span>
            </div>
          </div>
        </div>
      </div>

      <div className="student-skills-section">
        <div className="student-section-heading">
          <div>
            <div className="student-section-kicker">03 · CÁC TÍN HIỆU NỔI BẬT</div>
            <h3>Năng lực đang tạo lợi thế</h3>
          </div>
          <span>{skillItems.length} chỉ báo</span>
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
                        ? "Mức cao theo quy tắc"
                        : score >= 70
                          ? "Tín hiệu khá"
                          : "Cần theo dõi thêm"}
                    </span>
                    <span>{sourceNameVi(item.source ?? "COGNITIVE")}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="student-empty-state">
            Chưa đủ dữ liệu để hiển thị các chỉ báo nổi bật.
          </div>
        )}
      </div>

      <div className="student-intelligence-split">
        <article className="student-panel-card student-gap-panel">
          <div className="student-section-heading">
            <div>
              <div className="student-section-kicker">04 · NHỮNG ĐIỂM CẦN XEM LẠI</div>
              <h3>Khoảng cách cần xử lý</h3>
            </div>
            <span>{gaps.length} việc cần chú ý</span>
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
              Chưa có căn cứ xác định khoảng cách ưu tiên.
            </div>
          )}
        </article>

        <article className="student-panel-card student-action-panel">
          <div className="student-section-heading">
            <div>
              <div className="student-section-kicker">05 · VIỆC CÓ THỂ LÀM TIẾP</div>
              <h3>Hành động tiếp theo</h3>
            </div>
            <span>Gợi ý để tự lựa chọn</span>
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
            <span>Điểm kịch bản thử nghiệm</span>
            <strong>{prediction?.predictedScore ?? "--"}</strong>
            <p>
              Điểm kịch bản theo công thức thử nghiệm; chưa có xác suất đạt mục tiêu được hiệu chuẩn từ kết quả thực tế.
            </p>
            {prediction?.resultKind === "RULE_BASED_SCENARIO" && (
              <p role="note">
                Chỉ số khoảng cách mục tiêu: {prediction.goalGapReadinessIndex}/100 (quy tắc thử nghiệm, không phải phần trăm cơ hội đạt).
                Độ tin cậy thống kê: chưa được đánh giá.
              </p>
            )}
          </div>
        </article>

        <article>
          <div className="student-engine-icon">◇</div>
          <div>
            <span>Mô phỏng phương án ORION</span>
            <strong>{scenarioCount}</strong>
            <p>Số phương án đã được mô phỏng</p>
          </div>
        </article>

        <article>
          <div className="student-engine-icon">◈</div>
          <div>
            <span>Chiến lược học tập tham khảo</span>
            <strong>
              {optimization?.recommendedStrategy?.name ?? "--"}
            </strong>
            <p>Gợi ý theo quy tắc, bạn quyết định có thực hiện hay không.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
