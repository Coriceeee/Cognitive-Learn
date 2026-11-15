const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  PROJECT_ID, RULES_FILE, validateConfiguration, validateEmulatorEnvironment,
  overallStatus,
} = require('../tools/firestoreSecurityGate.cjs');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'firebase.emulator.cp21.json'), 'utf8'));

function deepCopy(value) { return JSON.parse(JSON.stringify(value)); }

test('SG01 accepts only reviewed candidate Rules in localhost emulator', () => {
  assert.deepEqual(validateConfiguration(config), {
    projectId: PROJECT_ID, rules: RULES_FILE, host: '127.0.0.1', port: 8080,
  });
});
test('SG02 rejects production or another demo Firebase project', () => {
  for (const id of ['cognitive-learn-ai', 'demo-other-project', '', 'production']) {
    assert.throws(() => validateConfiguration(config, id), /SECURITY STOP/);
  }
});
test('SG03 rejects a different Rules file, including a production Rules path', () => {
  for (const value of ['firestore.rules', 'firestore.rules.CANDIDATE', '', '../other.rules']) {
    const candidate = deepCopy(config); candidate.firestore.rules = value;
    assert.throws(() => validateConfiguration(candidate), /SECURITY STOP/);
  }
});
test('SG04 rejects emulator host binding on all interfaces or external network', () => {
  for (const value of ['0.0.0.0', '10.0.0.2', 'example.com', '']) {
    const candidate = deepCopy(config); candidate.emulators.firestore.host = value;
    assert.throws(() => validateConfiguration(candidate), /SECURITY STOP/);
  }
});
test('SG05 rejects invalid ports and enabled Emulator UI', () => {
  for (const port of [0, -1, 80, 65536, '8080']) {
    const candidate = deepCopy(config); candidate.emulators.firestore.port = port;
    assert.throws(() => validateConfiguration(candidate), /SECURITY STOP/);
  }
  const candidate = deepCopy(config); candidate.emulators.ui.enabled = true;
  assert.throws(() => validateConfiguration(candidate), /SECURITY STOP/);
});
test('SG06 rejects external/injected FIRESTORE_EMULATOR_HOST', () => {
  for (const host of ['example.com:8080','192.168.1.1:8080','0.0.0.0:8080','bad','localhost:1']) {
    assert.throws(() => validateEmulatorEnvironment(host), /SECURITY STOP/);
  }
});
test('SG07 allows only local FIRESTORE_EMULATOR_HOST values or unset', () => {
  for (const host of [undefined, '', 'localhost:8080', '127.0.0.1:8080']) {
    assert.equal(validateEmulatorEnvironment(host), true);
  }
});
test('SG08 overall PASS requires static AND emulator authorization tests PASS', () => {
  assert.equal(overallStatus('PASS','PASS'), 'PASS');
  assert.equal(overallStatus('PASS','BLOCKED'), 'BLOCKED');
  assert.equal(overallStatus('PASS','FAIL'), 'FAIL');
  assert.equal(overallStatus('FAIL','BLOCKED'), 'FAIL');
});
test('SG09 package scripts use fixed demo CLI and cannot invoke deployment', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts['test:rules:emulator'], /firestoreSecurityGate\.cjs/);
  assert.doesNotMatch(packageJson.scripts['test:rules:emulator'], /deploy|firestore:rules/);
  const code = fs.readFileSync(path.join(root, 'tools/firestoreSecurityGate.cjs'), 'utf8');
  assert.match(code, /'--project', PROJECT_ID/);
  assert.doesNotMatch(code, /firebase deploy|deploy --only|--project production/);
});
test('SG10 production firebase.json does not silently deploy candidate Rules', () => {
  const firebase = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
  assert.equal(firebase.firestore, undefined,
    'Candidate rules are not production-deployed by this checkpoint; do not infer deployment');
});

test('SG11 emulator test source fails closed on non-loopback endpoints', () => {
  const code = fs.readFileSync(path.join(root, 'tests/firestore.rules.cp21.test.mjs'), 'utf8');
  assert.match(code, /\['127\.0\.0\.1', 'localhost'\]\.includes\(hostname\)/);
  assert.match(code, /SECURITY STOP: Firestore Emulator must be a local loopback host/);
});
