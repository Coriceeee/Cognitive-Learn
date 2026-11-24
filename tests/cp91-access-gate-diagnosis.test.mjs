import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { explainAccessFailure } from '../src/lib/accountVerification.ts';

const err = code => Object.assign(new Error('NEVER ECHO PRIVATE DETAILS'), {code});
test('CP91: Firestore permission denial on users document is identified, not bypassed', () => {
  const v=explainAccessFailure(err('permission-denied'),'account-read');
  assert.equal(v.location,'users/{uid}');
  assert.equal(v.retryable,false);
  assert.match(v.guidance,/Firestore Rules/);
});
test('CP91: enabled consent gate surfaces consent read failure distinctly', () => {
  const v=explainAccessFailure(err('firestore/permission-denied'),'consent-read');
  assert.equal(v.location,'student_consents/{uid}');
  assert.match(v.guidance,/Consent Gate/);
});
test('CP91: realtime watcher failure identifies the listener document', () => {
  const a=explainAccessFailure(err('permission-denied'),'account-watch');
  const b=explainAccessFailure(err('permission-denied'),'consent-watch');
  assert.equal(a.location,'users/{uid}');
  assert.equal(b.location,'student_consents/{uid}');
});
test('CP91: network failures are retryable; no account escalation', () => {
  const v=explainAccessFailure(err('unavailable'),'account-read');
  assert.equal(v.retryable,true);
  assert.match(v.guidance,/mạng/);
});
test('CP91: raw internal errors and secrets are never reflected into UI', () => {
  const v=explainAccessFailure(err('private-token-1234'),'auth-stream');
  assert.equal(v.code,'unknown');
  assert.doesNotMatch(JSON.stringify(v),/private-token-1234|NEVER ECHO PRIVATE/);
});
test('CP91: UI never unlocks private children on failed verification', () => {
  const source=fs.readFileSync(new URL('../src/components/common/AccessGate.tsx',import.meta.url),'utf8');
  assert.match(source,/if \(displayStatus === "ready"\) return/);
  assert.match(source,/setAccessFailure\(explainAccessFailure\(error, checkpoint\)\)/);
  assert.match(source,/setAccessFailure\(explainAccessFailure\(error, "account-watch"\)\)/);
  assert.match(source,/setAccessFailure\(explainAccessFailure\(error, "consent-watch"\)\)/);
  assert.match(source,/metadata\.fromCache \|\| snapshot\.metadata\.hasPendingWrites/);
  assert.doesNotMatch(source,/getDocFromCache/);
});
test('CP91: UI shows exact document category and Firebase code without UID',()=>{
  const source=fs.readFileSync(new URL('../src/components/common/AccessGate.tsx',import.meta.url),'utf8');
  assert.match(source,/accessFailure\.location/);
  assert.match(source,/accessFailure\.code/);
  assert.doesNotMatch(source,/user\.uid}/);
});
