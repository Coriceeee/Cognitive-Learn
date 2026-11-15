/** Prediction/Orion semantics regression: every reported quantity is a heuristic index, not calibrated odds. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function loadTs(rel) {
  const sourcePath = path.resolve(root, rel);
  if (cache.has(sourcePath)) return cache.get(sourcePath).exports;
  const contents = fs.readFileSync(sourcePath, 'utf8');
  const compiled = ts.transpileModule(contents, {
    fileName: sourcePath,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.deepEqual(errors.map(d => ts.flattenDiagnosticMessageText(d.messageText,'\n')), []);
  const mod = { exports: {} };
  cache.set(sourcePath, mod);
  const localRequire = spec => {
    if (!spec.startsWith('.')) throw Error(`Unexpected runtime dependency: ${spec}`);
    const resolved = path.resolve(path.dirname(sourcePath), spec + (path.extname(spec) ? '' : '.ts'));
    return loadTs(path.relative(root, resolved));
  };
  new Function('module', 'exports', 'require', compiled.outputText)(mod, mod.exports, localRequire);
  return mod.exports;
}
const predict = loadTs('src/engines/prediction/predictionEngine.ts').predictLearningOutcome;
const simulate = loadTs('src/engines/simulation/orion/simulationEngine.ts');
const input = {
  currentScore: 6.5, targetScore: 9,
  cognitiveVector: { SCI:80, MAS:60, CSL:70, GVI:10, BDI:15, FRI:10, CRI:75 },
  studyHoursPerWeek:12, completionRate:60,
};
const baseline = { id:'baseline', type:'BASELINE', name:'Giữ nguyên', description:'Đối chiếu', changes:{} };

test('PRED-01 three heuristic indices have distinct, explicit semantics', () => {
  const result = predict(input);
  assert.equal(result.resultKind, 'RULE_BASED_SCENARIO');
  assert.equal(result.calibrationStatus, 'NOT_CALIBRATED');
  assert.equal(result.cognitiveStrengthIndex,72);
  assert.ok(Number.isInteger(result.goalGapReadinessIndex));
  assert.ok(Number.isInteger(result.stabilityCompletionIndex));
  assert.ok(result.limitations.length >= 3);
});
test('PRED-02 no probability or statistically calibrated confidence in engine output', () => {
  const result = predict(input);
  for (const badField of ['probability','achievementProbability','confidence']) {
    assert.ok(!Object.hasOwn(result,badField), badField);
  }
  assert.match(result.limitations.join(' '), /Không có mô hình xác suất/);
});
test('PRED-03 distance index is a bounded transformation of score gap, not an event probability', () => {
  const result = predict(input);
  const expected = Math.max(0,Math.min(100,Math.round(100-Math.max(0,input.targetScore-result.predictedScore)*20)));
  assert.equal(result.goalGapReadinessIndex,expected);
});
test('PRED-04 a higher target cannot improve the gap index with unchanged prediction inputs', () => {
  const lower = predict({...input,targetScore:7});
  const higher = predict({...input,targetScore:10});
  assert.equal(lower.predictedScore,higher.predictedScore);
  assert.ok(lower.goalGapReadinessIndex>=higher.goalGapReadinessIndex);
});
test('PRED-05 already reached target yields 100 index but NEVER 100% success claim', () => {
  const result = predict({...input,currentScore:9,targetScore:7});
  assert.equal(result.goalGapReadinessIndex,100);
  assert.equal(result.calibrationStatus,'NOT_CALIBRATED');
  assert.equal(result.resultKind,'RULE_BASED_SCENARIO');
});
test('PRED-06 distance index lower bound remains 0', () => {
  const result = predict({...input,currentScore:0,targetScore:10,cognitiveVector:{SCI:0,MAS:0,CSL:0,GVI:90,BDI:90,FRI:90,CRI:0},completionRate:0});
  assert.equal(result.goalGapReadinessIndex,0);
});
test('PRED-07 stability/completion weighted index is not an uncertainty interval', () => {
  const result = predict(input);
  assert.equal(result.stabilityCompletionIndex,Math.round((result.stability+input.completionRate)/2));
  assert.match(result.limitations.join(' '), /không phải dự báo ML/);
});
test('SIM-01 Orion scenario propagates named heuristic gap index only', () => {
  const result = simulate.simulateScenario(input,baseline);
  const prediction = predict(input);
  assert.equal(result.goalGapReadinessIndex,prediction.goalGapReadinessIndex);
  assert.equal(result.resultKind,'HEURISTIC_SCENARIO');
  assert.ok(!Object.hasOwn(result,'probability'));
  assert.ok(result.limitations.length>0);
});
test('SIM-02 utility uses descriptive cognitive index, not a probability field', () => {
  const result = simulate.simulateScenario(input,baseline);
  const prediction = predict(input);
  const riskPenalty = prediction.risk==='HIGH' ?20 :prediction.risk==='MEDIUM'?10:0;
  const expected = Math.round((prediction.predictedScore-input.currentScore)*20+prediction.cognitiveStrengthIndex*.4+prediction.stability*.3-riskPenalty);
  assert.equal(result.utilityScore,expected);
});
test('SIM-03 scenario lists maintain comparative sorting under renamed semantics', () => {
  const items = simulate.runSimulation(input,[baseline,{id:'completion',type:'CONSISTENCY_BOOST',name:'Luyện tập',description:'Mô phỏng',changes:{completionDelta:20}}]);
  assert.equal(items.results.length,2);
  assert.equal(items.bestScenario,items.results[0]);
  assert.ok(items.results[0].utilityScore>=items.results[1].utilityScore);
  assert.ok(items.results.every(x=>x.resultKind==='HEURISTIC_SCENARIO'));
});
test('CONTRACT-01 TypeScript strict compiles prediction + simulation contract together', () => {
  const files = ['src/engines/prediction/predictionEngine.ts','src/engines/simulation/orion/simulationEngine.ts','src/engines/simulation/chronos/chronosEngine.ts'].map(f=>path.join(root,f));
  const program = ts.createProgram(files,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,noEmit:true,skipLibCheck:true,lib:['lib.es2022.d.ts','lib.dom.d.ts']});
  assert.deepEqual(ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error).map(d=>`${d.file?.fileName||''}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`), []);
});
test('CONTRACT-02 UI exposes heuristic semantics and calibrated absence', () => {
  const ui=fs.readFileSync(path.join(root,'src/page/seed/components/LearningIntelligencePanel.tsx'),'utf8');
  assert.match(ui,/Chỉ số khoảng cách mục tiêu/);
  assert.match(ui,/Độ tin cậy thống kê: chưa được đánh giá/);
  assert.match(ui,/prediction\.goalGapReadinessIndex/);
});
test('CONTRACT-03 result types cannot silently reintroduce probability/confidence fields', () => {
  const names=['src/engines/prediction/predictionTypes.ts','src/engines/simulation/simulationTypes.ts','src/engines/simulation/chronos/chronosTypes.ts'];
  for (const name of names) {
    const code=fs.readFileSync(path.join(root,name),'utf8');
    assert.doesNotMatch(code,/\b(?:achievementProbability|probability|confidence)\s*:/);
  }
});
test('CONTRACT-04 model version is bumped and terms say scenario, not validated ML', () => {
  const result=predict(input);
  assert.match(result.modelVersion,/v2\.1\.0-heuristic/);
  assert.match(result.explanation.join(' '),/giả định|thử nghiệm/);
});

test('SIM-04 explanations do not equate an assumed cognitive adjustment with observed benefit', () => {
  const scenario = {id:'hypothetical',type:'STRATEGY_IMPROVEMENT',name:'Mô phỏng',description:'Thay đổi chỉ số',changes:{cognitive:{SCI:10,CRI:10,BDI:-5,FRI:10}}};
  const result=simulate.simulateScenario(input,scenario);
  assert.match(result.tradeoffs.join(' '), /giả định|kịch bản/);
  assert.match(result.tradeoffs.join(' '), /không phải độ tin cậy thống kê/);
  assert.ok(!result.explanation.some(x=>x.startsWith('Intervention:')));
});
