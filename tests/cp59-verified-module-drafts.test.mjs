import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isMatchingAccountRecord, isServerConfirmedSnapshot} from '../src/page/seed/services/realtimeReadPolicy.ts';
import {canPrefillFromVerifiedTranscript} from '../src/lib/transcriptPrefillEligibility.ts';

const read = relative => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const hook = read('src/lib/useModuleDraft.ts');
const uid = 'student-test-a';

test('CP59.1: cached and pending module snapshots are never server-confirmed', () => {
  assert.equal(isServerConfirmedSnapshot({fromCache:false, hasPendingWrites:false}),true);
  for (const metadata of [null, undefined, {}, {fromCache:true,hasPendingWrites:false},
    {fromCache:false,hasPendingWrites:true}, {fromCache:true,hasPendingWrites:true}]) {
    assert.equal(isServerConfirmedSnapshot(metadata),false);
  }
});

test('CP59.2: reject records owned by another account, allow safe legacy shape', () => {
  assert.equal(isMatchingAccountRecord({userId:uid,revision:2},uid),true);
  assert.equal(isMatchingAccountRecord({userId:'student-test-b',revision:2},uid),false);
  assert.equal(isMatchingAccountRecord({userId:uid,dataScope:'production'},uid),false);
  assert.equal(isMatchingAccountRecord({orion:{}},uid),true);
});

test('CP59.3: primary and legacy listeners request metadata changes and gate readValue', () => {
  assert.match(hook,/onSnapshot\(doc\(db, collections\[moduleName\], user\.uid\),\s*\{ includeMetadataChanges: true \}/);
  assert.match(hook,/onSnapshot\(doc\(db, "module_drafts", user\.uid\),\s*\{ includeMetadataChanges: true \}/);
  assert.equal((hook.match(/!isServerConfirmedSnapshot\((?:snap|legacy)\.metadata\)/g)||[]).length,2);
  assert.match(hook,/if \(!isServerConfirmedSnapshot\(snap\.metadata\)\) \{[\s\S]*?waitForServer\(\); return;/);
  assert.match(hook,/if \(!isServerConfirmedSnapshot\(legacy\.metadata\)\) \{ waitForServer\(\); return; \}/);
});

test('CP59.4: offline cache cannot become a CAS baseline and local edits are preserved', () => {
  assert.match(hook,/const waitForServer = \(\) => \{[\s\S]*?if \(!editing\.current\) \{[\s\S]*?setDraft\(null\);[\s\S]*?baseline\.current = noDocument;[\s\S]*?setStatus\("syncing"\);/);
  assert.match(hook,/if \(!editing\.current && !conflictRef\.current\)/);
  assert.match(hook,/if \(stopLegacy\) return;/);
});

test('CP59.5: primary, legacy and explicit reload validate current UID before displaying', () => {
  assert.ok((hook.match(/isMatchingAccountRecord\(/g)||[]).length >= 4);
  assert.match(hook,/fail\(\{code: "invalid-owner"\}\)/);
  assert.match(hook,/if \(!isMatchingAccountRecord\(data, ownerUid\)\)/);
  assert.match(hook,/if \(legacy\.exists\(\) && !isMatchingAccountRecord\(legacy\.data\(\), ownerUid\)\)/);
});

test('CP59.6: cloud saves require verified status; only an active Orion local fallback may save locally', () => {
  assert.match(hook,/const localFallbackReady = moduleName === "orion" && status === "local" && localOnly\.current/);
  assert.match(hook,/status !== "ready" && status !== "empty" && !localFallbackReady/);
  assert.match(hook,/await runTransaction\(db, async transaction => \{/);
  assert.match(hook,/assertDraftUnchanged\(expected, draftVersion\(stored\)\)/);
});

test('CP59.7: Orion, Pulse and Haven disable save and explain server-sync state', () => {
  for (const page of ['orion/OrionPage.tsx','pulse/PulsePage.tsx','haven/HavenPage.tsx']) {
    const text=read(`src/page/${page}`);
    assert.match(text,/saveStatus !== "ready" && saveStatus !== "empty"/);
    // CP66: the message is centralized, so verify the actual shared resolver
    // plus that every module wires its verified Firestore status into it.
    assert.match(text,/<ModuleDraftFeedback status=\{saveStatus\}/);
    const uiState=read('src/lib/moduleUiStatus.ts');
    assert.match(uiState,/input\.status === 'syncing'/);
    assert.match(uiState,/cache chưa phải dữ liệu đã đồng bộ/);
    assert.match(text,/conflict: draftConflict/);
  }
});

test('CP59.8: Seed verified-prefill is gated while module-draft server sync is pending', () => {
  const base = {draftOwnerUid:uid, transcriptOwnerUid:uid, draftStatus:'empty',
    transcriptStatus:'ready', seededOwnerUid:null, hasSupportedGrades:true};
  assert.equal(canPrefillFromVerifiedTranscript(base),true);
  assert.equal(canPrefillFromVerifiedTranscript({...base,draftStatus:'syncing'}),false);
  assert.equal(canPrefillFromVerifiedTranscript({...base,transcriptStatus:'syncing'}),false);
});
