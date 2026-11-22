const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { WINDOWS_AUTH_TEST_RUNNER, windowsAuthTestLauncherSource } = require('../tools/firestoreSecurityGate.cjs');
const { verifyRelease } = require('../tools/verify-cp84-snapshot.cjs');
const ROOT = path.resolve(__dirname, '..');

test('CP84 fixes Firebase Windows CLI flag-splitting using a single positional filename', () => {
  assert.equal(WINDOWS_AUTH_TEST_RUNNER, 'cla-firestore-authz.cmd');
  assert.match(WINDOWS_AUTH_TEST_RUNNER, /^[a-z0-9_-]+\.cmd$/);
  const source = fs.readFileSync(path.join(ROOT, 'tools/firestoreSecurityGate.cjs'), 'utf8');
  assert.match(source, /process\.platform === 'win32'\s*\? WINDOWS_AUTH_TEST_RUNNER/);
  assert.match(source, /fs\.writeFileSync\(path\.join\(stage, WINDOWS_AUTH_TEST_RUNNER\)/);
  assert.match(source, /for \(const rel of \[WINDOWS_AUTH_TEST_RUNNER,/);
  assert.match(source, /emulators:exec/);
  assert.match(source, /'--project', PROJECT_ID/);
  assert.match(source, /'--only', 'firestore', nestedCommandArg/);
  assert.doesNotMatch(source, /firebase deploy|deploy --only/);
});

test('CP84 staged Windows launcher uses only reviewed Firestore authorization tests and propagates failures', () => {
  const src = windowsAuthTestLauncherSource();
  assert.match(src, /^@echo off\r\nsetlocal\r\n/);
  assert.match(src, /node --test tests\\firestore\.rules\.cp21\.test\.mjs/);
  assert.match(src, /exit \/b %ERRORLEVEL%/);
  assert.doesNotMatch(src, /deploy|firestore:rules|https?:\/\//);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cla-cp84-launcher-'));
  try {
    const filename = path.join(temp, WINDOWS_AUTH_TEST_RUNNER);
    fs.writeFileSync(filename, src, 'ascii');
    assert.equal(fs.readFileSync(filename,'ascii'), src);
  } finally {
    fs.rmSync(temp, { recursive:true, force:true });
  }
});

test('CP84 immutable source manifest validates current release and excludes generated reports', () => {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT,'CP84_SOURCE_MANIFEST.json'),'utf8'));
  assert.equal(m.schema, 'cla.cp84.immutable-source.v1');
  assert.deepEqual(m.mutableOutputs.slice().sort(), [
    'reports/cp68/test-preflight-status.json',
    'reports/cp73/qa-selftest.json',
    'reports/evidence/cla_cp82_SYNTHETIC_LOCAL_REPLAY.json',
  ].sort());
  assert.equal(verifyRelease(ROOT).ok, true);
});
