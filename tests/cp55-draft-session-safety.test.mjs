import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertDraftRefreshUninterrupted,
  currentDraftListener,
  DraftRefreshInterruptedError,
} from '../src/lib/draftAsyncGuards.ts';

const hook = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');

test('CP55.1 current listener accepts only its active UID and observer epoch', () => {
  assert.equal(currentDraftListener('student-a', 5, 'student-a', 5, true), true);
  assert.equal(currentDraftListener('student-a', 5, 'student-b', 5, true), false);
  assert.equal(currentDraftListener('student-a', 5, 'student-a', 6, true), false);
  assert.equal(currentDraftListener('student-a', 5, 'student-a', 5, false), false);
  assert.equal(currentDraftListener('', 5, '', 5, true), false);
});

test('CP55.2 queued Firestore callback from previous account is rejected', async () => {
  let currentUid = 'student-a';
  let epoch = 9;
  let observed = '';
  const stale = () => {
    if (currentDraftListener('student-a', 9, currentUid, epoch, true)) observed = 'old snapshot';
  };
  currentUid = 'student-b'; epoch += 1;
  stale();
  assert.equal(observed, '');
});

test('CP55.3 remote refresh cannot discard edits made while server is responding', () => {
  assert.doesNotThrow(() => assertDraftRefreshUninterrupted(4, 4));
  assert.throws(() => assertDraftRefreshUninterrupted(4, 5), DraftRefreshInterruptedError);
  assert.throws(() => assertDraftRefreshUninterrupted(4, 5), /Đã giữ lại nội dung đang nhập/);
});

test('CP55.4 listener lifetime and queued-write cancellation use distinct epochs', () => {
  assert.match(hook, /const observerEpoch = useRef\(0\)/);
  assert.match(hook, /const currentListener = \(\) => currentDraftListener\(/);
  assert.match(hook, /if \(!currentListener\(\)\) return;\s*stopLegacyListener\(\)/);
  assert.match(hook, /capturedLegacyEpoch !== legacyEpoch/);
  assert.match(hook, /if \(!currentListener\(\)\) return;\s*setError\(""\)/);
  const reload = hook.slice(hook.indexOf('async function acceptRemote()'), hook.indexOf('async function save('));
  assert.match(reload, /const requestEdits = editGeneration\.current/);
  assert.equal((reload.match(/assertDraftRefreshUninterrupted\(requestEdits, editGeneration\.current\)/g) ?? []).length, 2);
  assert.doesNotMatch(reload, /observerEpoch\.current\s*\+=/);
});

test('CP55.5 cleanup invalidates callbacks and auth failures do not update unmounted hook', () => {
  assert.match(hook, /mounted = false; observerEpoch\.current \+= 1;/);
  assert.match(hook, /if \(mounted\) \{ setStatus\("error"\)/);
});
