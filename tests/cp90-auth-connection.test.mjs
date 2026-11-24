import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { probeFirebaseAuthConnection } from '../src/lib/authConnectionDiagnostics.ts';

const correct = {projectId:'cognitive-learn-ai',apiKey:'test-external-key-123',authEmulator:false,browserOnline:true};
function never() {throw new Error('FETCH_MUST_NOT_BE_CALLED');}
test('detects wrong project and emulator without contacting Firebase', async () => {
  assert.equal((await probeFirebaseAuthConnection({...correct, projectId:'demo-cla-mvp'},never)).code,'WRONG_PROJECT');
  assert.equal((await probeFirebaseAuthConnection({...correct, authEmulator:true},never)).code,'EMULATOR_MODE');
});
test('detects missing key/offline without contacting Firebase', async () => {
  assert.equal((await probeFirebaseAuthConnection({...correct,apiKey:''},never)).code,'NO_API_KEY');
  assert.equal((await probeFirebaseAuthConnection({...correct,browserOnline:false},never)).code,'BROWSER_OFFLINE');
});
test('distinguishes reachable endpoint, rejected configuration and network errors',async () => {
  assert.equal((await probeFirebaseAuthConnection(correct,async()=>({ok:true,status:200}),100)).code,'AUTH_HOST_REACHABLE');
  assert.equal((await probeFirebaseAuthConnection(correct,async()=>({ok:false,status:403}),100)).code,'AUTH_HTTP_REJECTED');
  assert.equal((await probeFirebaseAuthConnection(correct,async()=>{throw new TypeError('offline');},100)).code,'AUTH_NETWORK_BLOCKED');
  assert.equal((await probeFirebaseAuthConnection(correct,async()=>{throw new DOMException('Abort','AbortError');},100)).code,'AUTH_TIMEOUT');
});
test('no key, password or token echoed in the result',async () => {
  const secret='SENSITIVE-SECRET-NEVER-PRINT';
  const value = await probeFirebaseAuthConnection({...correct,apiKey:secret},async()=>({ok:false,status:403}),100);
  assert.doesNotMatch(JSON.stringify(value), /SENSITIVE-SECRET|password=|idToken/);
});
test('login component includes passive, on-click only read-only probe after network error',()=>{
  const src=readFileSync(new URL('../src/page/auth/LoginPage.tsx',import.meta.url),'utf8');
  assert.match(src,/authNetworkError &&/);
  assert.match(src,/firebaseErrorCode\(error\) === "auth\/network-request-failed"/);
  assert.match(src,/onClick=\{\(\) => void handleAuthNetworkProbe\(\)\}/);
});
