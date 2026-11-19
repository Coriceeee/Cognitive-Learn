/** CP37: read-only student state from the existing server-confirmed Seed record.
 * No synthetic/default metrics, no PII in output beyond user-entered goal labels.
 * Coverage is completeness, not probability, confidence or psychometric validity.
 */
export const STATE_VERSION = 'cla-dynamic-student-v1' as const;
type Scope = 'student' | 'demo';
type Obj = Record<string, unknown>;
export const asRecord = (v: unknown): Obj | null => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Obj : null;
export const numberWithin = (v: unknown, max: number, integer = false): number | null => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max && (!integer || Number.isSafeInteger(v)) ? v : null;
export const strictUtc = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(Date.parse(v)).toISOString() === v;
export function serverTime(v: unknown): string | null {
  const t = asRecord(v);
  if (!t || typeof t.seconds !== 'number' || !Number.isSafeInteger(t.seconds) || typeof t.nanoseconds !== 'number' || !Number.isInteger(t.nanoseconds) || t.nanoseconds < 0 || t.nanoseconds >= 1e9) return null;
  const ms = t.seconds * 1000 + Math.floor(t.nanoseconds / 1e6);
  if (!Number.isFinite(ms) || Math.abs(ms)>8.64e15) return null;
  const date = new Date(ms).toISOString();
  return strictUtc(date) ? date : null;
}
const text = (v: unknown): string | null => typeof v === 'string' && v.trim() !== '' && v.trim() !== '--' && v.trim().length <= 240 ? v.trim() : null;
const codes = ['SCI','MAS','CSL'] as const;
export type DynamicStudentState = {
  version: typeof STATE_VERSION; scope: Scope; observedAt: string;
  sourceVersion: string; academic: {gpa10:number|null;gpa11:number|null;gpa12:number|null;overall:number|null};
  behavior:{hours:number|null;practice:number|null;completion:number|null;motivation:number|null};
  cognitive:Record<typeof codes[number],number|null>;
  goals:{major:string|null;university:string|null}; finance:{budget:number|null;maxTuition:number|null};
  observedFields:number; totalFields:15; limitations:string[];
};
export function buildDynamicStudentState(raw: unknown, uid: string, serverConfirmed: boolean): DynamicStudentState | null {
  const r = asRecord(raw);
  if (serverConfirmed !== true || !r || !uid || r.userId !== uid || r.schemaVersion !== 1 || (r.dataScope !== 'student' && r.dataScope !== 'demo')) return null;
  const observedAt = serverTime(r.updatedAt), stamp = asRecord(r.updatedAt);
  if (!observedAt || !stamp) return null;
  const g=asRecord(r.gpaSummary), b=asRecord(r.behavior), f=asRecord(r.finance), p=asRecord(r.profile), c=asRecord(r.cognitiveMeasurement);
  const academic = {gpa10:numberWithin(g?.grade10,10),gpa11:numberWithin(g?.grade11,10),gpa12:numberWithin(g?.grade12,10),overall:numberWithin(g?.overall,10)};
  const behavior = {hours:numberWithin(b?.studyHoursPerWeek,168),practice:numberWithin(b?.practiceTestsPerWeek,Number.MAX_SAFE_INTEGER,true),completion:numberWithin(b?.planCompletionRate,100),motivation:numberWithin(b?.motivationLevel,100)};
  const cognitive = {SCI:null,MAS:null,CSL:null} as DynamicStudentState['cognitive'];
  if (c?.mappingVersion === 'cla-cognitive-proxy-v2' && Array.isArray(c.dimensions) && Array.isArray(c.missingDimensions)) {
    for(const code of codes){
      const matches=c.dimensions.filter(d=>asRecord(d)?.code===code);
      const d=asRecord(matches[0]);
      const value=numberWithin(c[code],100);
      if(matches.length===1 && d?.available===true && !c.missingDimensions.includes(code) && value!==null && d.value===value) cognitive[code]=value;
    }
  }
  const goals={major:text(p?.targetMajor),university:text(p?.targetUniversity)};
  const finance={budget:numberWithin(f?.educationBudget,Number.MAX_SAFE_INTEGER),maxTuition:numberWithin(f?.maxTuition,Number.MAX_SAFE_INTEGER)};
  const fields=[...Object.values(academic),...Object.values(behavior),...Object.values(cognitive),...Object.values(goals),...Object.values(finance)];
  return {version:STATE_VERSION,scope:r.dataScope,observedAt,sourceVersion:`${stamp.seconds}:${stamp.nanoseconds}`,academic,behavior,cognitive,goals,finance,observedFields:fields.filter(v=>v!==null).length,totalFields:15,limitations:['Server read confirms storage, not accuracy of self-reports.','Completeness is not confidence. Cognitive scores are experimental proxies.','No additional storage, model training or external transmission.']};
}
