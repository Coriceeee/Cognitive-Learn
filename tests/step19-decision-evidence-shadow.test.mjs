import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle } from '../src/lib/closedLoopJourney.ts';
import { evaluateShadowPolicies, replayShadowEvidence } from '../src/lib/journeyShadowPolicy.ts';
const ts = '2026-11-15T08:00:00.000Z';
function cycle() {return createJourneyCycle({ id:'shadow_cycle_001', scenarioId:'balanced',scenarioTitle:'Cân bằng',targetMajor:'',subjects:[{key:'math',label:'Toán',baseline:6,target:8}],plannedWeeklyHours:10,weeksLeft:4,startedAt:ts });}
function review(done, score) { const c=appendJourneyCheckIn(cycle(), {id:'shadow_check_001',week:1,actualHours:3,plannedActions:4,completedActions:done,note:'',recordedAt:ts}); return reassessJourneyCycle(c,{observations:[{key:'math',score}],note:'',recordedAt:ts});}
test('S19-01 incomplete cycle abstains and cannot imply a measured effect',()=>{const r=evaluateShadowPolicies(cycle()); assert.equal(r.adaptiveDecision,'ABSTAIN');assert.equal(r.changed,false);assert.equal(r.evidenceLevel,'technical_replay_only');});
test('S19-02 below engineering completion threshold differs from frozen static policy',()=>{const r=evaluateShadowPolicies(review(2,8));assert.equal(r.staticDecision,'MAINTAIN');assert.equal(r.adaptiveDecision,'REPLAN');assert.equal(r.changed,true);assert.equal(r.trigger,'self_reported_completion_below_60_percent');assert.equal(replayShadowEvidence(r),true);});
test('S19-03 positive delta with completed actions maintains both policies',()=>{const r=evaluateShadowPolicies(review(4,8));assert.equal(r.adaptiveDecision,'MAINTAIN');assert.equal(r.changed,false);assert.equal(replayShadowEvidence(r),true);});
test('S19-04 nonpositive score delta produces replan, including valid score zero',()=>{const r=evaluateShadowPolicies(review(4,0));assert.equal(r.trigger,'self_reported_score_delta_nonpositive');assert.equal(replayShadowEvidence(r),true);});
test('S19-05 tampering in recorded decisions is detected on replay',()=>{const r=evaluateShadowPolicies(review(2,8)); assert.equal(replayShadowEvidence({...r,adaptiveDecision:'MAINTAIN'}),false); assert.equal(replayShadowEvidence({...r,inputSnapshot:{...r.inputSnapshot,checkIns:[{...r.inputSnapshot.checkIns[0],completed:4}]}}),false);});
