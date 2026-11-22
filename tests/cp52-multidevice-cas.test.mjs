import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertDraftUnchanged, draftVersion, DraftConflictError } from '../src/lib/draftRevision.ts';

const hook = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');
const orion = readFileSync(new URL('../src/page/orion/OrionPage.tsx', import.meta.url), 'utf8');
const pulse = readFileSync(new URL('../src/page/pulse/PulsePage.tsx', import.meta.url), 'utf8');
const haven = readFileSync(new URL('../src/page/haven/HavenPage.tsx', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules.CANDIDATE', import.meta.url), 'utf8');
const rulesCP21 = readFileSync(new URL('../firestore.rules.CANDIDATE_CP21', import.meta.url), 'utf8');

const data = (revision, value, ns=0) => ({userId:'student-a',schemaVersion:1,revision,data:{value},updatedAt:{seconds:1722222222,nanoseconds:ns}});

test('CP52.1: first write from two empty devices detects competing create', () => {
  const empty = draftVersion(null);
  assert.doesNotThrow(() => assertDraftUnchanged(empty, empty));
  assert.throws(() => assertDraftUnchanged(empty, draftVersion(data(1,'remote'))), DraftConflictError);
});

test('CP52.2: stale device cannot overwrite newer revision', () => {
  const first = draftVersion(data(4,'alpha',12));
  const afterRemoteSave = draftVersion(data(5,'beta',13));
  assert.throws(() => assertDraftUnchanged(first, afterRemoteSave), /thiết bị khác/);
});

test('CP52.3: same revision with changed payload conflicts, timestamp resolution alone does not', () => {
  const first = draftVersion(data(3,'alpha',12));
  assert.throws(() => assertDraftUnchanged(first, draftVersion(data(3,'beta',12))), DraftConflictError);
  assert.doesNotThrow(() => assertDraftUnchanged(first, draftVersion(data(3,'alpha',13))));
});

test('CP52.4: legacy version-less draft detects remote changes before migration', () => {
  const first = {userId:'student-a',schemaVersion:1,data:{value:'alpha'},updatedAt:{seconds:1,nanoseconds:4}};
  assert.equal(draftVersion(first).revision,0);
  assert.doesNotThrow(() => assertDraftUnchanged(draftVersion(first),draftVersion(structuredClone(first))));
  assert.throws(() => assertDraftUnchanged(draftVersion(first),draftVersion({...first,data:{value:'beta'}})), DraftConflictError);
  assert.throws(() => assertDraftUnchanged(draftVersion(first),draftVersion({...first,updatedAt:{seconds:1,nanoseconds:5}})), DraftConflictError);
});

test('CP52.5: canonical signature ignores object key order', () => {
  const a={data:{b:2,a:{y:1,x:2}},updatedAt:{seconds:10,nanoseconds:1}};
  const b={updatedAt:{seconds:10,nanoseconds:1},data:{a:{x:2,y:1},b:2}};
  assert.doesNotThrow(() => assertDraftUnchanged(draftVersion(a),draftVersion(b)));
});

test('CP52.6: queued follow-up write may use acknowledged revision with unknown server timestamp', () => {
  const acknowledged = {exists:true,revision:6,signature:''};
  assert.doesNotThrow(() => assertDraftUnchanged(acknowledged,draftVersion(data(6,'latest'))));
  assert.throws(() => assertDraftUnchanged(acknowledged,draftVersion(data(7,'remote'))), DraftConflictError);
});

test('CP52.7: hook uses server transaction read before write, explicit server reload and local edit guard', () => {
  assert.match(hook,/await runTransaction\(db, async transaction => \{/);
  assert.match(hook,/const current = await transaction\.get\(ref\)/);
  assert.match(hook,/assertDraftUnchanged\(expected, draftVersion\(stored\)\)/);
  assert.match(hook,/transaction\.set\(ref,/);
  assert.match(hook,/revision,\s*data: value, updatedAt: serverTimestamp\(\)/);
  assert.match(hook,/if \(!editing\.current && !conflictRef\.current\)/);
  assert.match(hook,/await getDocFromServer\(doc\(db, collections\[moduleName\], ownerUid\)\)/);
  assert.match(hook,/session\.current \+= 1; \/\/ cancel older queued writes/);
});

test('CP52.8: Orion, Pulse and Haven expose deliberate conflict resolution, keep local editing', () => {
  for (const src of [orion,pulse,haven]) {
    assert.match(src,/conflict: draftConflict/);
    assert.match(src,/markEditing/);
    assert.match(src,/acceptRemote\(\)/);
    assert.match(src,/draftConflict && <button/);
    assert.match(src,/Tải bản mới nhất/);
  }
});

test('CP52.9: candidate rules preserve owner isolation and protect revisioned documents', () => {
  for (const src of [rules,rulesCP21]) {
    assert.match(src,/function validDraftUpdate\(\)/);
    assert.match(src,/request\.resource\.data\.revision == resource\.data\.get\('revision', 0\) \+ 1/);
    for(const module of ['orion','pulse','haven']){
      const section=src.split(`match /${module}_drafts/{uid} {`)[1].split('}')[0];
      assert.match(section,/allow get: if selfAcademicOwner\(uid\)/);
      assert.match(section,/allow update: if ownerRecord\(uid\) && validDraftUpdate\(\)/);
    }
  }
});
