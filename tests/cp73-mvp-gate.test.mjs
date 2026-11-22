import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('../tools/cp73_mvp_gate.py',import.meta.url),'utf8');
const run=(args)=>spawnSync('python',['tools/cp73_mvp_gate.py',...args],{cwd:root,encoding:'utf8',timeout:30000});

test('CP73 release gate rejects public host before reading QA credentials',()=>{
  const out=run(['--base-url','https://example.com','--report','reports/cp73/public-check.json']);
  assert.equal(out.status,2);assert.match(out.stderr,/loopback/);
  assert.equal(fs.existsSync(new URL('../reports/cp73/public-check.json',import.meta.url)),false);
});
test('CP73 gate rejects network origin with username/password or path',()=>{
  for(const addr of ['http://user:password@127.0.0.1:5173','http://127.0.0.1:5173/admin','http://127.0.0.1:5173/?token=x']) {
    assert.equal(run(['--base-url',addr,'--preflight']).status,2);
  }
});
test('CP73 gate rejects report paths outside release root',()=>{
  const out=run(['--report','../../etc/cla-mvp-qa.json','--preflight']);
  assert.equal(out.status,2);assert.match(out.stderr,/within the project/);
});
test('CP73 local gate writes a redacted, explicitly blocked report before dependencies installed',()=>{
  // The QA .env.local does not ship in ZIP, so this case remains blocked on
  // fresh checkout regardless of what another machine has installed.
  const out=run(['--report','reports/cp73/qa-selftest.json','--preflight']);
  assert.ok([0,2].includes(out.status));
  const data=JSON.parse(fs.readFileSync(new URL('../reports/cp73/qa-selftest.json',import.meta.url),'utf8'));
  assert.equal(data.mvpAccepted,false);assert.ok(['BLOCKED','PREFLIGHT_PASS_NOT_MVP'].includes(data.status));
  assert.deepEqual(Object.keys(data.checks),['qaConfiguration','dependencies','firebaseCli','emulatorPorts','localReactOrigin','productionBuild','firestoreRulesEmulator','realBrowserE2E']);
  assert.doesNotMatch(JSON.stringify(data),/password|@example\.|apiKey|idToken/i);
});
test('CP73 includes actual build, Emulator Rules and React E2E in candidate gate',()=>{
  assert.match(source, /'npm','run','build'/);
  assert.match(source, /'npm','run','test:rules:emulator'/);
  assert.match(source,/tools\/cp68_student_ux_e2e\.py/);
  assert.match(source,/len\(evidence\.get\('checks',\[\]\)\) != 12/);
  assert.match(source,/I_USE_SYNTHETIC_QA_ACCOUNTS/);
});
test('Local QA template must opt into consent gate and nonproduction Firebase ID',()=>{
  const txt=fs.readFileSync(new URL('../.env.mvp-qa.example',import.meta.url),'utf8');
  assert.match(txt,/VITE_CLA_STUDENT_CONSENT_GATE=true/);
  assert.match(txt,/VITE_FIREBASE_PROJECT_ID=demo-cla-mvp/);
  assert.doesNotMatch(txt,/VITE_FIREBASE_PROJECT_ID=cognitive-learn-ai/);
});
