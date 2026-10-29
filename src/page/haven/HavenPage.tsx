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
      setSaveNotice("Đã lưu dữ liệu lên Firestore của tài khoản đang đăng nhập.");
    } catch (error) {
      setSaveNotice(error instanceof Error ? error.message : "Không thể lưu Firestore.");
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
            <strong>{hasInputs ? `${result.supportReadinessScore}/100` : "Chưa đủ dữ liệu"}</strong>
            <em className={`haven-risk ${getRiskClass(result.riskLevel)}`}>
              {hasInputs ? getHavenRiskLabel(result.riskLevel) : "Chưa đánh giá"}
            </em>
          </aside>
        </section>

        <section className="haven-control-panel">
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
              {saving ? "Đang lưu Firestore…" : "Lưu dữ liệu vào Firestore"}
            </button>
            <span>{saveNotice || draftError || (saveStatus === "ready" ? "Đã tải bản lưu từ Firestore" : saveStatus === "loading" ? "Đang tải dữ liệu đã lưu…" : "Chưa có bản lưu trên Firestore")}</span>
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

        {hasInputs ? (<>
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
        </>) : <section className="cla-transcript-hint" role="status">Chưa đủ dữ liệu thực để đưa ra kết quả. Hãy hoàn thiện các ô đầu vào và lưu vào Firestore. Đây là công cụ mô phỏng theo giả định, không phải bằng chứng hiệu quả hoặc xác suất thành công.</section>}
      </section>
    </main>
  );
}