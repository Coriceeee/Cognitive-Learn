import type { ContinuityResult } from "../../lib/decisionCycleContinuity";
import { advisorDecisionStore, captureAdvisorDecision, type AdvisorDecisionRecord } from "../../lib/advisorDecisionContext";
import { checkDecisionHandoff, clearDecisionHandoff } from "../../lib/studentDecisionSnapshot";
import { optimizeGoalGap } from "../../lib/goalGapOptimizer";
import { useVerifiedStudentProfile } from "../seed/hooks/StudentProfileProvider";
import { auth } from "../../lib/firebase";
import { readAdmissionGoal, clearAdmissionGoal, formatAdmissionGoal, type AdmissionGoal } from "../../lib/admissionGoalHandoff";
import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import ModuleInputObservatory from "../../components/common/ModuleInputObservatory";
import ModuleDraftFeedback from "../../components/common/ModuleDraftFeedback";
import { useRef } from "react";
import { readNumber, isBlankOrValid } from "../../lib/inputValidation";

import { getLatestSubjectGrades } from "../seed/services/transcriptData";
import { canImportSeedSnapshotOnce } from "../../lib/transcriptPrefillEligibility";
import { useEffect, useLayoutEffect } from "react";
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

type ScoreKey = string;
const defaultScores: Record<ScoreKey, string> = {};
const defaultTargets: Record<ScoreKey, string> = {};
const legacySubjectNames: Record<string, string> = {
  math: "Toán", literature: "Ngữ văn", english: "Tiếng Anh",
  physics: "Vật lý", chemistry: "Hóa học", biology: "Sinh học",
};
function normalizeSubjectValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const subject = legacySubjectNames[key] ?? key;
    if (typeof raw === "string") result[subject] = raw;
    else if (typeof raw === "number" && Number.isFinite(raw)) result[subject] = String(raw);
  }
  return result;
}
function subjectImportance(subject: string): number {
  if (subject === "Toán" || subject === "Tiếng Anh") return 1.2;
  if (subject === "Vật lý" || subject === "Hóa học") return 1.1;
  return 1;
}

function canSaveSeedSnapshotWithoutWeeks(weeksLeft: string, syncVersion: number, subjects: string[]): boolean {
  return weeksLeft.trim() === "" && syncVersion === 1 && subjects.length > 0;
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

  const { draft: savedDraft, status: saveStatus, error: draftError, uid: draftOwnerUid, conflict: draftConflict, save: saveDraft, markEditing, acceptRemote } = useModuleDraft<{targetMajor:string;weeksLeft:string;scores:Record<ScoreKey,string>;targets:Record<ScoreKey,string>;seedSyncVersion?:number;seedSubjectsSnapshot?:string[]}>("orion");
  const verifiedProfile = useVerifiedStudentProfile();
  const transcript = verifiedProfile.transcript;
  const seedSubjectGrades = useMemo(() => transcript.data ? getLatestSubjectGrades(transcript.data) : [], [transcript.data]);
  const seedSubjectNames = useMemo(() => seedSubjectGrades.map(grade => grade.subject), [seedSubjectGrades]);
  const [seedSyncVersion, setSeedSyncVersion] = useState(0);
  const [seedSubjectsSnapshot, setSeedSubjectsSnapshot] = useState<string[]>([]);
  const [gapSubjects,setGapSubjects]=useState<string[]>([]);
  const [gapTotal,setGapTotal]=useState("");
  const [admissionGoal, setAdmissionGoal] = useState<AdmissionGoal | null>(null);
  const [advisorGoal,setAdvisorGoal]=useState<AdvisorDecisionRecord|null>(null);
  const [advisorGap,setAdvisorGap]=useState<AdvisorDecisionRecord|null>(null);
  const advisorReady=Boolean(draftOwnerUid&&auth.currentUser?.uid===draftOwnerUid&&transcript.userId===draftOwnerUid&&!verifiedProfile.loading&&!verifiedProfile.syncing&&["ready","empty"].includes(transcript.status)&&["ready","empty"].includes(saveStatus)&&!draftConflict);
  useLayoutEffect(()=>{
    if(!advisorGoal||advisorGoal.data.kind!=="goal")return;
    if(!advisorReady||advisorGoal.pin.owner!==draftOwnerUid||targetMajor!==formatAdmissionGoal(advisorGoal.data.value)){setAdvisorGoal(null);return;}
    return advisorDecisionStore.register(advisorGoal);
  },[advisorGoal,advisorReady,draftOwnerUid,targetMajor]);
  useLayoutEffect(()=>{
    if(!advisorGap||advisorGap.data.kind!=="gap")return;
    const data=advisorGap.data;
    const result=optimizeGoalGap(data.subjects,data.target);
    if(!advisorReady||advisorGap.pin.owner!==draftOwnerUid||readNumber(gapTotal,0,30)!==data.target||data.subjects.length!==gapSubjects.length||data.subjects.some(s=>!gapSubjects.includes(s.subject)||readNumber(scores[s.subject],0,10)!==s.score||readNumber(targets[s.subject],0,10)!==result.targets[s.subject])){setAdvisorGap(null);return;}
    return advisorDecisionStore.register(advisorGap);
  },[advisorGap,advisorReady,draftOwnerUid,gapTotal,gapSubjects,scores,targets]);

  useEffect(() => {
    if (!draftOwnerUid || auth.currentUser?.uid !== draftOwnerUid) { setAdmissionGoal(null); return; }
    setAdmissionGoal(readAdmissionGoal(draftOwnerUid));
  }, [draftOwnerUid]);
  const seededFromTranscript = useRef<string | null>(null);

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
    setGapSubjects([]); setGapTotal("");
    setWeeksLeft("");
    setScores(defaultScores);
    setTargets(defaultTargets);
    setSeedSyncVersion(0);
    setSeedSubjectsSnapshot([]);
    dirtyRevision.current = false;
    editRevision.current += 1;
    setHasLocalEdits(false);
    setAutosaveState("idle");
    setSaveNotice("");
  }, [draftOwnerUid]);

  const currentDraft = { targetMajor, weeksLeft, scores, targets, seedSyncVersion, seedSubjectsSnapshot };
  const currentDraftRef = useRef(currentDraft);
  currentDraftRef.current = currentDraft;

  useEffect(() => {
    // Remote snapshots must not overwrite edits still pending on this device.
    if (!savedDraft || dirtyRevision.current) return;
    setTargetMajor(savedDraft.targetMajor);
    setWeeksLeft(savedDraft.weeksLeft);
    setScores(normalizeSubjectValues(savedDraft.scores));
    setTargets(normalizeSubjectValues(savedDraft.targets));
    setSeedSyncVersion(savedDraft.seedSyncVersion === 1 ? 1 : 0);
    setSeedSubjectsSnapshot(Array.isArray(savedDraft.seedSubjectsSnapshot) ? savedDraft.seedSubjectsSnapshot.filter((item): item is string => typeof item === "string") : []);
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
        if ((!isBlankOrValid(payload.weeksLeft, 1, 104, true) &&
             !canSaveSeedSnapshotWithoutWeeks(payload.weeksLeft, payload.seedSyncVersion ?? 0, payload.seedSubjectsSnapshot ?? [])) ||
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
  }, [hasLocalEdits, saveStatus, targetMajor, weeksLeft, scores, targets, seedSyncVersion, seedSubjectsSnapshot]);

  function markLocalEdit() {
    markEditing();
    editRevision.current += 1;
    dirtyRevision.current = true;
    setHasLocalEdits(true);
    setAutosaveState("idle");
    setSaveNotice("");
  }

  useEffect(() => {
    if (!transcript.data) return;
    const supportedGrades = seedSubjectGrades.filter(grade => grade.provisional !== null);
    if (!canImportSeedSnapshotOnce({
      draftOwnerUid, transcriptOwnerUid: transcript.userId,
      draftStatus: saveStatus, transcriptStatus: transcript.status,
      seededOwnerUid: seededFromTranscript.current,
      hasSupportedGrades: supportedGrades.length > 0,
      hasLocalEdits: dirtyRevision.current,
      hasSnapshotMarker: savedDraft?.seedSyncVersion === 1,
    })) return;

    // Snapshot the locked Seed curriculum once. Upgrade legacy drafts by
    // preserving existing values and filling only subjects that are missing.
    seededFromTranscript.current = draftOwnerUid;
    const nextScores = normalizeSubjectValues(savedDraft?.scores);
    for (const grade of supportedGrades) {
      if (grade.provisional !== null && !nextScores[grade.subject]?.trim()) nextScores[grade.subject] = String(grade.provisional);
    }
    setScores(nextScores);
    setTargets(normalizeSubjectValues(savedDraft?.targets));
    setSeedSyncVersion(1);
    setSeedSubjectsSnapshot(seedSubjectNames);
    markLocalEdit();
    setSaveNoticeTone("success");
    setSaveNotice("Đã lấy điểm và danh sách môn từ SEED một lần. ORION lưu bản riêng, không tự đồng bộ lại.");
  }, [transcript.data, transcript.userId, transcript.status, draftOwnerUid, saveStatus, savedDraft, seedSubjectGrades, seedSubjectNames]);
  async function saveCurrentDraft() {
    if (autosaveTimer.current !== null) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = null;
    setSaving(true);
    setSaveNotice("");
    const revision = editRevision.current;
    try {
      if ((!isBlankOrValid(weeksLeft, 1, 104, true) &&
           !canSaveSeedSnapshotWithoutWeeks(weeksLeft, seedSyncVersion, seedSubjectsSnapshot)) ||
          ![...Object.values(scores), ...Object.values(targets)].every(v => isBlankOrValid(v, 0, 10))) {
        throw new Error("Điểm phải từ 0–10; số tuần phải là số nguyên từ 1–104.");
      }
      await saveDraft({targetMajor, weeksLeft, scores, targets, seedSyncVersion, seedSubjectsSnapshot});
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
      setScores(normalizeSubjectValues(remote?.scores));
      setTargets(normalizeSubjectValues(remote?.targets));
      setSeedSyncVersion(remote?.seedSyncVersion === 1 ? 1 : 0);
      setSeedSubjectsSnapshot(Array.isArray(remote?.seedSubjectsSnapshot) ? remote.seedSubjectsSnapshot.filter((item): item is string => typeof item === "string") : []);
      setSaveNoticeTone("success");
      setSaveNotice("Đã tải bản nháp mới nhất từ máy chủ.");
    } catch (error) {
      setSaveNoticeTone("error");
      setSaveNotice(error instanceof Error ? error.message : "Không thể tải bản mới nhất.");
    }
  }

  const activeSubjectNames = useMemo(
    () => seedSyncVersion === 1 && seedSubjectsSnapshot.length > 0 ? seedSubjectsSnapshot : seedSubjectNames,
    [seedSyncVersion, seedSubjectsSnapshot, seedSubjectNames]
  );
  const subjects: OrionSubjectScore[] = useMemo(() => {
    return activeSubjectNames.flatMap((subject): OrionSubjectScore[] => {
      const current = readNumber(scores[subject], 0, 10);
      const target = readNumber(targets[subject], 0, 10);
      if (current === null || target === null) return [];
      return [{ subject, label: subject, currentScore: current, targetScore: target, importance: subjectImportance(subject) }];
    });
  }, [activeSubjectNames, scores, targets]);

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

  function updateScore(key: string, value: string) {
    markLocalEdit();
    setScores((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateTarget(key: string, value: string) {
    markLocalEdit();
    setTargets((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const activeScoreValues = activeSubjectNames.flatMap(subject => [scores[subject] ?? "", targets[subject] ?? ""]);
  const hasInputs = readNumber(weeksLeft, 1, 104, true) !== null && subjects.length > 0 &&
    activeScoreValues.every(value => isBlankOrValid(value, 0, 10));

  const gapResult = useMemo(()=>{
    const total=readNumber(gapTotal,0,30);
    const selected=gapSubjects.map(subject=>({subject,score:readNumber(scores[subject],0,10)}));
    if(total===null || selected.length!==3 || selected.some(s=>s.score===null)) return null;
    return optimizeGoalGap(selected.map(s=>({subject:s.subject,score:s.score!})),total);
  },[gapTotal,gapSubjects,scores]);

  const inputPanel = (<section id="orion-input" className="orion-control-panel">
          <div className="orion-control-head">
            <div>
              <span>INPUT</span>
              <h2>Dữ liệu mô phỏng</h2>
              <p>
                Danh sách môn lấy theo hồ sơ SEED đã xác minh. Điểm hiện tại được chụp một lần vào bản nháp ORION; sau đó không tự đồng bộ lại hoặc ghi đè chỉnh sửa của bạn. Bạn tự đặt điểm mục tiêu và thời hạn học. Kết quả mô phỏng không mang ý nghĩa nhân quả.
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
          {admissionGoal && draftOwnerUid && auth.currentUser?.uid === draftOwnerUid && <div className="cla-focus-notice" role="status">
            <strong>Mục tiêu bạn đã chọn tại Atlas: {formatAdmissionGoal(admissionGoal)}</strong>
            <p>Chỉ chuyển lựa chọn của bạn, không tự đặt điểm mục tiêu hay xác nhận đủ điều kiện xét tuyển. Điểm hiện tại và điểm mục tiêu vẫn cần kiểm tra.</p>
            <button type="button" disabled={saveStatus !== "ready" && saveStatus !== "empty"} onClick={() => {
              if (verifiedProfile.loading || verifiedProfile.syncing || !["ready","empty"].includes(transcript.status) || checkDecisionHandoff(draftOwnerUid,"goal") !== "CURRENT") { setAdmissionGoal(null); clearAdmissionGoal(); setSaveNoticeTone("warning"); setSaveNotice("Mục tiêu hoặc hồ sơ chưa còn hiệu lực. Hãy chuyển lại từ Atlas sau khi đồng bộ."); return; }
              const goal = readAdmissionGoal(draftOwnerUid);
              if (!goal || JSON.stringify(goal) !== JSON.stringify(admissionGoal) || auth.currentUser?.uid !== draftOwnerUid) { setAdmissionGoal(null); return; }
              const nextGoal = formatAdmissionGoal(goal);
              const changed = targetMajor !== nextGoal;
              if (changed && (targetMajor.trim() || Object.values(targets).some(v=>v.trim())) && !window.confirm("Thay mục tiêu bằng lựa chọn Atlas và xóa điểm mục tiêu cũ? Điểm hiện tại và số tuần được giữ lại.")) return;
              setAdvisorGoal(captureAdvisorDecision(draftOwnerUid,{kind:"goal",value:goal}));
              markLocalEdit(); setTargetMajor(nextGoal); if (changed) setTargets({...defaultTargets}); clearAdmissionGoal(); clearDecisionHandoff("goal"); setAdmissionGoal(null);
            }}>Dùng mục tiêu này</button>{" "}
            <button type="button" onClick={() => { clearAdmissionGoal(); setAdmissionGoal(null); }}>Bỏ qua</button>
          </div>}
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

          <details className="cla-focus-disclosure">
            <summary>Phân bổ điểm mục tiêu theo tổ hợp 3 môn</summary>
            <p>Chọn đúng 3 môn đã nhập điểm hiện tại và nhập tổng điểm mục tiêu tự đặt (0–30, không cộng ưu tiên). Phân bổ đều phần điểm còn thiếu, tối đa 10/môn; không phải dự báo hay điểm chuẩn.</p>
            <div role="group" aria-label="Ba môn mục tiêu">{activeSubjectNames.map(subject=><label key={subject}><input type="checkbox" checked={gapSubjects.includes(subject)} disabled={!gapSubjects.includes(subject)&&gapSubjects.length>=3} onChange={e=>setGapSubjects(old=>e.target.checked?[...old,subject]:old.filter(k=>k!==subject))}/>{subject} </label>)}</div>
            <label>Tổng mục tiêu /30 <input inputMode="decimal" value={gapTotal} onChange={e=>setGapTotal(e.target.value)} placeholder="VD: 24"/></label>
            {gapResult && (gapResult.status==="READY" || gapResult.status==="ALREADY_MET") ? <div role="status"><p>Tổng hiện tại: {gapResult.currentTotal} · Khoảng cách: {gapResult.gap} điểm</p><p>{gapSubjects.map(k=>`${k}: ${gapResult.targets[k]}`).join(" · ")}</p><button type="button" disabled={saving||draftConflict||(saveStatus!=="ready"&&saveStatus!=="empty")||!draftOwnerUid||auth.currentUser?.uid!==draftOwnerUid} onClick={()=>{
              if(!window.confirm("Dùng phân bổ này và xóa mục tiêu điểm cũ ngoài tổ hợp?"))return;
              if(advisorReady&&draftOwnerUid) setAdvisorGap(captureAdvisorDecision(draftOwnerUid,{kind:"gap",subjects:gapSubjects.map(subject=>({subject,score:readNumber(scores[subject],0,10)!})),target:readNumber(gapTotal,0,30)!}));
              markLocalEdit();setTargets({...targets,...Object.fromEntries(gapSubjects.map(k=>[k,String(gapResult.targets[k])]))});
            }}>Dùng phân bổ này</button></div>:<p>Chọn đủ ba môn và kiểm tra các điểm đầu vào. Orion hiện hỗ trợ sáu môn trong bảng bên dưới.</p>}
          </details>
          <div className="orion-score-table">
            {activeSubjectNames.length === 0 ? (
              <p role="status">Chưa xác minh được danh sách môn từ SEED. Hãy hoàn thiện và lưu hồ sơ học tập trước khi lập kế hoạch tại ORION.</p>
            ) : activeSubjectNames.map((subject) => (
              <div key={subject}>
                <strong>{subject}</strong>
                <label>
                  <span>Hiện tại · lấy từ SEED một lần</span>
                  <input inputMode="decimal" value={scores[subject] ?? ""}
                    placeholder={seedSyncVersion === 1 ? "Chưa có điểm tại lần đồng bộ" : "Chưa có điểm trong SEED"}
                    onChange={(event) => updateScore(subject, event.target.value)} />
                </label>
                <label>
                  <span>Mục tiêu</span>
                  <input inputMode="decimal" value={targets[subject] ?? ""}
                    onChange={(event) => updateTarget(subject, event.target.value)} />
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
            { key: "now", title: "Điểm hiện tại (0–10)", fields: activeSubjectNames.map(subject => ({ key: `now-${subject}`, label: subject, value: scores[subject] ?? "", min: 0, max: 10 })) },
            { key: "target", title: "Điểm mục tiêu (0–10)", fields: activeSubjectNames.map(subject => ({ key: `target-${subject}`, label: subject, value: targets[subject] ?? "", min: 0, max: 10 })) },
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
          scenarios: eligibleScenarios, draftReady:advisorReady && !saving,
          applyReviewedScores:(owner:string,review:ContinuityResult)=>{
            if(!advisorReady || saving || auth.currentUser?.uid!==owner || draftOwnerUid!==owner || review.status!=="READY_TO_COPY" || !review.rows.length || review.rows.length!==subjects.length || !review.rows.every(r=>activeSubjectNames.includes(r.key)&&subjects.some(s=>s.subject===r.key&&s.currentScore===r.current&&s.targetScore===r.target)&&Number.isFinite(r.observed)&&r.observed>=0&&r.observed<=10))throw new Error("Bản nháp hoặc tài khoản đã thay đổi. Hãy đồng bộ và thử lại.");
            markLocalEdit(); setAdvisorGap(null);
            setScores(current=>{const next={...current}; for(const row of review.rows)next[row.key]=String(row.observed);return next;});
          } } : undefined} />}
        {view === "/orion/roadmap" && <p className="cla-focus-notice"><a href="/orion/scenarios#cla-closed-loop">Mô phỏng và chốt chu kỳ học tập →</a></p>}
      </section>
    </main>
  );
}