/** CP33 external aggregate gate; validates structure, not scientific truth. */
export const externalMlModels = ['last_G2','ridge_academic','ridge_plus_behavior','forest_academic','forest_plus_behavior'] as const;
type Model = typeof externalMlModels[number];
type Metrics = {mae:number;rmse:number;coverage:number;mean_interval_width:number;calibration_radius:number};
type Comparison = {mae_reduction:number;ci95_signature_bootstrap:[number,number]};
type Subject = {subject:'math'|'portuguese';rows:number;source_sha256:string;split_sha256:string;counts:{train:number;calibration:number;test:number};metrics:Record<Model,Metrics>;behavior_increment:Record<'ridge'|'forest',Comparison>};
export type ExternalMlEvidence = {schema_version:'cla.uci.ml-comparison.v1';status:'EXTERNAL_METHOD_FEASIBILITY_ONLY';dataset:string;revision:string;license:string;citation:string;nominal_coverage:number;code_sha256:string;subjects:Subject[];limitations:string[]};
function record(v:unknown):Record<string,unknown>|null {return v!==null && typeof v==='object' && !Array.isArray(v)?v as Record<string,unknown>:null;}
function finite(v:unknown,min:number,max:number):v is number {return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
function sha(v:unknown):boolean{return typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);}
function validMetrics(value:unknown):boolean{const m=record(value);return !!m&&finite(m.mae,0,20)&&finite(m.rmse,0,20)&&m.rmse+1e-9>=m.mae&&finite(m.coverage,0,1)&&finite(m.mean_interval_width,0,20)&&finite(m.calibration_radius,0,20);}
function validComparison(value:unknown):boolean{const c=record(value);if(!c||!finite(c.mae_reduction,-20,20))return false;const ci=c.ci95_signature_bootstrap;return Array.isArray(ci)&&ci.length===2&&finite(ci[0],-20,20)&&finite(ci[1],-20,20)&&ci[0]<=ci[1];}
export function isExternalMlEvidence(value:unknown):value is ExternalMlEvidence {
 const v=record(value);if(!v||v.schema_version!=='cla.uci.ml-comparison.v1'||v.status!=='EXTERNAL_METHOD_FEASIBILITY_ONLY'||v.dataset!=='DElmazi/Student_Performance'||v.revision!=='85a4fba73197d748e4cfd445a5e9c2ed35ca4a21'||v.license!=='CC-BY-4.0'||v.nominal_coverage!==0.9||!sha(v.code_sha256)||typeof v.citation!=='string'||!Array.isArray(v.limitations)||v.limitations.length<5||!v.limitations.every(x=>typeof x==='string')||!Array.isArray(v.subjects)||v.subjects.length!==2)return false;
 const seen=new Set<string>();
 for(const raw of v.subjects){const s=record(raw);if(!s||!(s.subject==='math'||s.subject==='portuguese')||seen.has(s.subject)||s.rows!==(s.subject==='math'?395:649)||!sha(s.source_sha256)||!sha(s.split_sha256))return false;seen.add(s.subject);
 const c=record(s.counts),m=record(s.metrics),b=record(s.behavior_increment);if(!c||!m||!b||!finite(c.train,50,649)||!finite(c.calibration,20,649)||!finite(c.test,20,649)||![c.train,c.calibration,c.test].every(Number.isInteger)||c.train+c.calibration+c.test!==s.rows)return false;
 if(!externalMlModels.every(k=>validMetrics(m[k]))||!validComparison(b.ridge)||!validComparison(b.forest))return false;
 for(const family of ['ridge','forest']){const a=m[`${family}_academic`] as Metrics;const plus=m[`${family}_plus_behavior`] as Metrics;const change=b[family] as Comparison;if(Math.abs(a.mae-plus.mae-change.mae_reduction)>1e-8)return false;}
 }
 return true;
}
