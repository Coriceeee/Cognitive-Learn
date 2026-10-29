import { useRef } from "react";
import { readNumber, isBlankOrValid } from "../../lib/inputValidation";
import { useStudentTranscript } from "../seed/hooks/useStudentTranscript";
import { getLatestSubjectGrades } from "../seed/services/transcriptData";
import { useEffect } from "react";
import { useModuleDraft } from "../../lib/useModuleDraft";
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

const defaultScores: Record<ScoreKey, string> = { math: "", literature: "", english: "", physics: "", chemistry: "", biology: "" };

const defaultTargets: Record<ScoreKey, string> = { math: "", literature: "", english: "", physics: "", chemistry: "", biology: "" };

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
  const [targetMajor, setTargetMajor] = useState("");
  const [weeksLeft, setWeeksLeft] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, string>>(defaultScores);
  const [targets, setTargets] =
    useState<Record<ScoreKey, string>>(defaultTargets);

  const { draft: savedDraft, status: saveStatus, error: draftError, save: saveDraft } = useModuleDraft<{targetMajor:string;weeksLeft:string;scores:Record<ScoreKey,string>;targets:Record<ScoreKey,string>}>("orion");
  const transcript = useStudentTranscript();
  const seededFromTranscript = useRef(false);
  useEffect(() => {
    if (seededFromTranscript.current || saveStatus !== "empty" || !transcript.data) return;
    seededFromTranscript.current = true;
    const keyBySubject: Record<string, ScoreKey> = {
      "Toán": "math", "Ngữ văn": "literature", "Tiếng Anh": "english",
      "Vật lý": "physics", "Hóa học": "chemistry", "Sinh học": "biology",
    };
    const grades = getLatestSubjectGrades(transcript.data);
    setScores(current => {
      const next = { ...current };
      for (const grade of grades) {
        const key = keyBySubject[grade.subject];
        if (key && !next[key] && grade.provisional !== null) next[key] = String(grade.provisional);
      }
      return next;
    });
  }, [transcript.data, saveStatus]);

  const [saveNotice, setSaveNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!savedDraft) return;
    setTargetMajor(savedDraft.targetMajor);
    setWeeksLeft(savedDraft.weeksLeft);
    setScores(savedDraft.scores);
    setTargets(savedDraft.targets);
  }, [savedDraft]);
  async function saveCurrentDraft() {
    setSaving(true);
    setSaveNotice("");
    try {
      if (!isBlankOrValid(weeksLeft, 1, 104, true) ||
          ![...Object.values(scores), ...Object.values(targets)].every(v => isBlankOrValid(v, 0, 10))) {
        throw new Error("Điểm phải từ 0–10; số tuần phải là số nguyên từ 1–104.");
      }
      await saveDraft({targetMajor, weeksLeft, scores, targets});
      setSaveNotice("Đã lưu dữ liệu lên Firestore của tài khoản đang đăng nhập.");
    } catch (error) {
      setSaveNotice(error instanceof Error ? error.message : "Không thể lưu Firestore.");
    } finally { setSaving(false); }
  }

  const subjects: OrionSubjectScore[] = useMemo(() => {
    return (Object.keys(subjectLabels) as ScoreKey[]).flatMap((key): OrionSubjectScore[] => {
      const current = readNumber(scores[key], 0, 10);
      const target = readNumber(targets[key], 0, 10);
      // Incomplete subjects must NOT enter the engine as observed zeros.
      if (current === null || target === null) return [];
      return [{
        subject: key,
        label: subjectLabels[key],
        currentScore: current,
        targetScore: target,
        importance: key === "math" || key === "english" ? 1.2 :
          key === "physics" || key === "chemistry" ? 1.1 : 1,
      }];
    });
  }, [scores, targets]);

  const strategy = useMemo(() => {
    return runOrionStrategy({
      subjects,
      weeksLeft: readNumber(weeksLeft, 1, 104, true) ?? 1,
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

  const hasInputs = readNumber(weeksLeft, 1, 104, true) !== null && subjects.length > 0 &&
    [...Object.values(scores), ...Object.values(targets)].every(value => isBlankOrValid(value, 0, 10));

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
            <strong>{hasInputs ? `${strategy.readinessScore}/100` : "Chưa đủ dữ liệu"}</strong>
            <em className={`orion-risk ${getRiskClass(strategy.riskLevel)}`}>
              {hasInputs ? getRiskLabel(strategy.riskLevel) : "Chưa đánh giá"}
            </em>
          </aside>
        </section>

        <section className="orion-control-panel">
          <div className="orion-control-head">
            <div>
              <span>INPUT</span>
              <h2>Dữ liệu mô phỏng</h2>
              <p>
                Điểm hiện tại được đề xuất từ bảng điểm đã lưu khi có dữ liệu. Bạn có thể chỉnh mục tiêu, lưu bản nháp trên Firestore. Kết quả mô phỏng không mang ý nghĩa nhân quả.
              </p>
            </div>
          </div>

          <div className="cla-firestore-save" role="status" style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:12,margin:"12px 0"}}>
            <button type="button" disabled={saving || saveStatus === "loading" || saveStatus === "error" || saveStatus === "signed-out"} onClick={() => void saveCurrentDraft()}>
              {saving ? "Đang lưu Firestore…" : "Lưu dữ liệu vào Firestore"}
            </button>
            <span>{saveNotice || draftError || (saveStatus === "ready" ? "Đã tải bản lưu từ Firestore" : saveStatus === "loading" ? "Đang tải dữ liệu đã lưu…" : "Chưa có bản lưu trên Firestore")}</span>
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

        {hasInputs ? (<>
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
        </>) : <section className="cla-transcript-hint" role="status">Chưa đủ dữ liệu hợp lệ để đưa ra kết quả. Hãy hoàn thiện các ô đầu vào và lưu vào Firestore. Đây là công cụ mô phỏng theo giả định, không phải bằng chứng hiệu quả hoặc xác suất thành công.</section>}
      </section>
    </main>
  );
}