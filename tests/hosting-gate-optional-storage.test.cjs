'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const gate = path.resolve(__dirname, '../tools/claHostingDeployGate.cjs');
const baseline = [
  'VITE_FIREBASE_API_KEY=AIzaEXAMPLE_NOT_A_REAL_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN=cognitive-learn-ai.firebaseapp.com',
  'VITE_FIREBASE_PROJECT_ID=cognitive-learn-ai',
  'VITE_FIREBASE_MESSAGING_SENDER_ID=111111111111',
  'VITE_FIREBASE_APP_ID=1:111111111111:web:abc123',
  'VITE_USE_FIREBASE_EMULATORS=false',
  'VITE_CLA_STUDENT_CONSENT_GATE=true',
];
function run(extra = [], args = ['--frontend-only', '--offline-check']) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cla-gate-test-'));
  try {
    fs.writeFileSync(path.join(temp, 'package.json'), '{}');
    fs.writeFileSync(path.join(temp, '.firebaserc'), JSON.stringify({ projects: { default: 'cognitive-learn-ai' } }));
    fs.writeFileSync(path.join(temp, 'firebase.json'), JSON.stringify({ hosting: { public: 'dist', rewrites: [{source:'**',destination:'/index.html'}] } }));
    fs.writeFileSync(path.join(temp, '.env.live.local'), baseline.concat(extra).join('\n'));
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('VITE_')));
    return cp.spawnSync(process.execPath, [gate, ...args], { cwd: temp, env, encoding:'utf8' });
  } finally { fs.rmSync(temp, {recursive:true,force:true}); }
}
test('does not require unused storage bucket for frontend-only QA gate', () => {
  const r=run();
  assert.equal(r.status,0, r.stdout + r.stderr);
  assert.match(r.stdout,/HOSTING PREFLIGHT PASS/);
});
test('rejects explicit QA/demo storage bucket', () => {
  const r=run(['VITE_FIREBASE_STORAGE_BUCKET=demo-cla-mvp.appspot.com']);
  assert.equal(r.status,2, r.stdout + r.stderr);
  assert.match(r.stderr,/STORAGE_BUCKET/);
});
test('still blocks disabled product consent gate', () => {
  const r=run(['VITE_CLA_STUDENT_CONSENT_GATE=false']);
  assert.equal(r.status,2, r.stdout + r.stderr);
  assert.match(r.stderr,/Consent Gate/);
});
test('still blocks missing HTTPS backend in normal deployment', () => {
  const r=run([], ['--offline-check']);
  assert.equal(r.status,2,r.stdout+r.stderr);
  assert.match(r.stderr,/VITE_API_BASE_URL/);
});
