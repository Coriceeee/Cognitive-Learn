/** CP31 Batch 6 gate-contract tests. These are not Playwright browser tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const runner = read('tools/cp31_browser_e2e.py');
const gate = read('tools/cp31_browser_gate.py');
const pkg = JSON.parse(read('package.json'));

test('B6-01 real mobile E2E uses Playwright Page viewport, not BrowserContext', () => {
  assert.match(runner, /page\.set_viewport_size\(\{"width": 390, "height": 844\}\)/);
  assert.doesNotMatch(runner, /context\.set_viewport_size/);
});
test('B6-02 browser attempt invalidates stale QA gate before auth', () => {
  assert.match(runner, /if not args\.check_config and not args\.preflight:\s*atomic_json\(DEFAULT_REPORT/);
  assert.match(runner, /'overall': 'BLOCKED'/);
  assert.match(runner, /abort_reason=fatal_error/);
});
test('B6-03 all 72 distinct cases required, without permissive count shortcuts', () => {
  assert.match(gate, /len\(result\) != 72 or len\(set\(result\)\) != 72/);
  assert.match(gate, /if passed == len\(rows\) else 'FAIL'/);
  assert.match(gate, /Missing, duplicate, or reordered case IDs/);
});
test('B6-04 QA identity checked before and after login without mocking role', () => {
  assert.match(runner, /local_qa_project\(origin, project_id\)/);
  assert.match(runner, /'Project: ' \+ project_id/);
  assert.match(runner, /sign_in\(page, origin, \*accounts\["ADMIN"\], "ADMIN"\)/);
  assert.doesNotMatch(runner, /page\.route\(|setDoc\(|updateDoc\(|firebaseAdmin|storage_state=/);
});
test('B6-05 E2E report is sanitized and atomic, no page body or credential capture', () => {
  assert.match(gate, /def atomic_json\(/);
  assert.match(gate, /os\.replace\(tmp, path\)/);
  assert.match(gate, /Only store an error \*type\*/);
  assert.doesNotMatch(runner, /\.screenshot\(|\.tracing\.|\.video\.|\.har\b/);
});
test('B6-06 static verification does not silently count as browser pass', () => {
  assert.ok(pkg.scripts['test:cp31:batch6'].includes('test_browser_*.py'));
  assert.match(pkg.scripts['audit:cp31:browser'], /cp31_browser_gate\.py/);
  assert.match(pkg.scripts['verify:cp31:batch6'], /verify:cp31:batch5/);
  assert.doesNotMatch(pkg.scripts['verify:cp31:batch6'], /test:cp31:browser/);
  assert.match(pkg.scripts['verify:cp31:batch6:full'], /test:cp31:browser/);
  assert.match(pkg.scripts['verify:cp31:batch6:full'], /audit:cp31:browser/);
});
test('B6-07 never bundle or track old E2E report as release evidence', () => {
  assert.match(read('.gitignore'), /^reports\/e2e\//m);
});
