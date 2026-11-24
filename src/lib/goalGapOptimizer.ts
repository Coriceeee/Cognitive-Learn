/** Equal marginal allocation in hundredths, with 0–10 bounds. Arithmetic only. */
export const GOAL_GAP_VERSION='cla-goal-gap-v1';
export type GapSubject={subject:string;score:number};
export type GapResult={status:'READY'|'ALREADY_MET'|'INVALID'|'INFEASIBLE';currentTotal:number|null;gap:number|null;targets:Record<string,number>;version:string};
export function optimizeGoalGap(subjects:readonly GapSubject[],target:number):GapResult {
  const invalid:GapResult={status:'INVALID',currentTotal:null,gap:null,targets:{},version:GOAL_GAP_VERSION};
  if(subjects.length!==3||new Set(subjects.map(s=>s.subject)).size!==3||subjects.some(s=>!s.subject.trim()||!Number.isFinite(s.score)||s.score<0||s.score>10)||!Number.isFinite(target)||target<0)return invalid;
  // Round up baseline only at display precision (actual targets never below original scores).
  const points=subjects.map(s=>({subject:s.subject,base:Math.ceil(s.score*100-1e-9),score:s.score}));
  const total=subjects.reduce((sum,s)=>sum+s.score,0);
  const gap=Math.max(0,Math.round((target-total)*10000)/10000);
  const result={currentTotal:Math.round(total*10000)/10000,gap,version:GOAL_GAP_VERSION};
  if(target>30)return {...result,status:'INFEASIBLE',targets:{}};
  if(target-total<=1e-9)return {...result,status:'ALREADY_MET',targets:Object.fromEntries(subjects.map(s=>[s.subject,s.score]))};
  const targets=points.map(s=>s.base); let remaining=Math.max(0,Math.ceil(target*100-1e-9)-targets.reduce((a,b)=>a+b,0));
  while(remaining>0){let best=-1;for(let i=0;i<targets.length;i++){if(targets[i]>=1000)continue;if(best===-1||targets[i]-points[i].base<targets[best]-points[best].base)best=i;}if(best===-1)return {...result,status:'INFEASIBLE',targets:{}};targets[best]++;remaining--;}
  return {...result,status:'READY',targets:Object.fromEntries(points.map((s,i)=>[s.subject,targets[i]/100]))};
}
