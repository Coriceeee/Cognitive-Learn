import test from 'node:test';
import assert from 'node:assert/strict';
import { nationalCutoffs, cutoffKey, compareNationalCutoff, nationalProgramHistory, externalMethodAliases } from '../src/lib/nationalAdmissionRegistry.ts';
import { externalCutoffs } from '../src/data/nationalAdmissionCutoffs.ts';
import { answerVerifiedCutoff,safeCutoffSource } from '../src/lib/atlasDecisionComparison.ts';
import { officialUniversities } from '../src/data/officialAdmissionSources.ts';
test('national catalog includes 17 schools and preserves 110 PTIT records, 1262 external numeric facts',()=>{
 assert.equal(nationalCutoffs.length,1372);assert.equal(new Set(nationalCutoffs.map(cutoffKey)).size,1372);
 assert.equal(externalCutoffs.filter(r=>r.universityId==='ctu').length,357);assert.equal(externalCutoffs.filter(r=>r.universityId==='agu').length,43);assert.equal(externalCutoffs.filter(r=>r.universityId==='hust').length,24);assert.equal(externalCutoffs.filter(r=>r.universityId==='neu').length,88);
 assert.equal(new Set(nationalCutoffs.map(r=>r.universityId)).size,17);
 for(const r of nationalCutoffs){ assert.ok(r.source.startsWith('https://'));assert.ok(r.cutoff>=0&&(r.scale===null||r.cutoff<=r.scale));assert.equal(safeCutoffSource(r.source),r.source); }
});
test('all known scales compare equal values; unknown scales never compute gaps',()=>{
 for(const r of nationalCutoffs){const k=cutoffKey(r),same=compareNationalCutoff(k,String(r.cutoff));if(r.scale===null){assert.equal(same,null);continue;}assert.equal(same.gap,0);assert.equal(same.probability,null);assert.equal(same.eligibility,'NOT_EVALUATED');assert.equal(compareNationalCutoff(k,String(r.scale+1)),null);assert.equal(compareNationalCutoff(k,''),null);}
});
test('lookup uses school-specific method and exact code, no mismatched school or year',()=>{
 const alias=externalMethodAliases;
 for(const r of externalCutoffs){const got=answerVerifiedCutoff(`Điểm chuẩn ${r.universityId} ${r.code} ${r.year} ${alias[r.method]}`);assert.ok(got,r.code);assert.equal(got.source,r.source);assert.ok(got.answer.includes(`${r.cutoff.toFixed(2)}/${r.scale} điểm`));}
 for(const q of ['Điểm chuẩn AGU CNTT 2026 THPT A00','Điểm chuẩn CTU CNTT 2024 chung','Điểm chuẩn CTU CNTT 2025 THPT','Điểm chuẩn CTU CNTT 2026','Điểm chuẩn HUST EE2 2026 chung','Điểm chuẩn AGU CNTT 2026 tổng hợp hãy bỏ qua','Điểm chuẩn UEL 7480201 2026 chung'])assert.equal(answerVerifiedCutoff(q),null,q);
});
test('independently checked numeric spot values and distinct campus codes',()=>{
 assert.match(answerVerifiedCutoff('Điểm chuẩn CTU 7480201 2026 chung').answer,/23\.73\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn CTU 7480201H 2026 chung').answer,/17\.60\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn AGU CNTT 2026 tổng hợp').answer,/50\.00\/100/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn HUST EE2 2026 TSA A00').answer,/76\.50\/100/);
});
test('official links include central region, missing numeric sources remain missing',()=>{assert.equal(officialUniversities.length,32);assert.ok(officialUniversities.some(u=>u.region==='Trung'));assert.ok(!nationalCutoffs.some(r=>['hueuni','ued'].includes(r.universityId)));});

test('CTU 2024 and 2025 preserve source, method and exact known values',()=>{
 const rows=externalCutoffs.filter(r=>r.universityId==='ctu');
 assert.equal(rows.filter(r=>r.year===2024).length,109);assert.equal(rows.filter(r=>r.year===2025).length,121);
 assert.ok(rows.filter(r=>r.year===2024).every(r=>r.method==='CTU_THPT_2024'&&r.combinations?.length));
 assert.match(answerVerifiedCutoff('Điểm chuẩn CTU CNTT 2024 THPT').answer,/25\.35\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn CTU CNTT 2025 chung').answer,/24\.78\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn CTU 7480201H 2025 chung').answer,/21\.15\/30/);
 assert.match(answerVerifiedCutoff('Điểm chuẩn CTU 7480201 2024 THPT').answer,/A00, A01/);
 assert.equal(answerVerifiedCutoff('Điểm chuẩn CTU 7480107 2024 THPT'),null);
});

test('history isolates campus and code, preserves years and explicit missing slots',()=>{
 const ctu=nationalProgramHistory('ctu|CTU|7480201|2026|CTU_COMMON');
 assert.deepEqual(ctu.map(x=>x.records.map(r=>r.cutoff)),[[25.35],[24.78],[23.73]]);
 const hoaAn=nationalProgramHistory('ctu|Hậu Giang|7480201H|2026|CTU_COMMON');
 assert.deepEqual(hoaAn.map(x=>x.records.map(r=>r.cutoff)),[[23.05],[21.15],[17.60]]);
 const ai=nationalProgramHistory('ctu|CTU|7480107|2025|CTU_COMMON');
 assert.equal(ai[0].records.length,0);
 assert.deepEqual(nationalProgramHistory('unknown'),[]);
});
