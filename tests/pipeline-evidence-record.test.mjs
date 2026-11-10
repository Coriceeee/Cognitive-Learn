import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPipelineEvidence } from '../src/lib/pipelineEvidence.ts';
import { buildPersistedPipelineEvidence } from '../src/lib/pipelineEvidenceRecord.ts';
const uid='student_A', at='2026-11-08T08:15:00.000Z';
const evidence=()=>buildPipelineEvidence(uid,{},at);
test('R01 whitelisted persisted record has no UID/scores/names/notes',()=>{
 const input=evidence();input.scope='student';input.notes.push('PRIVATE_NAME',uid);input.stages[0].reason='PRIVATE_SCORE=9.3';
 const r=buildPersistedPipelineEvidence(input);
 assert.deepEqual(Object.keys(r).sort(),['schemaVersion','evidenceVersion','recordType','dataScope','checkedAt','complete','stages','historyStatus','historyCount'].sort());
 assert.equal(JSON.stringify(r).includes('PRIVATE'),false);assert.equal(JSON.stringify(r).includes(uid),false);
});
test('R02 unknown dataScope cannot be stored',()=>assert.throws(()=>buildPersistedPipelineEvidence(evidence()),/dataScope/));
test('R03 stored demo record remains explicitly labeled',()=>{
 const r=evidence();r.scope='demo';assert.equal(buildPersistedPipelineEvidence(r).dataScope,'demo');
});
test('R04 never persist complete:true or another evidence version',()=>{
 const r=evidence();r.scope='student';r.complete=true;assert.throws(()=>buildPersistedPipelineEvidence(r));
 r.complete=false;r.version='unknown';assert.throws(()=>buildPersistedPipelineEvidence(r));
});
test('R05 exactly four distinct stages required',()=>{
 const r=evidence();r.scope='student';r.stages.push(r.stages[0]);assert.throws(()=>buildPersistedPipelineEvidence(r));
 r.stages.pop();r.stages[2]={...r.stages[2],stage:'seed'};assert.throws(()=>buildPersistedPipelineEvidence(r));
});
test('R06 invalid stage status rejected',()=>{
 const r=evidence();r.scope='student';r.stages[0].status='EFFECTIVE';assert.throws(()=>buildPersistedPipelineEvidence(r));
});
test('R07 malformed timestamps rejected',()=>{
 const r=evidence();r.scope='student';r.checkedAt='yesterday';assert.throws(()=>buildPersistedPipelineEvidence(r));
});
test('R08 history range/count consistency validated',()=>{
 const r=evidence();r.scope='student';r.history.count=11;assert.throws(()=>buildPersistedPipelineEvidence(r));
 r.history.count=1;r.history.status='NONE';assert.throws(()=>buildPersistedPipelineEvidence(r));
 r.history.status='SINGLE';assert.equal(buildPersistedPipelineEvidence(r).historyCount,1);
});
test('R09 real zero not copied into provenance even when observed',()=>{
 const r=buildPipelineEvidence(uid,{learning_profiles:{userId:uid,schemaVersion:1,dataScope:'student',cognitiveMeasurement:{scoreAvailable:true,overallScore:0,mappingVersion:'v2'}},student_transcripts:{userId:uid,schemaVersion:1,dataScope:'student'}},at);
 const safe=buildPersistedPipelineEvidence(r);assert.equal(safe.stages.lumen,'PRESENT');assert.equal('overallScore' in safe,false);
});
test('R10 unchanged observedAt and no arbitrary createdAt',()=>{
 const r=evidence();r.scope='student';const safe=buildPersistedPipelineEvidence(r);
 assert.equal(safe.checkedAt,at);assert.equal('createdAt' in safe,false);
});
