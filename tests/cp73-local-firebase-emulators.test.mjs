import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveLocalFirebaseEmulators as resolve} from '../src/lib/localFirebaseEmulators.ts';

const safe = {
  enabled: 'true', mode: 'development', hostname: '127.0.0.1', protocol: 'http:',
  projectId: 'demo-cla-mvp', apiKey: 'fake-api-key', authDomain: 'demo-cla-mvp.firebaseapp.com',
};
test('QA opt-in disabled does not mutate production connection', () => {
  for (const flag of [undefined, false, 'false', '']) assert.equal(resolve({...safe, enabled: flag}), null);
});
test('Explicit QA opt-in only connects known demo identity to loopback ports', () => {
  assert.deepEqual(resolve(safe), {projectId:'demo-cla-mvp', host:'127.0.0.1', authPort:9099, firestorePort:8080});
  assert.deepEqual(resolve({...safe,hostname:'localhost'}), resolve(safe));
  assert.deepEqual(resolve({...safe,hostname:'::1'}), resolve(safe));
});
test('Unknown opt-in value does not fall through to production', () => {
  for (const enabled of ['1', 'yes', 'TRUE', '0']) assert.throws(() => resolve({...safe,enabled}), /exactly true or false/);
});
test('Production build and external hostname reject QA switch', () => {
  for (const change of [{mode:'production'},{hostname:'cla.example.com'},{protocol:'https:'},{hostname:''}]) {
    assert.throws(() => resolve({...safe,...change}), /loopback development origin/);
  }
});
test('Wrong Firebase project, key or auth domain cannot connect to live project', () => {
  for (const change of [{projectId:'cognitive-learn-ai'},{projectId:''},{apiKey:'AIza-real'},{authDomain:'cognitive-learn-ai.firebaseapp.com'}]) {
    assert.throws(() => resolve({...safe,...change}), /non-demo or mismatched Firebase identity/);
  }
});
test('Firebase SDK connects both emulators only after safety check', () => {
  const firebase=readFileSync(new URL('../src/lib/firebase.ts',import.meta.url),'utf8');
  assert.match(firebase,/const emulator = resolveLocalFirebaseEmulators/);
  assert.ok(firebase.indexOf('const emulator =') < firebase.indexOf('initializeApp('));
  assert.match(firebase,/connectAuthEmulator\(auth,/);
  assert.match(firebase,/connectFirestoreEmulator\(db,/);
  assert.match(firebase,/if \(emulator\) \{/);
});
test('QA template does not contain a real Firebase key or an application secret', () => {
  const template=readFileSync(new URL('../.env.mvp-qa.example',import.meta.url),'utf8');
  for (const value of ['VITE_USE_FIREBASE_EMULATORS=true', 'VITE_FIREBASE_PROJECT_ID=demo-cla-mvp', 'VITE_FIREBASE_API_KEY=fake-api-key']) assert.ok(template.includes(value));
  assert.doesNotMatch(template,/^GEMINI_API_KEY=[^#\s]/m);
});

test('plain npm run dev uses real Firebase live env; emulator stays opt-in via dev:qa',()=>{
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  assert.equal(pkg.scripts.dev,'vite --mode live --open');
  assert.equal(pkg.scripts['dev:qa'],'vite --mode development --open');
});
