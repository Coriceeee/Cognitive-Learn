import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle, auditJourneyT0Snapshot } from '../src/lib/closedLoopJourney.ts';
import { compareJourneyT0T1, replayJourneyT0T1Comparison } from '../src/lib/journeyT0T1Comparison.ts';
import { runSyntheticGoldenPath } from '../tools/cla_golden_path_offline.mjs';

const fixture = JSON.parse(readFileSync(new URL('../research/golden_path/fixture_SYNTHETIC.v1.json', import.meta.url),'utf8'));
const copy = structuredClone;
const start = () => createJourneyCycle(fixture.cycle);
function reviewed(observations = fixture.reassessment.observations) {
  let cycle = start();
  for (const check of fixture.checkIns) cycle = appendJourneyCheckIn(cycle, check);
  return reassessJourneyCycle(cycle, {...fixture.reassessment, observations});
}
const report = () => compareJourneyT0T1(reviewed());
const bad = (mutate) => { const c=reviewed(); mutate(c); return compareJourneyT0T1(c); };

test('B11-01 reviewed and traced cycle allows DESCRIPTIVE_ONLY comparison',()=> {
  const r=report(); assert.equal(r.status,'DESCRIPTIVE_ONLY');assert.equal(r.schema,'cla.journey.t0-t1-comparison.v1');
});
test('B11-02 no cycle is INVALID with no implied student outcome',()=> {
  const r=compareJourneyT0T1(null);assert.equal(r.status,'INVALID');assert.equal(r.summary.observedAverageDelta,null);
});
test('B11-03 ACTIVE cycle has no post-outcome comparison',()=> {
  const r=compareJourneyT0T1(start());assert.equal(r.status,'NOT_REVIEWED');assert.equal(r.t1RecordedAt,null);
});
test('B11-04 check-in without T1 cannot create outcome',()=> {
  const c=appendJourneyCheckIn(start(),fixture.checkIns[0]);const r=compareJourneyT0T1(c);
  assert.equal(r.status,'NOT_REVIEWED');assert.equal(r.measures.length,0);
});
test('B11-05 frozen T0 is never derived from reassessment',()=> {
  const c=reviewed(); const r=compareJourneyT0T1(c);
  assert.equal(r.t0FrozenAt,c.startedAt);assert.equal(r.t1RecordedAt,c.reassessment.recordedAt);
  assert.notEqual(r.t0FrozenAt,r.t1RecordedAt);
});
test('B11-06 observed zero remains zero (not null/missing)',()=> {
  const r=report();const math=r.measures.find(s=>s.subjectKey==='math');
  assert.equal(math.t0Score,0); assert.equal(math.t1Score,0);assert.equal(math.delta,0);assert.equal(math.matched,true);
});
test('B11-07 matched subjects and denominator are explicit',()=> {
  const r=report();assert.equal(r.summary.matchedSubjectCount,2);assert.equal(r.summary.missingT1SubjectCount,0);
  assert.equal(r.summary.averageMatchedT0,3.5); assert.equal(r.summary.averageMatchedT1,4);
  assert.equal(r.summary.observedAverageDelta,0.5);
});
test('B11-08 missing subject cannot be imputed to zero',()=> {
  const r=compareJourneyT0T1(reviewed([{key:'english',score:8}]));
  assert.equal(r.status,'DESCRIPTIVE_ONLY');assert.equal(r.summary.matchedSubjectCount,1);
  assert.equal(r.summary.missingT1SubjectCount,1);assert.equal(r.summary.observedAverageDelta,1);
  const missing=r.measures.find(s=>s.subjectKey==='math');assert.equal(missing.t1Score,null);assert.equal(missing.delta,null);
});
test('B11-09 compared averages restrict to matched measures (not full T0)',()=> {
  const r=compareJourneyT0T1(reviewed([{key:'math',score:0}]));
  assert.equal(r.summary.averageMatchedT0,0);assert.equal(r.summary.averageMatchedT1,0);
  assert.equal(r.summary.observedAverageDelta,0);
});
test('B11-10 negative observed delta is allowed and not a risk probability',()=> {
  const r=compareJourneyT0T1(reviewed([{key:'english',score:2}]));
  assert.equal(r.summary.observedAverageDelta,-5);assert.equal(r.calibratedProbability,null);
});
test('B11-11 self-reported hours preserve actual zero',()=> {
  const r=report();assert.equal(r.summary.reportedHours,4);assert.equal(r.summary.reportedCompletionPercent,37.5);
});
test('B11-12 T0 target gap remains independent of T1 change',()=> {
  const a=report(),b=compareJourneyT0T1(reviewed([{key:'math',score:10}]));
  assert.equal(a.summary.frozenTargetGapPoints,b.summary.frozenTargetGapPoints);
  assert.notEqual(a.summary.observedAverageDelta,b.summary.observedAverageDelta);
});
test('B11-13 no ML forecast exists: error and calibration withheld',()=> {
  const r=report();assert.equal(r.forecastEvaluation,'NOT_POSSIBLE_NO_T0_FORECAST');
  assert.equal(r.forecastError,null);assert.equal(r.calibratedProbability,null);
});
test('B11-14 no causal effect estimate or treatment assignment',()=> {
  const r=report();assert.equal(r.causalEffect,null);assert.equal(r.treatmentAssignment,'NOT_PERFORMED');
  assert.equal(r.evidenceLevel,'student_self_report_only');
});
test('B11-15 limitation array explicitly discloses missingness and self-report',()=> {
  const r=report();assert.ok(r.limitations.some(s=>s.includes('Missing T1')));
  assert.ok(r.limitations.some(s=>s.includes('self-report')));
});
test('B11-16 no mutation to frozen T0 or source cycle on comparison',()=> {
  const c=reviewed(), before=copy(c);compareJourneyT0T1(c);assert.deepEqual(c,before);
});
test('B11-17 legacy reviewed cycle without T0 cannot compare',()=> {
  const c=reviewed();delete c.t0Snapshot;const r=compareJourneyT0T1(c);
  assert.equal(r.status,'LEGACY_NO_T0');assert.equal(r.summary.observedAverageDelta,null);
});
test('B11-18 reviewed legacy without Evidence Record cannot compare',()=> {
  const c=reviewed();delete c.evidenceRecord;const r=compareJourneyT0T1(c);
  assert.equal(r.status,'LEGACY_NO_EVIDENCE');assert.equal(r.summary.observedAverageDelta,null);
});
test('B11-19 mismatched T0 is not comparable',()=> {
  const r=bad(c=>{c.t0Snapshot.subjects[0].baseline=5;});assert.equal(r.status,'INVALID');
});
test('B11-20 forged T0 forecast is rejected not evaluated',()=> {
  const r=bad(c=>{c.t0Snapshot.forecastStatus='CALIBRATED';c.t0Snapshot.predictedOutcome=9;});
  assert.equal(r.status,'INVALID');assert.equal(r.forecastError,null);
});
test('B11-21 altered T1 observation is rejected without recalculated evidence',()=> {
  const r=bad(c=>{c.reassessment.observations[0].score=9;});
  assert.equal(r.status,'INVALID');assert.equal(r.measures.length,0);
});
test('B11-22 altered hours is rejected without recalculated evidence',()=> {
  const r=bad(c=>{c.checkIns[0].actualHours=100;});assert.equal(r.status,'INVALID');
});
test('B11-23 invalid reassessment chronology is rejected',()=> {
  const r=bad(c=>{c.reassessment.recordedAt='2026-09-01T08:00:00.000Z';});assert.equal(r.status,'INVALID');
});
test('B11-24 corruption in the evidence output fails closed',()=> {
  const r=bad(c=>{c.evidenceRecord.output.value=9;});assert.equal(r.status,'INVALID');
});
test('B11-25 cannot pass fake foreign/empty/shape-invalid cycles',()=> {
  for(const v of [{},{id:'fake',status:'REVIEWED'},[1],null,'reviewed'])
    assert.equal(compareJourneyT0T1(v).status,'INVALID');
});
test('B11-26 result replay succeeds with exact domain outputs',()=> {
  const c=reviewed(),r=compareJourneyT0T1(c);assert.equal(replayJourneyT0T1Comparison(c,r),true);
});
test('B11-27 replay ignores Firestore object key ordering',()=> {
  const c=reviewed(),r=report();const shuffled=Object.fromEntries(Object.entries(r).reverse());
  assert.equal(replayJourneyT0T1Comparison(c,shuffled),true);
});
test('B11-28 report tampering detected for measured values and claims',()=> {
  const c=reviewed();for(const field of ['observedAverageDelta','matchedSubjectCount']) {
    const r=report();r.summary[field]=9;assert.equal(replayJourneyT0T1Comparison(c,r),false);
  }
  const fake=report();fake.causalEffect=0.9;assert.equal(replayJourneyT0T1Comparison(c,fake),false);
});
test('B11-29 appended reviewer/external verification is rejected',()=> {
  const c=reviewed(),r=report();r.reviewedBy='expert';assert.equal(replayJourneyT0T1Comparison(c,r),false);
});
test('B11-30 replay rejects INVALID status even if structurally self-consistent',()=> {
  const invalid=compareJourneyT0T1(null);assert.equal(replayJourneyT0T1Comparison(null,invalid),false);
});
test('B11-31 golden path uses the real comparison engine with no fake prediction',()=> {
  const r=runSyntheticGoldenPath(fixture);assert.equal(r.stages.length,7);
  assert.equal(r.comparison.status,'DESCRIPTIVE_ONLY');assert.equal(r.comparison.forecastError,null);
  assert.equal(r.comparison.summary.observedAverageDelta,r.assessment.observedAverageDelta);
});
test('B11-32 golden path frozen T0 does not change after measurement',()=> {
  const r=runSyntheticGoldenPath(fixture);assert.deepEqual(r.frozenT0.subjects,r.fixture.cycle.subjects);
  assert.equal(r.comparison.summary.frozenTargetGapPoints,r.frozenT0.planGapPoints);
});
test('B11-33 student UI displays uncertainty, matched T1 and blocks legacy comparison',()=> {
  const src=readFileSync(new URL('../src/components/journey/ClosedLoopPanel.tsx',import.meta.url),'utf8');
  assert.match(src,/compareJourneyT0T1\(latest\)/);assert.match(src,/LEGACY_NO_T0/);
  assert.match(src,/LEGACY_NO_EVIDENCE/);assert.match(src,/KHÔNG ĐÁNH GIÁ DỰ BÁO/);
});
test('B11-34 comparator cannot compute forecasts from targets or T1',()=> {
  const src=readFileSync(new URL('../src/lib/journeyT0T1Comparison.ts',import.meta.url),'utf8');
  assert.doesNotMatch(src,/Math\.pow\(|predictOutcome\(/);
  assert.match(src,/causalEffect: null/);
});
test('B11-35 deep comparison identifies changed limitations and metadata',()=> {
  const c=reviewed();let r=report();r.limitations[0]='Verified student outcomes';
  assert.equal(replayJourneyT0T1Comparison(c,r),false);
  r=report();r.t0FrozenAt='2026-12-01T00:00:00.000Z';assert.equal(replayJourneyT0T1Comparison(c,r),false);
});
test('B11-36 no conditional claim about improvement on zero completion',()=> {
  const r=report();assert.equal(r.summary.reportedCompletionPercent,37.5);
  assert.ok(!Object.hasOwn(r,'improvedByCLA'));assert.equal(r.causalEffect,null);
});
