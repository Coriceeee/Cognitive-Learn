import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { asMillis, cleanupWithdrawnStudentLinks, isProductConsentWithdrawal, PAGE_SIZE, verifyWithdrawnLinkCleanup } from '../functions-privacy/src/consentCleanup.mjs';
import { makeFirestoreCleanupAdapter } from '../functions-privacy/src/firestoreAdapter.mjs';

const UID='student_001';
const stamp = ms => ({toMillis:()=>ms});
const consent = (accepted, overrides={}) => ({
  userId:UID,schemaVersion:1,noticeVersion:'cla-student-privacy-v1',
  productAccepted:accepted,researchConsent:false,updatedAt:stamp(300),...overrides,
});
const entry = (id, created=100, data={}) => ({
  id, data:{studentId:UID,viewerId:id.slice(UID.length+1),createdAt:stamp(created),...data},
});
const oldA=entry(`${UID}_teacher_001`,100);
const oldB=entry(`${UID}_parent_001`,200);

function mockAdapter(initial) {
  const rows=[...initial].sort((a,b)=>a.id.localeCompare(b.id));
  const deleted=[];
  const adapter={
    async scan(uid,cursor,size) {
      assert.equal(uid,UID);
      const start = cursor===null ? 0 : rows.findIndex(x=>x.id > cursor);
      const active = start===-1 ? [] : rows.slice(start,start+size);
      return {links:active,nextCursor:active.at(-1)?.id??null};
    },
    async deletePair(link) {
      deleted.push(link.id);
      const index=rows.findIndex(x=>x.id===link.id);
      assert.ok(index>=0);
      rows.splice(index,1);
    },
  };
  return {adapter,deleted,rows};
}

test('CS01 accepts only transition accepted -> withdrawn for same valid student and policy version',()=>{
  assert.equal(isProductConsentWithdrawal(consent(true),consent(false),UID),true);
  assert.equal(isProductConsentWithdrawal(null,consent(false),UID),false);
  assert.equal(isProductConsentWithdrawal(consent(false),consent(false),UID),false);
  assert.equal(isProductConsentWithdrawal(consent(true),consent(true),UID),false);
  assert.equal(isProductConsentWithdrawal(consent(true),consent(false),'student_002'),false);
  assert.equal(isProductConsentWithdrawal(consent(true),consent(false,'x'),UID),true);
  assert.equal(isProductConsentWithdrawal(consent(true),consent(false,{researchConsent:true}),UID),false);
  assert.equal(isProductConsentWithdrawal(consent(true),consent(false,{noticeVersion:'old'}),UID),false);
});
test('CS02 rejects malformed timestamps, UID and bounds instead of guessing',async()=>{
  assert.equal(asMillis(stamp(300)),300);
  assert.equal(asMillis('300'),null);
  assert.equal(asMillis({toMillis:()=>Infinity}),null);
  assert.equal(asMillis(null),null);
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:'../bad',cutoffMs:300,adapter:mockAdapter([]).adapter}),/INVALID_UID/);
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:Infinity,adapter:mockAdapter([]).adapter}),/INVALID_CUTOFF/);
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,pageSize:PAGE_SIZE+1,adapter:mockAdapter([]).adapter}),/INVALID_BOUNDS/);
});
test('CS03 deletes old report/link pairs and reports accurate completion',async()=>{
  const h=mockAdapter([oldA,oldB]);
  const result=await cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter});
  assert.deepEqual(result,{deleted:2,examined:2,complete:true});
  assert.equal(h.rows.length,0);
});
test('CS04 does NOT delete newly granted links after student reconsents',async()=>{
  const recent=entry(`${UID}_teacher_002`,400);
  const h=mockAdapter([oldA,recent]);
  const result=await cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter});
  assert.equal(result.deleted,1);
  assert.deepEqual(h.rows.map(x=>x.id),[recent.id]);
});
test('CS05 page traversal does not starve old records behind newer ones',async()=>{
  const links=Array.from({length:14},(_,i)=>entry(`${UID}_viewer_${String(i).padStart(3,'0')}`,i%2 ? 400:100));
  const h=mockAdapter(links);
  const result=await cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter,pageSize:3});
  assert.equal(result.deleted,7);
  assert.equal(result.examined,14);
  assert.equal(h.rows.length,7);
});
test('CS06 fail closed on foreign/malformed link, no subsequent delete',async()=>{
  const h=mockAdapter([entry(`${UID}_a_001`,100,{studentId:'student_999'})]);
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter}),/FOREIGN_OR_MALFORMED_LINK/);
  assert.equal(h.deleted.length,0);
});
test('CS07 fails and retries if conditional delete fails; cannot claim completion',async()=>{
  const h=mockAdapter([oldA]);
  h.adapter.deletePair=async()=>{throw new Error('failed-precondition');};
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter}),/failed-precondition/);
  assert.equal(h.rows.length,1);
});
test('CS08 limit exhaustion never reports full cleanup',async()=>{
  const links=Array.from({length:6},(_,i)=>entry(`${UID}_viewer_${i}abcde`,100));
  const h=mockAdapter(links);
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter,pageSize:2,maxPages:1}),/PAGE_LIMIT_RETRY_REQUIRED/);
  assert.equal(h.deleted.length,2);
});
test('CS09 idempotent repeat after completed cleanup returns deleted=0',async()=>{
  const h=mockAdapter([oldA]);
  const first=await cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter});
  const second=await cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter});
  assert.equal(first.deleted,1);assert.equal(second.deleted,0);assert.equal(second.complete,true);
});
test('CS10 malformed page/cursor rejects without claiming success',async()=>{
  await assert.rejects(cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,pageSize:1,
    adapter:{scan:async()=>({links:[oldA],nextCursor:null}),deletePair:async()=>{}}}),/INVALID_CURSOR/);
});
test('CS11 deployment is isolated from default Firebase config; immutable source guarded',()=>{
  const root=new URL('../',import.meta.url);
  const defaultConfig=JSON.parse(readFileSync(new URL('firebase.json',root),'utf8'));
  const privacyConfig=JSON.parse(readFileSync(new URL('firebase.privacy.json',root),'utf8'));
  const privacyIndex=readFileSync(new URL('functions-privacy/index.mjs',root),'utf8');
  assert.ok(!('functions' in defaultConfig));
  assert.equal(privacyConfig.functions.source,'functions-privacy');
  assert.match(privacyIndex,/CLA_CONSENT_REVOCATION_ENABLED !== 'true'/);
  const adapterSrc=readFileSync(new URL('functions-privacy/src/firestoreAdapter.mjs',root),'utf8');
  assert.match(adapterSrc,/lastUpdateTime/);
  assert.match(privacyIndex,/onDocumentWritten/);
  assert.doesNotMatch(privacyIndex,/\.\.\.process\.env/);
});
test('CS12 no accidental PII in server cleanup logs',()=>{
  const root=new URL('../',import.meta.url);
  const privacyIndex=readFileSync(new URL('functions-privacy/index.mjs',root),'utf8');
  assert.match(privacyIndex,/deleted:result\.deleted/);
  assert.doesNotMatch(privacyIndex,/console\.log\([^\n]*\buid\b/);
});

function fakeAdmin({reportExists=true,reportOwner=UID,reportUpdated=true,failCommit=false}={}) {
  const actions=[];
  const reportRef={path:`student_shared_reports/${UID}_teacher_001`,get:async()=>({
    exists:reportExists,updateTime:reportUpdated ? 'report-time' : null,
    data:()=>({studentId:reportOwner,viewerId:'teacher_001',viewerRole:'teacher'}),
  })};
  const linkRef={path:`student_links/${UID}_teacher_001`};
  const batch={delete:(ref,precondition)=>actions.push({path:ref.path,precondition}),
    commit:async()=>{if(failCommit) throw new Error('failed-precondition');actions.push('commit');}};
  const db={collection:(name)=>{
    if(name==='student_shared_reports') return {doc:(id)=>{assert.equal(id,`${UID}_teacher_001`);return reportRef;}};
    throw new Error('unexpected collection');
  },batch:()=>batch};
  return {db,actions,link:{id:`${UID}_teacher_001`,data:{studentId:UID,viewerId:'teacher_001',viewerRole:'teacher'},
    snapshot:{exists:true,updateTime:'link-time',ref:linkRef}}};
}
test('CS13 privileged adapter deletes report+link atomically with update-time preconditions',async()=>{
  const h=fakeAdmin();
  await makeFirestoreCleanupAdapter(h.db,{}).deletePair(h.link);
  assert.deepEqual(h.actions,[
    {path:`student_shared_reports/${UID}_teacher_001`,precondition:{lastUpdateTime:'report-time'}},
    {path:`student_links/${UID}_teacher_001`,precondition:{lastUpdateTime:'link-time'}},
    'commit',
  ]);
});
test('CS14 deleting old link with no report is safe and atomic',async()=>{
  const h=fakeAdmin({reportExists:false});
  await makeFirestoreCleanupAdapter(h.db,{}).deletePair(h.link);
  assert.deepEqual(h.actions,[{path:`student_links/${UID}_teacher_001`,precondition:{lastUpdateTime:'link-time'}},'commit']);
});
test('CS15 refuses corrupt cross-account report before committing any deletion',async()=>{
  const h=fakeAdmin({reportOwner:'student_999'});
  await assert.rejects(makeFirestoreCleanupAdapter(h.db,{}).deletePair(h.link),/LINEAGE_MISMATCH/);
  assert.equal(h.actions.length,0);
});
test('CS16 conditional batch conflict is surfaced for retry',async()=>{
  const h=fakeAdmin({failCommit:true});
  await assert.rejects(makeFirestoreCleanupAdapter(h.db,{}).deletePair(h.link),/failed-precondition/);
  assert.equal(h.actions.some(x=>x==='commit'),false);
});
test('CS17 adapter rejects missing timestamps; never does unconditional deletes',async()=>{
  const h=fakeAdmin({reportUpdated:false});
  await assert.rejects(makeFirestoreCleanupAdapter(h.db,{}).deletePair(h.link),/STALE_REPORT_SNAPSHOT/);
  assert.equal(h.actions.length,0);
});


test('CS18 independent verification confirms empty set after actual deletes',async()=>{
  const h=mockAdapter([oldA,oldB]);
  await cleanupWithdrawnStudentLinks({uid:UID,cutoffMs:300,adapter:h.adapter});
  assert.deepEqual(await verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter}),
    {remaining:0,examined:0,complete:true});
});
test('CS19 verification detects old metadata left behind after false success',async()=>{
  const h=mockAdapter([oldA]);
  assert.deepEqual(await verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter}),
    {remaining:1,examined:1,complete:true});
});
test('CS20 verification preserves later consent grants without false positives',async()=>{
  const h=mockAdapter([entry(`${UID}_teacher_002`,400)]);
  assert.deepEqual(await verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter}),
    {remaining:0,examined:1,complete:true});
});
test('CS21 legacy links with missing timestamp remain pending',async()=>{
  const h=mockAdapter([entry(`${UID}_teacher_002`,400,{createdAt:null})]);
  const result=await verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter});
  assert.equal(result.remaining,1);
});
test('CS22 scan verification does not perform deletes or expose record details',async()=>{
  const h=mockAdapter([oldA]);
  const result=await verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter});
  assert.deepEqual(h.deleted,[]);
  assert.deepEqual(Object.keys(result),['remaining','examined','complete']);
});
test('CS23 refuses incomplete full-page audit instead of reporting success',async()=>{
  const h=mockAdapter([oldA,oldB]);
  await assert.rejects(verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter,pageSize:1,maxPages:1}),
    /VERIFICATION_PAGE_LIMIT/);
});
test('CS24 rejects malformed and foreign records in audit scan',async()=>{
  const h=mockAdapter([entry(`${UID}_teacher_002`,400,{studentId:'student_999'})]);
  await assert.rejects(verifyWithdrawnLinkCleanup({uid:UID,cutoffMs:300,adapter:h.adapter}),
    /FOREIGN_OR_MALFORMED_LINK/);
});
test('CS25 deployed function gates completion on independent verification',()=>{
  const root=new URL('../',import.meta.url);
  const src=readFileSync(new URL('functions-privacy/index.mjs',root),'utf8');
  assert.match(src,/verifyWithdrawnLinkCleanup/);
  assert.match(src,/verification\.remaining !== 0/);
  assert.match(src,/CP28_REVOCATION_INCOMPLETE/);
  assert.match(src,/verified-at-check-time/);
});
