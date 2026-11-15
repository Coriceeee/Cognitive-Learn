import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle,
  buildJourneyEvidence, isJourneyCycle, isJourneyEvidenceRecord, isJourneyLock } from '../src/lib/closedLoopJourney.ts';

const startedAt = '2026-11-13T12:00:00.000Z';
const plan = () => createJourneyCycle({ id: 'cycle_lock_001', scenarioId:'balanced',
  scenarioTitle:'Cân bằng', targetMajor:'Kỹ thuật', plannedWeeklyHours:12, weeksLeft:8,
  startedAt, subjects:[{key:'math', label:'Toán', baseline:0, target:7},
    {key:'english', label:'Anh', baseline:8.25, target:9}] });
const tracked = () => appendJourneyCheckIn(plan(), {id:'check_001', week:1, actualHours:0,
  plannedActions:4, completedActions:0, note:'Tự đánh giá', recordedAt:startedAt});
const reviewed = () => reassessJourneyCycle(tracked(), {observations:[{key:'math',score:0}],
  note:'Tự báo cáo', recordedAt:'2026-11-13T14:00:00.000Z'});
const code = (file) => readFileSync(new URL(file,import.meta.url),'utf8');

test('JR01 new cycle has no evidence before reassessment', () => {
  const x=plan(); assert.equal(x.evidenceRecord,null); assert.equal(x.reassessment,null);
});
test('JR02 evidence is persisted as a derived property of reviewed cycle', () => {
  const x=reviewed(); assert.equal(x.status,'REVIEWED'); assert.ok(x.evidenceRecord);
  assert.equal(x.evidenceRecord.resultId,'cycle_lock_001-review');
  assert.equal(x.evidenceRecord.inputSnapshotId,'cycle_lock_001');
  assert.equal(x.evidenceRecord.resultType,'recommendation');
  assert.equal(isJourneyCycle(x),true);
});
test('JR03 scores of zero stay zero, missing outcomes are not imputed', () => {
  const x=reviewed(); assert.equal(x.evidenceRecord.output.value,0);
  assert.equal(x.reassessment.observations.length,1);
  assert.equal(x.reassessment.observations[0].key,'math');
  assert.equal(x.evidenceRecord.output.probability,null);
});
test('JR04 evidence discloses provenance and no causal/confidence claim', () => {
  const x=reviewed().evidenceRecord;
  assert.equal(x.modelVersion,'rule-based-unvalidated-v1');
  assert.equal(x.uncertainty.type,'not_estimated');
  assert.equal(x.codeCommitHash,'not_recorded');
  assert.ok(x.limitations.some(v=>/causal/i.test(v)));
  assert.ok(x.limitations.some(v=>/verification/i.test(v)));
  assert.ok(x.evidenceRefs.every(v=>v.startsWith('self-report-')));
});
test('JR05 evidence record matches §26.1 mandatory contract fields', () => {
  const expected=['resultId','resultType','participantPseudonym','inputSnapshotId',
    'engine','datasetVersion','featureVersion','modelVersion','output','uncertainty',
    'factors','evidenceRefs','limitations','sourceVersions','codeCommitHash','createdAt','humanOverride'];
  assert.deepEqual(Object.keys(reviewed().evidenceRecord).sort(),expected.sort());
  assert.equal(isJourneyEvidenceRecord(reviewed().evidenceRecord,'cycle_lock_001'),true);
});
test('JR06 corrupted lineage cannot silently be accepted', () => {
  const x=reviewed();
  assert.equal(isJourneyCycle({...x,evidenceRecord:{...x.evidenceRecord,output:{value:0,probability:0.9,unit:'%'}}}),false);
  assert.equal(isJourneyCycle({...x,evidenceRecord:{...x.evidenceRecord,participantPseudonym:'fake'}}),false);
});
test('JR07 old v1 records without evidenceRecord still readable', () => {
  const x=plan(); delete x.evidenceRecord;
  assert.equal(isJourneyCycle(x),true);
  const y=reviewed(); delete y.evidenceRecord;
  assert.equal(isJourneyCycle(y),true);
});
test('JR08 lock validates ownership and supports released state',()=>{
  assert.equal(isJourneyLock({schemaVersion:1,userId:'u1',activeCycleId:'cycle_lock_001'},'u1'),true);
  assert.equal(isJourneyLock({schemaVersion:1,userId:'u1',activeCycleId:null},'u1'),true);
  assert.equal(isJourneyLock({schemaVersion:1,userId:'u2',activeCycleId:null},'u1'),false);
  assert.equal(isJourneyLock({schemaVersion:1,userId:'u1',activeCycleId:'bad'},'u1'),false);
});
test('JR09 create uses transaction with fixed lock and server legacy ACTIVE preflight',()=>{
  const src=code('../src/lib/useClosedLoopJourney.ts');
  assert.match(src,/const lockPath = \(uid: string\) => doc\(db, root, uid, "state", "current"\)/);
  assert.match(src,/getDocsFromServer\(query\(cyclesPath\(owner\), where\("status", "==", "ACTIVE"\), limit\(1\)\)\)/);
  assert.match(src,/transaction\.get\(stateReference\)/);
  assert.match(src,/transaction\.set\(stateReference, nextState\)/);
  assert.match(src,/transaction\.set\(reference, \{ \.\.\.cycle/);
  assert.doesNotMatch(src,/await setDoc\(reference, \{ \.\.\.cycle/);
});
test('JR10 review releases state atomically and stores evidence; check-in does not release',()=>{
  const src=code('../src/lib/useClosedLoopJourney.ts');
  assert.match(src,/if \(next\.status === "REVIEWED"\) transaction\.update\(stateReference/);
  assert.match(src,/evidenceRecord: next\.evidenceRecord/);
  assert.match(src,/if \(!state\.exists\(\) \|\| !isJourneyLock/);
});
test('JR11 Rules enforce paired cycle+state updates using getAfter',()=>{
  const src=code('../firestore.rules.CANDIDATE_CP21');
  assert.match(src,/match \/learning_journeys\/\{uid\}\/state\/\{stateId\}/);
  assert.match(src,/getAfter\(journeyStatePath\(uid\)\)\.data\.activeCycleId == cycleId/);
  assert.match(src,/getAfter\(journeyStatePath\(uid\)\)\.data\.activeCycleId == null/);
  assert.match(src,/validJourneyEvidence\(request\.resource\.data\.get\('evidenceRecord', null\)/);
});
test('JR12 UI shows limitation and engine lineage, not calibrated probabilities',()=>{
  const src=code('../src/components/journey/ClosedLoopPanel.tsx');
  assert.match(src,/Dấu vết minh chứng kỹ thuật \(tự báo cáo\)/);
  assert.match(src,/không ước lượng/);
  assert.match(src,/latest\.evidenceRecord/);
});
test('JR13 evidence cannot be created before review or after malformed observations',()=>{
  assert.throws(()=>buildJourneyEvidence(plan()),/Chỉ tạo/);
  assert.throws(()=>reassessJourneyCycle(tracked(),{observations:[{key:'math',score:NaN}],note:'',recordedAt:startedAt}));
});

test('JR14 rapid double-click is synchronously guarded in hook',()=>{
  const src=code('../src/lib/useClosedLoopJourney.ts');
  assert.match(src,/useRef\(false\)/);
  assert.match(src,/if \(busyRef\.current\) throw/);
  assert.match(src,/busyRef\.current = true/);
  assert.match(src,/finally \{ busyRef\.current = false/);
});
test('JR15 legacy lock can be claimed after a previous lock is released',()=>{
  const src=code('../src/lib/useClosedLoopJourney.ts');
  assert.match(src,/if \(state\.exists\(\)\) transaction\.update\(stateReference/);
  const rules=code('../firestore.rules.CANDIDATE_CP21');
  assert.match(rules,/resource\.data\.activeCycleId == null/);
  assert.match(rules,/getAfter\(journeyCyclePath\(uid, request\.resource\.data\.activeCycleId\)\)\.data\.status == 'ACTIVE'/);
});
