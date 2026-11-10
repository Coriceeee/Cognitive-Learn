import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPipelineEvidence } from '../src/lib/pipelineEvidence.ts';

const uid = 'student_A';
const at = '2026-11-08T00:00:00.000Z';
const profile = (extra={}) => ({ userId:uid, schemaVersion:1, dataScope:'student', cognitiveMeasurement:{scoreAvailable:true,overallScore:0,mappingVersion:'cla-cognitive-proxy-v2'}, ...extra });
const transcript = (extra={}) => ({userId:uid,schemaVersion:1,dataScope:'student', ...extra});
const draft = (extra={}) => ({userId:uid,schemaVersion:1,data:{},...extra});
const build = docs => buildPipelineEvidence(uid, docs, at);
const state = (record, stage) => record.stages.find(s => s.stage === stage).status;

test('P01 missing four sources cannot become a report', () => {
  const r = build({}); assert.deepEqual(r.stages.map(s => s.status), ['MISSING','MISSING','MISSING','MISSING']); assert.equal(r.complete,false);
});
test('P02 real Cognitive zero with scoreAvailable and mapping version counts as observed proxy', () => {
  assert.equal(state(build({learning_profiles:profile(),student_transcripts:transcript()}), 'lumen'), 'PRESENT');
});
test('P03 technical zero without scoreAvailable is LIMITED, not an observed zero', () => {
  const r=build({learning_profiles:profile({cognitiveMeasurement:{overallScore:0,scoreAvailable:false}}),student_transcripts:transcript()});
  assert.equal(state(r,'lumen'),'LIMITED');
});
test('P04 inconsistent transcript owner is INVALID', () => {
  assert.equal(state(build({learning_profiles:profile(),student_transcripts:transcript({userId:'other'})}),'seed'),'INVALID');
});
test('P05 inconsistent scopes are INVALID', () => {
  assert.equal(state(build({learning_profiles:profile(),student_transcripts:transcript({dataScope:'demo'})}),'seed'),'INVALID');
});
test('P06 legacy schema is not silently accepted', () => {
  assert.equal(state(build({learning_profiles:profile({schemaVersion:0}),student_transcripts:transcript()}),'seed'),'INVALID');
});
test('P07 drafts can be present only as LIMITED, never confirmed outcomes', () => {
  const r=build({learning_profiles:profile(),student_transcripts:transcript(),orion_drafts:draft(),pulse_drafts:draft()});
  assert.equal(state(r,'orion'),'LIMITED'); assert.equal(state(r,'pulse'),'LIMITED'); assert.equal(r.complete,false);
});
test('P08 unknown dataScope is not treated as student', () => {
  const r=build({learning_profiles:profile({dataScope:'unexpected'}),student_transcripts:transcript()});
  assert.equal(r.scope,'unknown'); assert.equal(state(r,'seed'),'INVALID');
});
test('P09 demo records are labeled non-research', () => {
  const r=build({learning_profiles:profile({dataScope:'demo'}),student_transcripts:transcript({dataScope:'demo'})});
  assert.equal(r.scope,'demo'); assert.ok(r.notes.some(note=>note.includes('DEMO')));
});
test('P10 missing cognitive and invalid draft are distinguished', () => {
  const r=build({learning_profiles:profile({cognitiveMeasurement:null}),student_transcripts:transcript(),orion_drafts:draft({data:'invalid'})});
  assert.equal(state(r,'lumen'),'MISSING');assert.equal(state(r,'orion'),'INVALID');
});
test('P11 cannot build a check without authenticated UID', () => assert.throws(()=>buildPipelineEvidence('',{},at)));
test('P12 cannot build a check with invalid timestamp', () => assert.throws(()=>buildPipelineEvidence(uid,{},'bad-date')));
test('P13 privacy: no UID, score, name, raw profile included in evidence record', () => {
  const r=build({learning_profiles:profile({profile:{fullName:'SENSITIVE_NAME'}}),student_transcripts:transcript()});
  assert.ok(!JSON.stringify(r).includes(uid));assert.ok(!JSON.stringify(r).includes('SENSITIVE_NAME'));
});

test('P14 one valid snapshot never becomes a trend', () => {
  const r=build({cognitive_history:[{studentId:uid,scoreAvailable:true,mappingVersion:'v1',createdAt:'2026-11-01T00:00:00Z'}]});
  assert.equal(r.history.status,'SINGLE');
});
test('P15 two snapshots with different versions cannot be compared', () => {
  const r=build({cognitive_history:[
    {studentId:uid,scoreAvailable:true,mappingVersion:'v1',createdAt:'2026-11-01T00:00:00Z'},
    {studentId:uid,scoreAvailable:true,mappingVersion:'v2',createdAt:'2026-11-08T00:00:00Z'}
  ]});
  assert.equal(r.history.status,'INCONSISTENT');
});
test('P16 two time-separated matching observations allow technical comparison only', () => {
  const r=build({cognitive_history:[
    {studentId:uid,scoreAvailable:true,mappingVersion:'v1',createdAt:'2026-11-01T00:00:00Z'},
    {studentId:uid,scoreAvailable:true,mappingVersion:'v1',createdAt:'2026-11-08T00:00:00Z'}
  ]});
  assert.equal(r.history.status,'MULTIPLE'); assert.equal(r.complete,false);
});
test('P17 history from another UID excluded', () => {
  const r=build({cognitive_history:[{studentId:'other',scoreAvailable:true,mappingVersion:'v1',createdAt:'2026-11-08T00:00:00Z'}]});
  assert.equal(r.history.status,'NONE');
});
