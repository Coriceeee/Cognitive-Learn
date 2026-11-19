/**
 * CLA Decision Evidence Studio / shadow-only v1.
 * Both policies are deterministic technical comparators, NEVER treatment effect estimates.
 * No writes, no Firestore side effects, no probabilistic or causal interpretation.
 */
import { analyzeJourney, type JourneyCycle } from "./closedLoopJourney.ts";

export type ShadowDecision = "MAINTAIN" | "REPLAN" | "ABSTAIN";
export type ShadowPolicyResult = {
  schemaVersion: 1;
  policyVersion: "cla-shadow-policy-v1";
  evidenceLevel: "technical_replay_only";
  cycleId: string;
  inputSnapshot: {
    scenarioId: string;
    baselineSubjects: Array<{ key: string; baseline: number; target: number }>;
    checkIns: Array<{ id: string; week: number; planned: number; completed: number; source: "student_self_report" }>;
    reassessment: Array<{ key: string; score: number }> | null;
  };
  staticDecision: ShadowDecision;
  adaptiveDecision: ShadowDecision;
  changed: boolean;
  trigger: string;
  completionPercent: number | null;
  observedDelta: number | null;
  limitations: string[];
};

const SHADOW_LIMITATIONS = [
  "Check-ins and scores are student self-reports; data are not independently verified.",
  "Static is a frozen-policy baseline; neither policy assigns an intervention in shadow mode.",
  "Decision divergence is not evidence of improved outcomes or a causal effect.",
  "The 60% rule is an unvalidated engineering threshold, not a calibrated risk cutoff.",
  "No uncertainty estimate, population validation, or research consent is inferred.",
] as const;

export function evaluateShadowPolicies(cycle: JourneyCycle): ShadowPolicyResult {
  const observed = analyzeJourney(cycle);
  const eligible = cycle.status === "REVIEWED" && cycle.reassessment !== null &&
    cycle.checkIns.length > 0 && observed.completionRate !== null &&
    observed.observedAverageDelta !== null;
  const staticDecision: ShadowDecision = "MAINTAIN";
  // The Static baseline always retains the initial plan. Both paths abstain from
  // a new outcome-based judgement until a reviewed cycle has sufficient input.
  const adaptiveDecision: ShadowDecision = !eligible ? "ABSTAIN" :
    observed.completionRate! < 60 || observed.observedAverageDelta! <= 0 ? "REPLAN" : "MAINTAIN";
  const trigger = !eligible ? "insufficient_reassessment" :
    observed.completionRate! < 60 ? "self_reported_completion_below_60_percent" :
    observed.observedAverageDelta! <= 0 ? "self_reported_score_delta_nonpositive" : "no_replan_trigger";
  return {
    schemaVersion: 1, policyVersion: "cla-shadow-policy-v1", evidenceLevel: "technical_replay_only",
    cycleId: cycle.id,
    inputSnapshot: {
      scenarioId: cycle.scenarioId,
      baselineSubjects: cycle.subjects.map(s => ({ key: s.key, baseline: s.baseline, target: s.target })),
      checkIns: cycle.checkIns.map(c => ({ id: c.id, week: c.week, planned: c.plannedActions,
        completed: c.completedActions, source: c.provenance })),
      reassessment: cycle.reassessment?.observations.map(o => ({ ...o })) ?? null,
    },
    staticDecision, adaptiveDecision, changed: eligible && adaptiveDecision !== staticDecision,
    trigger, completionPercent: observed.completionRate, observedDelta: observed.observedAverageDelta,
    limitations: [...SHADOW_LIMITATIONS],
  };
}

/**
 * Recompute every decision field against the embedded bounded snapshot.
 * This is an INTERNAL-CONSISTENCY check, not a signature or external verification.
 * It must not be used to authenticate user-supplied evidence or claim treatment effects.
 */
export function replayShadowEvidence(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<ShadowPolicyResult>;
  if (record.schemaVersion !== 1 || record.policyVersion !== "cla-shadow-policy-v1" ||
      record.evidenceLevel !== "technical_replay_only" ||
      typeof record.cycleId !== "string" || !/^[\w-]{8,100}$/.test(record.cycleId) ||
      record.staticDecision !== "MAINTAIN" || typeof record.changed !== "boolean" ||
      !Array.isArray(record.limitations) || record.limitations.length !== 5 ||
      record.limitations.some((item, idx) => item !== SHADOW_LIMITATIONS[idx])) return false;
  const s = record.inputSnapshot;
  if (!s || !["balanced", "focused", "breakthrough"].includes(s.scenarioId) ||
      !Array.isArray(s.baselineSubjects) || s.baselineSubjects.length < 1 || s.baselineSubjects.length > 6 ||
      !Array.isArray(s.checkIns) || s.checkIns.length > 12 ||
      (s.reassessment !== null && !Array.isArray(s.reassessment))) return false;
  const validScore = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 10;
  const keyOK = (key: unknown): key is string => typeof key === "string" && /^[a-z]{2,20}$/.test(key);
  const baselineKeys = new Set<string>();
  for (const x of s.baselineSubjects) {
    if (!x || !keyOK(x.key) || baselineKeys.has(x.key) || !validScore(x.baseline) || !validScore(x.target)) return false;
    baselineKeys.add(x.key);
  }
  const seenWeeks = new Set<number>();
  const seenIds = new Set<string>();
  let planned = 0;
  let completed = 0;
  for (const c of s.checkIns) {
    if (!c || typeof c.id !== "string" || !/^[\w-]{8,100}$/.test(c.id) || seenIds.has(c.id) ||
        !Number.isInteger(c.week) || c.week < 1 || c.week > 104 || seenWeeks.has(c.week) ||
        !Number.isInteger(c.planned) || c.planned < 1 || c.planned > 20 ||
        !Number.isInteger(c.completed) || c.completed < 0 || c.completed > c.planned ||
        c.source !== "student_self_report") return false;
    seenWeeks.add(c.week); seenIds.add(c.id);
    planned += c.planned; completed += c.completed;
  }
  if (s.reassessment !== null) {
    if (s.checkIns.length === 0 || s.reassessment.length < 1 || s.reassessment.length > baselineKeys.size) return false;
    const observedKeys = new Set<string>();
    for (const o of s.reassessment) {
      if (!o || !keyOK(o.key) || !baselineKeys.has(o.key) || observedKeys.has(o.key) || !validScore(o.score)) return false;
      observedKeys.add(o.key);
    }
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const pct = planned ? round2(completed / planned * 100) : null;
  const observed = s.reassessment;
  const byKey = new Map(s.baselineSubjects.map(x => [x.key, x.baseline]));
  const delta = observed && observed.length ? round2(observed.reduce((acc, o) => acc + o.score - byKey.get(o.key)!, 0) / observed.length) : null;
  const eligible = observed !== null && s.checkIns.length > 0 && pct !== null && delta !== null;
  const expected: ShadowDecision = !eligible ? "ABSTAIN" : pct! < 60 || delta! <= 0 ? "REPLAN" : "MAINTAIN";
  const trigger = !eligible ? "insufficient_reassessment" :
    pct! < 60 ? "self_reported_completion_below_60_percent" :
    delta! <= 0 ? "self_reported_score_delta_nonpositive" : "no_replan_trigger";
  return record.adaptiveDecision === expected && record.changed === (eligible && expected !== "MAINTAIN") &&
    record.trigger === trigger && record.completionPercent === pct && record.observedDelta === delta;
}
