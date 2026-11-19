/** V4 CP41: conditional, read-only Bayesian feedback prototype, not a policy or a forecast. */
import { auditJourneyHistory } from './journeyMultiCycleTrend.ts';
import { compareJourneyT0T1 } from './journeyT0T1Comparison.ts';
import { isJourneyCycle } from './closedLoopJourney.ts';
export const BAYES_FEEDBACK_VERSION='cla-bayes-weekly-shadow-v1' as const;
type Posterior={prior:[number,number];alpha:number;beta:number;mean:number;credible95:[number,number]};
export type FeedbackShadow={version:typeof BAYES_FEEDBACK_VERSION;status:'BLOCKED'|'INSUFFICIENT'|'SHADOW_ONLY';reason:string;sourceCycleId:string|null;reviewEvidenceId:string|null;weeks:number;met:number;refs:string[];posterior:Posterior[];policyEffect:null;prediction:null};
const DAY=86400000;
// Integer beta(a,b) CDF via the exact binomial tail identity; small n (<=12 weeks).
function cdf(x:number,a:number,b:number):number{
 if(x<=0)return 0;if(x>=1)return 1;
 const n=a+b-1;let sum=0,choose=1;
 for(let k=0;k<=n;k++){
   if(k>=a)sum+=choose*Math.pow(x,k)*Math.pow(1-x,n-k);
   if(k<n)choose*= (n-k)/(k+1);
 }
 return Math.min(1,Math.max(0,sum));
}
function quantile(p:number,a:number,b:number):number{let lo=0,hi=1;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(cdf(m,a,b)<p)lo=m;else hi=m;}return (lo+hi)/2;}
export function evaluateFeedbackShadow(cycles:unknown,owner:string|null,serverConfirmed:boolean):FeedbackShadow {
 const r:FeedbackShadow={version:BAYES_FEEDBACK_VERSION,status:'BLOCKED',reason:'SERVER_VIEW_REQUIRED',sourceCycleId:null,reviewEvidenceId:null,weeks:0,met:0,refs:[],posterior:[],policyEffect:null,prediction:null};
 if(serverConfirmed!==true||!owner)return r;
 const h=auditJourneyHistory(cycles,owner);
 if(h.status==='INVALID'){r.reason='INVALID_HISTORY';return r;}
 if(!Array.isArray(cycles)||!cycles.length){r.status='INSUFFICIENT';r.reason='NO_CYCLE';return r;}
 const last=cycles.find(c=>isJourneyCycle(c)&&c.id===h.cycleIdsChronological[h.cycleIdsChronological.length-1]);
 if(!isJourneyCycle(last)||last.status!=='REVIEWED'||!last.evidenceRecord||compareJourneyT0T1(last).status!=='DESCRIPTIVE_ONLY'){r.reason='REVIEW_REQUIRED';return r;}
 r.sourceCycleId=last.id;r.reviewEvidenceId=last.evidenceRecord.resultId;
 const checks=[...last.checkIns].sort((a,b)=>a.week-b.week);
 // Count weeks, not tasks. Reject gaps and reports entered together/late; time is self-report, not verified adherence.
 if(checks.length<3){r.status='INSUFFICIENT';r.reason='NEED_THREE_WEEKS';return r;}
 for(let i=0;i<checks.length;i++){
   const c=checks[i];const elapsed=(Date.parse(c.recordedAt)-Date.parse(last.startedAt))/DAY;
   if(c.week!==i+1||elapsed<7*i||elapsed>=7*(i+1)){r.reason='NONCONTIGUOUS_OR_LATE_REPORT';return r;}
   if(i>0){const gap=(Date.parse(c.recordedAt)-Date.parse(checks[i-1].recordedAt))/DAY;if(gap<5||gap>9){r.reason='IRREGULAR_WEEKLY_REPORTS';return r;}}
 }
 r.weeks=checks.length;r.met=checks.filter(c=>5*c.completedActions>=3*c.plannedActions).length;r.refs=checks.map(c=>`self-report-checkin:${c.id}`);
 for(const prior of [[1,1],[2,2],[1,2]] as [number,number][]){const alpha=prior[0]+r.met,beta=prior[1]+r.weeks-r.met;r.posterior.push({prior,alpha,beta,mean:alpha/(alpha+beta),credible95:[quantile(.025,alpha,beta),quantile(.975,alpha,beta)]});}
 r.status='SHADOW_ONLY';r.reason='CONDITIONAL_IID_ASSUMPTION_UNVALIDATED';return r;
}
