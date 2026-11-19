import {evaluateScenarioChoices} from './scenarioDecision.ts';
import type {OrionScenario,OrionRiskLevel} from './orionStrategyEngine.ts';
export const ROBUST_POLICY_VERSION='cla-orion-minimax-regret-v1';
export type PreferenceVector=readonly [number,number,number];
const EPS=1e-10;
const dot=(a:PreferenceVector,b:PreferenceVector)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export type RobustRow={id:string;title:string;nominalUtility:number;minUtility:number;maxUtility:number;worstRegret:number;criteria:PreferenceVector;worstVertex:number;dominated:boolean};
/** Exact worst-case regret for a convex set of preference weights, NOT stochastic uncertainty.
 * Criteria: gain / 2.4, feasibility / 100, 1 - hours / 18 (fixed anchors of the existing Orion v1 scenario family).
 * A radius r permits w=(1-r)w0+r*v for any v on the 3-dimensional probability simplex.
 * Max of linear pairwise regrets attains its maximum at a simplex vertex. No learned outcomes or probabilities. */
export function analyzeRobustScenarioPolicy(scenarios:readonly OrionScenario[],maxHours:number|null,maxRisk:OrionRiskLevel|null,weights:PreferenceVector,radius:number){
 const base={version:ROBUST_POLICY_VERSION,probability:null,causalEffect:null,assignment:'NOT_PERFORMED' as const};
 const fail=(reason:string)=>({...base,status:'BLOCKED' as const,reason,rows:[] as RobustRow[],nominalBest:[] as string[],minimaxBest:[] as string[],vertices:[] as PreferenceVector[],normalizedWeights:null as PreferenceVector|null});
 if(!Array.isArray(weights)||weights.length!==3||!weights.every(w=>Number.isFinite(w)&&w>=0&&w<=100)||!Number.isFinite(radius)||radius<0||radius>1)return fail('INVALID_PREFERENCES');
 const sum=weights.reduce((a,b)=>a+b,0);if(sum<=0)return fail('MISSING_PREFERENCES');
 if(!Array.isArray(scenarios)||!scenarios.length||scenarios.length>30||scenarios.some(s=>!s||typeof s.id!=='string'||!s.id||typeof s.title!=='string'||!s.title||!Number.isFinite(s.expectedGain)||s.expectedGain<0||s.expectedGain>2.4||!Number.isFinite(s.weeklyHours)||s.weeklyHours<0||s.weeklyHours>18))return fail('UNSUPPORTED_SCENARIO_SCALE');
 const comparison=evaluateScenarioChoices(scenarios,maxHours,maxRisk);
 if(!comparison.configValid||comparison.rows.some(x=>x.reasons.includes('Dữ liệu phương án không hợp lệ')))return fail('INVALID_SCENARIOS_OR_CONSTRAINTS');
 const eligible=comparison.rows.filter(x=>!x.reasons.length).map(x=>x.scenario);
 if(!eligible.length)return fail('NO_FEASIBLE_SCENARIO');
 const normalizedWeights:PreferenceVector=[weights[0]/sum,weights[1]/sum,weights[2]/sum];
 const vertices:PreferenceVector[]=[0,1,2].map(i=>[(1-radius)*normalizedWeights[0]+(i===0?radius:0),(1-radius)*normalizedWeights[1]+(i===1?radius:0),(1-radius)*normalizedWeights[2]+(i===2?radius:0)]);
 const candidates=eligible.map(s=>({id:s.id,title:s.title,criteria:[s.expectedGain/2.4,s.feasibility/100,1-s.weeklyHours/18] as PreferenceVector}));
 const bestAtVertex=vertices.map(w=>Math.max(...candidates.map(c=>dot(w,c.criteria))));
 const rows:RobustRow[]=candidates.map(c=>{
  const values=vertices.map(w=>dot(w,c.criteria));const regrets=values.map((v,i)=>Math.max(0,bestAtVertex[i]-v));
  const worstRegret=Math.max(...regrets);
  return {...c,nominalUtility:dot(normalizedWeights,c.criteria),minUtility:Math.min(...values),maxUtility:Math.max(...values),worstRegret,worstVertex:regrets.findIndex(r=>Math.abs(r-worstRegret)<EPS),dominated:!comparison.frontier.includes(c.id)};
 });
 // Pareto dominance is an independent tie-break guard: no dominated recommendation.
 const frontier=rows.filter(r=>!r.dominated);const maxNominal=Math.max(...frontier.map(r=>r.nominalUtility)),minRegret=Math.min(...frontier.map(r=>r.worstRegret));
 return {...base,status:'READY' as const,reason:null,rows,nominalBest:frontier.filter(r=>maxNominal-r.nominalUtility<EPS).map(r=>r.id),minimaxBest:frontier.filter(r=>r.worstRegret-minRegret<EPS).map(r=>r.id),vertices,normalizedWeights};
}
