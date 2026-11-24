/** Session-only transfer of a reproducible mock exam scenario, never official marks. */
import { projectExamScore, EXAM_PROJECTION_VERSION } from './examProjection.ts';
import { parseSubjectScore } from './scoreConversionEngine.ts';
import type { SubjectCode } from './admissionTypes.ts';
export const EXAM_SUBJECT_LABELS: Readonly<Record<SubjectCode,string>> = Object.freeze({math:'Toán',literature:'Văn',english:'Anh',physics:'Lý',chemistry:'Hóa',biology:'Sinh',history:'Sử',geography:'Địa',civicEducation:'GDKT & Pháp luật',informatics:'Tin học',technology:'Công nghệ'});
export type ExamInputs = Partial<Record<SubjectCode,unknown>>;
export type ExamProjectionSnapshot = { version: typeof EXAM_PROJECTION_VERSION; createdAt:number; scores:Partial<Record<SubjectCode,string>>; observations:Partial<Record<SubjectCode,{previous:number;latest:number}>> };
export function buildExamProjectionSnapshot(previous:ExamInputs,latest:ExamInputs,now=Date.now()):ExamProjectionSnapshot|null {
  if (!Number.isFinite(now)) return null;
  const scores:ExamProjectionSnapshot['scores']={}, observations:ExamProjectionSnapshot['observations']={};
  for(const key of Object.keys(EXAM_SUBJECT_LABELS) as SubjectCode[]) {
    const raw=[previous[key],latest[key]];
    if(raw.some(v=>v!==undefined&&v!==null&&!(typeof v==='string'&&!v.trim())&&parseSubjectScore(v)===undefined)) return null;
    const a=parseSubjectScore(raw[0]),b=parseSubjectScore(raw[1]);
    if(a===undefined||b===undefined) continue;
    const projected=projectExamScore(a,b);
    if(projected===undefined) continue;
    scores[key]=projected.toFixed(2); observations[key]={previous:a,latest:b};
  }
  return Object.keys(scores).length ? {version:EXAM_PROJECTION_VERSION,createdAt:now,scores,observations} : null;
}
let pending:{uid:string;snapshot:ExamProjectionSnapshot}|null=null;
const TTL=5*60_000;
export function clearExamProjection():void { pending=null; }
export function stageExamProjection(uid:string,previous:ExamInputs,latest:ExamInputs,now=Date.now()):boolean {
  clearExamProjection();
  const snapshot=buildExamProjectionSnapshot(previous,latest,now);
  if(!uid||!snapshot)return false;
  pending={uid,snapshot};return true;
}
export function readExamProjection(uid:string,now=Date.now()):ExamProjectionSnapshot|null {
  if(!pending)return null;
  if(!uid||pending.uid!==uid||!Number.isFinite(now)||now<pending.snapshot.createdAt||now-pending.snapshot.createdAt>=TTL){clearExamProjection();return null;}
  return { ...pending.snapshot,scores:{...pending.snapshot.scores},observations:Object.fromEntries(Object.entries(pending.snapshot.observations).map(([key,value])=>[key,{...value}])) };
}
export function consumeExamProjection(uid:string,now=Date.now()):ExamProjectionSnapshot|null {
  const snapshot=readExamProjection(uid,now);clearExamProjection();return snapshot;
}
