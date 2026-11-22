import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/page/orion/OrionPage.tsx', import.meta.url), 'utf8');
const draftHook = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');

test('CP47-01: Orion autosaves only after an explicit local edit and verified draft state', () => {
  assert.match(source, /hasLocalEdits/);
  assert.match(source, /saveStatus !== "ready" && saveStatus !== "empty"/);
  assert.match(source, /window\.setTimeout\(async \(\) =>/);
  assert.match(source, /\}, 700\)/);
  assert.match(source, /await saveDraft\(payload\)/);
});

test('CP47-02: newer edits are not marked saved by an older in-flight autosave', () => {
  assert.match(source, /const revision = editRevision\.current/);
  assert.match(source, /if \(editRevision\.current === revision\)/);
  assert.match(source, /editRevision\.current \+= 1/);
});

test('CP47-03: autosave retains the authenticated Firestore ownership guard', () => {
  assert.match(draftHook, /auth\.currentUser\?\.uid !== uid/);
  assert.match(draftHook, /doc\(db, collections\[moduleName\], ownerUid\)/);
  assert.match(draftHook, /status !== "ready" && status !== "empty"/);
  // CP59 also rejects syncing/cache-only snapshots before any write.
  assert.match(draftHook, /isServerConfirmedSnapshot\(snap\.metadata\)/);
});

test('CP47-04: autosave is a Firestore draft only; no browser storage or outcome claim is introduced', () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /không mang ý nghĩa nhân quả/);
  const sharedStatus = readFileSync(new URL('../src/lib/moduleUiStatus.ts', import.meta.url), 'utf8');
  assert.match(source, /autosave=\{autosaveState\}/);
  assert.match(sharedStatus, /Bản nháp đã được máy chủ xác nhận lưu/);
});

test('CP47-05: manual save cancels a pending autosave to avoid duplicate writes', () => {
  assert.match(source, /autosaveTimer\.current !== null\) window\.clearTimeout\(autosaveTimer\.current\)/);
  assert.match(source, /async function saveCurrentDraft\(\) \{[\s\S]*?autosaveTimer\.current = null/);
});
