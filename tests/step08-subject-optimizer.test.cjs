/* Subject Optimizer 2026: rule and UI contract regression. No Firebase or live sources. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const examRulesPath = path.join(root,'src/lib/examMethodRules.ts');
const optimizerPath = path.join(root,'src/lib/examChoiceEngine.ts');
function load(file, stubs={}) {
  const output = ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod = {exports:{}};
  new Function('module','exports','require',output)(mod,mod.exports,(name)=>{
    if(name in stubs) return stubs[name];
    throw new Error('Unmocked import '+name);
  });
  return mod.exports;
}
const rules = load(examRulesPath);
const api = load(optimizerPath,{'./examMethodRules':rules});
const common = {math:8,literature:7,english:9,physics:8.5,chemistry:8,history:6,geography:6,civicEducation:9.5,informatics:9.9};
const get = (subjects,scores=common, rest={}) => api.optimizeExamChoices2026({confirmedGrade12Subjects:subjects,subjectScores:scores,...rest});

test('08.01 policy states two compulsory plus two elective subjects, source and year',()=>{
  assert.deepEqual(api.EXAM_POLICY_2026.compulsory,['math','literature']);
  assert.equal(api.EXAM_POLICY_2026.electiveCount,2);
  assert.equal(api.EXAM_POLICY_2026.year,2026);
  assert.ok(api.EXAM_POLICY_2026.policySource.startsWith('https://xaydungchinhsach.chinhphu.vn/'));
});
test('08.02 no confirmed grade-12 courses means abstain; marks alone are not enrollment',()=>{
  const result=get([],common);
  assert.equal(result.status,'NEED_COURSE_CONFIRMATION');
  assert.equal(result.options.length,0);
});
test('08.03 one confirmed elective cannot form a pair',()=>{
  assert.equal(get(['english']).options.length,0);
});
test('08.04 two confirmed choices produce exactly one pair',()=>{
  const result=get(['english','physics']);
  assert.equal(result.options.length,1);
  assert.equal(result.options[0].id,'english+physics');
  assert.deepEqual(result.options[0].exploratoryCombinations,['A01','C01','D01']);
});
test('08.05 only the confirmed grade-12 list contributes, other high scores excluded',()=>{
  const result=get(['history','geography']);
  assert.equal(result.options.length,1);
  assert.deepEqual(result.options[0].exploratoryCombinations,['C00']);
  assert.ok(!result.options[0].exploratoryCombinations.includes('A01'));
});
test('08.06 incomplete elective scores are null, never silently zero',()=>{
  const result=get(['physics','chemistry'],{math:8,literature:7,physics:9});
  assert.equal(result.options[0].electiveScoreSum,null);
  assert.equal(result.options[0].bothElectiveScoresObserved,false);
  assert.deepEqual(result.options[0].completedCombinations,[{code:'C01',score:24}]); // existing Physics + compulsory marks can still form C01
});
test('08.07 actual zero remains valid input',()=>{
  const result=get(['english','physics'],{math:8,literature:7,english:0,physics:8.5});
  assert.equal(result.options[0].electiveScoreSum,8.5);
  assert.equal(result.options[0].bothElectiveScoresObserved,true);
  assert.ok(result.options[0].completedCombinations.some(x=>x.code==='D01' && x.score===15));
});
test('08.08 invalid and negative marks cannot manufacture an observed-score comparison',()=>{
  const result=get(['english','physics'],{math:8,literature:7,english:11,physics:-1});
  assert.equal(result.options[0].electiveScoreSum,null);
  assert.deepEqual(result.options[0].completedCombinations,[]);
});
test('08.09 does not claim no admission possible when project catalogue has no combo',()=>{
  const result=get(['informatics','civicEducation']);
  assert.deepEqual(result.options[0].exploratoryCombinations,[]);
  assert.match(result.options[0].limitations.join(' '), /không có nghĩa là không được xét tuyển/);
});
test('08.10 technology streams are distinct and generic technology grade is not reused',()=>{
  const result=get(['technologyIndustry','physics'],{math:8,literature:7,technology:10,physics:9});
  assert.equal(result.options[0].electiveScoreSum,null);
  assert.match(result.options[0].limitations.join(' '),/định hướng Công nghệ/);
});
test('08.11 duplicates are deduplicated and are not counted as two different electives',()=>{
  const result=get(['english','english']);
  assert.equal(result.options.length,0);
  assert.ok(result.warnings.some(s=>s.includes('trùng')));
});
test('08.12 never invents verified university matches from exploratory combinations',()=>{
  assert.equal(get(['english','physics']).options[0].sourceVerifiedMatches.length,0);
});
test('08.13 only explicitly supplied verified program data is considered a matching opportunity',()=>{
  const result=get(['english','physics'],common,{targetMajor:'Công nghệ thông tin',verifiedPrograms:[{id:'p1',majorName:'Công nghệ thông tin',combinations:['A01']},{id:'p2',majorName:'Quản trị kinh doanh',combinations:['D01']}]});
  assert.deepEqual(result.options[0].sourceVerifiedMatches.map(x=>x.programId),['p1']);
  assert.equal(result.verifiedTargetAvailable,true);
});
test('08.14 unmatched target cannot be fabricated by substring scoring or mock sources',()=>{
  const result=get(['english','physics'],common,{targetMajor:'Y đa khoa', verifiedPrograms:[{id:'p1',majorName:'Công nghệ thông tin',combinations:['D01']}]});
  assert.equal(result.options[0].sourceVerifiedMatches.length,0);
  assert.equal(result.verifiedTargetAvailable,false);
  assert.ok(result.warnings.some(s=>s.includes('Chưa có chương trình')));
});
test('08.15 three studied electives creates three pairs and sorts by coverage then grades',()=>{
  const result=get(['english','physics','chemistry']);
  assert.equal(result.options.length,3);
  assert.equal(result.options[0].id,'english+physics');
});
test('08.16 combining a pair with mandatory subjects only uses supported academic combinations',()=>{
  const result=get(['history','geography']);
  assert.deepEqual(result.options[0].completedCombinations,[{code:'C00',score:19}]);
});
test('08.17 two technological streams are never assumed to share a common grade',()=>{
  const result=get(['technologyIndustry','technologyAgriculture'],{technology:10});
  assert.equal(result.options[0].bothElectiveScoresObserved,false);
  assert.ok(result.warnings.some(s=>s.includes('định hướng')));
});
test('08.18 UI requires explicit confirmation and exposes policy/source/limits',()=>{
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  for (const part of ['atlas-exam-choice','toggleConfirmedExamSubject','confirmedGrade12Subjects','aria-pressed={selectedExamPairId === option.id}','EXAM_POLICY_2026.policySource','role="status"','Seed thuộc lớp 12']) assert.ok(ui.includes(part),part);
  assert.ok(ui.includes('source.status === "verified"'));
  assert.ok(ui.includes('program.status === "verified"'));
});
test('08.19 previously established Seed and school-score safety gates remain untouched',()=>{
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  assert.ok(ui.includes('loadSeedSchoolMarks(seedSnapshot)'));
  assert.ok(ui.includes('scoreBasis === "official_thpt_2026"'));
  assert.ok(ui.includes('setConfirmedGrade12Subjects([])'));
  assert.ok(ui.includes('useState<string>("")'));
  assert.doesNotMatch(ui,/useState<string>\("D01"\)|setSelectedCombination\("D01"\)/);
  assert.match(ui,/scoreReport\.combinationOptions\.find\([\s\S]*?\) \?\? rankedCombinations\[0\]/);
});
