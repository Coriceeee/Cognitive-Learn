import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import ModuleInputObservatory from "../../components/common/ModuleInputObservatory";
import ModuleDraftFeedback from "../../components/common/ModuleDraftFeedback";
import { useRef } from "react";
import { readNumber, isBlankOrValid } from "../../lib/inputValidation";
import { useStudentTranscript } from "../seed/hooks/useStudentTranscript";
import { getLatestSubjectGrades } from "../seed/services/transcriptData";
import { canPrefillFromVerifiedTranscript } from "../../lib/transcriptPrefillEligibility";
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
import OrionScenarioTradeoff from "./OrionScenarioTradeoff";
import { evaluateScenarioChoices } from "../../lib/scenarioDecision";
import OrionDecisionWorkbench from "./OrionDecisionWorkbench";
import ClosedLoopPanel from "../../components/journey/ClosedLoopPanel";

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
  const view = currentFocusedPath();
  const [scenarioStep, setScenarioStep] = useState<"compare" | "optimize" | "commit">(() => window.location.hash === "#cla-closed-loop" ? "commit" : window.location.hash === "#orion-optimize" ? "optimize" : "compare");
  function changeScenarioStep(next: "compare" | "optimize" | "commit") {
    setScenarioStep(next);
    const hash = next === "commit" ? "#cla-closed-loop" : next === "optimize" ? "#orion-optimize" : "#orion-scenarios";
    window.history.replaceState(window.history.state, "", "/orion/scenarios" + window.location.search + hash);
  }
  const [decisionHours,setDecisionHours]=useState('');
  const [decisionRisk,setDecisionRisk]=useState<OrionRiskLevel|''>('');
  const [targetMajor, setTargetMajor] = useState("");
  const [weeksLeft, setWeeksLeft] = useState("");
  const [scores, setScores] = useState<Record<ScoreKey, string>>(defaultScores);
  const [targets, setTargets] =
    useState<Record<ScoreKey, string>>(defaultTargets);

  const { draft: savedDraft, status: saveStatus, error: draftError, uid: draftOwnerUid, conflict: draftConflict, save: saveDraft, markEditing, acceptRemote } = useModuleDraft<{targetMajor:string;weeksLeft:string;scores:Record<ScoreKey,string>;targets:Record<ScoreKey,string>}>("orion");
  const transcript = useStudentTranscript();
  const seededFromTranscript = useRef<string | null>(null);
  useEffect(() => {
    if (!transcript.data) return;
    const keyBySubject: Record<string, ScoreKey> = {
      "Toán": "math", "Ngữ văn": "literature", "Tiếng Anh": "english",
      "Vật lý": "physics", "Hóa học": "chemistry", "Sinh học": "biology",
    };
    const grades = getLatestSubjectGrades(transcript.data);
    // An empty transcript must not consume the one-time prefill.
    // A later Firestore snapshot with observed grades can still populate Orion.
    const supportedGrades = grades.filter(grade => keyBySubject[grade.subject] && grade.provisional !== null);
    if (!canPrefillFromVerifiedTranscript({
      draftOwnerUid, transcriptOwnerUid: transcript.userId,
      draftStatus: saveStatus, transcriptStatus: transcript.status,
      seededOwnerUid: seededFromTranscript.current,
      hasSupportedGrades: supportedGrades.length > 0,
      hasLocalEdits: dirtyRevision.current,
    })) return;
    seededFromTranscript.current = draftOwnerUid;
    setScores(current => {
      const next = { ...current };
      for (const grade of supportedGrades) {
        const key = keyBySubject[grade.subject];
        if (key && !next[key] && grade.provisional !== null) next[key] = String(grade.provisional);
      }
      return next;
    });
  }, [transcript.data, transcript.userId, transcript.status, draftOwnerUid, saveStatus]);

  const [saveNotice, setSaveNotice] = useState("");
  const [saveNoticeTone, setSaveNoticeTone] = useState<"success" | "warning" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "pending">("idle");
  const editRevision = useRef(0);
  const dirtyRevision = useRef(false);
  const autosaveTimer = useRef<number | null>(null);
  // CP52: never show a previous account's draft after sign-out/account switch.
  const lastDraftOwner = useRef<string | null>(null);
  useEffect(() => {
    if (lastDraftOwner.current === null) {
      lastDraftOwner.current = draftOwnerUid;
      return;
    }
    if (lastDraftOwner.current === draftOwnerUid) return;
    lastDraftOwner.current = draftOwnerUid;
    setTargetMajor("");
    setWeeksLeft("");
    setScores(defaultScores);
    setTargets(defaultTargets);
    dirtyRevision.current = false;
    editRevision.current += 1;
    setHasLocalEdits(false);
    setAutosaveState("idle");
    setSaveNotice("");
  }, [draftOwnerUid]);

  const currentDraft = { targetMajor, weeksLeft, scores, targets };
  const currentDraftRef = useRef(currentDraft);
  currentDraftRef.current = currentDraft;

  useEffect(() => {
    // Remote snapshots must not overwrite edits still pending on this device.
    if (!savedDraft || dirtyRevision.current) return;
    setTargetMajor(savedDraft.targetMajor);
    setWeeksLeft(savedDraft.weeksLeft);
    setScores(savedDraft.scores);
    setTargets(savedDraft.targets);
  }, [savedDraft]);

  // Debounced Firestore draft persistence protects work when students move between modules.
  // It only runs after a user edit and after the account's existing draft state is verified.
  useEffect(() => {
    if (!hasLocalEdits || (saveStatus !== "ready" && saveStatus !== "empty")) return;
    const revision = editRevision.current;
    const payload = { ...currentDraftRef.current };
    autosaveTimer.current = window.setTimeout(async () => {
      autosaveTimer.current = null;
      setAutosaveState("saving");
      try {
        if (!isBlankOrValid(payload.weeksLeft, 1, 104, true) ||
            ![...Object.values(payload.scores), ...Object.values(payload.targets)].every(v => isBlankOrValid(v, 0, 10))) {
          throw new Error("Invalid Orion draft: scores or weeks outside supported range");
        }
        await saveDraft(payload);
        if (editRevision.current === revision) {
          dirtyRevision.current = false;
          setHasLocalEdits(false);
          setAutosaveState("saved");
        }
      } catch {
        setAutosaveState("pending");
      }
    }, 700);
    return () => {
      if (autosaveTimer.current !== null) window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    };
  }, [hasLocalEdits, saveStatus, targetMajor, weeksLeft, scores, targets]);

  function markLocalEdit() {
    markEditing();
    editRevision.current += 1;
    dirtyRevision.current = true;
    setHasLocalEdits(true);
    setAutosaveState("idle");
    setSaveNotice("");
  }

  async function saveCurrentDraft() {
    if (autosaveTimer.current !== null) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = null;
    setSaving(true);
    setSaveNotice("");
    const revision = editRevision.current;
    try {
      if (!isBlankOrValid(weeksLeft, 1, 104, true) ||
          ![...Object.values(scores), ...Object.values(targets)].every(v => isBlankOrValid(v, 0, 10))) {
        throw new Error("Điểm phải từ 0–10; số tuần phải là số nguyên từ 1–104.");
      }
      await saveDraft({targetMajor, weeksLeft, scores, targets});
      if (editRevision.current === revision) {
        dirtyRevision.current = false;
        setHasLocalEdits(false);
        setAutosaveState("saved");
        setSaveNoticeTone("success");
        setSaveNotice("Đã lưu vào hồ sơ của bạn.");
      } else {
        setSaveNoticeTone("warning");
        setSaveNotice("Đã lưu phiên bản trước; thay đổi mới đang chờ tự lưu.");
      }
    } catch (error) {
      setSaveNoticeTone("error");
      setSaveNotice(error instanceof Error ? error.message : "Không thể lưu dữ liệu. Hãy kiểm tra kết nối và thử lại.");
    } finally { setSaving(false); }
  }

  async function loadLatestDraft() {
    setSaveNotice("");
    try {
      const remote = await acceptRemote();
      // Reset local dirty flag only on explicit user choice.
      editRevision.current += 1;
      dirtyRevision.current = false;
      setHasLocalEdits(false);
      setAutosaveState("idle");
      setTargetMajor(remote?.targetMajor ?? "");
      setWeeksLeft(remote?.weeksLeft ?? "");
      setScores(remote?.scores ?? defaultScores);
      setTargets(remote?.targets ?? defaultTargets);
      setSaveNoticeTone("success");
      setSaveNotice("Đã tải bản nháp mới nhất từ máy chủ.");
    } catch (error) {
      setSaveNoticeTone("error");
      setSaveNotice(error instanceof Error ? error.message : "Không thể tải bản mới nhất.");
    }
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

  const eligibleScenarios = useMemo(() => evaluateScenarioChoices(strategy.scenarios,
    decisionHours.trim() === '' ? null : Number(decisionHours), decisionRisk || null).rows
    .filter(row => row.reasons.length === 0).map(row => row.scenario), [strategy.scenarios, decisionHours, decisionRisk]);

  function updateScore(key: ScoreKey, value: string) {
    markLocalEdit();
    setScores((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTarget(key: ScoreKey, value: string) {
    markLocalEdit();
    setTargets((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const hasInputs = readNumber(weeksLeft, 1, 104, true) !== null && subjects.length > 0 &&
    [...Object.values(scores), ...Object.values(targets)].every(value => isBlankOrValid(value, 0, 10));

  const inputPanel = (<section id="orion-input" className="orion-control-panel">
          <div className="orion-control-head">
            <div>
              <span>INPUT</span>
              <h2>Dữ liệu mô phỏng</h2>
              <p>
                Điểm hiện tại được đề xuất từ bảng điểm đã lưu khi có dữ liệu. Bạn có thể chỉnh mục tiêu, lưu bản nháp vào hồ sơ. Kết quả mô phỏng không mang ý nghĩa nhân quả.
              </p>
            </div>
          </div>

          <div className="cla-firestore-save cla-module-save-panel">
            <button type="button" disabled={saving || (saveStatus !== "ready" && saveStatus !== "empty")} onClick={() => void saveCurrentDraft()}>
              {saving ? "Đang lưu…" : "Lưu dữ liệu"}
            </button>
            {draftConflict && <button type="button" onClick={() => void loadLatestDraft()}>Tải bản mới nhất (bỏ thay đổi trên máy này)</button>}
            <ModuleDraftFeedback status={saveStatus} error={draftError} conflict={draftConflict}
              saving={saving} notice={saveNotice} noticeTone={saveNoticeTone}
              dirty={hasLocalEdits} autosave={autosaveState} />
          </div>
          <div className="orion-form-grid">
            <label>
              <span>Ngành mục tiêu</span>
              <input
                value={targetMajor}
                onChange={(event) => { markLocalEdit(); setTargetMajor(event.target.value); }}
                placeholder="Ví dụ: Công nghệ thông tin"
              />
            </label>

            <label>
              <span>Số tuần còn lại</span>
              <input
                value={weeksLeft}
                onChange={(event) => { markLocalEdit(); setWeeksLeft(event.target.value); }}
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
        </section>);

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
        {view === "/orion" && <>
          <section className="orion-hero">
          <div>
            <span>ORION · KIẾN TRÚC TƯƠNG LAI</span>
            <h1>Mô phỏng chiến lược học tập và xét tuyển</h1>
            <p>
              Orion dùng điểm hiện tại, điểm mục tiêu và thời gian còn lại để
              tạo chiến lược tăng điểm, phân tích rủi ro và đề xuất lộ trình
              hành động theo tuần.
            </p>
          </div>

          <aside>
            <span>Mức sẵn sàng (tham khảo)</span>
            <strong>{hasInputs ? `${strategy.readinessScore}/100` : "Chưa đủ dữ liệu"}</strong>
            <em className={`orion-risk ${getRiskClass(strategy.riskLevel)}`}>
              {hasInputs ? getRiskLabel(strategy.riskLevel) : "Chưa đánh giá"}
            </em>
          </aside>
        </section></>}

        <ModuleSectionNav moduleKey="orion" />
        {view === "/orion" && <ModuleInputObservatory moduleName="Orion" editHref="/orion/inputs"
          resultHref="/orion/scenarios" resultLabel="Mở mô phỏng chiến lược" canSimulate={hasInputs}
          note="Cần thời hạn hợp lệ và ít nhất một môn có cả điểm hiện tại lẫn mục tiêu. Các ô còn trống không được diễn giải là điểm 0. Đây không phải thang đo năng lực."
          groups={[
            { key: "now", title: "Điểm hiện tại (0–10)", fields: (Object.keys(subjectLabels) as ScoreKey[]).map(key => ({ key: `now-${key}`, label: subjectLabels[key], value: scores[key], min: 0, max: 10 })) },
            { key: "target", title: "Điểm mục tiêu (0–10)", fields: (Object.keys(subjectLabels) as ScoreKey[]).map(key => ({ key: `target-${key}`, label: subjectLabels[key], value: targets[key], min: 0, max: 10 })) },
            { key: "planning", title: "Thời hạn & ngành định hướng", fields: [
              { key: "weeks", label: "Số tuần còn lại", value: weeksLeft, min: 1, max: 104, integer: true },
              { key: "major", label: "Ngành mục tiêu", value: targetMajor },
            ] },
          ]} />}


        {view === "/orion/inputs" && <>{inputPanel}<p className="cla-focus-notice">Lưu dữ liệu trước khi chuyển trang. <a href="/orion/scenarios">Mở mô phỏng chiến lược →</a></p></>}
        {view === "/orion/scenarios" && <div className="cla-workflow-tabs" aria-label="Các bước ra quyết định">
          <button type="button" aria-pressed={scenarioStep === "compare"} onClick={() => changeScenarioStep("compare")}>1 · So sánh</button>
          <button type="button" aria-pressed={scenarioStep === "optimize"} onClick={() => changeScenarioStep("optimize")}>2 · Tối ưu</button>
          <button type="button" aria-pressed={scenarioStep === "commit"} onClick={() => changeScenarioStep("commit")}>3 · Chốt chu kỳ</button>
        </div>}
        {view === "/orion/scenarios" && <p className="cla-focus-notice">Giới hạn hiện tại: {decisionHours.trim() || "Chưa đặt"} giờ/tuần · {decisionRisk ? getRiskLabel(decisionRisk) : "Chưa giới hạn áp lực"} · {hasInputs ? `${eligibleScenarios.length} phương án hợp lệ` : "Chưa đủ dữ liệu"}. <button type="button" className="cla-focus-text-button" onClick={() => changeScenarioStep("optimize")}>Sửa giới hạn</button></p>}
        {view === "/orion/scenarios" && <details className="cla-focus-disclosure"><summary>Xem / chỉnh dữ liệu mô phỏng và lưu bản nháp</summary>{inputPanel}</details>}


        {["/orion/scenarios", "/orion/roadmap"].includes(view) && (hasInputs ? (<>
{view === "/orion/scenarios" && scenarioStep === "compare" && <details className="cla-focus-disclosure"><summary>Kết quả tổng hợp và môn cần ưu tiên</summary><section className="orion-result-grid">
          <article className="orion-summary-card">
            <span>KẾT QUẢ ORION</span>
            <h2>{strategy.bestScenario.title} · tham khảo ban đầu</h2>
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
                <span>Điểm khả thi heuristic</span>
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
        </section></details>}

        {view === "/orion/scenarios" && scenarioStep === "compare" && <>
          <section id="orion-scenarios" className="orion-section">
          <div className="orion-section-head">
            <div>
              <span>SCENARIOS</span>
              <h2>3 chiến lược có thể chọn</h2>
            </div>
          </div>

          <details className="cla-viz-scenario-details"><summary>Chi tiết ba chiến lược</summary><div className="cla-viz-rows">
            {strategy.scenarios.map((scenario) => (
              <article className="cla-viz-row" key={scenario.id}>
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
          </div></details>
          <OrionScenarioTradeoff scenarios={strategy.scenarios} maxHours={decisionHours.trim()===''?null:Number(decisionHours)} maxRisk={decisionRisk||null} />
          <p className="cla-focus-notice"><button className="cla-focus-text-button" type="button" onClick={() => changeScenarioStep("optimize")}>Tiếp: giới hạn thời gian và tối ưu đa mục tiêu →</button></p>
        </section></>}
        {view === "/orion/scenarios" && scenarioStep === "optimize" && <div id="orion-optimize"><OrionDecisionWorkbench scenarios={strategy.scenarios} subjects={subjects} hours={decisionHours} risk={decisionRisk} setHours={setDecisionHours} setRisk={setDecisionRisk} /><p className="cla-focus-notice"><button className="cla-focus-text-button" type="button" onClick={() => changeScenarioStep("commit")}>Tiếp: chốt chu kỳ →</button></p></div>}

        {view === "/orion/roadmap" && <>
          <section id="orion-roadmap" className="orion-section">
          <div className="orion-section-head">
            <div>
              <span>ROADMAP</span>
              <h2>Lộ trình tham khảo theo thời hạn</h2>
              <p>Lộ trình chung trước khi bạn chốt chiến lược; không phải kế hoạch đã lưu. Hãy chọn phương án phù hợp trong phần tạo chu kỳ.</p>
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
        </section></>}

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
        </>) : <section className="cla-transcript-hint" role="status"><span id="orion-scenarios" /><span id="orion-roadmap" />Chưa đủ dữ liệu hợp lệ để đưa ra kết quả. Hãy hoàn thiện các ô đầu vào và lưu hồ sơ. Đây là công cụ mô phỏng theo giả định, không phải bằng chứng hiệu quả hoặc xác suất thành công. <a href="/orion/inputs">Mở dữ liệu & mục tiêu</a>.</section>)}
        {view === "/orion/scenarios" && scenarioStep === "commit" && <ClosedLoopPanel mode="orion" plan={hasInputs ? { targetMajor,
          weeksLeft: readNumber(weeksLeft, 1, 104, true) ?? 1,
          subjects: subjects.map(s => ({key:s.subject,label:s.label,baseline:s.currentScore,target:s.targetScore})),
          scenarios: eligibleScenarios } : undefined} />}
        {view === "/orion/roadmap" && <p className="cla-focus-notice"><a href="/orion/scenarios#cla-closed-loop">Mô phỏng và chốt chu kỳ học tập →</a></p>}
      </section>
    </main>
  );
}