import test from 'node:test';
import assert from 'node:assert/strict';
import {createDraftWriteQueue} from '../src/lib/serializedDraftWrites.ts';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');
const deferred = () => { let resolve; let reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };

test('CP51: queued older write cannot finish after a newer write', async () => {
  const queue = createDraftWriteQueue();
  const first = deferred(); const order = [];
  const a = queue.enqueue(async () => { order.push('start-old'); await first.promise; order.push('end-old'); });
  const b = queue.enqueue(async () => { order.push('start-new'); order.push('end-new'); });
  await Promise.resolve();
  assert.deepEqual(order, ['start-old']);
  first.resolve(); await Promise.all([a,b]);
  assert.deepEqual(order, ['start-old','end-old','start-new','end-new']);
});

test('CP51: failed earlier write does not poison subsequent writes', async () => {
  const queue = createDraftWriteQueue();
  await assert.rejects(queue.enqueue(async () => { throw Error('offline'); }), /offline/);
  let completed = false;
  await queue.enqueue(async () => { completed = true; });
  assert.equal(completed, true);
});

test('CP51: eligibility checked when queued write starts', async () => {
  const queue = createDraftWriteQueue();
  let owner = 'student-a';
  const gate = deferred();
  const first = queue.enqueue(() => gate.promise);
  const second = queue.enqueue(async () => { if (owner !== 'student-a') throw Error('owner changed'); });
  await Promise.resolve();
  owner = 'student-b'; gate.resolve();
  await first;
  await assert.rejects(second, /owner changed/);
});

test('CP51: Firestore draft hook uses FIFO and checks authenticated owner at execution time', () => {
  assert.match(source, /createDraftWriteQueue/);
  assert.match(source, /writeQueue\.current\.enqueue\(async \(\) =>/);
  assert.match(source, /if \(auth\.currentUser\?\.uid !== ownerUid\)/);
  assert.match(source, /doc\(db, collections\[moduleName\], ownerUid\)/);
});
