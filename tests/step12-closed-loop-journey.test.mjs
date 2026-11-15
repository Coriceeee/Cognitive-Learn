import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle,
  analyzeJourney, isJourneyCycle } from '../src/lib/closedLoopJourney.ts';

const NOW = '2026-11-13T08:00:00.000Z';
const plan = () => createJourneyCycle({ id: 'cycle_test_001', scenarioId: 'focused',
  scenarioTitle: 'Tập trung', targetMajor: 'Công nghệ thông tin', plannedWeeklyHours: 14,
  weeksLeft: 6, startedAt: NOW,
  subjects: [{ key: 'math', label: 'Toán', baseline: 0, target: 5 },
    { key: 'english', label: 'Anh', baseline: 8, target: 9 }] });
const check = (overrides = {}) => ({ id: 'checkin_001', week: 1, actualHours: 7,
  plannedActions: 4, completedActions: 2, note: 'Em đã học Toán', recordedAt: NOW, ...overrides });
const inspect = file => readFileSync(new URL(file, import.meta.url), 'utf8');

test('CL01 creates a versioned cycle and preserves valid baseline zero', () => {
  const cycle = plan();
  assert.equal(cycle.subjects[0].baseline, 0);
  assert.equal(cycle.status, 'ACTIVE');
  assert.equal(cycle.reassessment, null);
  assert.equal(cycle.origin, 'orion_simulation');
  assert.equal(isJourneyCycle(cycle), true);
});
test('CL02 rejects missing/NaN, invalid and duplicate baseline scores', () => {
  const base = { id: 'cycle_good_002', scenarioId:'balanced', scenarioTitle:'Cân bằng', targetMajor:'',plannedWeeklyHours:10,weeksLeft:8,startedAt:NOW };
  assert.throws(() => createJourneyCycle({...base,subjects:[{key:'math',label:'Toán',baseline:NaN,target:8}]}));
  assert.throws(() => createJourneyCycle({...base,subjects:[{key:'math',label:'Toán',baseline:10.1,target:8}]}));
  assert.throws(() => createJourneyCycle({...base,subjects:[{key:'math',label:'Toán',baseline:0,target:8},{key:'math',label:'Toán',baseline:0,target:7}]}));
  assert.throws(() => createJourneyCycle({...base,subjects:[]}));
});
test('CL03 no outcome is inferred merely from an Orion strategy', () => {
  const a = analyzeJourney(plan());
  assert.equal(a.stage,'CHECK_IN'); assert.equal(a.observedAverageDelta,null);
  assert.equal(a.completionRate,null);
});
test('CL04 check-in records self-report but is not an outcome', () => {
  const c = appendJourneyCheckIn(plan(),check());
  assert.equal(c.checkIns.length,1);
  assert.equal(c.checkIns[0].provenance,'student_self_report');
  assert.equal(analyzeJourney(c).observedAverageDelta,null);
  assert.equal(analyzeJourney(c).completionRate,50);
  assert.equal(analyzeJourney(c).totalHoursReported,7);
});
test('CL05 zero actual hours and zero completed tasks are observed zeros', () => {
  const c = appendJourneyCheckIn(plan(),check({actualHours:0,completedActions:0}));
  assert.equal(c.checkIns[0].actualHours,0);
  assert.equal(analyzeJourney(c).completionRate,0);
});
test('CL06 rejects duplicate week and check-in ID', () => {
  const c = appendJourneyCheckIn(plan(),check());
  assert.throws(()=>appendJourneyCheckIn(c,check({id:'checkin_002'})),/Tuần này/);
  assert.throws(()=>appendJourneyCheckIn(c,check({week:2})),/Tuần này/);
});
test('CL07 rejects invalid time and impossible completion', () => {
  assert.throws(()=>appendJourneyCheckIn(plan(),check({actualHours:169})));
  assert.throws(()=>appendJourneyCheckIn(plan(),check({actualHours:NaN})));
  assert.throws(()=>appendJourneyCheckIn(plan(),check({completedActions:5})));
  assert.throws(()=>appendJourneyCheckIn(plan(),check({week:7})));
});
test('CL08 reassessment is blocked until one actual check-in exists', () => {
  assert.throws(()=>reassessJourneyCycle(plan(),{recordedAt:NOW,note:'',observations:[{key:'math',score:5}]}));
});
test('CL09 reassessment only accepts observed subjects, 0 is valid', () => {
  const c=appendJourneyCheckIn(plan(),check());
  const r=reassessJourneyCycle(c,{recordedAt:NOW,note:'Kiểm tra',observations:[{key:'math',score:0}]});
  assert.equal(r.status,'REVIEWED');
  assert.equal(r.reassessment.provenance,'student_self_report');
  assert.equal(analyzeJourney(r).observedAverageDelta,0);
  assert.equal(analyzeJourney(r).suggestion,'REPLAN');
});
test('CL10 prevents unknown subject/NaN, absent score and duplicate score', () => {
  const c=appendJourneyCheckIn(plan(),check());
  const mk=observations=>reassessJourneyCycle(c,{recordedAt:NOW,note:'',observations});
  assert.throws(()=>mk([{key:'physics',score:9}]));
  assert.throws(()=>mk([{key:'math',score:NaN}]));
  assert.throws(()=>mk([]));
  assert.throws(()=>mk([{key:'math',score:8},{key:'math',score:7}]));
});
test('CL11 review calculates matched before-after delta without imputation', () => {
  const c=appendJourneyCheckIn(plan(),check({completedActions:4}));
  const r=reassessJourneyCycle(c,{recordedAt:NOW,note:'',observations:[{key:'english',score:7}]});
  assert.equal(analyzeJourney(r).observedAverageDelta,-1);
  assert.equal(r.subjects[0].baseline,0);
});
test('CL12 closed cycles cannot be edited, measured again, or check-in again', () => {
  const c=appendJourneyCheckIn(plan(),check());
  const r=reassessJourneyCycle(c,{recordedAt:NOW,note:'',observations:[{key:'math',score:3}]});
  assert.throws(()=>appendJourneyCheckIn(r,check({week:2,id:'checkin_002'})));
  assert.throws(()=>reassessJourneyCycle(r,{recordedAt:NOW,note:'',observations:[{key:'math',score:8}]}));
});
test('CL13 rejects corrupted documents, does not silently overwrite them',()=>{
  assert.equal(isJourneyCycle({}),false);
  assert.equal(isJourneyCycle({...plan(),schemaVersion:100}),false);
  assert.equal(isJourneyCycle({...plan(),checkIns:'forged'}),false);
  assert.equal(isJourneyCycle({...plan(),subjects:[{key:'math',baseline:'0',target:8}]}),false);
});
test('CL14 Orion, Pulse and Lumen all mount the same shared journey',()=>{
  for(const [file,mode] of [
    ['../src/page/orion/OrionPage.tsx','orion'],
    ['../src/page/pulse/PulsePage.tsx','pulse'],
    ['../src/page/lumen/LumenPage.tsx','lumen']]) {
    const src=inspect(file);
    assert.match(src,/import ClosedLoopPanel from/);
    assert.match(src,new RegExp(`<ClosedLoopPanel mode="${mode}"`));
  }
});
test('CL15 Firestore hook uses authenticated ownership and transaction-based updates',()=>{
  const code=inspect('../src/lib/useClosedLoopJourney.ts');
  assert.match(code,/onAuthStateChanged/);
  assert.match(code,/auth\.currentUser\?\.uid !== owner/);
  assert.match(code,/runTransaction/);
  assert.match(code,/if \(!isJourneyCycle\(current\)\)/);
});
test('CL16 candidate rules restrict student ownership, product consent, and immutable baselines',()=>{
  const code=inspect('../firestore.rules.CANDIDATE_CP21');
  assert.match(code,/match \/learning_journeys\/\{uid\}\/cycles\/\{cycleId\}/);
  assert.match(code,/function validJourneyRecord/);
  assert.match(code,/studentMayPersist\(uid\)/);
  assert.match(code,/resource\.data\.status == 'ACTIVE'/);
  assert.match(code,/affectedKeys\(\)\.hasOnly/);
  assert.match(code,/allow delete: if false;/);
});
test('CL17 no claim that self-report is externally verified or causal proof',()=>{
  const ui=inspect('../src/components/journey/ClosedLoopPanel.tsx');
  assert.match(ui,/tự báo cáo/);
  assert.match(ui,/không kết luận|không phải bằng chứng/i);
  assert.doesNotMatch(ui,/xác suất trúng tuyển [0-9]/i);
});
test('CL18 module never writes its own outcomes into Seed as proven grades',()=>{
  const hook=inspect('../src/lib/useClosedLoopJourney.ts');
  assert.doesNotMatch(hook,/student_transcripts|cognitive_history|learning_profiles/);
  assert.match(hook,/learning_journeys/);
});
