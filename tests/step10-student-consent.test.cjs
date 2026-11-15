const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = (part) => fs.readFileSync(path.join(root, part), 'utf8');
const rules = source('firestore.rules.CANDIDATE_CP21');
const gate = source('src/components/common/AccessGate.tsx');
const consentPage = source('src/page/seed/StudentConsentPage.tsx');
const helperSource = source('src/lib/studentConsentPolicy.ts');
const moduleOutput = ts.transpileModule(helperSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
const sandbox = { exports: {}, module: { exports: {} } };
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(moduleOutput.outputText, sandbox);
const policy = sandbox.module.exports;

test('SC01 new, missing consent is never accepted', () => {
  assert.equal(policy.readProductConsent(null, 'uid-1'), 'missing');
});
test('SC02 same UID and notice required', () => {
  const record = policy.createProductConsentRecord('uid-1', true, 1000);
  assert.equal(policy.readProductConsent(record, 'uid-1'), 'accepted');
  assert.equal(policy.readProductConsent(record, 'uid-2'), 'missing');
  assert.equal(policy.readProductConsent({ ...record, noticeVersion: 'old' }, 'uid-1'), 'outdated');
});
test('SC03 withdrawn consent is not active', () => {
  const record = policy.createProductConsentRecord('uid-1', false, 1000);
  assert.equal(policy.readProductConsent(record, 'uid-1'), 'withdrawn');
});
test('SC04 product consent never enrolls in research', () => {
  assert.equal(policy.createProductConsentRecord('a', true, 1000).researchConsent, false);
  assert.equal(policy.createProductConsentRecord('a', false, 1000).researchConsent, false);
});
test('SC05 helper rejects blank identity', () => {
  assert.throws(() => policy.createProductConsentRecord(' ', true, 1000));
});
test('SC06 root routing includes student consent page', () => {
  assert.match(source('src/App.tsx'), /path === "\/student\/consent"/);
});
test('SC07 student consent route allowed by role gate', () => {
  assert.match(gate, /"\/student\/consent"/);
  assert.match(gate, /STUDENT_CONSENT_GATE_ENABLED && actualRole === "student" && path !== "\/student\/consent"/);
});
test('SC08 protected student pages read consent from server', () => {
  assert.match(gate, /getDocFromServer\(doc\(db, "student_consents", user.uid\)\)/);
  assert.match(gate, /consent !== "accepted"/);
});
test('SC09 UI has separate acceptance and withdrawal controls', () => {
  assert.match(consentPage, /saveDecision\(true\)/);
  assert.match(consentPage, /saveDecision\(false\)/);
});
test('SC10 UI requires explicit acknowledgment', () => {
  assert.match(consentPage, /accept && !acknowledged/);
});
test('SC11 UI never silently enrolls research', () => {
  assert.match(consentPage, /không đăng ký bạn tham gia nghiên cứu/);
  assert.doesNotMatch(consentPage, /researchConsent:\s*true/);
});
test('SC12 Rules include consent owner-only and strict schema', () => {
  assert.match(rules, /match \/student_consents\/\{uid\}/);
  assert.match(rules, /allow get: if studentOwns\(uid\)/);
  assert.match(rules, /data\.researchConsent == false/);
});
test('SC13 Rules gate academic writes, including profile and transcript', () => {
  assert.match(rules, /function academicMayPersist\(uid\)/);
  assert.match(rules, /match \/learning_profiles\/\{uid\}[\s\S]*?allow create: if academicMayPersist\(uid\)/);
  assert.match(rules, /function ownerRecord\(uid\)\s*\{\s*return academicMayPersist\(uid\)/);
  assert.match(rules, /match \/student_transcripts\/\{uid\}[\s\S]*?allow create: if ownerRecord\(uid\)/);
});
test('SC14 existing teacher/parent share gates closed on withdrawal', () => {
  assert.match(rules, /hasProductConsent\(data\.studentId\)/);
  assert.match(rules, /hasProductConsent\(resource\.data\.studentId\)/);
});
test('SC15 UI warns guardian identity is unverified', () => {
  assert.match(consentPage, /chưa xác minh được chữ ký hoặc danh tính người giám hộ/);
});

test('SC16 safe rollout stays off unless explicitly enabled', () => {
  assert.match(source('src/lib/studentConsentConfig.ts'), /VITE_CLA_STUDENT_CONSENT_GATE === "true"/);
  assert.match(consentPage, /status === "preview"/);
});

test('SC17 assistant cannot mount outside the protected route gate', () => {
  const app = source('src/App.tsx');
  assert.match(app, /<AccessGate path=\{path\}>[\s\S]*?<FloatingAdvisorChat \/>[\s\S]*?<\/AccessGate>/);
  assert.doesNotMatch(app, /<AppFooter \/>\s*<FloatingAdvisorChat \/>/);
});
