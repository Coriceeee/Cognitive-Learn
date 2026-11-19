/**
 * CP31 Batch 12 — bounded, purely descriptive longitudinal audit of learning cycles.
 * A second cycle's T0 is NEVER a measured T2 by itself. A T2 can only label an
 * independently self-reported post-cycle score when T1->new T0 is continuous.
 * Equality of self-reported scores does not demonstrate measurement equivalence.
 */
import { isJourneyCycle, type JourneyCycle } from './closedLoopJourney.ts';
import { compareJourneyT0T1, type JourneyT0T1Comparison } from './journeyT0T1Comparison.ts';

export type JourneyHistoryStatus = 'NO_HISTORY' | 'ONE_REVIEWED_CYCLE' | 'MULTI_CYCLE_DESCRIPTIVE'
  | 'PARTIAL_HISTORY' | 'DISCONTINUITY' | 'INVALID';
export type JourneyTransitionStatus = 'CONTINUOUS_SELF_REPORT' | 'BASELINE_CHANGED'
  | 'MISSING_T1' | 'SUBJECT_CHANGED' | 'NO_SHARED_SUBJECT';
export type JourneyTransition = {
  fromCycleId: string; toCycleId: string; status: JourneyTransitionStatus;
  linkedSubjects: string[]; missingSubjects: string[];
  changedSubjects: string[]; previousT1: string; nextT0: string;
};
export type JourneyTrendPoint = {
  label: string; cycleId: string; observedAt: string; score: number;
  provenance: 'student_self_report';
};
export type JourneySubjectTrend = {
  key: string; label: string; points: JourneyTrendPoint[];
  /** A three-point trajectory requires two reviewed, traceable cycles. */
  comparable: boolean;
};
export type JourneyHistoryReport = {
  schema: 'cla.journey.history.v1'; status: JourneyHistoryStatus;
  windowLimit: 8; windowMayBeTruncated: boolean;
  reviewedCount: number; incompleteCount: number;
  cycleIdsChronological: string[];
  transitions: JourneyTransition[];
  subjectTrends: JourneySubjectTrend[];
  crossCycleAverageChange: null;
  forecastError: null; causalEffect: null;
  limitations: string[];
};
const LIMITATIONS = [
  'A Firestore display window of at most eight cycles is not a complete student history.',
  'Scores and check-ins are self-reported; sources and measurement equivalence are unverified.',
  'Each next-cycle baseline is a NEW self-report, not a reassessment or a T2 by itself.',
  'T1 to next T0 equality is technical continuity only, not proof of stable learning.',
  'No longitudinal treatment effect, overall gain, calibrated forecast or causal inference is estimated.',
];
const strictUtc = (s: unknown): s is string => typeof s === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) &&
  Number.isFinite(Date.parse(s)) && new Date(Date.parse(s)).toISOString() === s;
const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return typeof a !== 'number' || Number.isFinite(a);
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object' ||
      Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v,i)=>same(v,b[i]));
  const x=a as Record<string,unknown>, y=b as Record<string,unknown>;
  const keys=Object.keys(x).sort(), other=Object.keys(y).sort();
  return keys.length === other.length && keys.every((key,i)=>key === other[i] && same(x[key],y[key]));
};

/** Output is read-only and intentionally does not identify or authenticate a learner.
 * cycle order is ignored; only strictly verified timestamps determine chronology.
 * Invalid entries FAIL CLOSED; never silently exclude a corrupt record to show a trend.
 */
export function auditJourneyHistory(input: unknown, expectedUserId?: string): JourneyHistoryReport {
  const report: JourneyHistoryReport = {
    schema:'cla.journey.history.v1',status:'INVALID',windowLimit:8,windowMayBeTruncated:false,
    reviewedCount:0,incompleteCount:0,cycleIdsChronological:[],transitions:[],subjectTrends:[],
    crossCycleAverageChange:null,forecastError:null,causalEffect:null,limitations:[...LIMITATIONS],
  };
  if (!Array.isArray(input) || input.length > 8) return report;
  if (input.length === 0) { report.status='NO_HISTORY';return report; }
  if (expectedUserId !== undefined && (typeof expectedUserId !== 'string' || expectedUserId.length === 0)) return report;
  const ids=new Set<string>();
  const owners=new Set<string | null>();
  for (const raw of input) {
    if (!isJourneyCycle(raw) || !strictUtc(raw.startedAt) || ids.has(raw.id)) return report;
    const owner=(raw as JourneyCycle & {userId?:unknown}).userId;
    if (owner !== undefined && (typeof owner !== 'string' || owner.length === 0)) return report;
    if (expectedUserId !== undefined && owner !== expectedUserId) return report;
    owners.add(owner === undefined ? null : owner as string);
    if (owners.size > 1) return report; // Never compare mixed-owner or ownerless-plus-owned cycles.
    ids.add(raw.id);
    if (raw.status === 'REVIEWED' && !strictUtc(raw.reassessment?.recordedAt)) return report;
  }
  const ordered=[...input as JourneyCycle[]].sort((a,b)=>a.startedAt.localeCompare(b.startedAt));
  // Duplicate timestamps cannot establish which T0 existed first.
  if (ordered.some((cycle,i)=>i>0 && cycle.startedAt === ordered[i-1].startedAt)) return report;
  report.windowMayBeTruncated = ordered.length === 8;
  report.cycleIdsChronological = ordered.map(c=>c.id);
  const reviewed: Array<{cycle:JourneyCycle; comparison:JourneyT0T1Comparison}> = [];
  let incomplete=0;
  for (let i=1;i<ordered.length;i++) {
    const previous=ordered[i-1];
    if (previous.status==='ACTIVE' || (previous.reassessment &&
        Date.parse(previous.reassessment.recordedAt) >= Date.parse(ordered[i].startedAt))) return report;
  }
  for (const cycle of ordered) {
    const result=compareJourneyT0T1(cycle);
    if (result.status === 'INVALID') return {...report, status:'INVALID', transitions:[], subjectTrends:[]};
    if (cycle.status === 'REVIEWED') {
      if (result.status === 'DESCRIPTIVE_ONLY') reviewed.push({cycle,comparison:result});
      else incomplete++;
    } else incomplete++;
  }
  report.reviewedCount=reviewed.length;
  report.incompleteCount=incomplete;
  if (reviewed.length === 0) {report.status='PARTIAL_HISTORY';return report;}
  if (reviewed.length === 1) {report.status=incomplete?'PARTIAL_HISTORY':'ONE_REVIEWED_CYCLE';return report;}
  // All reviewed records must be traceable before ANY longitudinal comparison.
  if (incomplete && ordered.some(c=>c.status==='REVIEWED' &&
    compareJourneyT0T1(c).status !== 'DESCRIPTIVE_ONLY')) { report.status='PARTIAL_HISTORY';return report; }
  let continuity=true;
  for (let i=1;i<reviewed.length;i++) {
    const prev=reviewed[i-1], next=reviewed[i];
    const t1=prev.comparison.t1RecordedAt!, t0=next.comparison.t0FrozenAt!;
    if (Date.parse(t0) <= Date.parse(t1)) { report.status='INVALID';report.transitions=[];return report; }
    const prior=new Map(prev.comparison.measures.map(m=>[m.subjectKey,m]));
    const current=new Map(next.comparison.measures.map(m=>[m.subjectKey,m]));
    const linked:string[]=[], missing:string[]=[], changed:string[]=[];
    let shared=0, labelChange=false, baselineChange=false;
    for (const [key, before] of prior) {
      const after=current.get(key);
      if (!after) {missing.push(key);continue;}
      shared++;
      if (before.subjectLabel !== after.subjectLabel) {
        labelChange=true;changed.push(key);continue;
      }
      if (!before.matched || before.t1Score === null || !after.matched || after.t1Score === null) {
        missing.push(key);continue;
      }
      // Match is exact on score-scale, not an implicit imputation or tolerance.
      if (before.t1Score !== after.t0Score) {baselineChange=true;changed.push(key);continue;}
      linked.push(key);
    }
    // Do not hide new-only subjects from the missingness disclosure.
    for (const key of current.keys()) if (!prior.has(key)) missing.push(key);
    const status:JourneyTransitionStatus = labelChange ? 'SUBJECT_CHANGED' : baselineChange ? 'BASELINE_CHANGED'
      : shared===0 ? 'NO_SHARED_SUBJECT' : missing.length ? 'MISSING_T1' : 'CONTINUOUS_SELF_REPORT';
    report.transitions.push({fromCycleId:prev.cycle.id,toCycleId:next.cycle.id,
      status,linkedSubjects:linked,missingSubjects:missing,changedSubjects:changed,previousT1:t1,nextT0:t0});
    if (status !== 'CONTINUOUS_SELF_REPORT') continuity=false;
  }
  // Only uninterrupted complete per-subject tracks may receive sequential T labels.
  const first=reviewed[0];
  for (const measurement of first.comparison.measures) {
    if (!measurement.matched || measurement.t1Score===null) continue;
    const key=measurement.subjectKey;
    const allLinked=report.transitions.every(t=>t.linkedSubjects.includes(key));
    if (!allLinked) continue;
    const points:JourneyTrendPoint[]=[
      {label:'T0',cycleId:first.cycle.id,observedAt:first.comparison.t0FrozenAt!,score:measurement.t0Score,provenance:'student_self_report'},
      {label:'T1',cycleId:first.cycle.id,observedAt:first.comparison.t1RecordedAt!,score:measurement.t1Score,provenance:'student_self_report'},
    ];
    for (let i=1;i<reviewed.length;i++) {
      const m=reviewed[i].comparison.measures.find(x=>x.subjectKey===key)!;
      points.push({label:`T${i+1}`,cycleId:reviewed[i].cycle.id,
        observedAt:reviewed[i].comparison.t1RecordedAt!,score:m.t1Score!,provenance:'student_self_report'});
    }
    report.subjectTrends.push({key,label:measurement.subjectLabel,points,comparable:true});
  }
  report.status=continuity && report.subjectTrends.length>0 ? 'MULTI_CYCLE_DESCRIPTIVE' : 'DISCONTINUITY';
  // Unreviewed latest cycle is pending and must not alter the audited reviewed trend.
  if (ordered.some(c => c.status==='REVIEWED' && compareJourneyT0T1(c).status !== 'DESCRIPTIVE_ONLY'))
    report.status='PARTIAL_HISTORY';
  if (report.status!=='MULTI_CYCLE_DESCRIPTIVE') report.subjectTrends=[];
  return report;
}

/** Local deterministic replay, NOT signed, notarized or server-attested research evidence. */
export function replayJourneyHistory(input: unknown, report: unknown, expectedUserId?: string): boolean {
  const result=auditJourneyHistory(input,expectedUserId);
  return result.status==='MULTI_CYCLE_DESCRIPTIVE' && same(result,report);
}
