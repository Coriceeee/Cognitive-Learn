/** Annual VND arithmetic; all amounts supplied explicitly, no exchange-rate/award assumption. */
export const BUDGET_VERSION='cla-annual-budget-v1';
export type AnnualBudgetInput={budget:number;tuition:number;living:number;other:number;confirmedAid:number;possibleAid:number;tuitionCap:number|null;stressPercent:number};
const money=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=1e12;
export function compareAnnualBudget(i:AnnualBudgetInput){
 if(!i||![i.budget,i.tuition,i.living,i.other,i.confirmedAid,i.possibleAid].every(money)||(i.tuitionCap!==null&&!money(i.tuitionCap))||!Number.isInteger(i.stressPercent)||i.stressPercent<0||i.stressPercent>100)return null;
 const total=i.tuition+i.living+i.other;
 if(i.confirmedAid+i.possibleAid>total)return null;
 const stressTotal=total+Math.ceil((i.living+i.other)*i.stressPercent/100);
 const rows=[{id:'confirmed',net:total-i.confirmedAid},{id:'conditional',net:total-i.confirmedAid-i.possibleAid},{id:'stress',net:stressTotal-i.confirmedAid}].map(r=>({...r,remaining:i.budget-r.net,withinBudget:r.net<=i.budget}));
 return {version:BUDGET_VERSION,total,tuitionCapStatus:i.tuitionCap===null?'UNKNOWN':i.tuition<=i.tuitionCap?'WITHIN':'EXCEEDS',rows};
}
