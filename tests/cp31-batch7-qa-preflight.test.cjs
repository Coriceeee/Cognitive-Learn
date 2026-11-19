/** CP31 Batch 7: QA pre-auth project binding; source contract != browser E2E. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const runner = read('tools/cp31_browser_e2e.py');
const pkg = JSON.parse(read('package.json'));

test('B7-N01 index.html embeds public project marker by Vite env substitution', () => {
  assert.match(read('index.html'), /<meta name="cla-firebase-project-id" content="%VITE_FIREBASE_PROJECT_ID%"\s*\/>/);
  assert.doesNotMatch(read('index.html'), /apiKey|password|token/i);
});
test('B7-N02 source fingerprint tracks entry HTML as part of release integrity', () => {
  const tool = read('tools/cp31_release_fingerprint.cjs');
  assert.match(tool, /SOURCE_FILES\s*=\s*\[[^\]]*'index\.html'/);
  const { trackedFiles } = require('../tools/cp31_release_fingerprint.cjs');
  assert.ok(trackedFiles().includes('index.html'));
});
test('B7-N03 pre-auth live project binding precedes all credential collection', () => {
  assert.match(runner, /qa_preflight\(origin, project_id\)/);
  assert.ok(runner.indexOf('qa_preflight(origin, project_id)') < runner.lastIndexOf('accounts = require_accounts'));
  assert.match(runner, /assert_qa_origin_project\(origin, project_id\)/);
});
test('B7-N04 HTML served project marker cannot be bypassed by HTTPS staging', () => {
  assert.match(runner, /class _NoRedirect\(HTTPRedirectHandler\):/);
  assert.match(runner, /len\(parser\.values\) != 1/);
  assert.match(runner, /parser\.values\[0\] != expected_id/);
  assert.match(runner, /response\.read\(131073\)/);
});
test('B7-N05 --preflight does not invalidate browser evidence or request passwords', () => {
  assert.match(runner, /not args\.check_config and not args\.preflight/);
  assert.match(runner, /if args\.preflight:/);
  assert.match(runner, /0 passwords requested; 0 browser cases run/);
});
test('B7-N06 existing 72-case QA inventory/report remains unchanged', () => {
  const gate = require('node:child_process').spawnSync('python',['tools/cp31_browser_gate.py','--help'],{cwd:root,encoding:'utf8'});
  assert.equal(gate.status,0,gate.stderr);
  assert.match(read('tools/cp31_browser_gate.py'), /if len\(result\) != 72/);
  assert.match(pkg.scripts['qa:cp31:browser'], /--prompt-passwords/);
});
test('B7-N07 new scripts distinguish preflight, contracts and privileged real QA', () => {
  assert.match(pkg.scripts['qa:cp31:preflight'], /--preflight/);
  assert.match(pkg.scripts['test:cp31:batch7'], /test_browser_\*\.py/);
  assert.match(pkg.scripts['verify:cp31:batch7'], /verify:cp31:batch6/);
  assert.doesNotMatch(pkg.scripts['verify:cp31:batch7'], /qa:cp31:browser/);
});
