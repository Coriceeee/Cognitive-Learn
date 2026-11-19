import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle } from '../src/lib/closedLoopJourney.ts';
import { evaluateShadowPolicies, replayShadowEvidence } from '../src/lib/journeyShadowPolicy.ts';
import { FIXTURE, validateSyntheticFixture, runSyntheticGoldenPath, createEnvelope, verifyEnvelope } from '../tools/cla_golden_path_offline.mjs';
import { cp31ReleaseSourceSha256 } from '../src/lib/nexusEvidenceBaseline.ts';
const { fingerprint, trackedFiles } = createRequire(import.meta.url)('../tools/cp31_release_fingerprint.cjs');
const raw = fs.readFileSync(FIXTURE,'utf8');
const data = JSON.parse(raw);
const clone = x => JSON.parse(JSON.stringify(x));
const make = (patch = {}) => ({...clone(data),...patch});
const run = () => runSyntheticGoldenPath(data);
const tryFail = f => assert.throws(() => runSyntheticGoldenPath(f));

test('B8-01 source integrity includes the fixed synthetic fixture',()=>{
 assert.ok(trackedFiles().includes('research/golden_path/fixture_SYNTHETIC.v1.json'));
 assert.equal(fingerprint().sha256,cp31ReleaseSourceSha256);
});
test('B8-02 seven stages use real domain functions in deterministic order',()=>{
 assert.deepEqual(run().stages.map(x=>x.name),['synthetic_seed','plan','check_ins','reassessment','outcome_analysis','evidence','adaptation']);
});
test('B8-03 never represents demo as a real research outcome or production QA',()=>{
 const r=run();assert.equal(r.dataScope,'SYNTHETIC_ONLY');
 for (const k of ['empiricalClaimEligible','treatmentEffectEstimated','independentlyVerified','productionDeploymentVerified']) assert.equal(r[k],false);
 assert.equal(r.evaluationStatus,'TECHNICAL_REPLAY_ONLY');
});
test('B8-04 no apparent learning progress before reassessment',()=>{
 assert.equal(run().before.observedAverageDelta,null);
 assert.equal(run().afterCheckIn.observedAverageDelta,null);
});
test('B8-05 observed zero is preserved as numeric 0, not missing',()=>{
 const r=run(); assert.equal(r.replay,undefined);
 assert.equal(r.evidence.output.value,.5);
 assert.equal(r.shadow.inputSnapshot.baselineSubjects[0].baseline,0);
 assert.equal(r.shadow.inputSnapshot.reassessment[0].score,0);
});
test('B8-06 zero reported hours and zero completed actions are valid synthetic input',()=>{
 const r=run();assert.equal(r.shadow.inputSnapshot.checkIns[0].completed,0);
 assert.deepEqual(r.stages[2].facts.observations,[0,37.5]);
});
test('B8-07 application produces a bounded self-report evidence record',()=>{
 const e=run().evidence;
 assert.equal(e.output.probability,null);
 assert.equal(e.uncertainty.value,null);
 assert.equal(e.codeCommitHash,'not_recorded');
 assert.ok(e.limitations.some(x=>x.includes('not a causal')));
});
test('B8-08 shadow engine compares static and adaptive, no treatment assignment',()=>{
 const r=run();assert.equal(r.shadow.staticDecision,'MAINTAIN'); assert.equal(r.shadow.adaptiveDecision,'REPLAN');
 assert.equal(r.shadow.trigger,'self_reported_completion_below_60_percent');
 assert.equal(r.stages[6].facts.assignedTreatment,false);
});
test('B8-09 new shadow verifier accepts authentic replay, abstention and valid zero',()=>{
 assert.equal(replayShadowEvidence(run().shadow),true);
 const before=createJourneyCycle(data.cycle);
 const abstain=evaluateShadowPolicies(before);
 assert.equal(abstain.adaptiveDecision,'ABSTAIN'); assert.equal(replayShadowEvidence(abstain),true);
});
test('B8-10 verifying the same fixture is deterministic',()=>{
 const a=createEnvelope(raw), b=createEnvelope(raw);
 assert.deepEqual(a,b);assert.equal(verifyEnvelope(a,raw),true);
});
test('B8-11 changing a derived metric without updating all fields is rejected',()=>{
 const e=createEnvelope(raw);e.payload.replay.assessment.observedAverageDelta=9;
 assert.equal(verifyEnvelope(e,raw),false);
});
test('B8-12 even a fully recomputed payload hash cannot forge original fixture',()=>{
 const e=createEnvelope(raw);e.payload.replay.dataScope='real-student';
 e.payloadSha256=crypto.createHash('sha256').update(JSON.stringify(e.payload)).digest('hex');
 assert.equal(verifyEnvelope(e,raw),false);
});
test('B8-13 wrong source fingerprint or extra metadata is denied',()=>{
 assert.equal(verifyEnvelope(createEnvelope(raw,'f'.repeat(64)),raw),false);
 const e=createEnvelope(raw);e.reviewedBy='independent expert';assert.equal(verifyEnvelope(e,raw),false);
});
test('B8-14 invalid record or null never passes local verification',()=>{
 assert.equal(verifyEnvelope(null,raw),false);
 assert.equal(verifyEnvelope({status:'PASS'},raw),false);
});
test('B8-15 synthetic scope and flag cannot be replaced with claims about participants',()=>{
 for (const patch of [{dataScope:'student'},{researchConsent:'granted'},{schema:'research.verified'}]) tryFail(make(patch));
});
test('B8-16 disallow real-looking cycle IDs and subject labels',()=>{
 for (const patch of [{id:'student_1'},{subjects:[{key:'math',label:'Toán thật',baseline:0,target:5}]}])
  tryFail(make({cycle:{...data.cycle,...patch}}));
});
test('B8-17 chronological order is mandatory, unlike mere date-parse validity',()=>{
 const first={...data.checkIns[0],recordedAt:'2026-09-01T08:00:00.000Z'};
 tryFail(make({checkIns:[first,data.checkIns[1]]}));
 tryFail(make({reassessment:{...data.reassessment,recordedAt:'2026-10-07T08:00:00.000Z'}}));
});
test('B8-18 reject forged or overflowing check-in scores instead of clamping',()=>{
 tryFail(make({checkIns:[{...data.checkIns[0],completedActions:5},data.checkIns[1]]}));
 tryFail(make({checkIns:[{...data.checkIns[0],actualHours:169},data.checkIns[1]]}));
});
test('B8-19 reject duplicated check-in weeks/identities and duplicate reassessments',()=>{
 tryFail(make({checkIns:[data.checkIns[0],{...data.checkIns[0],id:'synthetic_check_002',recordedAt:data.checkIns[1].recordedAt}]}));
 tryFail(make({reassessment:{...data.reassessment,observations:[{key:'math',score:0},{key:'math',score:4}]}}));
});
test('B8-20 reject malformed timestamps and free-text identity leakage',()=>{
 tryFail(make({checkIns:[{...data.checkIns[0],note:'student A'},data.checkIns[1]]}));
 tryFail(make({reassessment:{...data.reassessment,recordedAt:'2026-02-31T08:00:00.000Z'}}));
});
test('B8-21 shadow replay rejects falsified trigger, evidence class and limits',()=>{
 const r=run().shadow;
 for(const x of [{...r,trigger:'no_replan_trigger'},{...r,evidenceLevel:'validated'},
  {...r,limitations:[]},{...r,completionPercent:62.5},{...r,observedDelta:0}]) assert.equal(replayShadowEvidence(x),false);
});
test('B8-22 shadow replay rejects forged absent and malformed check-in data',()=>{
 const r=run().shadow;
 const c=r.inputSnapshot.checkIns[0];
 for(const x of [{...c,planned:0},{...c,completed:-1},{...c,source:'verified'},{...c,week:0}])
  assert.equal(replayShadowEvidence({...r,inputSnapshot:{...r.inputSnapshot,checkIns:[x,r.inputSnapshot.checkIns[1]]}}),false);
});
test('B8-23 shadow replay rejects negative scores, unknown subject and duplicates',()=>{
 const r=run().shadow;
 for(const observations of [[{key:'math',score:11}], [{key:'unknown',score:4}],
   [{key:'math',score:0},{key:'math',score:1}]])
  assert.equal(replayShadowEvidence({...r,inputSnapshot:{...r.inputSnapshot,reassessment:observations}}),false);
});
test('B8-24 shadow replay refuses synthetic data disguised as validated evidence',()=>{
 const r=run().shadow;
 assert.equal(replayShadowEvidence({...r,inputSnapshot:{...r.inputSnapshot,checkIns:[{...r.inputSnapshot.checkIns[0],source:'teacher_verified'},r.inputSnapshot.checkIns[1]]}}),false);
});
test('B8-25 no network or credential dependencies in the replay engine',()=>{
 const src=fs.readFileSync(new URL('../tools/cla_golden_path_offline.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/firebase\/(?:app|auth|firestore)|fetch\(|getDoc\(|setDoc\(|updateDoc\(|process\.env\.CLA_E2E_/);
});

test('B8-26 refuse extra PII fields at every fixture level, even with a synthetic marker',()=>{
 tryFail(make({cycle:{...data.cycle,studentName:'Real Student'}}));
 tryFail(make({cycle:{...data.cycle,subjects:[{...data.cycle.subjects[0],uid:'sensitive'}]}}));
 tryFail(make({reassessment:{...data.reassessment,observations:[{...data.reassessment.observations[0],studentId:'unsafe'}]}}));
});
