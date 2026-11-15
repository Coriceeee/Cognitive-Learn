/* Step 06 score semantics and Studio safety. Synthetic cases only. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function loadTs(relative, stubs = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleObject = { exports: {} };
  new Function('module', 'exports', 'require', code)(moduleObject, moduleObject.exports, (name) => {
    if (name in stubs) return stubs[name];
    throw new Error(`Unexpected runtime import ${name} from ${relative}`);
  });
  return moduleObject.exports;
}
const examRules = loadTs('src/lib/examMethodRules.ts');
const scores = loadTs('src/lib/scoreConversionEngine.ts', {'./examMethodRules': examRules});
const admission = loadTs('src/lib/admissionRules.ts');
const {parseSubjectScore, calculateCombinationScore, buildScoreConversionReport} = scores;
const testGrades = {math:8, literature:7, english:9};

const testProgram = {id:'p1',majorName:'Ngành mô phỏng',majorCode:'7480201',universityName:'Trường mô phỏng', combinations:['D01'], methods:['THPT'], sourceYear:2026, verified:true, benchmarkVerified:true, benchmarkMethod:'THPT', benchmarkYear:2026, benchmarkScore:25};

test('06.01 zero is a legitimate observed score, absent is not zero', () => {
  assert.equal(parseSubjectScore(0), 0);
  assert.equal(parseSubjectScore('0'), 0);
  assert.equal(parseSubjectScore('0,0'), 0);
  assert.equal(parseSubjectScore(''), undefined);
  assert.equal(parseSubjectScore('   '), undefined);
  assert.equal(parseSubjectScore(undefined), undefined);
  assert.equal(parseSubjectScore(null), undefined);
});
test('06.02 impossible or malformed subject scores are not silently clamped', () => {
  for (const value of [-0.1, 11, Infinity, NaN, '10.1', '-1', '1e1', 'abc', '3,2,1', '2 3', true]) {
    assert.equal(parseSubjectScore(value), undefined, String(value));
  }
  assert.equal(parseSubjectScore('9,25'),9.25);
  assert.equal(parseSubjectScore('10'),10);
});
test('06.03 D01 uses exactly its three observed subjects', () => {
  const result = calculateCombinationScore(testGrades,'D01');
  assert.deepEqual(result.missingSubjects,[]);
  assert.equal(result.rawScore,24);
  assert.equal(result.convertedScore,24);
});
test('06.04 genuine zero does not make a complete combination incomplete', () => {
  const result = calculateCombinationScore({math:0,literature:7,english:9},'D01');
  assert.deepEqual(result.missingSubjects,[]);
  assert.equal(result.rawScore,16);
});
test('06.05 blank or invalid remains missing in the exact combination', () => {
  const result = calculateCombinationScore({math:8,english:9},'D01');
  assert.deepEqual(result.missingSubjects,['literature']);
  assert.ok(result.warnings.some(x=>x.includes('Thiếu điểm')));
  assert.deepEqual(calculateCombinationScore({math:-1,literature:7,english:9},'D01').missingSubjects,['math']);
});
test('06.06 partial sum is never the winning option', () => {
  const report = buildScoreConversionReport({subjectScores:{math:10,physics:10,english:9}});
  assert.equal(report.bestOption.label,'A01');
  assert.ok(report.combinationOptions.find(x=>x.combinationCode==='D01').missingSubjects.includes('literature'));
  assert.equal(buildScoreConversionReport({subjectScores:{math:9,english:9}}).bestOption,null);
});
test('06.07 no external scale is silently ranked against school combinations', () => {
  const report=buildScoreConversionReport({subjectScores:{},externalScores:[{method:'SAT',rawScore:1600,verified:true}]});
  assert.equal(report.bestOption,null);
  assert.ok(report.externalOptions[0].warnings.some(x=>x.includes('quy đổi')));
});
test('06.08 a three-subject zero score remains an eligible combination, not a missing record', () => {
  const report=buildScoreConversionReport({subjectScores:{math:0,literature:0,english:0}});
  const candidate=report.combinationOptions.find(x=>x.combinationCode==='D01');
  assert.deepEqual(candidate.missingSubjects,[]);
  const result=admission.validateAdmissionProgram({program:testProgram,scoreReport:report});
  assert.ok(result.eligibleOptions.some(x=>x.label==='D01'));
  assert.equal(result.riskLevel,'REACH');
});
test('06.09 invalid or missing subjects cannot qualify for a verified benchmark', () => {
  const report=buildScoreConversionReport({subjectScores:{math:8,english:9}});
  const result=admission.validateAdmissionProgram({program:testProgram,scoreReport:report});
  assert.equal(result.riskLevel,'INVALID');
  assert.equal(result.valid,false);
});
test('06.10 Studio only admits official self-declared THPT 2026 scores into cutoff comparison', () => {
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  assert.match(ui, /type ScoreBasis = "practice" \| "school" \| "official_thpt_2026"/);
  assert.match(ui,/scoreBasis === "official_thpt_2026"/);
  assert.match(ui,/parsedPriority === 0/);
  assert.match(ui,/program\.sourceYear === ADMISSION_POLICY_2026\.year/);
  assert.match(ui,/completeCombinations\.length > 0/);
  assert.doesNotMatch(ui,/hasCompleteSubjectScores/);
});
test('06.11 visual explanation is based on computed engine combinations, not hardcoded examples', () => {
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  for (const marker of ['atlas-combination-studio','rankedCombinations','focusedCombination','aria-pressed','item.rawScore.toFixed(2)','item.missingSubjects']) {
    assert.ok(ui.includes(marker),marker);
  }
});
test('06.12 supported input subjects are visible but extra combinations are not invented', () => {
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  for (const field of ['civicEducation','informatics','technology']) assert.ok(ui.includes(field));
  assert.match(ui,/9 tổ hợp hiện là danh mục hỗ trợ thử nghiệm/);
  assert.equal(examRules.admissionCombinations.length,9);
});
test('06.13 Studio styling supports mobile and reduced motion', () => {
  const css=fs.readFileSync(path.join(root,'src/styles/07-atlas.css'),'utf8');
  assert.match(css,/atlas-combination-cards/);
  assert.match(css,/@media \(max-width:720px\)/);
  assert.match(css,/prefers-reduced-motion/);
});
