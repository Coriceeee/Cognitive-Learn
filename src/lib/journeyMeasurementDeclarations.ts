/** CP31 B14 — immutable, owner-bound student DECLARATIONS about measurement context.
 * A recordedAt server timestamp proves only when a declaration was stored, not
 * when a test was administered or the psychometric equivalence of its scores.
 */
import { auditJourneyEvidence, auditJourneyT0Snapshot, isJourneyCycle, type JourneyCycle } from './closedLoopJourney.ts';
import { type DeclaredMeasurement, type JourneyMeasurementManifest } from './journeyMeasurementAudit.ts';

export type MeasurementContextInput = Pick<DeclaredMeasurement,
  'instrumentId' | 'instrumentVersion' | 'formId' | 'scoringProtocolId' | 'scaleId'>;
export type MeasurementPoint = { cycleId:string; subjectKey:string; subjectLabel:string;
  timepoint:'T0'|'T1'; score:number; linkedAt:string };
export type StoredMeasurementDeclaration = DeclaredMeasurement & {
  schemaVersion:1; userId:string; subjectIndex:number; observationIndex:number;
  declaredAt:unknown;
};
const idPattern=/^[a-z][a-z0-9_-]{2,63}$/;
const cyclePattern=/^[\w-]{8,100}$/;
const strictUtc=(x:unknown):x is string=>typeof x==='string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) &&
  !Number.isNaN(Date.parse(x)) && new Date(Date.parse(x)).toISOString()===x;
const score=(x:unknown):x is number=>typeof x==='number' && Number.isFinite(x) && x>=0 && x<=10;
const sameKeys=(x:Record<string,unknown>,names:string[])=>
  Object.keys(x).sort().join('|')===[...names].sort().join('|');
export const measurementDeclarationDocId=(point:Pick<MeasurementPoint,'cycleId'|'subjectKey'|'timepoint'>)=>
  `${point.cycleId}~${point.subjectKey}~${point.timepoint}`;

/** Derive the observed point ONLY from a currently auditable cycle. */
export function listMeasurementPoints(cycle:JourneyCycle):MeasurementPoint[] {
  if (!isJourneyCycle(cycle) || !cyclePattern.test(cycle.id) ||
      auditJourneyT0Snapshot(cycle)!=='FROZEN_CONSISTENT' || !strictUtc(cycle.startedAt)) return [];
  const points:MeasurementPoint[]=cycle.subjects.map(s=>({cycleId:cycle.id,subjectKey:s.key,
    subjectLabel:s.label,timepoint:'T0',score:s.baseline,linkedAt:cycle.startedAt}));
  if (cycle.status==='REVIEWED' && cycle.reassessment &&
      auditJourneyEvidence(cycle)==='CONSISTENT' && strictUtc(cycle.reassessment.recordedAt)) {
    for(const obs of cycle.reassessment.observations){
      const subject=cycle.subjects.find(s=>s.key===obs.key);
      if(subject && score(obs.score)) points.push({cycleId:cycle.id,subjectKey:obs.key,
        subjectLabel:subject.label,timepoint:'T1',score:obs.score,linkedAt:cycle.reassessment.recordedAt});
    }
  }
  return points;
}

export function buildMeasurementDeclaration(cycle:JourneyCycle,uid:string,subjectKey:string,
  timepoint:'T0'|'T1',context:MeasurementContextInput):Omit<StoredMeasurementDeclaration,'declaredAt'> {
  if(!uid || uid.length>128 || !cyclePattern.test(cycle.id) || !idPattern.test(subjectKey) ||
    ('userId' in cycle && (cycle as JourneyCycle & {userId?:unknown}).userId !== uid))
    throw new Error('Tài khoản, chu kỳ hoặc môn không hợp lệ.');
  const point=listMeasurementPoints(cycle).find(p=>p.subjectKey===subjectKey && p.timepoint===timepoint);
  if(!point) throw new Error('Chưa có mốc đo hợp lệ; không khai báo thay cho điểm chưa quan sát.');
  if(!context || typeof context!=='object' || Array.isArray(context) || !sameKeys(context as unknown as Record<string,unknown>,['instrumentId','instrumentVersion','formId','scoringProtocolId','scaleId']) ||
    !['score-0-to-10','score-0-to-10-rounded'].includes(context.scaleId) ||
    !(['instrumentId','instrumentVersion','formId','scoringProtocolId'] as const)
      .every(key=>typeof context[key]==='string' && idPattern.test(context[key])))
    throw new Error('Mã công cụ/đề/phiên bản/quy tắc chấm không hợp lệ (chữ thường, số, _ hoặc -).');
  const subjectIndex=cycle.subjects.findIndex(s=>s.key===subjectKey);
  const observationIndex=timepoint==='T1'
    ? cycle.reassessment!.observations.findIndex(s=>s.key===subjectKey):-1;
  if(subjectIndex<0 || (timepoint==='T1' && observationIndex<0)) throw new Error('Không tìm thấy môn đo.');
  return {schemaVersion:1,userId:uid,subjectIndex,observationIndex,
    cycleId:point.cycleId,subjectKey:point.subjectKey,timepoint:point.timepoint,
    score:point.score,linkedAt:point.linkedAt,source:'student_self_report',
    instrumentId:context.instrumentId,instrumentVersion:context.instrumentVersion,
    formId:context.formId,scoringProtocolId:context.scoringProtocolId,scaleId:context.scaleId};
}

const storedFields=['schemaVersion','userId','subjectIndex','observationIndex','cycleId',
  'subjectKey','timepoint','score','linkedAt','source','instrumentId','instrumentVersion',
  'formId','scoringProtocolId','scaleId','declaredAt'];
const declaredFields=['cycleId','subjectKey','timepoint','score','linkedAt','source',
  'instrumentId','instrumentVersion','formId','scoringProtocolId','scaleId'] as const;
/** Reject injected/forged fields, stale scores and other owners; never silently filter. */
export function parseStoredMeasurementDeclaration(raw:unknown,docId:string,
  cycles:JourneyCycle[],uid:string):StoredMeasurementDeclaration|null {
  if(!raw || typeof raw!=='object' || Array.isArray(raw) || !uid) return null;
  const record=raw as Record<string,unknown>;
  if(!sameKeys(record,storedFields) || record.schemaVersion!==1 || record.userId!==uid ||
      record.source!=='student_self_report' || !strictUtc(record.linkedAt) ||
      typeof record.cycleId!=='string' || typeof record.subjectKey!=='string' ||
      (record.timepoint!=='T0' && record.timepoint!=='T1') || !score(record.score) ||
      measurementDeclarationDocId(record as MeasurementPoint)!==docId ||
      typeof record.subjectIndex!=='number' || !Number.isInteger(record.subjectIndex) ||
      typeof record.observationIndex!=='number' || !Number.isInteger(record.observationIndex) ||
      !record.declaredAt || typeof (record.declaredAt as {toDate?:unknown}).toDate!=='function') return null;
  const cycle=cycles.find(c=>c.id===record.cycleId);
  if(!cycle || ('userId' in cycle && (cycle as JourneyCycle & {userId?:unknown}).userId !== uid)) return null;
  let expected:Omit<StoredMeasurementDeclaration,'declaredAt'>;
  try { expected=buildMeasurementDeclaration(cycle,uid,record.subjectKey,
    record.timepoint,Object.fromEntries(
      ['instrumentId','instrumentVersion','formId','scoringProtocolId','scaleId'].map(k=>[k,record[k]])
    ) as MeasurementContextInput); }
  catch { return null; }
  for(const key of storedFields.filter(k=>k!=='declaredAt')) {
    if(record[key]!==expected[key as keyof typeof expected]) return null;
  }
  return record as StoredMeasurementDeclaration;
}
/** Generate B13 input with exact fields; no owner, timestamp or extra evidence claims. */
export function manifestFromStoredMeasurements(rows:StoredMeasurementDeclaration[]):JourneyMeasurementManifest {
  return {schema:'cla.journey.measurement-declarations.v1',source:'student_declared_unverified',
    declarations:rows.map(row=>Object.fromEntries(declaredFields.map(k=>[k,row[k]])) as DeclaredMeasurement)};
}
