const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');

// Pure data-contract test; no Firestore, Firebase credentials or production calls.
const source = fs.readFileSync(path.join(__dirname, '../src/engines/history/cognitiveHistoryEngine.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
}}).outputText;
const moduleShim = { exports: {} };
new Function('module', 'exports', compiled)(moduleShim, moduleShim.exports);
const { attachObservedSnapshotMetrics } = moduleShim.exports;
const base = Object.freeze({ id: 'sample', SCI: 0, gpaOverall: 0,
  studyHoursPerWeek: 0, practiceTestsPerWeek: 0, planCompletionRate: 0, motivationLevel: 0 });
let count = 0;
function check(name, fn) { fn(); count++; console.log('PASS', name); }
check('unknown academic and behavior metrics stay null, not fake 0', () => {
  const out = attachObservedSnapshotMetrics(base, {
    gpaOverall: null, studyHoursPerWeek: null, practiceTestsPerWeek: null,
    planCompletionRate: null, motivationLevel: null,
  });
  for (const name of ['gpaOverall', 'studyHoursPerWeek', 'practiceTestsPerWeek', 'planCompletionRate', 'motivationLevel']) {
    assert.equal(out[name], null, name);
  }
});
check('genuine observed zero is preserved', () => {
  const out = attachObservedSnapshotMetrics(base, {
    gpaOverall: 0, studyHoursPerWeek: 0, practiceTestsPerWeek: 0,
    planCompletionRate: 0, motivationLevel: 0,
  });
  for (const name of ['gpaOverall', 'studyHoursPerWeek', 'practiceTestsPerWeek', 'planCompletionRate', 'motivationLevel']) {
    assert.equal(out[name], 0, name);
  }
});
check('mixed observed and missing metrics retain distinction', () => {
  const out = attachObservedSnapshotMetrics(base, {
    gpaOverall: 7.5, studyHoursPerWeek: null, practiceTestsPerWeek: 2,
    planCompletionRate: 0, motivationLevel: null,
  });
  assert.equal(out.gpaOverall, 7.5);
  assert.equal(out.studyHoursPerWeek, null);
  assert.equal(out.practiceTestsPerWeek, 2);
  assert.equal(out.planCompletionRate, 0);
  assert.equal(out.motivationLevel, null);
});
check('snapshot provenance and source object remain unchanged', () => {
  const out = attachObservedSnapshotMetrics(base, {
    gpaOverall: null, studyHoursPerWeek: null, practiceTestsPerWeek: null,
    planCompletionRate: null, motivationLevel: null,
  });
  assert.equal(out.id, 'sample');
  assert.equal(out.SCI, 0);
  assert.equal(base.gpaOverall, 0);
});
console.log(`COGNITIVE OBSERVATION TESTS: ${count}/${count} PASS`);
