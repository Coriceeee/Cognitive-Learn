import type { OrionSubjectScore } from './orionStrategyEngine.ts';
export const ALLOCATION_VERSION = 'orion-gap-diminishing-v1';
export type AllocationSubject = Pick<OrionSubjectScore,'subject'|'label'|'currentScore'|'targetScore'>;
export type AllocationRow = AllocationSubject & { gap:number; hours:number; maintenanceHours:number; extraHours:number };
/** Discrete separable concave utility: gap × log(1 + extra half-hour blocks).
 * Greedy maximum marginal utility is exact for this objective, not an outcome model.
 * No extrapolation, no implied score gain, no hidden subject weight. */
export function allocateStudyTime(subjects:readonly AllocationSubject[], budget:number, maintenance:number) {
 const fail=(reason:string)=>({version:ALLOCATION_VERSION,status:'INVALID' as const,reason,rows:[] as AllocationRow[],usedHours:null,unusedHours:null});
 const validTime=(x:number)=>Number.isFinite(x)&&x>=0&&x<=168&&Number.isInteger(x*2);
 if(!validTime(budget)||!validTime(maintenance))return fail('Thời lượng phải từ 0 đến 168 giờ, theo bước 0,5 giờ.');
 if(!subjects.length||subjects.length>30)return fail('Cần từ 1 đến 30 môn có điểm hiện tại và mục tiêu.');
 const ids=new Set<string>();
 for(const s of subjects){if(!s.subject||!s.label||ids.has(s.subject)||![s.currentScore,s.targetScore].every(v=>Number.isFinite(v)&&v>=0&&v<=10))return fail('Dữ liệu môn không hợp lệ hoặc bị trùng.');ids.add(s.subject);}
 if(maintenance*subjects.length>budget)return fail('Thời lượng duy trì tối thiểu vượt ngân sách giờ học.');
 const rows=subjects.map(s=>({...s,gap:Math.max(0,s.targetScore-s.currentScore),hours:maintenance,maintenanceHours:maintenance,extraHours:0})).sort((a,b)=>a.subject<b.subject?-1:a.subject>b.subject?1:0);
 let remaining=(budget-maintenance*rows.length)*2;
 while(remaining>0){
  let best:AllocationRow|undefined;let bestMarginal=0;
  for(const r of rows){const blocks=r.extraHours*2;const marginal=r.gap*Math.log1p(1/(blocks+1));if(marginal>bestMarginal){bestMarginal=marginal;best=r;}}
  if(!best)break;
  best.extraHours+=.5;best.hours+=.5;remaining--;
 }
 return {version:ALLOCATION_VERSION,status:'READY' as const,reason:null,rows,usedHours:budget-remaining/2,unusedHours:remaining/2};
}
