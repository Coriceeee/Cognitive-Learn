/**
 * CP31 Batch 11 — retrospective comparison of frozen T0 with student-reported T1.
 * No predictive evaluation is possible while T0.forecastStatus is NOT_ESTIMATED.
 * This pure read-only adapter neither verifies students nor estimates intervention effects.
 */
import {
  analyzeJourney, auditJourneyEvidence, auditJourneyT0Snapshot, isJourneyCycle,
  type JourneyCycle,
} from './closedLoopJourney.ts';

export type JourneyComparisonStatus =
  | 'DESCRIPTIVE_ONLY' | 'NOT_REVIEWED' | 'LEGACY_NO_T0'
  | 'LEGACY_NO_EVIDENCE' | 'INVALID';

export type JourneyT0T1Comparison = {
  schema: 'cla.journey.t0-t1-comparison.v1';
  status: JourneyComparisonStatus;
  evidenceLevel: 'student_self_report_only';
  t0FrozenAt: string | null;
  t1RecordedAt: string | null;
  cycleId: string | null;
  measures: Array<{
    subjectKey: string; subjectLabel: string; t0Score: number;
    t1Score: number | null; delta: number | null; matched: boolean;
  }>;
  summary: {
    matchedSubjectCount: number; missingT1SubjectCount: number;
    averageMatchedT0: number | null; averageMatchedT1: number | null;
    observedAverageDelta: number | null;
    reportedHours: number | null; reportedCompletionPercent: number | null;
    frozenTargetGapPoints: number | null;
  };
  forecastEvaluation: 'NOT_POSSIBLE_NO_T0_FORECAST';
  calibratedProbability: null;
  forecastError: null;
  causalEffect: null;
  treatmentAssignment: 'NOT_PERFORMED';
  limitations: string[];
};

const LIMITATIONS = [
  'T0 and T1 are student self-reports, not independently verified test scores.',
  'T0 contains a descriptive target gap, NOT an ML forecast; prediction error cannot be assessed.',
  'Action completion and hours are self-reported and cannot establish treatment exposure.',
  'A before-after difference is not an intervention effect; no controlled comparison is available.',
  'Missing T1 subjects are excluded, not replaced with zero; measurement equivalence is unverified.',
] as const;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Fail closed on mismatch, including ostensibly valid but untraceable review records. */
export function compareJourneyT0T1(input: unknown): JourneyT0T1Comparison {
  const base: JourneyT0T1Comparison = {
    schema: 'cla.journey.t0-t1-comparison.v1', status: 'INVALID',
    evidenceLevel: 'student_self_report_only', cycleId: null,
    t0FrozenAt: null, t1RecordedAt: null, measures: [],
    summary: { matchedSubjectCount: 0, missingT1SubjectCount: 0, averageMatchedT0: null,
      averageMatchedT1: null, observedAverageDelta: null, reportedHours: null,
      reportedCompletionPercent: null, frozenTargetGapPoints: null },
    forecastEvaluation: 'NOT_POSSIBLE_NO_T0_FORECAST', calibratedProbability: null,
    forecastError: null, causalEffect: null, treatmentAssignment: 'NOT_PERFORMED',
    limitations: [...LIMITATIONS],
  };
  if (!isJourneyCycle(input)) return base;
  const cycle = input as JourneyCycle;
  base.cycleId = cycle.id;
  if (cycle.status !== 'REVIEWED') { base.status = 'NOT_REVIEWED'; return base; }
  const t0Audit = auditJourneyT0Snapshot(cycle);
  if (t0Audit === 'MISMATCH') return base;
  if (t0Audit === 'LEGACY_NO_T0') { base.status = 'LEGACY_NO_T0'; return base; }
  const evidenceAudit = auditJourneyEvidence(cycle);
  if (evidenceAudit === 'LEGACY_NO_EVIDENCE') { base.status = 'LEGACY_NO_EVIDENCE'; return base; }
  if (evidenceAudit !== 'CONSISTENT' || !cycle.t0Snapshot || !cycle.reassessment) return base;
  // A typed T0 is read only from the persisted frozen snapshot, never a current draft.
  const frozen = cycle.t0Snapshot;
  if (frozen.forecastStatus !== 'NOT_ESTIMATED' || frozen.predictedOutcome !== null ||
      frozen.calibratedProbability !== null) return base;
  const t1 = new Map(cycle.reassessment.observations.map(o => [o.key, o.score]));
  const measures = frozen.subjects.map(s => {
    const score = t1.has(s.key) ? t1.get(s.key)! : null;
    return { subjectKey: s.key, subjectLabel: s.label, t0Score: s.baseline,
      t1Score: score, delta: score === null ? null : round2(score - s.baseline), matched: score !== null };
  });
  const matched = measures.filter(m => m.matched);
  if (matched.length === 0) return base;
  const assessment = analyzeJourney(cycle);
  const averageDelta = round2(matched.reduce((n,m) => n + m.delta!, 0) / matched.length);
  if (assessment.stage !== 'REVIEWED' || assessment.observedAverageDelta !== averageDelta ||
      assessment.completionRate === null || !Number.isFinite(assessment.totalHoursReported)) return base;
  base.status = 'DESCRIPTIVE_ONLY';
  base.t0FrozenAt = frozen.frozenAt;
  base.t1RecordedAt = cycle.reassessment.recordedAt;
  base.measures = measures;
  base.summary = {
    matchedSubjectCount: matched.length, missingT1SubjectCount: measures.length - matched.length,
    averageMatchedT0: round2(matched.reduce((n,m) => n + m.t0Score, 0) / matched.length),
    averageMatchedT1: round2(matched.reduce((n,m) => n + m.t1Score!, 0) / matched.length),
    observedAverageDelta: averageDelta,
    reportedHours: assessment.totalHoursReported,
    reportedCompletionPercent: assessment.completionRate,
    frozenTargetGapPoints: frozen.planGapPoints,
  };
  return base;
}

function sameData(a: unknown, b: unknown): boolean {
  if (a === b) return typeof a !== 'number' || Number.isFinite(a);
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' ||
      Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x,i) => sameData(x,b[i]));
  const left = a as Record<string,unknown>, right = b as Record<string,unknown>;
  const keysA = Object.keys(left).sort(), keysB = Object.keys(right).sort();
  return keysA.length === keysB.length && keysA.every((k,i) => k === keysB[i] && sameData(left[k],right[k]));
}

/** Internal reproducibility check; NOT authentication of the original student data. */
export function replayJourneyT0T1Comparison(cycle: unknown, report: unknown): boolean {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return false;
  const current = compareJourneyT0T1(cycle);
  return current.status === 'DESCRIPTIVE_ONLY' && sameData(current, report);
}
