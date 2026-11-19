import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle,
  auditJourneyT0Snapshot, buildJourneyT0Snapshot, auditJourneyEvidence, isJourneyCycle } from '../src/lib/closedLoopJourney.ts';
import { runSyntheticGoldenPath } from '../tools/cla_golden_path_offline.mjs';
const fixture = JSON.parse(readFileSync(new URL('../research/golden_path/fixture_SYNTHETIC.v1.json', import.meta.url), 'utf8'));
const plan = () => createJourneyCycle(fixture.cycle);
const copy = structuredClone;
const check = x => appendJourneyCheckIn(x, fixture.checkIns[0]);
const review = x => reassessJourneyCycle(appendJourneyCheckIn(x, fixture.checkIns[0]), fixture.reassessment);
const tamper = mutator => { const x = plan(); mutator(x); assert.equal(auditJourneyT0Snapshot(x), 'MISMATCH'); assert.equal(isJourneyCycle(x), false); };
test('B10-01 T0 created with plan before check-in / outcomes', () => {
  const c=plan(); assert.equal(c.t0Snapshot.frozenAt,c.startedAt); assert.equal(c.checkIns.length,0);
  assert.equal(c.reassessment,null); assert.equal(auditJourneyT0Snapshot(c),'FROZEN_CONSISTENT');
});
test('B10-02 T0 is transparent descriptive gap, not predicted score/gain', () => {
  const t=plan().t0Snapshot; assert.equal(t.planGapPoints,3); assert.equal(t.forecastStatus,'NOT_ESTIMATED');
  assert.equal(t.predictedOutcome,null); assert.equal(t.calibratedProbability,null);
});
test('B10-03 observed 0 is not missing, negative gaps truncated per subject', () => {
  const c=plan(); assert.equal(c.t0Snapshot.subjects[0].baseline,0);
  assert.equal(c.t0Snapshot.planGapPoints,(5+1)/2);
  const another=createJourneyCycle({...fixture.cycle, subjects:[{key:'math',label:'Toán',baseline:10,target:3}]});
  assert.equal(another.t0Snapshot.planGapPoints,0);
});
test('B10-04 T0 is a defensive copy, not a live reference to editable draft', () => {
  const input=copy(fixture.cycle); const c=createJourneyCycle(input);
  input.subjects[0].baseline=9; input.scenarioId='balanced';
  assert.equal(c.t0Snapshot.subjects[0].baseline,0);
  assert.equal(auditJourneyT0Snapshot(c),'FROZEN_CONSISTENT');
});
test('B10-05 check-in does not alter T0 snapshot',()=>{
 const c=plan(), frozen=copy(c.t0Snapshot); const after=check(c);
 assert.deepEqual(after.t0Snapshot,frozen);assert.equal(auditJourneyT0Snapshot(after),'FROZEN_CONSISTENT');
});
test('B10-06 review / measured T1 does not alter T0 snapshot',()=>{
 const c=plan(), frozen=copy(c.t0Snapshot);const after=review(c);
 assert.deepEqual(after.t0Snapshot,frozen);assert.equal(auditJourneyT0Snapshot(after),'FROZEN_CONSISTENT');
 assert.equal(auditJourneyEvidence(after),'CONSISTENT');
});
test('B10-07 same T0 inputs with different later outcomes give identical T0',()=>{
 const c=plan(), a=check(c), b=check(c);
 const low=reassessJourneyCycle(a,{...fixture.reassessment,observations:[{key:'math',score:0}]});
 const high=reassessJourneyCycle(b,{...fixture.reassessment,observations:[{key:'math',score:10}]});
 assert.deepEqual(low.t0Snapshot,high.t0Snapshot);assert.notEqual(low.evidenceRecord.output.value,high.evidenceRecord.output.value);
});
test('B10-08 client refuses to check in after plan baseline rewritten',()=>{
 const c=plan();c.subjects[0].baseline=9;assert.throws(()=>check(c),/T0/);
});
test('B10-09 client refuses to reassess after T0 was rewritten',()=>{
 const c=check(plan());c.t0Snapshot.subjects[0].baseline=4;
 assert.throws(()=>reassessJourneyCycle(c,fixture.reassessment),/T0/);
});
test('B10-10 T0 rejects faked future predicted score',()=>tamper(c=>{c.t0Snapshot.predictedOutcome=8;}));
test('B10-11 T0 rejects faked calibrated probability',()=>tamper(c=>{c.t0Snapshot.calibratedProbability=.99;}));
test('B10-12 T0 rejects forged forecastStatus',()=>tamper(c=>{c.t0Snapshot.forecastStatus='CALIBRATED';}));
test('B10-13 T0 rejects recalculated target gap after measurement',()=>tamper(c=>{c.t0Snapshot.planGapPoints=8;}));
test('B10-14 T0 rejects after-the-fact baseline change',()=>tamper(c=>{c.subjects[0].baseline=2;}));
test('B10-15 T0 rejects after-the-fact target change',()=>tamper(c=>{c.subjects[0].target=10;}));
test('B10-16 T0 rejects after-the-fact strategy or hours change',()=>{
 tamper(c=>{c.scenarioId='balanced';});tamper(c=>{c.plannedWeeklyHours=30;});
});
test('B10-17 T0 rejects artificial frozenAt / startedAt',()=>{
 tamper(c=>{c.t0Snapshot.frozenAt='2026-10-12T09:00:00.000Z';});
 tamper(c=>{c.startedAt='2026-10-12T09:00:00.000Z';});
});
test('B10-18 T0 refuses altered input provenance / policy',()=>{
 tamper(c=>{c.t0Snapshot.inputSource='teacher_verified';});
 tamper(c=>{c.t0Snapshot.policyVersion='ai-calibrated';});
});
test('B10-19 T0 refuses extra fields implying external review',()=>tamper(c=>{c.t0Snapshot.reviewedBy='third-party';}));
test('B10-20 T0 refuses duplicate/fake subject data',()=>{
 tamper(c=>{c.t0Snapshot.subjects.push(copy(c.t0Snapshot.subjects[0]));});
 tamper(c=>{c.t0Snapshot.subjects[0].key='biology';});
});
test('B10-21 T0 safely allows old cycles without evidence but never claims frozen',()=>{
 const c=plan();delete c.t0Snapshot;assert.equal(auditJourneyT0Snapshot(c),'LEGACY_NO_T0');
 assert.equal(isJourneyCycle(c),true);const r=review(c);
 assert.equal(auditJourneyT0Snapshot(r),'LEGACY_NO_T0');assert.equal(isJourneyCycle(r),true);
});
test('B10-22 explicit null from old Firestore cycle is legacy, not valid snapshot',()=>{
 const c=plan();c.t0Snapshot=null;assert.equal(auditJourneyT0Snapshot(c),'LEGACY_NO_T0');
});
test('B10-23 malformed T0 and impossible timestamps fail closed',()=>{
 tamper(c=>{c.t0Snapshot={};});tamper(c=>{c.t0Snapshot.frozenAt='2026-02-30T08:00:00.000Z';});
});
test('B10-24 synthetic Golden Path retains frozen T0 and no predictions',()=>{
 const r=runSyntheticGoldenPath(fixture);
 assert.equal(r.frozenT0.forecastStatus,'NOT_ESTIMATED');
 assert.equal(r.stages.length,7);assert.equal(r.stages[1].facts.t0ForecastEstimated,false);
 assert.equal(r.stages[0].facts.t0Status,'FROZEN_CONSISTENT');
});
test('B10-25 Firestore candidate enforces immutable snapshot + baseline before write',()=>{
 const rules=readFileSync(new URL('../firestore.rules.CANDIDATE_CP21',import.meta.url),'utf8');
 assert.match(rules,/function validJourneyT0Snapshot/);
 assert.match(rules,/validJourneyT0Snapshot\(data\.t0Snapshot, data\)/);
 const updates=rules.slice(rules.indexOf('function validJourneyUpdate'),rules.indexOf('match /learning_journeys/{uid}/cycles/'));
 assert.match(updates,/next\.diff\(old\)\.affectedKeys\(\)\.hasOnly/);
 const whitelist=updates.match(/affectedKeys\(\)\.hasOnly\(\[([\s\S]*?)\]\)/)?.[1];
 assert.ok(whitelist && !whitelist.includes('t0Snapshot') && !whitelist.includes('subjects') && !whitelist.includes('scenarioId'));
 assert.notEqual(JSON.parse(readFileSync(new URL('../firebase.json',import.meta.url),'utf8')).firestore?.rules,'firestore.rules.CANDIDATE_CP21');
});
test('B10-26 candidate emulator tests cover T0 missing/tamper, no silently dropped authorization tests',()=>{
 const tests=readFileSync(new URL('../tests/firestore.rules.cp21.test.mjs',import.meta.url),'utf8');
 for(const term of ['J01 student','J09 legacy','J10 new cycle','J14 new T0','J15 T0 immutable']) assert.ok(tests.includes(term));
});
test('B10-27 app displays T0 frozen/legacy status and refuses future prediction labels',()=>{
 const ui=readFileSync(new URL('../src/components/journey/ClosedLoopPanel.tsx',import.meta.url),'utf8');
 assert.match(ui,/auditJourneyT0Snapshot/);assert.match(ui,/T0 ĐÃ CHỐT/);
 assert.match(ui,/CHƯA ƯỚC LƯỢNG/);assert.match(ui,/BẢN GHI CŨ — chưa có snapshot T0/);
});
test('B10-28 stored T0 is never included in mutable Firestore updates',()=>{
 const hook=readFileSync(new URL('../src/lib/useClosedLoopJourney.ts',import.meta.url),'utf8');
 const update=hook.split('transaction.update(reference, {')[1].split('});')[0];
 assert.ok(!update.includes('t0Snapshot')&&!update.includes('subjects')&&!update.includes('startedAt'));
 assert.match(hook,/transaction\.set\(reference, \{ \.\.\.cycle/);
});
test('B10-29 snapshot builder does not even accept later checkIns / reassessment fields',()=>{
 const code=readFileSync(new URL('../src/lib/closedLoopJourney.ts',import.meta.url),'utf8');
 const body=code.slice(code.indexOf('export function buildJourneyT0Snapshot'),code.indexOf('export function auditJourneyT0Snapshot'));
 assert.doesNotMatch(body,/reassessment|checkIns|observedAverageDelta|postOutcome/);
});
test('B10-30 static contract: T0 gap cannot be sold as causal effect or forecast',()=>{
 const t=plan().t0Snapshot;assert.equal(t.forecastStatus,'NOT_ESTIMATED');
 const gap=buildJourneyT0Snapshot({...fixture.cycle,subjects:[{key:'math',label:'Toán',baseline:0,target:10}]}).planGapPoints;
 assert.equal(gap,10);
 assert.equal(typeof gap,'number');
});
