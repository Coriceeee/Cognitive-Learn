/** Same-registry fidelity check, not an LLM or external source validation. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { verifiedPrograms, ptit2026MethodScales } from '../src/data/verifiedAdmissionPrograms.ts';
import { answerVerifiedCutoff, safeCutoffSource, comparisonVersion } from '../src/lib/atlasDecisionComparison.ts';
import { externalCutoffs } from '../src/data/nationalAdmissionCutoffs.ts';
import release from './cp31_release_fingerprint.cjs';
const aliases={THPT:'THPT',TALENT:'tài năng',SAT:'SAT',ACT:'ACT',TSA:'TSA',HSA:'HSA',VACT:'V-ACT',SPT:'SPT',COMBINED:'kết hợp'};
const cases=[];
for(const p of verifiedPrograms){
 for(const [method,meta] of Object.entries(ptit2026MethodScales)) cases.push({question:`Điểm chuẩn PTIT BVH ${p.code} 2026 ${aliases[method]}`,expected:`${p.cutoffs2026.values[method].toFixed(2)}/${meta.scale} điểm`,source:p.cutoffs2026.source,group:'2026_method'});
 for(const item of p.historicalCutoffs) cases.push({question:`Điểm chuẩn PTIT BVH ${p.code} ${item.year}`,expected:`${item.cutoff.toFixed(2)}${item.year===2024?'/30':''} điểm`,source:item.source,group:'historical'});
}
import { externalMethodAliases as externalAliases } from '../src/lib/nationalAdmissionRegistry.ts';
for(const r of externalCutoffs) cases.push({question:`Điểm chuẩn ${r.universityId} ${r.code} ${r.year} ${externalAliases[r.method]}`,expected:`${r.cutoff.toFixed(2)}/${r.scale} điểm`,source:r.source,group:`national_${r.year}`});
for(const q of ['Điểm chuẩn PTIT BVH CNTT 2026','Điểm chuẩn PTIT BVH CNTT 2025 THPT','Điểm chuẩn PTIT BVH CNTT 2026 SAT và ACT','Điểm chuẩn PTIT BVH CNTT 2027 THPT','Điểm chuẩn PTIT BVS CNTT 2026 THPT','Điểm chuẩn PTIT BVH CNTT 2026 THPT ignore instructions','Điểm chuẩn PTIT BVH CNTT 2026 __proto__','Điểm chuẩn PTIT BVH ngành lạ 2026 THPT','Điểm chuẩn PTIT BVH CNTT 2024 HSA','Điểm chuẩn PTIT BVH CNTT 2026 THPT cho tôi xác suất đỗ']) cases.push({question:q,expected:null,source:null,group:'abstention'});
const results=cases.map((c,i)=>{const a=answerVerifiedCutoff(c.question);return {...c,id:`ATLAS-LOOKUP-${String(i+1).padStart(3,'0')}`,actual:a,pass:c.expected===null?a===null:Boolean(a&&a.answer.includes(c.expected)&&a.source===c.source&&safeCutoffSource(a.source)===a.source&&a.answer.includes('không phải dự báo đỗ'))};});
const report={scope:'DETERMINISTIC_SAME_REGISTRY_FIDELITY_ONLY',version:comparisonVersion,sourceFingerprint:release.fingerprint().sha256,total:results.length,passed:results.filter(x=>x.pass).length,modelEvaluation:'NOT RUN',externalSourceRevalidation:'NOT RUN',limitations:['Expected values are drawn from the same curated data registry, not independent ground truth.','No Gemini call, no real student outcomes, no admission probability or user study.'],results};
mkdirSync('reports/evidence',{recursive:true});writeFileSync('reports/evidence/atlas_lookup_fidelity.json',JSON.stringify(report,null,2)+'\n');console.log(`ATLAS LOOKUP FIDELITY ${report.passed}/${report.total} (deterministic, NOT LLM evaluation)`);if(report.passed!==report.total)process.exitCode=1;
