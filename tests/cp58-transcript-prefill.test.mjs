import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canPrefillFromVerifiedTranscript } from '../src/lib/transcriptPrefillEligibility.ts';

const state = {
  draftOwnerUid: 'student-a', transcriptOwnerUid: 'student-a',
  draftStatus: 'empty', transcriptStatus: 'ready',
  seededOwnerUid: null, hasSupportedGrades: true, hasLocalEdits: false,
};
const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('CP58.1: Seed → Orion/Haven prefill requires both server-verified records for same UID', () => {
  assert.equal(canPrefillFromVerifiedTranscript(state), true);
  for (const changes of [
    {draftOwnerUid: ''}, {transcriptOwnerUid: null},
    {transcriptOwnerUid: 'student-b'}, {draftStatus: 'loading'},
    {draftStatus: 'ready'}, {draftStatus: 'error'},
    {transcriptStatus: 'loading'}, {transcriptStatus: 'syncing'},
    {transcriptStatus: 'error'}, {transcriptStatus: 'empty'},
  ]) assert.equal(canPrefillFromVerifiedTranscript({...state, ...changes}), false, JSON.stringify(changes));
});

test('CP58.2: an empty transcript cannot consume the first eligible prefill', () => {
  assert.equal(canPrefillFromVerifiedTranscript({...state,hasSupportedGrades:false}), false);
  assert.equal(canPrefillFromVerifiedTranscript({...state,hasSupportedGrades:true}), true);
});

test('CP58.3: manual edits take priority and same student is prefilled at most once', () => {
  assert.equal(canPrefillFromVerifiedTranscript({...state,hasLocalEdits:true}), false);
  assert.equal(canPrefillFromVerifiedTranscript({...state,seededOwnerUid:'student-a'}), false);
});

test('CP58.4: account A prefill never blocks an eligible account B prefill', () => {
  assert.equal(canPrefillFromVerifiedTranscript({...state,draftOwnerUid:'student-b',transcriptOwnerUid:'student-b',seededOwnerUid:'student-a'}), true);
  assert.equal(canPrefillFromVerifiedTranscript({...state,draftOwnerUid:'student-b',transcriptOwnerUid:'student-a',seededOwnerUid:'student-a'}), false);
});

test('CP58.5: Orion and Haven bind the prefill to verified UIDs, not any cached transcript', () => {
  for (const page of ['src/page/orion/OrionPage.tsx','src/page/haven/HavenPage.tsx']) {
    const content = source(page);
    assert.match(content, /canPrefillFromVerifiedTranscript\(\{/);
    assert.match(content, /draftOwnerUid, transcriptOwnerUid: transcript\.userId/);
    assert.match(content, /transcriptStatus: transcript\.status/);
    assert.match(content, /seededFromTranscript\.current = draftOwnerUid/);
    assert.doesNotMatch(content, /seededFromTranscript\.current = true/);
  }
});

test('CP58.6: Haven does not mark empty/unsupported grades as prefilled', () => {
  const haven = source('src/page/haven/HavenPage.tsx');
  assert.match(haven, /hasSupportedGrades: yearly\.length > 0 \|\|/);
  const eligibility = haven.indexOf('canPrefillFromVerifiedTranscript');
  const consumed = haven.indexOf('seededFromTranscript.current = draftOwnerUid');
  assert.ok(eligibility >= 0 && consumed > eligibility);
  assert.match(haven, /localInputEdited\.current = true/);
});

test('CP58.7: transcript prefill never performs Firestore writes or fabricates a missing score', () => {
  const helper = source('src/lib/transcriptPrefillEligibility.ts');
  assert.doesNotMatch(helper, /runTransaction|setDoc|updateDoc|localStorage|sessionStorage/);
  assert.match(source('src/page/orion/OrionPage.tsx'), /grade\.provisional !== null/);
  assert.match(source('src/page/haven/HavenPage.tsx'), /englishGrade !== null && englishGrade !== undefined/);
});

test('CP58.8: App re-renders for same-path query changes without hard reload', () => {
  const app = source('src/App.tsx');
  assert.match(app, /href: getNavigationSnapshot\(\)/);
  assert.match(app, /setRouteSnapshot\(\{/);
  assert.match(app, /path: currentFocusedPath\(\), href: getNavigationSnapshot\(\)/);
  assert.match(app, /<AdminDiagnosticsPage key=\{routeSnapshot\.href\}/);
  assert.doesNotMatch(app, /window\.location\.reload\(/);
});

test('CP58.9: Atlas study-abroad synchronizes Back/Forward country query without losing same-country checklist', () => {
  const atlas = source('src/page/study-abroad/StudyAbroadPage.tsx');
  assert.match(atlas, /navigationHref.*string/);
  assert.match(atlas, /new URL\(navigationHref, window\.location\.origin\)/);
  assert.match(atlas, /if \(countryCode !== nextCountry\)/);
  assert.match(atlas, /setChecked\(\[\]\)/);
  assert.match(source('src/App.tsx'), /<StudyAbroadPage navigationHref=\{routeSnapshot\.href\}/);
});
