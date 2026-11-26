import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canImportSeedSnapshotOnce, canPrefillFromVerifiedTranscript } from '../src/lib/transcriptPrefillEligibility.ts';

const state = {
  draftOwnerUid: 'student-a', transcriptOwnerUid: 'student-a',
  draftStatus: 'empty', transcriptStatus: 'ready',
  seededOwnerUid: null, hasSupportedGrades: true, hasLocalEdits: false,
};
const stateBaseForSnapshot = state;
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

test('CP58.5: Orion and Haven bind imports to verified UIDs, not cached transcripts', () => {
  const orion = source('src/page/orion/OrionPage.tsx');
  assert.match(orion, /canImportSeedSnapshotOnce\(\{/);
  assert.match(orion, /draftOwnerUid, transcriptOwnerUid: transcript\.userId/);
  assert.match(orion, /transcriptStatus: transcript\.status/);
  assert.match(orion, /seededFromTranscript\.current = draftOwnerUid/);
  assert.doesNotMatch(orion, /seededFromTranscript\.current = true/);
  const haven = source('src/page/haven/HavenPage.tsx');
  assert.match(haven, /canPrefillFromVerifiedTranscript\(\{/);
  assert.match(haven, /draftOwnerUid, transcriptOwnerUid: transcript\.userId/);
  assert.match(haven, /transcriptStatus: transcript\.status/);
  assert.match(haven, /seededFromTranscript\.current = draftOwnerUid/);
  assert.doesNotMatch(haven, /seededFromTranscript\.current = true/);
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


test('CP58.10: Orion snapshots all verified Seed subjects once and preserves existing draft values', () => {
  const orion = source('src/page/orion/OrionPage.tsx');
  const helper = source('src/lib/transcriptPrefillEligibility.ts');
  assert.match(orion, /getLatestSubjectGrades\(transcript\.data\)/);
  assert.match(orion, /seedSubjectGrades\.map\(grade => grade\.subject\)/);
  assert.match(orion, /seedSubjectGrades\.filter\(grade => grade\.provisional !== null\)/);
  assert.match(orion, /seedSubjectsSnapshot/);
  assert.match(orion, /seedSyncVersion === 1/);
  assert.match(orion, /if \(!nextScores\[grade\.subject\]\?\.trim\(\)\) nextScores\[grade\.subject\] = String\(grade\.provisional\)/);
  assert.match(orion, /normalizeSubjectValues\(savedDraft\?\.scores\)/);
  assert.doesNotMatch(orion, /keyBySubject: Record<string, ScoreKey>/);
  assert.doesNotMatch(orion, /type ScoreKey =\s*\n\s*\| "math"/);
  assert.match(helper, /state\.draftStatus === 'empty' \|\| state\.draftStatus === 'ready'/);
  assert.match(helper, /!state\.hasSnapshotMarker/);
});

test('CP58.11: one-time Seed snapshot requires same-owner server transcript and refuses later re-import', () => {
  const state = { ...stateBaseForSnapshot, draftOwnerUid:'student-a', transcriptOwnerUid:'student-a',
    draftStatus:'empty', transcriptStatus:'ready', seededOwnerUid:null, hasSupportedGrades:true,
    hasLocalEdits:false, hasSnapshotMarker:false };
  assert.equal(canImportSeedSnapshotOnce(state), true);
  assert.equal(canImportSeedSnapshotOnce({...state,draftStatus:'ready'}), true);
  for (const changes of [
    {transcriptOwnerUid:'student-b'}, {transcriptStatus:'syncing'}, {draftStatus:'loading'},
    {hasSupportedGrades:false}, {hasLocalEdits:true}, {seededOwnerUid:'student-a'},
    {hasSnapshotMarker:true}, {draftOwnerUid:''},
  ]) assert.equal(canImportSeedSnapshotOnce({...state,...changes}), false, JSON.stringify(changes));
});

test('CP58.9: Atlas study-abroad synchronizes Back/Forward country query without losing same-country checklist', () => {
  const atlas = source('src/page/study-abroad/StudyAbroadPage.tsx');
  assert.match(atlas, /navigationHref.*string/);
  assert.match(atlas, /new URL\(navigationHref, window\.location\.origin\)/);
  assert.match(atlas, /if \(countryCode !== nextCountry\)/);
  assert.match(atlas, /setChecked\(\[\]\)/);
  assert.match(source('src/App.tsx'), /<StudyAbroadPage navigationHref=\{routeSnapshot\.href\}/);
});
