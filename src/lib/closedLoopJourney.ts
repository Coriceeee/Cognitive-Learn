/** CLA closed-loop v1. Inputs and outcomes are student-reported, NOT causal evidence. */
export type JourneySubject = {
  key: string;
  label: string;
  baseline: number;
  target: number;
};
export type JourneyScenarioId = "balanced" | "focused" | "breakthrough";
export type JourneyCheckIn = {
  id: string;
  week: number;
  recordedAt: string;
  actualHours: number;
  completedActions: number;
  plannedActions: number;
  note: string;
  provenance: "student_self_report";
};
export type JourneyReassessment = {
  recordedAt: string;
  observations: Array<{ key: string; score: number }>;
  note: string;
  provenance: "student_self_report";
};
/** Protocol §26.1-compatible technical trace; NOT a verified research record. */
export type JourneyEvidenceRecord = {
  resultId: string;
  resultType: "recommendation";
  participantPseudonym: string;
  inputSnapshotId: string;
  engine: { name: string; version: string };
  datasetVersion: string;
  featureVersion: string;
  modelVersion: string;
  output: { value: number | null; probability: null; unit: string };
  uncertainty: { type: "not_estimated"; value: null };
  factors: Array<{ name: string; value: number | null; direction: "?"; attribution: null }>;
  evidenceRefs: string[];
  limitations: string[];
  sourceVersions: string[];
  codeCommitHash: string;
  createdAt: string;
  humanOverride: null;
};
/** CP31 Batch 10. Frozen before the first action, NOT a calibrated prediction.
 * No reassessment, outcome, intervention effect or later check-in may enter T0.
 */
export type JourneyT0Snapshot = {
  schemaVersion: 1;
  policyVersion: "cla-t0-descriptive-gap-v1";
  frozenAt: string;
  inputSource: "student_self_report";
  scenarioId: JourneyScenarioId;
  subjects: JourneySubject[];
  plannedWeeklyHours: number;
  weeksLeft: number;
  planGapPoints: number;
  forecastStatus: "NOT_ESTIMATED";
  predictedOutcome: null;
  calibratedProbability: null;
};
export type JourneyT0Audit = "FROZEN_CONSISTENT" | "LEGACY_NO_T0" | "MISMATCH";
export type JourneyLock = { schemaVersion: 1; userId: string; activeCycleId: string | null };
export function isJourneyLock(value: unknown, uid: string): value is JourneyLock {
  if (!value || typeof value !== "object") return false;
  const lock = value as Partial<JourneyLock>;
  return lock.schemaVersion === 1 && lock.userId === uid &&
    (lock.activeCycleId === null || (typeof lock.activeCycleId === "string" && /^[\w-]{8,100}$/.test(lock.activeCycleId)));
}
/** Optional immutable client-reported decision lineage; not treatment assignment. */
export type JourneyDecisionTrace = {
  schemaVersion: 1; policyVersion: "cla-adaptive-next-cycle-v1";
  sourceCycleId: string; inputSnapshotId: string; reviewEvidenceId: string;
  disposition: "ACCEPTED" | "DECLINED";
  recommendedId: JourneyScenarioId; recommendedHours: number;
  optionHours: Record<JourneyScenarioId, number | null>;
};
export function validJourneyDecisionTrace(value: unknown, cycle: Pick<JourneyCycle,"id"|"scenarioId"|"plannedWeeklyHours">): value is JourneyDecisionTrace {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const t = value as JourneyDecisionTrace;
  const keys = ["schemaVersion","policyVersion","sourceCycleId","inputSnapshotId","reviewEvidenceId","disposition","recommendedId","recommendedHours","optionHours"];
  const ids: JourneyScenarioId[] = ["balanced","focused","breakthrough"];
  const hours = t.optionHours;
  if (Object.keys(t).length !== keys.length || !keys.every(k=>Object.prototype.hasOwnProperty.call(t,k)) ||
      t.schemaVersion !== 1 || t.policyVersion !== "cla-adaptive-next-cycle-v1" ||
      typeof t.sourceCycleId !== "string" || !/^[\w-]{8,100}$/.test(t.sourceCycleId) || t.sourceCycleId === cycle.id ||
      t.inputSnapshotId !== t.sourceCycleId || t.reviewEvidenceId !== `${t.sourceCycleId}-review` ||
      !ids.includes(t.recommendedId) || !hours || typeof hours !== "object" || Array.isArray(hours) ||
      Object.keys(hours).length !== 3 || !ids.every(id=>Object.prototype.hasOwnProperty.call(hours,id) && (hours[id] === null || (Number.isInteger(hours[id]) && hours[id]! >= 1 && hours[id]! <= 80))) ||
      !Number.isInteger(t.recommendedHours) || t.recommendedHours < 1 || t.recommendedHours > 80 || hours[t.recommendedId] !== t.recommendedHours ||
      hours[cycle.scenarioId] !== cycle.plannedWeeklyHours) return false;
  return t.disposition === "ACCEPTED" ? cycle.scenarioId === t.recommendedId : t.disposition === "DECLINED" && cycle.scenarioId !== t.recommendedId;
}
export type JourneyCycle = {
  /** Firestore owner UID. Present on persisted cycle documents; omitted from offline/synthetic domain cycles. */
  userId?: string;
  id: string;
  schemaVersion: 1;
  origin: "orion_simulation";
  scenarioId: JourneyScenarioId;
  scenarioTitle: string;
  targetMajor: string;
  subjects: JourneySubject[];
  plannedWeeklyHours: number;
  weeksLeft: number;
  startedAt: string;
  status: "ACTIVE" | "REVIEWED";
  checkIns: JourneyCheckIn[];
  reassessment: JourneyReassessment | null;
  /** New cycles freeze an immutable T0. Legacy v1 documents may lack it. */
  t0Snapshot?: JourneyT0Snapshot | null;
  /** Legacy v1 documents may not have this field. */
  evidenceRecord?: JourneyEvidenceRecord | null;
  decisionTrace?: JourneyDecisionTrace;
};
export type JourneyAssessment = {
  stage: "NOT_STARTED" | "CHECK_IN" | "READY_TO_REASSESS" | "REVIEWED";
  observedAverageDelta: number | null;
  totalHoursReported: number;
  completionRate: number | null;
  suggestion: "CONTINUE" | "REPLAN" | "REASSESS" | "START";
  explanation: string;
};
const isScore = (value: number) => Number.isFinite(value) && value >= 0 && value <= 10;
const isInteger = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Input-only computation. Its gap is descriptive, not a predicted learning gain. */
export function buildJourneyT0Snapshot(cycle: Pick<JourneyCycle,
  "startedAt" | "scenarioId" | "subjects" | "plannedWeeklyHours" | "weeksLeft">): JourneyT0Snapshot {
  const gap = round2(cycle.subjects.reduce((total, s) => total + Math.max(0, s.target - s.baseline), 0) /
    cycle.subjects.length);
  return {
    schemaVersion: 1, policyVersion: "cla-t0-descriptive-gap-v1",
    frozenAt: cycle.startedAt, inputSource: "student_self_report",
    scenarioId: cycle.scenarioId, subjects: cycle.subjects.map(s => ({ ...s })),
    plannedWeeklyHours: cycle.plannedWeeklyHours, weeksLeft: cycle.weeksLeft,
    planGapPoints: gap, forecastStatus: "NOT_ESTIMATED", predictedOutcome: null,
    calibratedProbability: null,
  };
}

/** Structural/derived consistency only: cannot authenticate a writer or prove pre-registration.
 * Firestore candidate rules must separately make t0Snapshot and base plan fields immutable.
 */
export function auditJourneyT0Snapshot(cycle: JourneyCycle): JourneyT0Audit {
  if (cycle.t0Snapshot === undefined || cycle.t0Snapshot === null) return "LEGACY_NO_T0";
  if (!validUtc(cycle.startedAt) || !Array.isArray(cycle.subjects) ||
      cycle.subjects.length < 1 || cycle.subjects.length > 6 ||
      !Number.isInteger(cycle.plannedWeeklyHours) || cycle.plannedWeeklyHours < 1 || cycle.plannedWeeklyHours > 80 ||
      !Number.isInteger(cycle.weeksLeft) || cycle.weeksLeft < 1 || cycle.weeksLeft > 104 ||
      !["balanced", "focused", "breakthrough"].includes(cycle.scenarioId) ||
      new Set(cycle.subjects.map(s => s.key)).size !== cycle.subjects.length ||
      !cycle.subjects.every(s => s && /^[a-z]{2,20}$/.test(s.key) &&
        typeof s.label === "string" && s.label.length >= 1 && s.label.length <= 40 &&
        isScore(s.baseline) && isScore(s.target))) return "MISMATCH";
  return sameEvidenceData(cycle.t0Snapshot, buildJourneyT0Snapshot(cycle)) ? "FROZEN_CONSISTENT" : "MISMATCH";
}
const requireValid = (ok: boolean, message: string) => { if (!ok) throw new Error(message); };

export function createJourneyCycle(input: {
  id: string; scenarioId: JourneyScenarioId; scenarioTitle: string;
  targetMajor: string; subjects: JourneySubject[];
  plannedWeeklyHours: number; weeksLeft: number; startedAt: string;
}): JourneyCycle {
  requireValid(/^[\w-]{8,100}$/.test(input.id), "Mã chu kỳ không hợp lệ.");
  requireValid(["balanced", "focused", "breakthrough"].includes(input.scenarioId), "Chiến lược không hợp lệ.");
  requireValid(input.scenarioTitle.trim().length > 0 && input.scenarioTitle.length <= 100, "Tên chiến lược không hợp lệ.");
  requireValid(input.targetMajor.length <= 120, "Ngành mục tiêu quá dài.");
  requireValid(isInteger(input.weeksLeft, 1, 104), "Số tuần phải từ 1–104.");
  requireValid(isInteger(input.plannedWeeklyHours, 1, 80), "Giờ học dự kiến không hợp lệ.");
  requireValid(isValidIsoDate(input.startedAt), "Ngày khởi tạo không hợp lệ.");
  requireValid(input.subjects.length >= 1 && input.subjects.length <= 6, "Cần ít nhất một môn có điểm và mục tiêu.");
  requireValid(input.subjects.every(s => /^[a-z]{2,20}$/.test(s.key) && s.label.length > 0 && s.label.length <= 40 && isScore(s.baseline) && isScore(s.target)), "Điểm phải thuộc thang 0–10.");
  requireValid(new Set(input.subjects.map(s => s.key)).size === input.subjects.length, "Trùng môn trong chu kỳ.");
  const plan: JourneyCycle = { id: input.id, schemaVersion: 1, origin: "orion_simulation", scenarioId: input.scenarioId,
    scenarioTitle: input.scenarioTitle.trim(), targetMajor: input.targetMajor.trim(),
    subjects: input.subjects.map(s => ({ ...s })), plannedWeeklyHours: input.plannedWeeklyHours,
    weeksLeft: input.weeksLeft, startedAt: input.startedAt, status: "ACTIVE", checkIns: [], reassessment: null, evidenceRecord: null };
  return { ...plan, t0Snapshot: buildJourneyT0Snapshot(plan) };
}

export function appendJourneyCheckIn(cycle: JourneyCycle, input: {
  id: string; week: number; actualHours: number; completedActions: number;
  plannedActions: number; note: string; recordedAt: string;
}): JourneyCycle {
  requireValid(auditJourneyT0Snapshot(cycle) !== "MISMATCH", "Mốc T0 đã bị thay đổi; từ chối ghi check-in.");
  requireValid(cycle.status === "ACTIVE", "Chu kỳ đã tổng kết, không thể ghi thêm check-in.");
  requireValid(cycle.checkIns.length < 12, "Chu kỳ đã có tối đa 12 lần check-in.");
  requireValid(/^[\w-]{8,100}$/.test(input.id) && isValidIsoDate(input.recordedAt), "Mã hoặc ngày check-in không hợp lệ.");
  requireValid(isInteger(input.week, 1, cycle.weeksLeft), "Tuần check-in nằm ngoài kế hoạch.");
  requireValid(!cycle.checkIns.some(item => item.week === input.week || item.id === input.id), "Tuần này đã có check-in.");
  requireValid(Number.isFinite(input.actualHours) && input.actualHours >= 0 && input.actualHours <= 168, "Giờ học thực tế phải từ 0–168.");
  requireValid(isInteger(input.plannedActions, 1, 20) && isInteger(input.completedActions, 0, input.plannedActions), "Số hành động hoàn thành không hợp lệ.");
  requireValid(input.note.length <= 240, "Ghi chú tối đa 240 ký tự.");
  return { ...cycle, checkIns: [...cycle.checkIns, { ...input, note: input.note.trim(), provenance: "student_self_report" }] };
}

export function reassessJourneyCycle(cycle: JourneyCycle, input: {
  observations: Array<{ key: string; score: number }>;
  note: string; recordedAt: string;
}): JourneyCycle {
  requireValid(auditJourneyT0Snapshot(cycle) !== "MISMATCH", "Mốc T0 đã bị thay đổi; không thể đánh giá lại.");
  requireValid(cycle.status === "ACTIVE" && cycle.reassessment === null, "Chu kỳ đã được tổng kết.");
  requireValid(cycle.checkIns.length > 0, "Cần ít nhất một check-in trước khi đánh giá lại.");
  requireValid(isValidIsoDate(input.recordedAt), "Ngày đánh giá lại không hợp lệ.");
  requireValid(input.note.length <= 240, "Ghi chú tối đa 240 ký tự.");
  requireValid(input.observations.length > 0 && input.observations.length <= cycle.subjects.length, "Cần nhập ít nhất một điểm đánh giá lại.");
  const validKeys = new Set(cycle.subjects.map(s => s.key));
  requireValid(input.observations.every(o => validKeys.has(o.key) && isScore(o.score)), "Điểm đánh giá lại phải thuộc môn đã chốt và từ 0–10.");
  requireValid(new Set(input.observations.map(o => o.key)).size === input.observations.length, "Trùng môn đo lại.");
  const reviewed: JourneyCycle = { ...cycle, status: "REVIEWED", reassessment: {
    recordedAt: input.recordedAt, note: input.note.trim(),
    observations: input.observations.map(o => ({ ...o })), provenance: "student_self_report",
  } };
  return { ...reviewed, evidenceRecord: buildJourneyEvidence(reviewed) };
}

/** Versioned evidence-shaped technical lineage. Never assert causal impact or calibration. */
export function buildJourneyEvidence(cycle: JourneyCycle): JourneyEvidenceRecord {
  requireValid(cycle.status === "REVIEWED" && cycle.reassessment !== null,
    "Chỉ tạo dấu vết minh chứng khi đã đo lại.");
  const assessment = analyzeJourney(cycle);
  return {
    resultId: `${cycle.id}-review`, resultType: "recommendation",
    // A cycle-local alias, NOT a research-grade participant pseudonym.
    participantPseudonym: `local-cycle-${cycle.id}`, inputSnapshotId: cycle.id,
    engine: { name: "CLA Closed-Loop Analyzer", version: "1.1.0" },
    datasetVersion: "student-self-report-v1", featureVersion: "closed-loop-v1",
    modelVersion: "rule-based-unvalidated-v1",
    output: { value: assessment.observedAverageDelta, probability: null, unit: "score-points-0-to-10" },
    uncertainty: { type: "not_estimated", value: null },
    factors: [
      { name: "hours_self_reported", value: assessment.totalHoursReported, direction: "?", attribution: null },
      { name: "task_completion_percent_self_reported", value: assessment.completionRate, direction: "?", attribution: null },
    ],
    evidenceRefs: [...cycle.checkIns.map(c => `self-report-checkin:${c.id}`), `self-report-reassessment:${cycle.id}`],
    limitations: [
      "Inputs and outcomes are student self-reports; no independent verification.",
      "No control group; observed before-after difference is not a causal effect.",
      "No calibrated model, uncertainty estimate, or validated research pseudonym.",
    ],
    sourceVersions: ["cla-closed-loop-v1"],
    codeCommitHash: "not_recorded", createdAt: cycle.reassessment!.recordedAt,
    humanOverride: null,
  };
}

export function analyzeJourney(cycle: JourneyCycle | null): JourneyAssessment {
  if (!cycle) return { stage: "NOT_STARTED", observedAverageDelta: null, totalHoursReported: 0,
    completionRate: null, suggestion: "START", explanation: "Chưa có chu kỳ nào được tạo từ Orion." };
  const hours = round2(cycle.checkIns.reduce((n, entry) => n + entry.actualHours, 0));
  const planned = cycle.checkIns.reduce((n, entry) => n + entry.plannedActions, 0);
  const done = cycle.checkIns.reduce((n, entry) => n + entry.completedActions, 0);
  const completionRate = planned ? round2(done / planned * 100) : null;
  if (cycle.status === "REVIEWED" && cycle.reassessment) {
    const differences = cycle.reassessment.observations.flatMap(o => {
      const baseline = cycle.subjects.find(s => s.key === o.key);
      return baseline ? [o.score - baseline.baseline] : [];
    });
    const delta = differences.length ? round2(differences.reduce((a,b) => a+b, 0) / differences.length) : null;
    const replan = delta !== null && delta <= 0 || (completionRate !== null && completionRate < 60);
    return { stage: "REVIEWED", observedAverageDelta: delta, totalHoursReported: hours, completionRate,
      suggestion: replan ? "REPLAN" : "CONTINUE", explanation: replan
        ? "Nên xem lại thời lượng hoặc cách học trước khi khởi tạo chu kỳ tiếp theo."
        : "Có thể giữ hoặc điều chỉnh kế hoạch theo dữ liệu tự báo cáo ở chu kỳ tiếp theo." };
  }
  if (cycle.checkIns.length === 0) return { stage: "CHECK_IN", observedAverageDelta: null,
    totalHoursReported: hours, completionRate, suggestion: "CONTINUE",
    explanation: "Cần ghi check-in thực tế trước khi có thể đánh giá lại." };
  return { stage: "READY_TO_REASSESS", observedAverageDelta: null, totalHoursReported: hours,
    completionRate, suggestion: "REASSESS",
    explanation: "Đã có check-in. Có thể ghi điểm đo lại khi đã hoàn thành một bài đánh giá." };
}

export function isJourneyEvidenceRecord(record: unknown, cycleId: string): record is JourneyEvidenceRecord {
  if (!record || typeof record !== "object") return false;
  const e = record as Partial<JourneyEvidenceRecord>;
  return e.resultId === `${cycleId}-review` && e.inputSnapshotId === cycleId
    && e.participantPseudonym === `local-cycle-${cycleId}`
    && e.resultType === "recommendation"
    && e.engine?.name === "CLA Closed-Loop Analyzer" && e.engine?.version === "1.1.0"
    && e.modelVersion === "rule-based-unvalidated-v1"
    && e.output?.probability === null && e.output?.unit === "score-points-0-to-10"
    && (e.output.value === null || (typeof e.output.value === "number" && Number.isFinite(e.output.value)
      && e.output.value >= -10 && e.output.value <= 10))
    && e.uncertainty?.type === "not_estimated" && e.uncertainty?.value === null
    && Array.isArray(e.evidenceRefs) && Array.isArray(e.limitations)
    && e.humanOverride === null && e.codeCommitHash === "not_recorded"
    && typeof e.createdAt === "string";
}

/**
 * CP31 Batch 9 — deterministic, read-only consistency check of a stored review.
 * This does NOT authenticate the writer, Firestore server or original observations:
 * a forged cycle and forged evidence can still be mutually consistent.
 * Legacy reviewed records without an evidenceRecord remain readable but unverified.
 */
export type JourneyEvidenceAuditStatus = "CONSISTENT" | "LEGACY_NO_EVIDENCE" | "NOT_REVIEWED" | "MISMATCH";

function sameEvidenceData(a: unknown, b: unknown): boolean {
  if (a === b) return !(typeof a === "number" && !Number.isFinite(a));
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => sameEvidenceData(item, b[i]));
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, i) =>
    key === rightKeys[i] && sameEvidenceData(left[key], right[key]));
}

const validUtc = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
  const t = Date.parse(value);
  return Number.isFinite(t) && new Date(t).toISOString() === value;
};

function validReplayInputs(cycle: JourneyCycle): boolean {
  if (!validUtc(cycle.startedAt) || cycle.status !== "REVIEWED" || !cycle.reassessment ||
      !Number.isInteger(cycle.weeksLeft) || cycle.weeksLeft < 1 || cycle.weeksLeft > 104 ||
      !Number.isInteger(cycle.plannedWeeklyHours) || cycle.plannedWeeklyHours < 1 || cycle.plannedWeeklyHours > 80 ||
      !Array.isArray(cycle.subjects) || cycle.subjects.length < 1 || cycle.subjects.length > 6 ||
      !Array.isArray(cycle.checkIns) || cycle.checkIns.length < 1 || cycle.checkIns.length > 12) return false;
  const subjects = new Set<string>();
  for (const subject of cycle.subjects) {
    if (!subject || typeof subject.key !== "string" || !/^[a-z]{2,20}$/.test(subject.key) || subjects.has(subject.key) ||
        typeof subject.label !== "string" || !subject.label || subject.label.length > 40 ||
        typeof subject.baseline !== "number" || !isScore(subject.baseline) ||
        typeof subject.target !== "number" || !isScore(subject.target)) return false;
    subjects.add(subject.key);
  }
  const weeks = new Set<number>();
  const ids = new Set<string>();
  let lastTime = Date.parse(cycle.startedAt);
  for (const check of cycle.checkIns) {
    if (!check || typeof check.id !== "string" || !/^[\w-]{8,100}$/.test(check.id) || ids.has(check.id) ||
        !Number.isInteger(check.week) || check.week < 1 || check.week > cycle.weeksLeft || weeks.has(check.week) ||
        !validUtc(check.recordedAt) || Date.parse(check.recordedAt) < lastTime ||
        typeof check.actualHours !== "number" || !Number.isFinite(check.actualHours) ||
        check.actualHours < 0 || check.actualHours > 168 ||
        !Number.isInteger(check.plannedActions) || check.plannedActions < 1 || check.plannedActions > 20 ||
        !Number.isInteger(check.completedActions) || check.completedActions < 0 || check.completedActions > check.plannedActions ||
        check.provenance !== "student_self_report" || typeof check.note !== "string" || check.note.length > 240) return false;
    weeks.add(check.week); ids.add(check.id); lastTime = Date.parse(check.recordedAt);
  }
  const reassessment = cycle.reassessment;
  if (!validUtc(reassessment.recordedAt) || Date.parse(reassessment.recordedAt) < lastTime ||
      reassessment.provenance !== "student_self_report" ||
      typeof reassessment.note !== "string" || reassessment.note.length > 240 ||
      !Array.isArray(reassessment.observations) || reassessment.observations.length < 1 ||
      reassessment.observations.length > subjects.size) return false;
  const observed = new Set<string>();
  for (const item of reassessment.observations) {
    if (!item || typeof item.key !== "string" || !subjects.has(item.key) || observed.has(item.key) ||
        typeof item.score !== "number" || !isScore(item.score)) return false;
    observed.add(item.key);
  }
  return true;
}

export function auditJourneyEvidence(cycle: JourneyCycle): JourneyEvidenceAuditStatus {
  if (cycle.status !== "REVIEWED") return "NOT_REVIEWED";
  if (cycle.evidenceRecord === undefined || cycle.evidenceRecord === null) return "LEGACY_NO_EVIDENCE";
  if (!validReplayInputs(cycle) || !isJourneyEvidenceRecord(cycle.evidenceRecord, cycle.id)) return "MISMATCH";
  try {
    // Compare exact domain output, refs, factors, dates, versions and limitations;
    // object key order is irrelevant (Firestore can reorder map keys).
    const expected = buildJourneyEvidence(cycle);
    return sameEvidenceData(cycle.evidenceRecord, expected) ? "CONSISTENT" : "MISMATCH";
  } catch {
    return "MISMATCH";
  }
}

/** Reject malformed or unsupported server data instead of silently resetting a learning record. */
export function isJourneyCycle(value: unknown): value is JourneyCycle {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<JourneyCycle>;
  return c.schemaVersion === 1 && c.origin === "orion_simulation"
    && typeof c.id === "string" && typeof c.startedAt === "string"
    && ["balanced", "focused", "breakthrough"].includes(c.scenarioId ?? "")
    && (c.status === "ACTIVE" || c.status === "REVIEWED")
    && Array.isArray(c.subjects) && c.subjects.length >= 1
    && c.subjects.every(s => s && typeof s.key === "string" && isScore(s.baseline) && isScore(s.target))
    && Array.isArray(c.checkIns) && c.checkIns.length <= 12
    && (c.decisionTrace === undefined || validJourneyDecisionTrace(c.decisionTrace, c as JourneyCycle))
    && auditJourneyT0Snapshot(c as JourneyCycle) !== "MISMATCH"
    && (c.status === "ACTIVE"
      ? c.reassessment === null && (c.evidenceRecord === undefined || c.evidenceRecord === null)
      : c.reassessment !== null && c.reassessment !== undefined && validReplayInputs(c as JourneyCycle)
        && (c.evidenceRecord === undefined || c.evidenceRecord === null || auditJourneyEvidence(c as JourneyCycle) === "CONSISTENT"));
}
