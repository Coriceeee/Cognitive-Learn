/* Official PTIT admissions pathways: constrained 2026 source-backed read-only matching. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.resolve(__dirname,'..');
function load(file, stubs={}) {
  const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'), {fileName:file, compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const m={exports:{}};
  new Function('module','exports','require',compiled)(m,m.exports,(name)=>{
    if(name in stubs) return stubs[name];
    throw new Error('Unexpected dependency '+name);
  });
  return m.exports;
}
const programs=load(path.join(root,'src/data/verifiedAdmissionPrograms.ts'));
const matcher=load(path.join(root,'src/lib/ptitAdmissionPathways2026.ts'), {'../data/verifiedAdmissionPrograms':programs});
const base={math:8, literature:7, english:9, physics:8.5, chemistry:8, informatics:9.5};
const run=(pair, scores=base, other={})=> matcher.matchPtitPublishedPathways2026({selectedElectives:pair,scores,...other});
test('09.01 published mappings include X06 and X26, not a guessed synonym',()=>{
  assert.deepEqual(matcher.PTIT_2026_COMBINATION_SUBJECTS.X06,['math','physics','informatics']);
  assert.deepEqual(matcher.PTIT_2026_COMBINATION_SUBJECTS.X26,['math','informatics','english']);
});
test('09.02 abstains until exactly two distinct electives confirmed',()=>{
  assert.equal(run([]).matches.length,0);assert.equal(run(['english']).matches.length,0);
  assert.equal(run(['english','english']).matches.length,0);
  assert.equal(run(['english','informatics','physics']).matches.length,0);
});
test('09.03 English + Informatics unlocks officially published X26, outside nine-code trial catalog',()=>{
  const report=run(['english','informatics']);
  assert.deepEqual(report.supportedCombinations,['X26','D01']);
  assert.equal(report.matches.length,10);
  const it=report.matches.find(p=>p.majorCode==='7480201');
  assert.deepEqual(it.combinations.map(c=>c.code),['X26']);
  assert.equal(it.combinations[0].observedScore,26.5);
});
test('09.04 Physics + Informatics matches X06 and not X26',()=>{
  const report=run(['physics','informatics']);
  assert.deepEqual(report.supportedCombinations,['X06']);
  assert.equal(report.matches.length,10);
  assert.equal(report.matches[0].combinations[0].observedScore,26);
});
test('09.05 Physics + English matches A01, and D01 only when literature and English exist',()=>{
  const report=run(['physics','english']);
  assert.deepEqual(report.supportedCombinations,['A01','D01']);
  const it=report.matches.find(p=>p.majorCode==='7480201');
  assert.deepEqual(it.combinations.map(x=>x.code),['A01']);
  assert.equal(it.combinations[0].observedScore,25.5);
});
test('09.06 Physics + Chemistry matches only A00',()=>{
  assert.deepEqual(run(['physics','chemistry']).supportedCombinations,['A00']);
});
test('09.07 History + geography have no PTIT match in this bounded sample, not a nationwide exclusion',()=>{
  const report=run(['history','geography']);
  assert.deepEqual(report.matches,[]);assert.equal(report.scope,'ptit_bvh_sample');
});
test('09.08 missing Informatics leaves X26 observable score null, not 0',()=>{
  const report=run(['english','informatics'],{math:8,english:9});
  assert.equal(report.matches[0].combinations.find(x=>x.code==='X26').observedScore,null);
});
test('09.09 real zero accepted when three scores observed',()=>{
  const report=run(['physics','informatics'],{math:8,physics:0,informatics:9});
  assert.equal(report.matches[0].combinations[0].observedScore,17);
});
test('09.10 invalid score cannot be used for a total',()=>{
  assert.equal(run(['physics','informatics'],{math:8,physics:11,informatics:9}).matches[0].combinations[0].observedScore,null);
});
test('09.11 target major identifies matching records but does not exclude other majors',()=>{
  const report=run(['english','informatics'],base,{targetMajor:'Công nghệ thông tin'});
  assert.ok(report.targetMatches >= 1);
  assert.equal(report.matches[0].majorCode,'7480201');
});
test('09.12 different source year is excluded',()=>{
  const stale={...programs.verifiedPrograms[0],availableYears:[2024,2025]};
  assert.equal(run(['physics','informatics'],base,{programs:[stale]}).matches.length,0);
});
test('09.13 untrusted host is excluded despite copied combinations',()=>{
  const fake={...programs.verifiedPrograms[0],source2026:'https://fake.example/admissions'};
  assert.equal(run(['physics','informatics'],base,{programs:[fake]}).matches.length,0);
});
test('09.14 campus BVS is not mislabeled BVH',()=>{
  const otherCampus={...programs.verifiedPrograms[0],campus:'BVS'};
  assert.equal(run(['physics','informatics'],base,{programs:[otherCampus]}).matches.length,0);
});
test('09.15 outside the PTIT published five codes does not create arbitrary official combinations',()=>{
  const unexpected={...programs.verifiedPrograms[0],combinations2026:['C00']};
  assert.equal(run(['history','geography'],base,{programs:[unexpected]}).matches.length,0);
});
test('09.16 output includes source URL, method, campus, year and program code',()=>{
  const match=run(['english','informatics']).matches[0];
  assert.equal(match.year,2026);assert.equal(match.admissionMethod,'THPT');assert.equal(match.campus,'BVH');
  assert.match(match.officialSource,/^https:\/\/tuyensinh\.ptit\.edu\.vn\/de-an-tuyen-sinh\//);
  assert.ok(match.majorCode);
});
test('09.17 national explorer replaces the bounded PTIT picker and exposes all registered programmes',()=>{
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  for(const snippet of ['buildNationalPathwayCatalogue','matchNationalPathways2026','selectedExamPairId','AtlasNationalPathways','selectedNational.entries']) assert.ok(ui.includes(snippet),snippet);
  assert.ok(!ui.includes('matchPtitPublishedPathways2026'));
});
test('09.18 protects admission comparison from school/tryout scores',()=>{
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  const national=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasNationalPathways.tsx'),'utf8');
  assert.ok(ui.includes('scoreBasis === "official_thpt_2026"'));
  assert.ok(national.includes('Không so tổng môn với điểm chuẩn'));
});

test('09.19 rejects prior-year official page even when a program wrongly claims year 2026',()=>{
  const wrong={...programs.verifiedPrograms[0],source2026:'https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025/'};
  assert.equal(run(['physics','informatics'],base,{programs:[wrong]}).matches.length,0);
});
test('09.20 excludes a program without a 2026 THPT admission method',()=>{
  const notThpt={...programs.verifiedPrograms[0],methods2026:['2: SAT/ACT']};
  assert.equal(run(['physics','informatics'],base,{programs:[notThpt]}).matches.length,0);
});

test('09.21 official-pathway exploration is discoverable from Atlas module navigation',()=>{
  const page=fs.readFileSync(path.join(root,'src/page/atlas/AtlasPage.tsx'),'utf8');
  const catalog=fs.readFileSync(path.join(root,'src/data/moduleSubmodules.ts'),'utf8');
  assert.ok(page.includes('<ModuleSectionNav moduleKey="atlas" />'), 'Atlas must show focused module navigation');
  assert.ok(catalog.includes('href: "/atlas/subjects"'), 'Subject optimizer must remain reachable');
  assert.ok(catalog.includes('title: "Tổ hợp chiến lược"'), 'Student-facing subject pathway must be named');
});
