import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertDraftUnchanged, draftVersion, DraftConflictError } from '../src/lib/draftRevision.ts';

const snapshot = (revision, data, updatedAt) => ({
  userId: 'student-test', schemaVersion: 1, revision, data, updatedAt,
});
const payload = { scores: {math: '8', english: '7.5'}, weeksLeft: '12' };

test('CP57.1 revisioned documents do not conflict during serverTimestamp null -> resolved', () => {
  const optimistic = draftVersion(snapshot(6, payload, null));
  const server = draftVersion(snapshot(6, payload, {seconds: 1800000000,nanoseconds: 2}));
  assert.equal(optimistic.signature, server.signature);
  assert.doesNotThrow(() => assertDraftUnchanged(optimistic, server));
  assert.doesNotThrow(() => assertDraftUnchanged(server, optimistic));
});

test('CP57.2 local timestamp estimates do not create phantom conflicts', () => {
  const cached = draftVersion(snapshot(3, payload, {seconds: 1799999999,nanoseconds: 0}));
  const committed = draftVersion(snapshot(3, {...payload, scores: {english: '7.5',math: '8'}}, {seconds: 1800000000,nanoseconds: 75}));
  assert.doesNotThrow(() => assertDraftUnchanged(cached, committed));
});

test('CP57.3 genuine remote edits remain blocked even if revision was reused', () => {
  const expected = draftVersion(snapshot(3, payload, null));
  assert.throws(() => assertDraftUnchanged(expected, draftVersion(snapshot(3, {...payload,weeksLeft:'1'}, {seconds:1800000000,nanoseconds:10}))), DraftConflictError);
  assert.throws(() => assertDraftUnchanged(expected, draftVersion(snapshot(4, payload, {seconds:1800000000,nanoseconds:10}))), DraftConflictError);
});

test('CP57.4 legacy revision-less documents keep timestamp ABA protection', () => {
  const legacy = {userId:'student-test',schemaVersion:1,data:payload,updatedAt:{seconds:1800000000,nanoseconds:2}};
  const first = draftVersion(legacy);
  assert.equal(first.revision, 0);
  assert.throws(() => assertDraftUnchanged(first, draftVersion({...legacy, updatedAt:{seconds:1800000000,nanoseconds:3}})), DraftConflictError);
});

test('CP57.5 acknowledgement with unknown timestamp still enforces exact payload', () => {
  const current = draftVersion(snapshot(5, payload, null));
  const saved = {exists:true,revision:5,signature:'',payloadSignature:current.payloadSignature};
  assert.doesNotThrow(() => assertDraftUnchanged(saved, draftVersion(snapshot(5,payload,{seconds:1800000001,nanoseconds:0}))));
  assert.throws(() => assertDraftUnchanged(saved, draftVersion(snapshot(5,{...payload,weeksLeft:'2'},null))), DraftConflictError);
});

test('CP57.6 draft hook remains protected by server-side transaction CAS', () => {
  const hook = readFileSync(new URL('../src/lib/useModuleDraft.ts', import.meta.url), 'utf8');
  assert.match(hook, /await runTransaction\(db, async transaction => \{/);
  assert.match(hook, /assertDraftUnchanged\(expected, draftVersion\(stored\)\)/);
  assert.match(hook, /payloadSignature: draftPayloadSignature\(value\)/);
});
