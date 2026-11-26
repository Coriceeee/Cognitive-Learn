import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createJourneyCycle, appendJourneyCheckIn, reassessJourneyCycle } from '../src/lib/closedLoopJourney.ts';
import { assessJourneySnapshot } from '../src/lib/journeySnapshotGate.ts';
import { buildStudentJourneyHandoff } from '../src/lib/studentJourneyBridge.ts';

const uid = 'student_cp70_A';
const NOW = '2026-11-22T06:00:00.000Z';
const mk = () => ({ ...createJourneyCycle({ id: 'cycle_cp70_001', scenarioId: 'focused',
  scenarioTitle: 'Tập trung', targetMajor: 'Kỹ thuật', subjects: [
    { key: 'math', label: 'Toán', baseline: 6, target: 8 },
  ], plannedWeeklyHours: 12, weeksLeft: 8, startedAt: NOW }), userId: uid });
const meta = { fromCache: false, hasPendingWrites: false };
const record = (data, id = data.id) => [{ id, data }];
const file = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const handoff = (overrides = {}) => buildStudentJourneyHandoff({
  uid, signedOut: false, status: 'empty', fromServer: true, hasProfile: true, latest: null, ...overrides,
});

test('CP70.01 cached snapshots cannot publish cycles, even if all records are otherwise valid', () => {
  assert.deepEqual(assessJourneySnapshot(uid, record(mk()), { fromCache: true, hasPendingWrites: false }),
    { state: 'WAITING_FOR_SERVER', cycles: [] });
});
test('CP70.02 pending Firestore local writes cannot publish cycles as server-confirmed', () => {
  assert.deepEqual(assessJourneySnapshot(uid, record(mk()), { fromCache: false, hasPendingWrites: true }),
    { state: 'WAITING_FOR_SERVER', cycles: [] });
});
test('CP70.03 confirmed empty server snapshot is distinguishable from empty cache', () => {
  assert.equal(assessJourneySnapshot(uid, [], meta).state, 'VERIFIED_EMPTY');
  assert.equal(assessJourneySnapshot(uid, [], { ...meta, fromCache: true }).state, 'WAITING_FOR_SERVER');
});
test('CP70.04 owner mismatch fails closed and drops the full batch', () => {
  const value = mk();
  assert.equal(assessJourneySnapshot('student_cp70_B', record(value), meta).state, 'INVALID');
  assert.equal(assessJourneySnapshot(uid, [record(value)[0], record({ ...value, userId: 'student_cp70_B', id: 'cycle_cp70_002' })[0]], meta).cycles.length, 0);
});
test('CP70.05 document ID and payload ID must agree', () => {
  assert.equal(assessJourneySnapshot(uid, record(mk(), 'other_document_id'), meta).state, 'INVALID');
});
test('CP70.06 tampered cycle fields and missing owner do not become a student journey', () => {
  assert.equal(assessJourneySnapshot(uid, record({ ...mk(), userId: undefined }), meta).state, 'INVALID');
  assert.equal(assessJourneySnapshot(uid, record({ ...mk(), checkIns: 'fake' }), meta).state, 'INVALID');
});
test('CP70.07 server-confirmed valid document is available without changing observed grades', () => {
  const cycle = mk();
  const r = assessJourneySnapshot(uid, record(cycle), meta);
  assert.equal(r.state, 'VERIFIED');
  assert.equal(r.cycles[0].subjects[0].baseline, 6);
  assert.equal(r.cycles[0].status, 'ACTIVE');
});
test('CP70.08 initial loading does not falsely prompt sign-in or invent progress', () => {
  const r = handoff({ uid: '', status: 'loading', fromServer: false });
  assert.equal(r.phase, 'waiting'); assert.equal(r.primaryHref, null); assert.equal(r.checkIns, null);
});
test('CP70.09 waiting from cache and error never present previous student data', () => {
  for (const scenario of [{ status:'syncing',fromServer:false }, {status:'ready',fromServer:false}, {status:'error',fromServer:false}]) {
    const r = handoff({ ...scenario, latest: mk() });
    assert.equal(r.primaryHref, null);
    assert.equal(r.checkIns, null);
  }
});
test('CP70.10 verified but wrong UID is blocked in navigation handoff as defense-in-depth', () => {
  const r = handoff({ status:'ready', latest: { ...mk(), userId: 'other' } });
  assert.equal(r.phase, 'error'); assert.equal(r.currentModule, null);
});
test('CP70.11 no profile takes student to Seed after a server-confirmed read', () => {
  const r = handoff({ hasProfile: false });
  assert.equal(r.phase, 'profile'); assert.equal(r.primaryHref, '/student/profile');
});
test('CP70.12 empty verified journey starts at Lumen without a fake achievement score', () => {
  const r = handoff();
  assert.equal(r.phase, 'new'); assert.equal(r.primaryHref, '/lumen/advanced');
  assert.equal(r.checkIns, null);
});
test('CP70.13 active plan links to Pulse with zero observed check-ins', () => {
  const r = handoff({ status: 'ready', latest: mk() });
  assert.equal(r.phase, 'check-in'); assert.equal(r.checkIns, 0); assert.equal(r.plannedWeeks, 8);
  assert.equal(r.primaryHref, '/pulse/checkin');
  assert.match(r.sourceNote, /tự báo cáo/);
});
test('CP70.14 check-in links to reassessment, without treating self-report as academic progress', () => {
  const cycle = appendJourneyCheckIn(mk(), { id:'check_cp70_01',week:1,actualHours:0,completedActions:0,plannedActions:3,note:'',recordedAt:NOW });
  const r = handoff({ status: 'ready', latest: cycle });
  assert.equal(r.phase, 'reassess'); assert.equal(r.checkIns, 1); assert.equal(r.primaryHref, '/pulse/checkin');
});
test('CP70.15 reviewed plan links to Lumen evidence, without making a probability claim', () => {
  const cycle = appendJourneyCheckIn(mk(), { id:'check_cp70_01',week:1,actualHours:2,completedActions:1,plannedActions:3,note:'',recordedAt:NOW });
  const reviewed = reassessJourneyCycle(cycle, { recordedAt: NOW, observations: [{ key: 'math', score: 7 }], note: '' });
  const r = handoff({ status:'ready', latest:reviewed });
  assert.equal(r.phase, 'reviewed'); assert.equal(r.primaryHref, '/lumen/evidence'); assert.equal(r.checkIns, 1);
  assert.doesNotMatch(JSON.stringify(r), /[Pp]robability|xác suất đậu/);
});
test('CP70.16 hook listens for metadata changes and clears stale cycles before server verification', () => {
  const hook=file('src/lib/useClosedLoopJourney.ts');
  assert.match(hook,/includeMetadataChanges: true/);
  assert.match(hook,/assessJourneySnapshot\(currentUid/);
  assert.match(hook,/decision\.state === "WAITING_FOR_SERVER"[\s\S]*setCycles\(\[\]\)[\s\S]*setStatus\("syncing"\)/);
  assert.match(hook,/auth\.currentUser\?\.uid !== uid \|\| !recentFromServer/);
  assert.match(hook,/previous\.data\(\)\?\.userId !== owner/);
  assert.match(hook,/current\.userId !== owner \|\| current\.id !== cycleId/);
});
test('CP70.17 Orion and Pulse write controls require server-confirmed cycles', () => {
  const panel=file('src/components/journey/ClosedLoopPanel.tsx');
  assert.match(panel,/const canWrite = !journey\.busy && journey\.recentFromServer/);
  assert.match(panel,/journey\.status === "syncing"/);
});
test('CP70.18 student journey has one action, while the LearningCircuit exclusively owns six-module navigation', () => {
  const component=file('src/page/seed/components/StudentJourneyBridge.tsx');
  const map=file('src/page/seed/components/LearningCircuit.tsx');
  const student=file('src/page/seed/StudentPage.tsx');
  for (const name of ['SEED','LUMEN','ATLAS','ORION','PULSE','HAVEN']) assert.ok(map.includes(`code:"${name}"`), name);
  for (const route of ['/lumen','/atlas','/orion','/pulse','/haven']) assert.ok(map.includes(`href:"${route}"`), route);
  assert.match(map, /href=\{item\.code==="SEED"\?profilePath:item\.href\}/);
  assert.doesNotMatch(component, /cla-journey-handoff__route|nodes\.map/);
  assert.match(component, /handoff\.primaryHref/);
  assert.doesNotMatch(student,/StudentJourneyBridge/);
  assert.match(student, /<LearningCircuit profilePath=\{profilePath\} \/>/);
});

test('CP70.19 a new student can start a Seed profile even if journey read is offline', () => {
  const r = handoff({ hasProfile: false, status: 'error', fromServer: false });
  assert.equal(r.phase, 'profile');
  assert.equal(r.primaryHref, '/student/profile');
  assert.equal(r.checkIns, null);
});
