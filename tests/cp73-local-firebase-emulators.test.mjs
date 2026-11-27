import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveLocalFirebaseEmulators as resolve} from '../src/lib/localFirebaseEmulators.ts';
import {resolveLiveFirebaseDefines} from '../tools/cla_vite_firebase_env.ts';

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
  assert.equal(pkg.scripts.dev,'node tools/cla_vite_dev.mjs');
  assert.equal(pkg.scripts['dev:qa'],'node tools/cla_vite_dev.mjs --qa');
});

const liveEnv = {
  VITE_FIREBASE_API_KEY: 'AIzaSyA123456789012345678901234567890123',
  VITE_FIREBASE_AUTH_DOMAIN: 'cognitive-learn-ai.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'cognitive-learn-ai',
  VITE_FIREBASE_STORAGE_BUCKET: 'cognitive-learn-ai.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef123456',
  VITE_USE_FIREBASE_EMULATORS: 'true',
};

test('normal local Vite serve pins all Firebase values to LIVE and disables stale Emulator flags',()=>{
  const defines=resolveLiveFirebaseDefines('serve',false,liveEnv);
  assert.equal(JSON.parse(defines['import.meta.env.VITE_FIREBASE_PROJECT_ID']),'cognitive-learn-ai');
  assert.equal(JSON.parse(defines['import.meta.env.VITE_FIREBASE_API_KEY']),liveEnv.VITE_FIREBASE_API_KEY);
  assert.equal(JSON.parse(defines['import.meta.env.VITE_USE_FIREBASE_EMULATORS']),'false');
});

test('Firebase Emulator is available only through explicit QA launcher opt-in; production builds require LIVE config',()=>{
  const previousCI=process.env.CI;
  delete process.env.CI;
  try {
    assert.deepEqual(resolveLiveFirebaseDefines('serve',true,{}),{});
    assert.throws(()=>resolveLiveFirebaseDefines('build',false,{}),/cognitive-learn-ai/);
    const buildDefines=resolveLiveFirebaseDefines('build',false,liveEnv);
    assert.equal(JSON.parse(buildDefines['import.meta.env.VITE_FIREBASE_PROJECT_ID']),'cognitive-learn-ai');
    assert.equal(JSON.parse(buildDefines['import.meta.env.VITE_USE_FIREBASE_EMULATORS']),'false');
  } finally {
    if(previousCI===undefined) delete process.env.CI; else process.env.CI=previousCI;
  }
});

test('normal local Vite serve fails fast instead of using fake or wrong Firebase credentials',()=>{
  assert.throws(()=>resolveLiveFirebaseDefines('serve',false,{...liveEnv,VITE_FIREBASE_API_KEY:'fake-api-key'}),/Web API key Firebase hợp lệ/);
  assert.throws(()=>resolveLiveFirebaseDefines('serve',false,{...liveEnv,VITE_FIREBASE_PROJECT_ID:'demo-cla-mvp'}),/cognitive-learn-ai/);
  assert.throws(()=>resolveLiveFirebaseDefines('serve',false,{...liveEnv,VITE_FIREBASE_APP_ID:''}),/VITE_FIREBASE_AUTH_DOMAIN hoặc VITE_FIREBASE_APP_ID/);
});

test('npm run dev uses guarded LIVE launcher and dev:qa is explicitly separate',()=>{
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  assert.equal(pkg.scripts.dev,'node tools/cla_vite_dev.mjs');
  assert.equal(pkg.scripts['dev:qa'],'node tools/cla_vite_dev.mjs --qa');
});

test('Firebase emulator activation is compile-time gated by the dedicated QA launcher, not VITE env files',()=>{
  const firebase=readFileSync(new URL('../src/lib/firebase.ts',import.meta.url),'utf8');
  const vite=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
  const types=readFileSync(new URL('../src/vite-env.d.ts',import.meta.url),'utf8');
  assert.match(vite,/__CLA_FIREBASE_QA__:\s*JSON\.stringify\(qaOptIn\)/);
  assert.match(firebase,/enabled:\s*__CLA_FIREBASE_QA__\s*\?\s*'true'\s*:\s*'false'/);
  assert.doesNotMatch(firebase,/enabled:\s*import\.meta\.env\.VITE_USE_FIREBASE_EMULATORS/);
  assert.match(types,/declare const __CLA_FIREBASE_QA__:\s*boolean/);
});

test('normal dev launcher never opts into Firebase Emulator; QA launcher is explicit',()=>{
  const launcher=readFileSync(new URL('../tools/cla_vite_dev.mjs',import.meta.url),'utf8');
  assert.match(launcher,/const qa = process\.argv\.includes\('--qa'\)/);
  assert.match(launcher,/if \(qa\) process\.env\.CLA_FIREBASE_QA = 'true'/);
  assert.match(launcher,/mode: qa \? 'development' : 'live'/);
});

test('live Firebase initialization rejects fake keys and wrong project before initializeApp',()=>{
  const firebase=readFileSync(new URL('../src/lib/firebase.ts',import.meta.url),'utf8');
  const guard=firebase.indexOf("if (!__CLA_FIREBASE_QA__)");
  const initialize=firebase.indexOf("const app = initializeApp(firebaseConfig)");
  assert.ok(guard>=0 && initialize>guard);
  assert.match(firebase,/firebaseConfig\.projectId !== 'cognitive-learn-ai'/);
  assert.match(firebase,/AIza/);
  assert.match(firebase,/Không thể khởi tạo Auth bằng fake-api-key/);
  assert.match(firebase,/LIVE project cognitive-learn-ai; Auth\/Firestore Emulator disabled/);
});
