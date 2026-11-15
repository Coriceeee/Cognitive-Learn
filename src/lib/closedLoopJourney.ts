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
export type JourneyLock = { schemaVersion: 1; userId: string; activeCycleId: string | null };
export function isJourneyLock(value: unknown, uid: string): value is JourneyLock {
  if (!value || typeof value !== "object") return false;
  const lock = value as Partial<JourneyLock>;
  return lock.schemaVersion === 1 && lock.userId === uid &&
    (lock.activeCycleId === null || (typeof lock.activeCycleId === "string" && /^[\w-]{8,100}$/.test(lock.activeCycleId)));
}
export type JourneyCycle = {
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
  /** Legacy v1 documents may not have this field. */
  evidenceRecord?: JourneyEvidenceRecord | null;
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
  return { id: input.id, schemaVersion: 1, origin: "orion_simulation", scenarioId: input.scenarioId,
    scenarioTitle: input.scenarioTitle.trim(), targetMajor: input.targetMajor.trim(),
    subjects: input.subjects.map(s => ({ ...s })), plannedWeeklyHours: input.plannedWeeklyHours,
    weeksLeft: input.weeksLeft, startedAt: input.startedAt, status: "ACTIVE", checkIns: [], reassessment: null, evidenceRecord: null };
}

export function appendJourneyCheckIn(cycle: JourneyCycle, input: {
  id: string; week: number; actualHours: number; completedActions: number;
  plannedActions: number; note: string; recordedAt: string;
}): JourneyCycle {
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
    && (c.reassessment === null || (c.reassessment !== undefined && Array.isArray(c.reassessment.observations)))
    && (c.evidenceRecord === undefined || c.evidenceRecord === null || isJourneyEvidenceRecord(c.evidenceRecord, c.id));
}
