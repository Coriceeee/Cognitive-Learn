/** CP34: conservative, advisory-only workload policy. Never predicts learning gains.
 * The caller must supply the current owner-bound server view. Replay verifies
 * calculation consistency, not the authenticity of a Firestore document. */
import { isJourneyCycle, validJourneyDecisionTrace, type JourneyCycle, type JourneyDecisionTrace, type JourneyScenarioId } from './closedLoopJourney.ts';
import { compareJourneyT0T1 } from './journeyT0T1Comparison.ts';
import { auditJourneyHistory } from './journeyMultiCycleTrend.ts';
export const ADAPTIVE_POLICY_VERSION='cla-adaptive-next-cycle-v1';
const ids: readonly JourneyScenarioId[]=['balanced','focused','breakthrough'];
export type AdaptiveOption={id:string;weeklyHours:number};
export type AdaptiveContext={cycles:unknown;owner:string|null;serverConfirmed:boolean;options:readonly AdaptiveOption[]};
const limits=['Self-reported actions are not verified adherence.','60% completion and 75% planned-hours thresholds are experimental engineering rules.','Score changes are descriptive; they do not drive this workload policy.','The learner may reject any suggestion; selection is not intervention assignment.','Replay is internal consistency only; no predicted or causal effect.'];
export type AdaptiveAdvice={schema:'cla.adaptive.advice.v1';policyVersion:typeof ADAPTIVE_POLICY_VERSION;decision:'ABSTAIN'|'MAINTAIN'|'REDUCE'|'MANUAL_REVIEW';reason:string;sourceCycleId:string|null;inputSnapshotId:string|null;reviewEvidenceId:string|null;checkInRefs:string[];factors:{checkInCount:number;completionPercent:number|null;actualMeanHours:number|null;previousWeeklyHours:number|null;reportedScoreDelta:number|null};options:Array<{id:JourneyScenarioId;weeklyHours:number;eligible:boolean}>;recommendedId:JourneyScenarioId|null;recommendedHours:number|null;probability:null;causalEffect:null;assignment:'NOT_PERFORMED';limitations:string[]};
const round=(x:number)=>Math.round(x*100)/100;
export function evaluateAdaptiveNextCycle(context:AdaptiveContext):AdaptiveAdvice {
 const r:AdaptiveAdvice={schema:'cla.adaptive.advice.v1',policyVersion:ADAPTIVE_POLICY_VERSION,decision:'ABSTAIN',reason:'SERVER_VIEW_REQUIRED',sourceCycleId:null,inputSnapshotId:null,reviewEvidenceId:null,checkInRefs:[],factors:{checkInCount:0,completionPercent:null,actualMeanHours:null,previousWeeklyHours:null,reportedScoreDelta:null},options:[],recommendedId:null,recommendedHours:null,probability:null,causalEffect:null,assignment:'NOT_PERFORMED',limitations:[...limits]};
 if(!context.serverConfirmed || !context.owner)return r;
 const history=auditJourneyHistory(context.cycles,context.owner);
 if(history.status==='INVALID'){r.reason='INVALID_HISTORY';return r;}
 if(!Array.isArray(context.cycles)||!context.cycles.length){r.reason='NO_HISTORY';return r;}
 const lastId=history.cycleIdsChronological[history.cycleIdsChronological.length-1];
 const latest=context.cycles.find(c=>isJourneyCycle(c)&&c.id===lastId);
 if(!isJourneyCycle(latest)||latest.status!=='REVIEWED'){r.reason='ACTIVE_OR_UNREVIEWED';return r;}
 const comparison=compareJourneyT0T1(latest);
 if(comparison.status!=='DESCRIPTIVE_ONLY'||!latest.evidenceRecord){r.reason='UNTRACEABLE_REVIEW';return r;}
 r.sourceCycleId=latest.id;r.inputSnapshotId=latest.evidenceRecord.inputSnapshotId;r.reviewEvidenceId=latest.evidenceRecord.resultId;
 r.checkInRefs=latest.checkIns.map(c=>`self-report-checkin:${c.id}`);
 const total=latest.checkIns.reduce((a,c)=>a+c.actualHours,0), n=latest.checkIns.length;
 const done=latest.checkIns.reduce((a,c)=>a+c.completedActions,0), planned=latest.checkIns.reduce((a,c)=>a+c.plannedActions,0);
 const prev=latest.plannedWeeklyHours;
 r.factors={checkInCount:n,completionPercent:comparison.summary.reportedCompletionPercent,actualMeanHours:round(total/n),previousWeeklyHours:prev,reportedScoreDelta:comparison.summary.observedAverageDelta};
 if(n<2){r.reason='NEED_TWO_REPORTED_WEEKS';return r;}
 if(comparison.summary.missingT1SubjectCount>0){r.reason='PARTIAL_REASSESSMENT';return r;}
 if(!Array.isArray(context.options)||context.options.length<1||context.options.length>3||new Set(context.options.map(x=>x?.id)).size!==context.options.length||!context.options.every(x=>x&&ids.includes(x.id as JourneyScenarioId)&&Number.isInteger(x.weeklyHours)&&x.weeklyHours>=1&&x.weeklyHours<=80)) {r.reason='OPTIONS_UNAVAILABLE_OR_INVALID';return r;}
 // Use exact ratios, not rounded display metrics; no upward workload recommendation.
 const lowCompletion=done/planned<0.6, lowHours=total/n<prev*0.75;
 const lower=lowCompletion||lowHours;
 const cap=lower?Math.min(prev-1,Math.floor(total/n)):prev;
 r.options=context.options.map(x=>({id:x.id as JourneyScenarioId,weeklyHours:x.weeklyHours,eligible:x.weeklyHours<=cap}));
 const eligible=r.options.filter(x=>x.eligible).sort((a,b)=>b.weeklyHours-a.weeklyHours||Number(b.id===latest.scenarioId)-Number(a.id===latest.scenarioId)||ids.indexOf(a.id)-ids.indexOf(b.id));
 if(!eligible.length){r.decision='MANUAL_REVIEW';r.reason='NO_OPTION_WITHIN_WORKLOAD_CAP';return r;}
 const chosen=eligible[0];r.recommendedId=chosen.id;r.recommendedHours=chosen.weeklyHours;
 r.decision=chosen.weeklyHours<prev?'REDUCE':'MAINTAIN';
 r.reason=lowCompletion?'COMPLETION_BELOW_60':lowHours?'HOURS_BELOW_75_OF_PLAN':chosen.weeklyHours<prev?'CLOSEST_NON_INCREASING_OPTION':'MAINTAIN_WORKLOAD';
 return r;
}
/** Only verify against current source, never trust an embedded source supplied with the advice. */
export function replayAdaptiveAdvice(context:AdaptiveContext, advice:unknown):boolean {
 return JSON.stringify(evaluateAdaptiveNextCycle(context))===JSON.stringify(advice);
}

/** Freeze only an explicit selection; an ordinary manual plan is not a rejection. */
export function freezeAdaptiveDecision(context:AdaptiveContext, next:JourneyCycle, disposition:JourneyDecisionTrace['disposition']):JourneyDecisionTrace {
 const a=evaluateAdaptiveNextCycle(context);
 if(!a.recommendedId || a.recommendedHours===null || !a.sourceCycleId || !a.inputSnapshotId || !a.reviewEvidenceId) throw new Error('Gợi ý thích ứng không còn hợp lệ.');
 const source=Array.isArray(context.cycles)?context.cycles.find(c=>isJourneyCycle(c)&&c.id===a.sourceCycleId):null;
 if(!isJourneyCycle(source)||!source.reassessment||!Number.isFinite(Date.parse(next.startedAt))||Date.parse(next.startedAt)<=Date.parse(source.reassessment.recordedAt)) throw new Error('Thời điểm chu kỳ không hợp lệ.');
 const optionHours:JourneyDecisionTrace['optionHours']={balanced:null,focused:null,breakthrough:null};
 for(const option of a.options)optionHours[option.id]=option.weeklyHours;
 const trace:JourneyDecisionTrace={schemaVersion:1,policyVersion:ADAPTIVE_POLICY_VERSION,sourceCycleId:a.sourceCycleId,inputSnapshotId:a.inputSnapshotId,reviewEvidenceId:a.reviewEvidenceId,disposition,recommendedId:a.recommendedId,recommendedHours:a.recommendedHours,optionHours};
 if(!validJourneyDecisionTrace(trace,next))throw new Error('Lựa chọn không khớp gợi ý đã xác nhận.');
 return trace;
}
/** Recompute from a separately retrieved owner-bound source, not embedded evidence. */
export function auditAdaptiveDecisionTrace(next:JourneyCycle,source:unknown,owner:string,serverConfirmed:boolean):'NO_TRACE'|'SOURCE_REQUIRED'|'CONSISTENT'|'MISMATCH' {
 const t=next.decisionTrace;if(!t)return 'NO_TRACE';
 if(!serverConfirmed||source===undefined||source===null)return 'SOURCE_REQUIRED';
 if(!validJourneyDecisionTrace(t,next)||!isJourneyCycle(source)||source.userId!==owner||next.userId!==owner||source.id!==t.sourceCycleId)return 'MISMATCH';
 try{
  const options=ids.flatMap(id=>t.optionHours[id]===null?[]:[{id,weeklyHours:t.optionHours[id]!}]);
  const actual=freezeAdaptiveDecision({cycles:[source],owner,serverConfirmed,options},next,t.disposition);
  return actual.sourceCycleId===t.sourceCycleId&&actual.inputSnapshotId===t.inputSnapshotId&&actual.reviewEvidenceId===t.reviewEvidenceId&&actual.recommendedId===t.recommendedId&&actual.recommendedHours===t.recommendedHours&&actual.policyVersion===t.policyVersion&&ids.every(id=>actual.optionHours[id]===t.optionHours[id])?'CONSISTENT':'MISMATCH';
 }catch{return 'MISMATCH';}
}

/** The existing mutex is released in the same commit as the most recent review.
 * Check nanoseconds as well as seconds; no client clock, no new lock schema.
 * Historical replay intentionally does NOT require the current mutex. */
export function sameReviewCommit(state:unknown, prior:unknown):boolean {
 const stamp=(v:unknown):{seconds:number;nanoseconds:number}|null=>{
  if(!v||typeof v!=="object")return null;
  const x=v as {seconds?:unknown;nanoseconds?:unknown};
  if(typeof x.seconds!=="number"||!Number.isSafeInteger(x.seconds)||typeof x.nanoseconds!=="number"||!Number.isInteger(x.nanoseconds)||x.nanoseconds<0||x.nanoseconds>=1e9)return null;
  return {seconds:x.seconds,nanoseconds:x.nanoseconds};
 };
 const a=stamp(state),b=stamp(prior);
 return !!a&&!!b&&a.seconds===b.seconds&&a.nanoseconds===b.nanoseconds;
}
