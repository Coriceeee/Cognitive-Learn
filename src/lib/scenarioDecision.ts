import type { OrionScenario, OrionRiskLevel } from './orionStrategyEngine.ts';
export const SCENARIO_DECISION_VERSION='orion-pareto-v1';
const riskOrder: Record<OrionRiskLevel,number>={LOW:0,MEDIUM:1,HIGH:2};
function valid(s:OrionScenario){return !!s.id&&Number.isFinite(s.expectedGain)&&s.expectedGain>=0&&Number.isFinite(s.feasibility)&&s.feasibility>=0&&s.feasibility<=100&&Number.isFinite(s.weeklyHours)&&s.weeklyHours>=0&&Object.prototype.hasOwnProperty.call(riskOrder,s.riskLevel);}
/** Maximize heuristic gain and feasibility, minimize workload. Equal options do not dominate. */
export function dominatesScenario(a:OrionScenario,b:OrionScenario){
 return a.expectedGain>=b.expectedGain&&a.feasibility>=b.feasibility&&a.weeklyHours<=b.weeklyHours&&(a.expectedGain>b.expectedGain||a.feasibility>b.feasibility||a.weeklyHours<b.weeklyHours);
}
export function evaluateScenarioChoices(scenarios:readonly OrionScenario[],maxHours:number|null,maxRisk:OrionRiskLevel|null){
 const configValid=(maxHours===null||(Number.isFinite(maxHours)&&maxHours>=0&&maxHours<=168))&&(maxRisk===null||Object.prototype.hasOwnProperty.call(riskOrder,maxRisk));
 const counts=new Map<string,number>(); for(const s of scenarios)counts.set(s.id,(counts.get(s.id)??0)+1);
 const rows=scenarios.map(s=>{
  const reasons:string[]=[];
  if(!configValid)reasons.push('Ràng buộc không hợp lệ');
  if(!valid(s)||counts.get(s.id)!==1)reasons.push('Dữ liệu phương án không hợp lệ');
  if(configValid&&valid(s)){if(maxHours!==null&&s.weeklyHours>maxHours)reasons.push('Vượt thời gian bạn có'); if(maxRisk!==null&&riskOrder[s.riskLevel]>riskOrder[maxRisk])reasons.push('Vượt mức áp lực bạn chọn');}
  return {scenario:s,reasons};
 });
 const eligible=rows.filter(r=>r.reasons.length===0).map(r=>r.scenario);
 return {version:SCENARIO_DECISION_VERSION,configValid,rows:rows.map(r=>({...r,dominatedBy:r.reasons.length?[]:eligible.filter(a=>a.id!==r.scenario.id&&dominatesScenario(a,r.scenario)).map(a=>a.id)})),frontier:eligible.filter(b=>!eligible.some(a=>a.id!==b.id&&dominatesScenario(a,b))).map(s=>s.id),probability:null};
}
