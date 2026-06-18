import { useMemo, useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import {
  getHavenRiskLabel,
  runHavenSupport,
  type HavenRiskLevel,
} from "../../lib/havenSupportEngine";
import "../../styles.css";

function toNumber(value: string) {
  const parsed = Number(value.replace(",", "."));

  if (!Number.isFinite(parsed)) return 0;

  return Math.max(0, parsed);
}

function getRiskClass(riskLevel: HavenRiskLevel) {
  if (riskLevel === "LOW") return "low";
  if (riskLevel === "MEDIUM") return "medium";
  return "high";
}

export default function HavenPage() {
  const [gpa, setGpa] = useState("8.1");
  const [englishScore, setEnglishScore] = useState("7.5");
  const [tuitionPressure, setTuitionPressure] = useState("55");
  const [studyPressure, setStudyPressure] = useState("60");
  const [admissionRisk, setAdmissionRisk] = useState("58");
  const [financialNeed, setFinancialNeed] = useState("50");

  const result = useMemo(() => {
    return runHavenSupport({
      gpa: toNumber(gpa),
      englishScore: toNumber(englishScore),
      tuitionPressure: toNumber(tuitionPressure),
      studyPressure: toNumber(studyPressure),
      admissionRisk: toNumber(admissionRisk),
      financialNeed: toNumber(financialNeed),
    });
  }, [
    gpa,
    englishScore,
    tuitionPressure,
    studyPressure,
    admissionRisk,
    financialNeed,
  ]);

  return (
    <main className="haven-page">
      <header className="haven-floating-header">
        <a
          className="haven-home-logo"
          href="/student"
          aria-label="Về trang học sinh"
        >
          <img src={appLogo} alt="Cognitive Learn" />
        </a>

        <UserMenu />
      </header>

      <section className="haven-shell">
        <section className="haven-hero">
          <div>
            <span>HAVEN SUPPORT</span>
            <h1>Hỗ trợ phụ huynh, giáo viên và học bổng</h1>
            <p>
              Haven phân tích áp lực tài chính, học tập và tuyển sinh để đề xuất
              hướng hỗ trợ phù hợp cho học sinh, phụ huynh và giáo viên.
            </p>
          </div>

          <aside>
            <span>Support Readiness</span>
            <strong>{result.supportReadinessScore}/100</strong>
            <em className={`haven-risk ${getRiskClass(result.riskLevel)}`}>
              {getHavenRiskLabel(result.riskLevel)}
            </em>
          </aside>
        </section>

        <section className="haven-control-panel">
          <div className="haven-control-head">
            <div>
              <span>SUPPORT INPUT</span>
              <h2>Dữ liệu mô phỏng hỗ trợ</h2>
              <p>
                Bản hiện tại nhập nhanh để demo. Sau này Haven sẽ lấy dữ liệu từ
                Seed Profile, Atlas, Orion và Pulse.
              </p>
            </div>
          </div>

          <div className="haven-form-grid">
            <label>
              <span>GPA</span>
              <input value={gpa} onChange={(event) => setGpa(event.target.value)} />
            </label>

            <label>
              <span>Điểm tiếng Anh</span>
              <input
                value={englishScore}
                onChange={(event) => setEnglishScore(event.target.value)}
              />
            </label>

            <label>
              <span>Áp lực học phí</span>
              <input
                value={tuitionPressure}
                onChange={(event) => setTuitionPressure(event.target.value)}
              />
            </label>

            <label>
              <span>Áp lực học tập</span>
              <input
                value={studyPressure}
                onChange={(event) => setStudyPressure(event.target.value)}
              />
            </label>

            <label>
              <span>Rủi ro tuyển sinh</span>
              <input
                value={admissionRisk}
                onChange={(event) => setAdmissionRisk(event.target.value)}
              />
            </label>

            <label>
              <span>Nhu cầu tài chính</span>
              <input
                value={financialNeed}
                onChange={(event) => setFinancialNeed(event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="haven-summary-grid">
          <article>
            <span>PHỤ HUYNH</span>
            <h2>Tóm tắt cho phụ huynh</h2>
            <p>{result.parentSummary}</p>
          </article>

          <article>
            <span>GIÁO VIÊN</span>
            <h2>Tóm tắt cho giáo viên</h2>
            <p>{result.teacherSummary}</p>
          </article>

          <article>
            <span>ÁP LỰC GIA ĐÌNH</span>
            <h2>{result.familyPressureScore}/100</h2>
            <p>
              Chỉ số này phản ánh mức áp lực tổng hợp từ học phí, học tập, tuyển
              sinh và nhu cầu tài chính.
            </p>
          </article>
        </section>

        <section className="haven-section">
          <div className="haven-section-head">
            <div>
              <span>SUPPORT PLAN</span>
              <h2>Việc nên hỗ trợ tiếp theo</h2>
            </div>
          </div>

          <div className="haven-support-list">
            {result.supportItems.map((item) => (
              <article className="haven-support-card" key={item.id}>
                <em>{item.priority}</em>
                <span>{item.type}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="haven-section">
          <div className="haven-section-head">
            <div>
              <span>SCHOLARSHIP</span>
              <h2>Gợi ý học bổng / hỗ trợ tài chính</h2>
            </div>
          </div>

          <div className="haven-scholarship-grid">
            {result.scholarshipOptions.map((option) => (
              <article className="haven-scholarship-card" key={option.title}>
                <div>
                  <span>{option.fitScore}/100 phù hợp</span>
                  <h3>{option.title}</h3>
                  <p>{option.reason}</p>
                </div>

                <ul>
                  {option.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {result.warnings.length > 0 && (
          <section className="haven-warning">
            <strong>Cảnh báo từ Haven</strong>
            <ul>
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}