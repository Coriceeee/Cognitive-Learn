const test = require('node:test');
const assert = require('node:assert/strict');
const {parseEnv,assess} = require('../tools/check-cp81-deploy-env.cjs');
const safe = {
  VITE_USE_FIREBASE_EMULATORS: 'false',
  VITE_FIREBASE_PROJECT_ID: 'cognitive-learn-ai',
  VITE_FIREBASE_API_KEY: 'an-example-valid-value',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
  VITE_FIREBASE_AUTH_DOMAIN: 'cognitive-learn-ai.firebaseapp.com',
  VITE_CLA_STUDENT_CONSENT_GATE: 'true',
};
test('CP81 production gate blocks emulator configurations', () => {
  assert.ok(assess({...safe,VITE_USE_FIREBASE_EMULATORS:'true'}).some(x=>x.includes('EMULATORS')));
});
test('CP81 production gate blocks demo/unknown Firebase project', () => {
  assert.ok(assess({...safe,VITE_FIREBASE_PROJECT_ID:'demo-cla-mvp'}).some(x=>x.includes('PROJECT_ID')));
});
test('CP81 production gate blocks no consent and missing config', () => {
  assert.ok(assess({...safe,VITE_CLA_STUDENT_CONSENT_GATE:'false',VITE_FIREBASE_APP_ID:''}).length >= 2);
});
test('CP81 production gate passes complete reviewed public config', () => {
  assert.deepEqual(assess(safe),[]);
});
test('CP81 only parses allowlisted public Vite keys', () => {
  assert.deepEqual(parseEnv('GEMINI_API_KEY=TOP_SECRET\nVITE_FIREBASE_PROJECT_ID="cognitive-learn-ai"\n'),{
    VITE_FIREBASE_PROJECT_ID:'cognitive-learn-ai'
  });
});
