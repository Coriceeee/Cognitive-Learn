import { useEffect } from "react";
import { allValid, isBlankOrValid } from "../../lib/inputValidation";
import { useModuleDraft } from "../../lib/useModuleDraft";
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
  const [cognitiveScore, setCognitiveScore] = useState("");
  const [previousCognitiveScore, setPreviousCognitiveScore] = useState("");
  const [admissionReadiness, setAdmissionReadiness] = useState("");
  const [orionReadiness, setOrionReadiness] = useState("");
  const [atlasProgramCount, setAtlasProgramCount] = useState("");
  const [aspirationCount, setAspirationCount] = useState("");
  const [weeklyStudyHours, setWeeklyStudyHours] = useState("");
  const [targetWeeklyHours, setTargetWeeklyHours] = useState("");

  const { draft: savedDraft, status: saveStatus, error: draftError, save: saveDraft } = useModuleDraft<{cognitiveScore:string;previousCognitiveScore:string;admissionReadiness:string;orionReadiness:string;atlasProgramCount:string;aspirationCount:string;weeklyStudyHours:string;targetWeeklyHours:string}>("pulse");
  const [saveNotice, setSaveNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!savedDraft) return;
    setCognitiveScore(savedDraft.cognitiveScore);
    setPreviousCognitiveScore(savedDraft.previousCognitiveScore);
    setAdmissionReadiness(savedDraft.admissionReadiness);
    setOrionReadiness(savedDraft.orionReadiness);
    setAtlasProgramCount(savedDraft.atlasProgramCount);
    setAspirationCount(savedDraft.aspirationCount);
    setWeeklyStudyHours(savedDraft.weeklyStudyHours);
    setTargetWeeklyHours(savedDraft.targetWeeklyHours);
  }, [savedDraft]);
  async function saveCurrentDraft() {
    setSaving(true);
    setSaveNotice("");
    try {
      if (![cognitiveScore, previousCognitiveScore, admissionReadiness, orionReadiness].every(v => isBlankOrValid(v, 0, 100)) ||
          ![atlasProgramCount, aspirationCount].every(v => isBlankOrValid(v, 0, 10000, true)) ||
          ![weeklyStudyHours, targetWeeklyHours].every(v => isBlankOrValid(v, 0, 168))) {
        throw new Error("Có dữ liệu ngoài khoảng hợp lệ. Kiểm tra thang 0–100, số lượng và giờ/tuần.");
      }
      await saveDraft({cognitiveScore, previousCognitiveScore, admissionReadiness, orionReadiness, atlasProgramCount, aspirationCount, weeklyStudyHours, targetWeeklyHours});
      setSaveNotice("Đã lưu dữ liệu lên Firestore của tài khoản đang đăng nhập.");
    } catch (error) {
      setSaveNotice(error instanceof Error ? error.message : "Không thể lưu Firestore.");
    } finally { setSaving(false); }
  }

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

  const hasInputs = allValid([
    [cognitiveScore, 0, 100], [previousCognitiveScore, 0, 100],
    [admissionReadiness, 0, 100], [orionReadiness, 0, 100],
    [atlasProgramCount, 0, 10000, true], [aspirationCount, 0, 10000, true],
    [weeklyStudyHours, 0, 168], [targetWeeklyHours, 0, 168],
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
            <strong>{hasInputs ? `${report.overallScore}/100` : "Chưa đủ dữ liệu"}</strong>
            <em className={`pulse-risk ${getRiskClass(report.riskLevel)}`}>
              {hasInputs ? getPulseRiskLabel(report.riskLevel) : "Chưa đánh giá"}
            </em>
            <em className={`pulse-trend ${getTrendClass(report.trend)}`}>
              {hasInputs ? getPulseTrendLabel(report.trend) : "Chưa đánh giá"}
            </em>
          </aside>
        </section>

        <section className="pulse-control-panel">
          <div className="pulse-control-head">
            <div>
              <span>SIMULATION INPUT</span>
              <h2>Dữ liệu mô phỏng báo cáo</h2>
              <p>
                Nhập các chỉ số có căn cứ và lưu bản nháp lên Firestore. Những ô chưa có dữ liệu không được mặc định là số 0; báo cáo chưa phải bằng chứng nghiên cứu.
              </p>
            </div>
          </div>

          <div className="cla-firestore-save" role="status" style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,margin:"12px 0"}}>
            <button type="button" disabled={saving || saveStatus === "loading" || saveStatus === "error" || saveStatus === "signed-out"} onClick={() => void saveCurrentDraft()}>
              {saving ? "Đang lưu Firestore…" : "Lưu dữ liệu vào Firestore"}
            </button>
            <span>{saveNotice || draftError || (saveStatus === "ready" ? "Đã tải bản lưu từ Firestore" : saveStatus === "loading" ? "Đang tải dữ liệu đã lưu…" : "Chưa có bản lưu trên Firestore")}</span>
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

        {hasInputs && <section className="pulse-metric-grid">
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
        </section>}

        {hasInputs ? (<>
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
        </>) : <section className="cla-transcript-hint" role="status">Chưa đủ dữ liệu thực để đưa ra kết quả. Hãy hoàn thiện các ô đầu vào và lưu vào Firestore. Đây là công cụ mô phỏng theo giả định, không phải bằng chứng hiệu quả hoặc xác suất thành công.</section>}
      </section>
    </main>
  );
}