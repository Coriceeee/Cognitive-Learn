/** P4: explicitly carry reviewed, self-reported T1 into the next Orion draft.
 * No claim of measurement equivalence, learning gain, or causal effect. */
import { isJourneyCycle, type JourneySubject } from './closedLoopJourney.ts';
import { auditJourneyHistory } from './journeyMultiCycleTrend.ts';
import { compareJourneyT0T1 } from './journeyT0T1Comparison.ts';
export const CONTINUITY_VERSION = 'cla-decision-continuity-v1' as const;
export type ContinuityPlan = {targetMajor:string; subjects:readonly JourneySubject[]};
export type ContinuityResult = {status:'BLOCKED'|'READY_TO_COPY'|'ALIGNED'; reason:string; cycleId:string|null; evidenceId:string|null; recordedAt:string|null; rows:{key:string;label:string;current:number;observed:number;target:number}[]; version:typeof CONTINUITY_VERSION};
const score=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10;
export function evaluateCycleContinuity(input:{owner:string;serverConfirmed:boolean;cycles:unknown;plan:ContinuityPlan|null}):ContinuityResult {
 const blocked=(reason:string):ContinuityResult=>({status:'BLOCKED',reason,cycleId:null,evidenceId:null,recordedAt:null,rows:[],version:CONTINUITY_VERSION});
 if(!input.owner||!input.serverConfirmed)return blocked('SERVER_REQUIRED');
 const history=auditJourneyHistory(input.cycles,input.owner);
 if(history.status==='INVALID')return blocked('INVALID_HISTORY');
 if(!Array.isArray(input.cycles)||!input.cycles.length)return blocked('NO_HISTORY');
 if(input.cycles.some(c=>isJourneyCycle(c)&&c.status==='ACTIVE'))return blocked('ACTIVE_CYCLE');
 const latest=input.cycles.find(c=>isJourneyCycle(c)&&c.id===history.cycleIdsChronological[history.cycleIdsChronological.length-1]);
 if(!isJourneyCycle(latest)||latest.status!=='REVIEWED')return blocked('REVIEW_REQUIRED');
 const comparison=compareJourneyT0T1(latest);
 if(comparison.status!=='DESCRIPTIVE_ONLY'||!latest.evidenceRecord||!latest.reassessment)return blocked('UNTRACEABLE_REVIEW');
 if(comparison.summary.missingT1SubjectCount!==0)return blocked('PARTIAL_REASSESSMENT');
 const plan=input.plan;
 if(!plan||typeof plan.targetMajor!=='string'||!Array.isArray(plan.subjects)||!plan.subjects.length||plan.subjects.length>6||new Set(plan.subjects.map(s=>s?.key)).size!==plan.subjects.length||!plan.subjects.every(s=>s&&typeof s.key==='string'&&score(s.baseline)&&score(s.target)))return blocked('PLAN_REQUIRED');
 if(plan.targetMajor.trim()!==latest.targetMajor.trim())return blocked('GOAL_CHANGED');
 if(plan.subjects.length!==latest.subjects.length||!plan.subjects.every(s=>latest.subjects.some(p=>p.key===s.key)))return blocked('SUBJECTS_CHANGED');
 if(!plan.subjects.every(s=>latest.subjects.some(p=>p.key===s.key&&p.target===s.target)))return blocked('TARGETS_CHANGED');
 const rows=plan.subjects.map(s=>({key:s.key,label:s.label,current:s.baseline,observed:comparison.measures.find(m=>m.subjectKey===s.key)!.t1Score!,target:s.target}));
 const aligned=rows.every(r=>r.current===r.observed);
 return {status:aligned?'ALIGNED':'READY_TO_COPY',reason:aligned?'BASELINES_MATCH':'EXPLICIT_COPY_REQUIRED',cycleId:latest.id,evidenceId:latest.evidenceRecord.resultId,recordedAt:latest.reassessment.recordedAt,rows,version:CONTINUITY_VERSION};
}
/** Bind explicit confirmation to the entire current plan and review, not just a scenario id. */
export function continuitySelectionKey(owner:string,plan:ContinuityPlan&{weeksLeft:number;scenarios:readonly {id:string;title:string;weeklyHours:number}[]},review:ContinuityResult):string {
 return JSON.stringify([owner,plan.targetMajor,plan.weeksLeft,plan.subjects,plan.scenarios,review]);
}
