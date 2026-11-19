/** CP31 Batch 15 — deterministic, owner-scoped Firestore declaration snapshot audit.
 * This is a CLIENT consistency check, not server attestation or psychometric validation.
 * An empty/partial query result never establishes that all measurements were declared.
 */
import { auditJourneyEvidence, auditJourneyT0Snapshot, isJourneyCycle, type JourneyCycle } from './closedLoopJourney.ts';
import { listMeasurementPoints, measurementDeclarationDocId,
  parseStoredMeasurementDeclaration, type StoredMeasurementDeclaration } from './journeyMeasurementDeclarations.ts';

export const MAX_MEASUREMENT_WINDOW_CYCLES = 8;
export const MAX_MEASUREMENT_WINDOW_DOCS = 96;
export type MeasurementSnapshotDocument = {id:string; data:unknown};
export type MeasurementSnapshotState = 'NO_WINDOW' | 'COMPLETE_UNVERIFIED' |
  'PARTIAL_UNVERIFIED' | 'LEGACY_READ_ONLY' | 'BLOCKED';
export type MeasurementSnapshotAudit = {
  state:MeasurementSnapshotState;
  rows:StoredMeasurementDeclaration[];
  expectedCount:number;
  storedCount:number;
  missingCount:number;
  legacyCycleIds:string[];
  /** Short code, not a data dump: safe for UI and test reports. */
  reason:'NONE'|'INVALID_WINDOW'|'ROW_LIMIT'|'INVALID_DOCUMENT'|'DUPLICATE_POINT'|'UNSUPPORTED_CYCLE';
};
const make=(state:MeasurementSnapshotState,reason:MeasurementSnapshotAudit['reason']='NONE'):MeasurementSnapshotAudit=>({
  state,rows:[],expectedCount:0,storedCount:0,missingCount:0,legacyCycleIds:[],reason,
});

/** Never use a truncated result as complete. Legacy cycles stay read-only.
 * Invalid or foreign documents invalidate the entire loaded window, never only one row.
 */
export function auditMeasurementSnapshot(uid:string,cycles:JourneyCycle[],docs:MeasurementSnapshotDocument[]):MeasurementSnapshotAudit {
  const blocked=(reason:MeasurementSnapshotAudit['reason'])=>make('BLOCKED',reason);
  if(!uid || uid.length>128 || !Array.isArray(cycles) || !Array.isArray(docs) ||
     cycles.length>MAX_MEASUREMENT_WINDOW_CYCLES || docs.length>MAX_MEASUREMENT_WINDOW_DOCS ||
     cycles.some(c=>!c || typeof c.id!=='string' || !/^[\w-]{8,100}$/.test(c.id)) ||
     new Set(cycles.map(c=>c.id)).size!==cycles.length) {
    return blocked(docs?.length>MAX_MEASUREMENT_WINDOW_DOCS?'ROW_LIMIT':'INVALID_WINDOW');
  }
  if(cycles.length===0) return docs.length===0?make('NO_WINDOW'):blocked('INVALID_DOCUMENT');
  const result=make('PARTIAL_UNVERIFIED');
  const expectedIds=new Set<string>();
  for(const cycle of cycles){
    if(!isJourneyCycle(cycle) || ('userId' in cycle && (cycle as JourneyCycle & {userId?:unknown}).userId!==uid))
      return blocked('UNSUPPORTED_CYCLE');
    const t0=auditJourneyT0Snapshot(cycle);
    const evidence=cycle.status==='REVIEWED'?auditJourneyEvidence(cycle):'NOT_REVIEWED';
    if(t0==='LEGACY_NO_T0' || evidence==='LEGACY_NO_EVIDENCE') {
      result.legacyCycleIds.push(cycle.id);
      continue;
    }
    if(t0!=='FROZEN_CONSISTENT' || (cycle.status==='REVIEWED' && evidence!=='CONSISTENT'))
      return blocked('UNSUPPORTED_CYCLE');
    const points=listMeasurementPoints(cycle);
    if(!points.length) return blocked('UNSUPPORTED_CYCLE');
    for(const point of points){
      const id=measurementDeclarationDocId(point);
      if(expectedIds.has(id))return blocked('DUPLICATE_POINT');
      expectedIds.add(id);
    }
  }
  const seen=new Set<string>();
  for(const d of docs){
    if(!d || typeof d.id!=='string' || !expectedIds.has(d.id))return blocked('INVALID_DOCUMENT');
    if(seen.has(d.id))return blocked('DUPLICATE_POINT');
    seen.add(d.id);
    const parsed=parseStoredMeasurementDeclaration(d.data,d.id,cycles,uid);
    if(!parsed)return blocked('INVALID_DOCUMENT');
    result.rows.push(parsed);
  }
  result.rows.sort((a,b)=>measurementDeclarationDocId(a).localeCompare(measurementDeclarationDocId(b)));
  result.expectedCount=expectedIds.size;
  result.storedCount=seen.size;
  result.missingCount=result.expectedCount-result.storedCount;
  result.legacyCycleIds.sort();
  result.state=result.legacyCycleIds.length?'LEGACY_READ_ONLY':result.missingCount?'PARTIAL_UNVERIFIED':'COMPLETE_UNVERIFIED';
  return result;
}
