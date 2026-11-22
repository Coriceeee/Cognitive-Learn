import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDraftWriteQueue } from '../src/lib/serializedDraftWrites.ts';

const hook = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');
const candidateRules = ['firestore.rules.CANDIDATE', 'firestore.rules.CANDIDATE_CP21']
  .map(file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
const deferred = () => {
  let resolve; let reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
};

test('CP54.1: a refresh waits for an in-flight save, and preserves its return value', async () => {
  const q = createDraftWriteQueue();
  const gate = deferred();
  const order = [];
  const save = q.enqueue(async () => { order.push('save:start'); await gate.promise; order.push('save:done'); });
  const refresh = q.enqueue(async () => { order.push('reload:server'); return { revision: 12 }; });
  await Promise.resolve();
  assert.deepEqual(order, ['save:start']);
  gate.resolve();
  const [_, result] = await Promise.all([save, refresh]);
  assert.deepEqual(order, ['save:start', 'save:done', 'reload:server']);
  assert.deepEqual(result, { revision: 12 });
});

test('CP54.2: failed save does not prevent a safe reload', async () => {
  const q = createDraftWriteQueue();
  const badSave = q.enqueue(async () => { throw new Error('offline'); });
  const reload = q.enqueue(async () => 'server-state');
  await assert.rejects(badSave, /offline/);
  assert.equal(await reload, 'server-state');
});

test('CP54.3: reload serializes with save and invalidates writes queued behind it', async () => {
  const q = createDraftWriteQueue();
  const gate = deferred();
  let session = 5;
  const writeBefore = q.enqueue(async () => { await gate.promise; });
  const refresh = q.enqueue(async () => { session += 1; return 'new baseline'; });
  const capturedSession = session;
  const staleWrite = q.enqueue(async () => {
    if (capturedSession !== session) throw new Error('stale session');
  });
  gate.resolve();
  await writeBefore;
  assert.equal(await refresh, 'new baseline');
  await assert.rejects(staleWrite, /stale session/);
});

test('CP54.4: hook uses shared FIFO for server reload and checks session before applying response', () => {
  const reload = hook.slice(hook.indexOf('async function acceptRemote()'), hook.indexOf('async function save('));
  assert.match(reload, /return writeQueue\.current\.enqueue\(async \(\) => \{/);
  assert.match(reload, /await getDocFromServer/);
  assert.match(reload, /requestSession !== session\.current/);
  assert.match(reload, /session\.current \+= 1; \/\/ cancel older queued writes/);
  assert.ok(reload.indexOf('return writeQueue.current.enqueue') < reload.indexOf('await getDocFromServer'));
});

test('CP54.5: both candidate Rules require revision on create and update', () => {
  for (const rules of candidateRules) {
    for (const section of ['validDraftCreate', 'validDraftUpdate']) {
      const body = rules.split(`function ${section}() {`)[1]?.split('\n    }')[0];
      assert.ok(body, `missing ${section}`);
      assert.match(body, /request\.resource\.data\.keys\(\)\.hasAll\(\['revision'\]\)/);
      assert.match(body, /request\.resource\.data\.revision is int/);
      assert.doesNotMatch(body, /!request\.resource\.data\.keys\(\)\.hasAny/);
    }
    assert.match(rules, /request\.resource\.data\.revision == 1/);
    assert.match(rules, /request\.resource\.data\.revision == resource\.data\.get\('revision', 0\) \+ 1/);
  }
});

test('CP54.6: Emulator suite includes revised creates and legacy migration checks', () => {
  const emulator = readFileSync(new URL('../tests/firestore.rules.cp21.test.mjs', import.meta.url), 'utf8');
  assert.match(emulator, /M05 CP54 new drafts require revision/);
  assert.match(emulator, /await assertFails\(setDoc\(item, base\)\)/);
  assert.match(emulator, /revision: 1,\s*data: \{ value: 'migrated' \}/);
});
