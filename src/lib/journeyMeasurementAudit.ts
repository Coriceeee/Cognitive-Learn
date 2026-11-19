/**
 * CP31 Batch 13 — measurement-context admissibility gate.
 * Existing T0/T1/T2 series are descriptive student self-reports only.
 * Matching *declared* instrument metadata DOES NOT establish reliability,
 * psychometric equivalence, independent grading, or a treatment effect.
 *
 * The optional manifest is an offline, synthetic/research-protocol input; it
 * is NOT persisted to Firestore by this module and is NOT an authentication
 * or research-quality provenance mechanism. Unknown/legacy => no promotion.
 */
import { isJourneyCycle, type JourneyCycle } from './closedLoopJourney.ts';
import { auditJourneyHistory } from './journeyMultiCycleTrend.ts';
import { compareJourneyT0T1 } from './journeyT0T1Comparison.ts';

export type DeclaredMeasurement = {
  cycleId: string;
  subjectKey: string;
  timepoint: 'T0' | 'T1';
  score: number;
  /** Recorded T0 freeze time or the T1 reassessment time: NOT test administration time. */
  linkedAt: string;
  source: 'student_self_report';
  instrumentId: string;
  instrumentVersion: string;
  formId: string;
  scoringProtocolId: string;
  scaleId: 'score-0-to-10' | 'score-0-to-10-rounded';
};
export type JourneyMeasurementManifest = {
  schema: 'cla.journey.measurement-declarations.v1';
  source: 'student_declared_unverified';
  declarations: DeclaredMeasurement[];
};
export type MeasurementAuditStatus = 'NO_HISTORY' | 'SOURCE_BLOCKED' |
  'MISSING_DECLARATIONS' | 'INVALID_DECLARATIONS' | 'INSTRUMENT_MISMATCH' |
  'SCALE_MISMATCH' | 'FORM_MISMATCH' | 'SCORING_PROTOCOL_MISMATCH' |
  'DECLARED_ALIGNED_ONLY';
export type MeasurementSubjectAudit = {
  key: string; label: string;
  status: Exclude<MeasurementAuditStatus, 'NO_HISTORY' | 'SOURCE_BLOCKED'>;
  expectedPointCount: number; suppliedPointCount: number;
};
export type JourneyMeasurementReport = {
  schema: 'cla.journey.measurement-audit.v1';
  status: MeasurementAuditStatus;
  sourceHistoryStatus: ReturnType<typeof auditJourneyHistory>['status'];
  expectedPointCount: number; suppliedPointCount: number;
  subjectAudits: MeasurementSubjectAudit[];
  declaredAlignedSubjects: string[];
  /** Always false. The manifest only records unverified student declarations. */
  measurementEquivalenceVerified: false;
  reliabilityValidated: false;
  independentOutcomeVerified: false;
  forecastError: null;
  causalEffect: null;
  limitations: string[];
};
const LIMITATIONS = [
  'Student-declared instrument/version/form/scale equality is NOT psychometric equivalence.',
  'Neither the declaration nor the T0/T1/T2 observations have independent source verification.',
  'No inter-rater reliability, test-retest reliability, calibrated prediction or causal effect is established.',
  'A missing or incompatible declaration cannot be replaced with a default scale or imputed score.',
  'T0/T1 linkedAt is a cycle-system timestamp, not independently verified test administration time.',
];
const idPattern = /^[a-z][a-z0-9_-]{2,63}$/;
const utc = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value;
const keysEqual = (data: Record<string, unknown>, fields: string[]) =>
  Object.keys(data).sort().join('|') === [...fields].sort().join('|');
const fields = ['cycleId', 'subjectKey', 'timepoint', 'score', 'linkedAt', 'source',
  'instrumentId', 'instrumentVersion', 'formId', 'scoringProtocolId', 'scaleId'];
const makeId = (cycleId:string, subjectKey:string, timepoint:string) => `${cycleId}\u0000${subjectKey}\u0000${timepoint}`;
const declarationValid = (raw: unknown): raw is DeclaredMeasurement => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const d = raw as Record<string, unknown>;
  return keysEqual(d, fields) && typeof d.cycleId === 'string' && /^[\w-]{8,100}$/.test(d.cycleId) &&
    typeof d.subjectKey === 'string' && /^[a-z]{2,20}$/.test(d.subjectKey) &&
    (d.timepoint === 'T0' || d.timepoint === 'T1') &&
    typeof d.score === 'number' && Number.isFinite(d.score) && d.score >= 0 && d.score <= 10 &&
    utc(d.linkedAt) && d.source === 'student_self_report' &&
    ['instrumentId','instrumentVersion','formId','scoringProtocolId'].every(k => typeof d[k] === 'string' && idPattern.test(d[k])) &&
    (d.scaleId === 'score-0-to-10' || d.scaleId === 'score-0-to-10-rounded');
};
const matchingType = (a: DeclaredMeasurement, b: DeclaredMeasurement): MeasurementSubjectAudit['status'] | null => {
  if (a.scaleId !== b.scaleId) return 'SCALE_MISMATCH';
  if (a.instrumentId !== b.instrumentId || a.instrumentVersion !== b.instrumentVersion)
    return 'INSTRUMENT_MISMATCH';
  if (a.formId !== b.formId) return 'FORM_MISMATCH';
  if (a.scoringProtocolId !== b.scoringProtocolId) return 'SCORING_PROTOCOL_MISMATCH';
  return null;
};

/** Validates declared score sources against the *already audited* frozen cycle snapshots.
 * Any surplus point, wrong score/time, wrong owner, unrecognized field, duplicated point,
 * malformed instrument or mixed scale FAILS CLOSED. Returns no numeric trend estimate.
 */
export function auditJourneyMeasurements(
  input: unknown, manifest: unknown = null, expectedUserId?: string,
): JourneyMeasurementReport {
  const history = auditJourneyHistory(input, expectedUserId);
  const base: JourneyMeasurementReport = {
    schema:'cla.journey.measurement-audit.v1', status:'SOURCE_BLOCKED',
    sourceHistoryStatus:history.status, expectedPointCount:0, suppliedPointCount:0,
    subjectAudits:[], declaredAlignedSubjects:[], measurementEquivalenceVerified:false,
    reliabilityValidated:false, independentOutcomeVerified:false, forecastError:null,
    causalEffect:null, limitations:[...LIMITATIONS],
  };
  if (history.status === 'NO_HISTORY') { base.status='NO_HISTORY'; return base; }
  if (history.status !== 'MULTI_CYCLE_DESCRIPTIVE' || !Array.isArray(input)) return base;
  const cycles = [...input as JourneyCycle[]].sort((a,b)=>a.startedAt.localeCompare(b.startedAt));
  const expected = new Map<string, {score:number;linkedAt:string;subjectLabel:string}>();
  // Trace points from each cycle's frozen T0 and independently recorded T1,
  // never from a new cycle's entry baseline in lieu of a previous T1.
  for (const cycle of cycles) {
    if (!isJourneyCycle(cycle)) return base;
    const comparison = compareJourneyT0T1(cycle);
    if (comparison.status !== 'DESCRIPTIVE_ONLY') {
      if (cycle.status === 'ACTIVE') continue; // Pending T1, never an observed next point.
      return base;
    }
    for (const m of comparison.measures) {
      if (!m.matched || m.t1Score === null) continue;
      expected.set(makeId(cycle.id,m.subjectKey,'T0'),
        {score:m.t0Score,linkedAt:comparison.t0FrozenAt!,subjectLabel:m.subjectLabel});
      expected.set(makeId(cycle.id,m.subjectKey,'T1'),
        {score:m.t1Score,linkedAt:comparison.t1RecordedAt!,subjectLabel:m.subjectLabel});
    }
  }
  const keys = new Set(history.subjectTrends.map(t=>t.key));
  const relevant = [...expected].filter(([id]) => keys.has(id.split('\u0000')[1]));
  base.expectedPointCount = relevant.length;
  if (manifest === null || manifest === undefined) {
    base.status='MISSING_DECLARATIONS';
    base.subjectAudits=history.subjectTrends.map(t=>({key:t.key,label:t.label,
      status:'MISSING_DECLARATIONS',expectedPointCount:cycles.filter(c=>c.status==='REVIEWED').length*2,
      suppliedPointCount:0}));
    return base;
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    base.status='INVALID_DECLARATIONS';return base;
  }
  const meta = manifest as Record<string,unknown>;
  if (!keysEqual(meta,['schema','source','declarations']) || meta.schema !== 'cla.journey.measurement-declarations.v1' ||
      meta.source !== 'student_declared_unverified' || !Array.isArray(meta.declarations) ||
      meta.declarations.length > 96) { base.status='INVALID_DECLARATIONS'; return base; }
  const declared = new Map<string, DeclaredMeasurement>();
  for (const d of meta.declarations) {
    if (!declarationValid(d)) { base.status='INVALID_DECLARATIONS';return base; }
    const id=makeId(d.cycleId,d.subjectKey,d.timepoint);
    const original=expected.get(id);
    if (declared.has(id) || !original || !keys.has(d.subjectKey) || d.score !== original.score || d.linkedAt !== original.linkedAt) {
      base.status='INVALID_DECLARATIONS';return base;
    }
    declared.set(id,d);
  }
  base.suppliedPointCount=declared.size;
  for (const track of history.subjectTrends) {
    const ids=relevant.map(([id])=>id).filter(id=>id.split('\u0000')[1]===track.key);
    const values=ids.map(id=>declared.get(id)).filter((d):d is DeclaredMeasurement=>Boolean(d));
    let status: MeasurementSubjectAudit['status']='DECLARED_ALIGNED_ONLY';
    if (values.length !== ids.length) status='MISSING_DECLARATIONS';
    else for (const value of values.slice(1)) {
      const mismatch=matchingType(values[0],value);
      if (mismatch) { status=mismatch; break; }
    }
    base.subjectAudits.push({key:track.key,label:track.label,
      status,expectedPointCount:ids.length,suppliedPointCount:values.length});
    if (status==='DECLARED_ALIGNED_ONLY') base.declaredAlignedSubjects.push(track.key);
  }
  // Never label a partially declared/mixed-scale multi-subject series aligned.
  base.status=base.subjectAudits.find(t=>t.status!=='DECLARED_ALIGNED_ONLY')?.status ?? 'DECLARED_ALIGNED_ONLY';
  if (base.status !== 'DECLARED_ALIGNED_ONLY') base.declaredAlignedSubjects=[];
  return base;
}
const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return typeof a !== 'number' || Number.isFinite(a);
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' ||
      Array.isArray(a)!==Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length===b.length && a.every((x,i)=>same(x,b[i]));
  const x=a as Record<string,unknown>, y=b as Record<string,unknown>;
  const k=Object.keys(x).sort(), l=Object.keys(y).sort();
  return k.length===l.length && k.every((p,i)=>p===l[i] && same(x[p],y[p]));
};
/** Replay checks local deterministic correspondence, NOT a signed evidence source. */
export function replayJourneyMeasurements(
  cycles: unknown, manifest: unknown, report: unknown, expectedUserId?: string,
): boolean {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return false;
  const result=auditJourneyMeasurements(cycles,manifest,expectedUserId);
  return result.status==='DECLARED_ALIGNED_ONLY' && same(result,report);
}
