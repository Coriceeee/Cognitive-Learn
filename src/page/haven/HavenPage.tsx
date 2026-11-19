import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import PublicSourceSearchPanel from "../../components/common/PublicSourceSearchPanel";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import { useRef } from "react";
import { allValid, isBlankOrValid } from "../../lib/inputValidation";
import { useStudentTranscript } from "../seed/hooks/useStudentTranscript";
import { getLatestSubjectGrades } from "../seed/services/transcriptData";
import { useEffect } from "react";
import { useModuleDraft } from "../../lib/useModuleDraft";
import { useMemo, useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import {
  getHavenRiskLabel,
  runHavenSupport,
  type HavenRiskLevel,
} from "../../lib/havenSupportEngine";
import "../../styles.css";
import HavenPressureTopology from "./HavenPressureTopology";
import HavenBudgetScenario from "./HavenBudgetScenario";
import HavenScholarshipExplorer from "./HavenScholarshipExplorer";

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
  const view = currentFocusedPath();
  const [gpa, setGpa] = useState("");
  const [englishScore, setEnglishScore] = useState("");
  const [tuitionPressure, setTuitionPressure] = useState("");
  const [studyPressure, setStudyPressure] = useState("");
  const [admissionRisk, setAdmissionRisk] = useState("");
  const [financialNeed, setFinancialNeed] = useState("");

  const { draft: savedDraft, status: saveStatus, error: draftError, save: saveDraft } = useModuleDraft<{gpa:string;englishScore:string;tuitionPressure:string;studyPressure:string;admissionRisk:string;financialNeed:string}>("haven");
  const transcript = useStudentTranscript();
  const seededFromTranscript = useRef(false);
  useEffect(() => {
    if (seededFromTranscript.current || saveStatus !== "empty" || !transcript.data) return;
    seededFromTranscript.current = true;
    const yearly = Object.values(transcript.data.yearly).filter((x): x is number => x !== null);
    if (yearly.length) setGpa(current => current || String(Math.round(yearly.reduce((a,b)=>a+b,0)/yearly.length*100)/100));
    const english = getLatestSubjectGrades(transcript.data).find(x => x.subject === "Tiếng Anh");
    if (english?.provisional !== null && english?.provisional !== undefined) {
      setEnglishScore(current => current || String(english.provisional));
    }
  }, [transcript.data, saveStatus]);

  const [saveNotice, setSaveNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!savedDraft) return;
    setGpa(savedDraft.gpa);
    setEnglishScore(savedDraft.englishScore);
    setTuitionPressure(savedDraft.tuitionPressure);
    setStudyPressure(savedDraft.studyPressure);
    setAdmissionRisk(savedDraft.admissionRisk);
    setFinancialNeed(savedDraft.financialNeed);
  }, [savedDraft]);
  async function saveCurrentDraft() {
    setSaving(true);
    setSaveNotice("");
    try {
      if (![gpa, englishScore].every(v => isBlankOrValid(v, 0, 10)) ||
          ![tuitionPressure, studyPressure, admissionRisk, financialNeed].every(v => isBlankOrValid(v, 0, 100))) {
        throw new Error("GPA/tiếng Anh phải từ 0–10; chỉ số hỗ trợ phải từ 0–100.");
      }
      await saveDraft({gpa, englishScore, tuitionPressure, studyPressure, admissionRisk, financialNeed});
      setSaveNotice("Đã lưu vào hồ sơ của bạn.");
    } catch (error) {
      setSaveNotice(error instanceof Error ? error.message : "Không thể lưu dữ liệu. Hãy kiểm tra kết nối và thử lại.");
    } finally { setSaving(false); }
  }

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

  const hasInputs = allValid([
    [gpa, 0, 10], [englishScore, 0, 10],
    [tuitionPressure, 0, 100], [studyPressure, 0, 100],
    [admissionRisk, 0, 100], [financialNeed, 0, 100],
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
        {view === "/haven" && <>
          <section className="haven-hero">
          <div>
            <span>HAVEN SUPPORT</span>
            <h1>Học bổng và hỗ trợ tài chính</h1>
            <p>
              Haven tập trung vào học bổng, ngân sách, khả năng chi trả và các phương án hỗ trợ học sinh.
              Tuyển sinh trong nước, chương trình liên kết và du học quốc tế đều được tra cứu trong Atlas.
            </p>
          </div>

          <aside>
            <span>Support Readiness</span>
            <strong>{hasInputs ? `${result.supportReadinessScore}/100` : "Chưa đủ dữ liệu"}</strong>
            <em className={`haven-risk ${getRiskClass(result.riskLevel)}`}>
              {hasInputs ? getHavenRiskLabel(result.riskLevel) : "Chưa đánh giá"}
            </em>
          </aside>
        </section></>}

        <ModuleSectionNav moduleKey="haven" />
        {view === "/haven/scholarships" && <PublicSourceSearchPanel topic="scholarship" />}
        {view === "/haven/scholarships" && <>
          <section id="haven-scholarships" className="cla-haven-study-link">
          <strong>Học bổng và điều kiện</strong>
          <p>Haven đánh giá điều kiện học bổng và nhu cầu hỗ trợ tài chính. Mỗi học bổng cụ thể phải có nguồn cấp, thời hạn, yêu cầu chứng chỉ và năm; không tự coi chỉ số phù hợp là xác suất nhận học bổng.</p>
          <a href="/atlas/study-abroad">Mở Atlas để tra quốc gia, trường và điều kiện du học ↗</a>
          <HavenScholarshipExplorer />
        </section></>}

        {view === "/haven/finance" && <HavenBudgetScenario />}
{view === "/haven/finance" && <details className="cla-focus-disclosure" open={window.location.hash === "#haven-financial" ? true : undefined}><summary>Nhập và lưu chỉ số hỗ trợ cá nhân</summary>        <section id="haven-financial" className="haven-control-panel">
          <div className="haven-control-head">
            <div>
              <span>SUPPORT INPUT</span>
              <h2>Dữ liệu mô phỏng hỗ trợ</h2>
              <p>
                Khi có dữ liệu điểm đã lưu, Haven có thể đề xuất điền GPA và điểm tiếng Anh. Các chỉ số áp lực là tự nhập, chưa phải thang đo được xác thực.
              </p>
            </div>
          </div>

          <div className="cla-firestore-save" role="status" style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,margin:"12px 0"}}>
            <button type="button" disabled={saving || saveStatus === "loading" || saveStatus === "error" || saveStatus === "signed-out"} onClick={() => void saveCurrentDraft()}>
              {saving ? "Đang lưu…" : "Lưu dữ liệu"}
            </button>
            <span>{saveNotice || draftError || (saveStatus === "ready" ? "Đã đồng bộ dữ liệu đã lưu" : saveStatus === "loading" ? "Đang tải dữ liệu đã lưu…" : "Chưa có dữ liệu đã lưu")}</span>
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
        </section></details>}

        {view === "/haven/finance" && hasInputs && <HavenPressureTopology values={{
          tuitionPressure: toNumber(tuitionPressure),
          studyPressure: toNumber(studyPressure),
          admissionRisk: toNumber(admissionRisk),
          financialNeed: toNumber(financialNeed),
        }} result={result} />}

        {["/haven/plan", "/haven/scholarships", "/haven/finance"].includes(view) && (hasInputs ? (<>
        {view === "/haven/plan" && <>
          <section id="haven-support-roles" className="haven-summary-grid">
          <article>
            <span>KẾ HOẠCH CỦA BẠN</span>
            <h2>Gợi ý tài chính và học tập</h2>
            <p>{result.studentSummary}</p>
          </article>

          <article>
            <span>ÁP LỰC TỔNG HỢP</span>
            <h2>{result.familyPressureScore}/100</h2>
            <p>
              Chỉ số này phản ánh mức áp lực tổng hợp từ học phí, học tập, tuyển
              sinh và nhu cầu tài chính.
            </p>
          </article>
        </section></>}

        {view === "/haven/plan" && <>
          <section id="haven-support-plan" className="haven-section">
          <div className="haven-section-head">
            <div>
              <span>SUPPORT PLAN</span>
              <h2>Việc bạn nên làm tiếp theo</h2>
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
        </section></>}

        {view === "/haven/scholarships" && <>
          <section id="haven-scholarship-scenarios" className="haven-section">
          <div className="haven-section-head">
            <div>
              <span>SUPPORT POLICY ARCHETYPES</span>
              <h2>Nhóm chính sách hỗ trợ nên đối chiếu</h2>
            </div>
          </div>
          <p className="haven-scholarship-note">Các mục dưới đây là nhóm chính sách minh họa do quy tắc Haven phân loại, không phải danh mục học bổng cụ thể đã xác minh. Chỉ được coi là cơ hội có thể nộp khi có URL chính thức, đơn vị cấp, năm tuyển, tiêu chí, chứng chỉ, hạn nộp và ngày kiểm tra.</p>

          <div className="haven-scholarship-grid">
            {result.scholarshipOptions.map((option) => (
              <article className="haven-scholarship-card" key={option.title}>
                <div>
                  <span>{option.fitScore}/100 · mức phù hợp theo quy tắc</span>
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
        </section></>}

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
        </>) : <section className="cla-transcript-hint" role="status"> <span id="haven-support-roles" />Chưa đủ dữ liệu để tính chỉ số hỗ trợ cá nhân và gợi ý theo quy tắc. Tra cứu học bổng và mô phỏng tiền hoạt động độc lập. <a href="/haven/finance#haven-financial">Mở phần chỉ số hỗ trợ cá nhân</a>.</section>)}
      </section>
    </main>
  );
}