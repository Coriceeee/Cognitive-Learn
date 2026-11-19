/**
 * CP27 V5 guardrails. STATIC checks only; run Firestore Emulator for access proof.
 * Ensure remediation does not bypass the security restrictions that caused the
 * test failures, without making any claim about actual authorization results.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const rules = readFileSync('firestore.rules.CANDIDATE_CP21', 'utf8');
const emulator = readFileSync('tests/firestore.rules.cp21.test.mjs', 'utf8');
const section = (start, end) => {
  const a = rules.indexOf(start);
  const b = rules.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing rule section: ${start}`);
  return rules.slice(a, b);
};

test('V5-01 legacy owner-only bounded list',()=>{
 const link=section('match /student_links/{linkId} {','match /student_shared_reports/{linkId} {');
 assert.match(link,/allow list: if request\.query\.limit != null && request\.query\.limit <= 40/);
 assert.match(link,/allow get: if studentOwns\(resource\.data\.studentId\)/);
 assert.doesNotMatch(link,/viewerId/);
});
test('V5-02 retired links cannot be created or updated',()=>{
 const link=section('match /student_links/{linkId} {','match /student_shared_reports/{linkId} {');
 assert.match(link,/allow create, update: if false/);
 assert.match(link,/allow delete: if studentOwns\(resource\.data\.studentId\)/);
});

test('V5-03 journey cycle creates still require validated immutable baseline and atomic lock', () => {
  const cycle = section('match /learning_journeys/{uid}/cycles/{cycleId} {', 'match /module_drafts/{uid} {');
  assert.match(cycle, /allow create: if validJourneyRecord\(uid, cycleId\)/);
  assert.match(cycle, /getAfter\(journeyStatePath\(uid\)\)\.data\.activeCycleId == cycleId/);
  assert.match(cycle, /allow delete: if false/);
});

test('V5-04 journey updates require owner, consent, immutable fields and LIVE lock', () => {
  const update = section('function validJourneyUpdate(uid, cycleId) {', 'match /learning_journeys/{uid}/cycles/{cycleId} {');
  assert.match(update, /studentMayPersist\(uid\)/);
  assert.match(update, /old\.status == 'ACTIVE'/);
  assert.match(update, /next\.createdAt == old\.createdAt/);
  assert.match(update, /affectedKeys\(\)\.hasOnly/);
  assert.match(update, /exists\(journeyStatePath\(uid\)\)/);
  assert.match(update, /get\(journeyStatePath\(uid\)\)\.data\.activeCycleId == cycleId/);
  assert.match(update, /getAfter\(journeyStatePath\(uid\)\)\.data\.activeCycleId == null/);
  assert.match(rules, /allow update: if validJourneyUpdate\(uid, cycleId\)/);
});

test('V5-05 check-in cannot mutate existing data or forge an observed outcome', () => {
  const update = section('function validJourneyUpdate(uid, cycleId) {', 'match /learning_journeys/{uid}/cycles/{cycleId} {');
  assert.match(update, /next\.checkIns\.size\(\) == old\.checkIns\.size\(\) \+ 1/);
  assert.match(update, /next\.checkIns\.hasAll\(old\.checkIns\)/);
  assert.match(update, /validJourneyCheckIn\(/);
  assert.match(update, /next\.reassessment == null/);
  assert.match(update, /next\.get\('evidenceRecord', null\) == old\.get\('evidenceRecord', null\)/);
});

test('V5-06 review remains evidence-checked and cannot edit check-in history', () => {
  const update = section('function validJourneyUpdate(uid, cycleId) {', 'match /learning_journeys/{uid}/cycles/{cycleId} {');
  assert.match(update, /next\.checkIns == old\.checkIns/);
  assert.match(update, /validJourneyReassessment\(/);
  assert.match(update, /validJourneyEvidence\(request\.resource\.data\.get\('evidenceRecord', null\)/);
  assert.match(update, /next\.status == 'REVIEWED'/);
});

test('V5-07 production rules unchanged by this patch', () => {
  const config = JSON.parse(readFileSync('firebase.json', 'utf8'));
  assert.notEqual(config.firestore?.rules, 'firestore.rules.CANDIDATE_CP21');
});

test('V5-08 existing six failed emulator assertions remain intact', () => {
  for (const name of ['L02 retired viewers cannot list links',
    'J04 only append check-in', 'J09 legacy ACTIVE cycle',
    'J10 new cycle can start', 'J11 forged probability', 'J12 a second legacy ACTIVE']) {
    assert.ok(emulator.includes(name), `Do not delete failed test: ${name}`);
  }
});
