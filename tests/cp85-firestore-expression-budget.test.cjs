/**
 * CP85 static change guard. These checks DO NOT prove Firestore runtime authorization;
 * only the entire 99-case demo emulator suite can do that.
 */
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const rules=fs.readFileSync(path.join(root,'firestore.rules.CANDIDATE_CP21'),'utf8');
const suite=fs.readFileSync(path.join(root,'tests/firestore.rules.cp21.test.mjs'),'utf8');
const between=(a,b)=>{const i=rules.indexOf(a),j=rules.indexOf(b,i);assert.ok(i>=0&&j>i);return rules.slice(i,j);};
const record=between('function validJourneyRecord(uid, cycleId) {','function validJourneyUpdate(uid, cycleId) {');
const create=between('match /learning_journeys/{uid}/cycles/{cycleId} {','match /learning_journeys/{uid}/measurement_declarations/{declarationId} {');

test('CP85 leaves authenticated owner and product-consent guard on every cycle create',()=>{
  assert.match(record,/studentMayPersist\(uid\)/);
  assert.match(record,/data\.id == cycleId && data\.userId == uid/);
  assert.match(record,/data\.keys\(\)\.hasOnly/);
  assert.match(record,/validJourneySubjects\(data\.subjects\)/);
  assert.match(record,/validJourneyT0Snapshot\(data\.t0Snapshot, data\)/);
  assert.match(record,/validDecisionTrace\(uid, data, data\.decisionTrace\)/);
  assert.match(record,/data\.updatedAt == request\.time/);
});

test('CP85 repeated create-only constraints are still strictly enforced',()=>{
  assert.match(create,/allow create: if validJourneyRecord\(uid, cycleId\)/);
  assert.match(create,/request\.resource\.data\.status == 'ACTIVE'/);
  assert.match(create,/request\.resource\.data\.checkIns is list/);
  assert.match(create,/request\.resource\.data\.checkIns\.size\(\) == 0/);
  assert.match(create,/request\.resource\.data\.reassessment == null/);
  assert.match(create,/request\.resource\.data\.get\('evidenceRecord', null\) == null/);
  assert.match(create,/request\.resource\.data\.createdAt == request\.time/);
  assert.match(create,/getAfter\(journeyStatePath\(uid\)\)\.data\.activeCycleId == cycleId/);
  assert.match(create,/allow update: if validJourneyUpdate\(uid, cycleId\)/);
  assert.match(create,/allow delete: if false/);
});

test('CP85 still requires reviewed prior cycle, exact source and immutable lineage',()=>{
  assert.match(rules,/prior\.status == 'REVIEWED' && prior\.checkIns\.size\(\) >= 2/);
  assert.match(rules,/prior\.evidenceRecord\.resultId == trace\.reviewEvidenceId/);
  assert.match(rules,/get\(journeyStatePath\(uid\)\)\.data\.updatedAt == prior\.updatedAt/);
  assert.match(suite,/test\('J21 adaptive lineage accepted only with current reviewed source and remains immutable'/);
  assert.match(suite,/test\('J22 adaptive lineage denies unknown source, forged references, and stale prior after another review'/);
  assert.match(suite,/test\('J23 adaptive lineage fails after revocation/);
});

test('CP85 candidate remains local-only and deployment Rules are unchanged',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'firebase.json'),'utf8'));
  assert.equal(config.firestore,undefined);
  const e=JSON.parse(fs.readFileSync(path.join(root,'firebase.emulator.cp21.json'),'utf8'));
  assert.equal(e.firestore.rules,'firestore.rules.CANDIDATE_CP21');
  const cmd=fs.readFileSync(path.join(root,'CHAY_NGHIEM_THU_CP85.cmd'),'utf8');
  assert.doesNotMatch(cmd,/firebase deploy|--only firestore:rules/);
});

test('CP85 immutable source matches its manifest',()=>{
  const {verifyRelease}=require('../tools/verify-cp85-snapshot.cjs');
  assert.equal(verifyRelease(root).ok,true);
});
