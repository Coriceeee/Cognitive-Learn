const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const cache=new Map();
function load(file){
  if(cache.has(file))return cache.get(file);
  const mod={exports:{}};cache.set(file,mod.exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('module','exports','require',code)(mod,mod.exports,name=>{
    const resolved=path.resolve(path.dirname(file),name);
    return load(resolved.endsWith('.ts')?resolved:resolved+'.ts');
  });return mod.exports;
}
const {projectExamScore}=load(path.join(root,'src/lib/examProjection.ts'));
test('mean baseline, no extrapolation, decimal comma and valid zero',()=>{
  assert.equal(projectExamScore(6,8),7);
  assert.equal(projectExamScore('8,5','9.25'),8.88);
  assert.equal(projectExamScore(0,0),0);
  assert.equal(projectExamScore(10,10),10);
});
test('missing, nonfinite and out-of-range observations abstain',()=>{
  for(const value of ['',undefined,null,-1,11,'NaN',Infinity,'abc']) assert.equal(projectExamScore(value,8),undefined);
  assert.equal(projectExamScore(8,''),undefined);
});
test('projection is isolated from official admission classification',()=>{
  const atlas=read('src/page/atlas/components/AtlasAdmissionEnginePanel.tsx');
  assert.match(atlas,/setScoreBasis\("projection"\)/);
  assert.match(atlas,/const canClassifyAdmission = scoreBasis === "official_thpt_2026"/);
  assert.match(atlas,/setSubjectScores\(\{\.\.\.defaultSubjectScores,\.\.\.scores\}\)/);
  assert.match(atlas,/key=\{transcript.userId \?\? "signed-out"\}/);
});
test('student path emphasizes assessment, projection, combination, school, strategy and advisor',()=>{
  const nav=read('src/components/common/ModuleSectionNav.tsx');
  assert.match(nav,/lumen: \["indices", "advanced", "insight"\]/);
  assert.match(nav,/atlas: \["subjects", "fit", "vietnam"\]/);
  const lumen=read('src/page/lumen/LumenPage.tsx');
  assert.match(lumen,/\/atlas\/subjects#cla-exam-projection/);
  assert.match(lumen,/gpaIntegrity.status === "VERIFIED"/);
  const atlas=read('src/page/atlas/AtlasPage.tsx');
  const chat=read('src/components/common/FloatingAdvisorChat.tsx');
  assert.doesNotMatch(atlas,/cla:open-admissions-advisor|Hỏi trợ lý tuyển sinh CLA/);
  assert.match(chat,/Trợ lý hướng nghiệp và tuyển sinh đại học/);
  assert.match(atlas,/\/orion\/scenarios/);
});

const bridge=load(path.join(root,'src/lib/examProjectionHandoff.ts'));
test('snapshot is calculated from observations, partial subjects are absent, zero is preserved',()=>{
  const snap=bridge.buildExamProjectionSnapshot({math:6,english:'0',physics:9},{math:8,english:0},100);
  assert.deepEqual(snap.scores,{math:'7.00',english:'0.00'});
  assert.deepEqual(snap.observations,{math:{previous:6,latest:8},english:{previous:0,latest:0}});
  assert.equal(snap.version,'mock-mean-v1');assert.equal(snap.createdAt,100);
});
test('malformed, absent and out-of-range observations cannot stage an invalid projection',()=>{
  for(const value of ['abc','11',NaN,Infinity,-1]) assert.equal(bridge.buildExamProjectionSnapshot({math:7,english:value},{math:8}),null);
  assert.equal(bridge.buildExamProjectionSnapshot({math:7},{english:8}),null);
  assert.equal(bridge.stageExamProjection('',{math:7},{math:8},100),false);
});
test('handoff is isolated by UID, expiry and backward clock',()=>{
  assert.ok(bridge.stageExamProjection('A',{math:7},{math:8},100));
  assert.equal(bridge.readExamProjection('B',101),null);assert.equal(bridge.readExamProjection('A',102),null);
  bridge.stageExamProjection('A',{math:7},{math:8},100);assert.equal(bridge.readExamProjection('A',300100),null);
  bridge.stageExamProjection('A',{math:7},{math:8},100);assert.equal(bridge.readExamProjection('A',99),null);
});
test('handoff snapshot is immutable to consumers and can be consumed only once',()=>{
  const prev={math:7};bridge.stageExamProjection('A',prev,{math:8},100);prev.math=2;
  const snapshot=bridge.readExamProjection('A',101);snapshot.scores.math='10';snapshot.observations.math.previous=10;
  assert.deepEqual(bridge.consumeExamProjection('A',102).observations.math,{previous:7,latest:8});
  assert.equal(bridge.consumeExamProjection('A',103),null);
});
test('new snapshot replaces old; explicit clear prevents stale navigation',()=>{
  bridge.stageExamProjection('A',{math:2},{math:4},100);bridge.stageExamProjection('A',{physics:5},{physics:7},101);
  assert.deepEqual(bridge.readExamProjection('A',102).scores,{physics:'6.00'});
  bridge.clearExamProjection();assert.equal(bridge.readExamProjection('A',103),null);
});
test('Lumen sends real inputs, Atlas explicitly applies isolated scenario and session changes clear handoffs',()=>{
  const lumen=read('src/page/lumen/LumenPage.tsx'),atlas=read('src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),main=read('src/main.tsx');
  assert.match(lumen,/stageExamProjection\(uid, previous, latest\)/);assert.match(lumen,/navigateTo\("\/atlas\/subjects"\)/);
  assert.match(atlas,/consumeExamProjection\(transcript.userId\)/);assert.match(atlas,/setSubjectScores\(\{\.\.\.defaultSubjectScores,\.\.\.accepted.scores\}\)/);
  assert.match(atlas,/JSON.stringify\(current\) !== JSON.stringify\(pendingProjection\)/);
  assert.match(atlas,/setImportedSeedKeys\(\[\]\); setPriorityScore\(""\); setScoreBasis\("projection"\)/);
  assert.match(main,/previousSessionUid !== uid.*clearExamProjection\(\); clearAdmissionGoal\(\)/);
});
test('Orion changes goal and clears stale target marks only after explicit confirmation',()=>{
  const orion=read('src/page/orion/OrionPage.tsx');
  assert.match(orion,/const changed = targetMajor !== nextGoal/);
  assert.match(orion,/window.confirm\("Thay mục tiêu.*xóa điểm mục tiêu cũ/);
  assert.match(orion,/if \(changed\) setTargets\(\{\.\.\.defaultTargets\}\)/);
});
