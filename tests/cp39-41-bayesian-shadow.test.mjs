import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {createJourneyCycle,appendJourneyCheckIn,reassessJourneyCycle} from '../src/lib/closedLoopJourney.ts';
import {evaluateFeedbackShadow as run} from '../src/lib/bayesianFeedbackShadow.ts';
const f=JSON.parse(readFileSync(new URL('../research/golden_path/fixture_SYNTHETIC.v1.json',import.meta.url),'utf8'));
function cycle({days=[1,8,15],done=[0,3,4],weeks=[1,2,3],planned=4}={}){
 let c=createJourneyCycle(f.cycle);for(let i=0;i<days.length;i++){c=appendJourneyCheckIn(c,{...f.checkIns[0],id:`fixture_check_${i}`,week:weeks[i],recordedAt:new Date(Date.parse(f.cycle.startedAt)+days[i]*86400000).toISOString(),plannedActions:planned,completedActions:done[i]});}
 c=reassessJourneyCycle(c,{...f.reassessment,recordedAt:'2026-10-28T08:00:00.000Z'});c.userId='fixture-owner';return c;
}
const evalC=(c)=>run([c],'fixture-owner',true);
test('weekly Bernoulli not per-task count; posterior exact and sensitivity',()=>{const c=cycle(),before=structuredClone(c);const r=evalC(c);assert.equal(r.status,'SHADOW_ONLY');assert.equal(r.weeks,3);assert.equal(r.met,2);assert.deepEqual(r.posterior.map(p=>[p.alpha,p.beta]),[[3,2],[4,3],[3,3]]);assert.equal(r.posterior[0].mean,.6);assert.ok(Math.abs(r.posterior[0].credible95[0]-.19412045)<1e-6);assert.ok(Math.abs(r.posterior[0].credible95[1]-.932414)<1e-6);assert.equal(r.prediction,null);assert.equal(r.policyEffect,null);assert.deepEqual(c,before);});
test('prior sensitivity and zero completions valid',()=>{const r=evalC(cycle({done:[0,0,0]}));assert.equal(r.met,0);assert.equal(r.posterior[0].mean,.2);assert.ok(r.posterior.every(p=>p.credible95[0]>0&&p.credible95[1]<1));});
test('reject cache or cross owner',()=>{const c=cycle();assert.equal(run([c],'fixture-owner',false).posterior.length,0);assert.equal(run([c],'other',true).status,'BLOCKED');});
test('two weeks insufficient',()=>{const r=evalC(cycle({days:[1,8],done:[0,3]}));assert.equal(r.status,'INSUFFICIENT');assert.equal(r.posterior.length,0);});
test('same-day/backfilled weeks blocked',()=>{const r=evalC(cycle({days:[15,15,15]}));assert.equal(r.status,'BLOCKED');assert.equal(r.posterior.length,0);});
test('irregular spacing blocked',()=>assert.equal(evalC(cycle({days:[1,13,15]})).reason,'IRREGULAR_WEEKLY_REPORTS'));
test('tampered evidence blocked',()=>{const c=cycle();c.evidenceRecord.output.value=9;assert.equal(evalC(c).status,'BLOCKED');});
test('policy is not changed and student panel does not display posterior probability',()=>{const s=readFileSync(new URL('../src/components/journey/ClosedLoopPanel.tsx',import.meta.url),'utf8');assert.match(s,/evaluateFeedbackShadow\(journey.cycles, journey.uid/);assert.doesNotMatch(s,/feedbackShadow\.posterior/);assert.match(s,/freezeAdaptiveDecision\(adaptiveContext/);});
