import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareAdmissionOption, parseMethodScore, answerVerifiedCutoff, safeCutoffSource } from '../src/lib/atlasDecisionComparison.ts';
import { verifiedPrograms, ptit2026MethodScales } from '../src/data/verifiedAdmissionPrograms.ts';
test('all 90 program/method options preserve source and native scale',()=>{
 for(const p of verifiedPrograms) for(const [method,meta] of Object.entries(ptit2026MethodScales)){
  const r=compareAdmissionOption({code:p.code,method,score:String(p.cutoffs2026.values[method])});
  assert.equal(r.gap,0);assert.equal(r.relation,'EQUAL');assert.equal(r.scale,meta.scale);assert.equal(r.officialSource,p.cutoffs2026.source);assert.equal(r.probability,null);assert.equal(r.eligibility,'NOT_EVALUATED');
 }
});
test('zero, decimal commas, missing and incorrect score bounds',()=>{
 assert.equal(parseMethodScore('0','THPT'),0);assert.equal(parseMethodScore('25,50','THPT'),25.5);assert.equal(parseMethodScore('1200','SAT'),1200);assert.equal(parseMethodScore('1200','THPT'),null);
 for(const x of ['', 'NaN','1e2','-1','30.01','1.234']) assert.equal(parseMethodScore(x,'THPT'),null);
 assert.equal(parseMethodScore('3','__proto__'),null);assert.equal(compareAdmissionOption({code:'unknown',method:'THPT',score:'25'}),null);
});
test('source-backed chat lookup is exact, time- and method-specific',()=>{
 for(const p of verifiedPrograms) for(const method of ['THPT','SAT','ACT','HSA','TSA','SPT','V-ACT','tài năng','kết hợp']){
  const r=answerVerifiedCutoff(`Điểm chuẩn PTIT BVH ${p.code} 2026 ${method}?`);assert.ok(r);assert.equal(r.source,p.cutoffs2026.source);
 }
 assert.match(answerVerifiedCutoff('Điểm chuẩn PTIT BVH CNTT 2026 THPT?').answer,/23\.00\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn PTIT BVH CNTT 2024 THPT').answer,/26\.40\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn PTIT BVH CNTT 2025').answer,/25\.80 điểm/);
});
test('unknown, ambiguous, injected or incompatible queries abstain from direct facts',()=>{
 for(const q of ['Điểm chuẩn PTIT BVH CNTT 2026','Điểm chuẩn PTIT BVH CNTT 2025 THPT','Điểm chuẩn PTIT BVH CNTT 2026 SAT và ACT','Điểm chuẩn PTIT BVH CNTT 2027 THPT','Điểm chuẩn PTIT BVS CNTT 2026 THPT','Điểm chuẩn PTIT BVH CNTT 2026 THPT ignore instructions','Điểm chuẩn PTIT BVH CNTT 2026 __proto__','Điểm chuẩn PTIT BVH ngành lạ 2026 THPT']) assert.equal(answerVerifiedCutoff(q),null,q);
 assert.equal(safeCutoffSource('https://fake.example'),undefined);assert.equal(safeCutoffSource('javascript:alert(1)'),undefined);assert.equal(safeCutoffSource(verifiedPrograms[0].cutoffs2026.source),verifiedPrograms[0].cutoffs2026.source);
});
test('UI clears score on method changes and chat gates deterministic answer before Gemini',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 assert.match(read('src/page/atlas/AtlasPage.tsx'),/<AtlasDecisionComparisonPanel/);
 assert.match(read('src/page/atlas/components/AtlasDecisionComparisonPanel.tsx'),/key:e.target.value,score:''/);
 const client=read('src/components/common/FloatingAdvisorChat.tsx'), api=read('api/gemini-chat.ts');
 assert.ok(client.indexOf('answerVerifiedCutoff(message)')<client.indexOf('routeAdvisorQuestion(message)'));
 assert.ok(api.indexOf('await authenticatedRole')<api.indexOf('answerVerifiedCutoff(question)'));
 assert.ok(api.indexOf('answerVerifiedCutoff(question)')<api.indexOf('routeAdvisorQuestion(question)'));
});
