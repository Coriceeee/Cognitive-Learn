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
    limitations: [
      "Check-ins and scores are student self-reports; data are not independently verified.",
      "Static is a frozen-policy baseline; neither policy assigns an intervention in shadow mode.",
      "Decision divergence is not evidence of improved outcomes or a causal effect.",
      "The 60% rule is an unvalidated engineering threshold, not a calibrated risk cutoff.",
      "No uncertainty estimate, population validation, or research consent is inferred.",
    ],
  };
}

/** Recalculate decisions from the stored snapshot, without Firestore or network I/O. */
export function replayShadowEvidence(record: ShadowPolicyResult): boolean {
  if (record.schemaVersion !== 1 || record.policyVersion !== "cla-shadow-policy-v1") return false;
  const { inputSnapshot: s } = record;
  if (!s.baselineSubjects.length || !s.checkIns.length || !s.reassessment?.length) {
    return record.adaptiveDecision === "ABSTAIN" && !record.changed;
  }
  const planned = s.checkIns.reduce((sum, c) => sum + c.planned, 0);
  const completed = s.checkIns.reduce((sum, c) => sum + c.completed, 0);
  if (planned <= 0 || completed > planned || completed < 0) return false;
  const byKey = new Map(s.baselineSubjects.map(x => [x.key, x.baseline]));
  const deltas = s.reassessment.map(o => byKey.has(o.key) ? o.score - byKey.get(o.key)! : NaN);
  if (deltas.some(n => !Number.isFinite(n))) return false;
  const pct = Math.round(completed / planned * 10000) / 100;
  const delta = Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length * 100) / 100;
  const expected: ShadowDecision = pct < 60 || delta <= 0 ? "REPLAN" : "MAINTAIN";
  return record.staticDecision === "MAINTAIN" && record.adaptiveDecision === expected &&
    record.changed === (expected !== "MAINTAIN") && record.completionPercent === pct &&
    record.observedDelta === delta;
}
