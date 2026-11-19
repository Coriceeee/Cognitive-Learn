import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifiedPrograms, ptit2026MethodScales } from '../src/data/verifiedAdmissionPrograms.ts';
const expected = { '7480201':23, '7480202':25.22, '7329001':22.75, '7340101':21.93, '7340115':22.75, '7340205':23.23, '7340301':22.47, '7320104':24.54, '7520216':26.91, '7520207':25.18 };
test('CP32 10 BVH programs, 3 years, 90 method-specific 2026 cutoffs', () => {
  assert.equal(verifiedPrograms.length, 10);
  assert.equal(new Set(verifiedPrograms.map(p=>p.code)).size,10);
  for (const p of verifiedPrograms) {
    assert.equal(p.campus,'BVH');
    assert.deepEqual(p.historicalCutoffs.map(x=>[x.year,x.admissionTrack]),[[2024,'THPT'],[2025,'PUBLISHED_COMMON']]);
    assert.equal(p.cutoffs2026.publishedAt,'2026-08-10');
    assert.equal(p.cutoffs2026.reviewedAt,'2026-11-17');
    assert.match(p.cutoffs2026.source,/^https:\/\/tuyensinh\.ptit\.edu\.vn\/thong-bao-diem-chuan-trung-tuyen-vao-dai-hoc-he-chinh-quy-nam-2026\/$/);
    assert.deepEqual(Object.keys(p.cutoffs2026.values),Object.keys(ptit2026MethodScales));
    assert.equal(p.cutoffs2026.values.THPT,expected[p.code]);
    for (const [key,{scale}] of Object.entries(ptit2026MethodScales)) assert.ok(Number.isFinite(p.cutoffs2026.values[key]) && p.cutoffs2026.values[key]>=0 && p.cutoffs2026.values[key]<=scale);
  }
});
test('Source example: exact 9-column mapping, tie-break, no invented tie-break for IT',()=>{
  const it=verifiedPrograms.find(p=>p.code==='7480201');
  assert.deepEqual(it.cutoffs2026.values,{THPT:23,TALENT:64.70,SAT:1169.61,ACT:26,TSA:52.48,HSA:81.64,VACT:762.73,SPT:17.82,COMBINED:27.14});
  assert.equal(it.cutoffs2026.tieBreak,null);
  assert.equal(verifiedPrograms.find(p=>p.code==='7520216').cutoffs2026.tieBreak,'ĐC = 0; TTNV ≤ 2');
});
test('Atlas national history retains all method scales, missing scales and exact source links',()=>{
 const ui=readFileSync(new URL('../src/page/atlas/components/AtlasCutoffField.tsx',import.meta.url),'utf8');
 assert.match(ui,/nationalProgramHistory/);
 assert.match(ui,/row.scale===null/);
 assert.match(ui,/Không so tỷ lệ thanh giữa các phương thức/);
 assert.match(ui,/2024–2026/);
 assert.match(ui,/href=\{row.source\}/);
});
