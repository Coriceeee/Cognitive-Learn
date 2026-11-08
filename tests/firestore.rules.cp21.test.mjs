/**
 * CLA Checkpoint 21 — Firestore Security Rules tests.
 * Run ONLY with Firebase Firestore Emulator. No production project is contacted.
 * npm run test:rules (inside firebase emulators:exec)
 */
import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp,
  setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-cla-cp21-security';
const UID = Object.freeze({
  student: 'student_001', other: 'student_002',
  teacher: 'teacher_001', parent: 'parent_001', admin: 'admin_001',
  inactive: 'inactive_001', missingActive: 'missingactive_001',
});
const ELECTIVES = ['Vật lý', 'Hóa học', 'Sinh học', 'Tin học'];
const ALT_ELECTIVES = ['Vật lý', 'Hóa học', 'Địa lý', 'Tin học'];
let env;
const account = (uid, role, active = true) => ({
  email: `${uid}@example.test`, role, active, fullName: uid,
  createdAt: '2026-11-02T00:00:00.000Z',
});
const dbAs = uid => env.authenticatedContext(uid, { email: `${uid}@example.test` }).firestore();
const anonymous = () => env.unauthenticatedContext().firestore();
const ref = (db, col, uid) => doc(db, col, uid);
const curriculum = (electives = ELECTIVES, overrides = {}) => ({
  program: 'GDPT 2018', foreignLanguage: 'Tiếng Anh', electiveSelectionLocked: true,
  selectedElectives: [...electives],
  gradedSubjects: ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử',
    'Giáo dục quốc phòng và an ninh', ...electives],
  ...overrides,
});
const profile = (uid, electives = ELECTIVES, scope = 'student') => ({
  userId: uid, schemaVersion: 1, dataScope: scope, curriculum: curriculum(electives),
  profile: { fullName: 'Học sinh thử nghiệm' }, updatedAt: serverTimestamp(),
});
const transcript = (uid, electives = ELECTIVES, scope = 'student') => ({
  userId: uid, schemaVersion: 1, dataScope: scope, curriculum: curriculum(electives),
  transcript: { grade12: { semester1: { 'Toán': { regular: ['0', '', '', '', ''], midterm: '', final: '' } } } },
  gpaSummary: {}, updatedAt: serverTimestamp(),
});
const linkId = (student, viewer) => `${student}_${viewer}`;
const writeLink = (db, student = UID.student, viewer = UID.teacher, role = 'teacher') =>
  setDoc(ref(db, 'student_links', linkId(student, viewer)), {
    studentId: student, viewerId: viewer, viewerRole: role,
    studentName: 'Student demo', createdAt: serverTimestamp(),
  });
const writeReport = (db, student = UID.student, viewer = UID.teacher, role = 'teacher') =>
  setDoc(ref(db, 'student_shared_reports', linkId(student, viewer)), {
    studentId: student, viewerId: viewer, viewerRole: role,
    title: 'Báo cáo tuần học tập', summary: 'Em đã hoàn thành các nhiệm vụ trong tuần học này.',
    nextStep: 'Ôn môn Toán', status: 'shared', feedback: '', reviewedAt: null,
    createdAt: serverTimestamp(),
  });

before(async () => {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  assert.ok(host, 'STOP: FIRESTORE_EMULATOR_HOST is missing. Run under Firebase Emulator, never production.');
  assert.match(process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || PROJECT_ID,
    /^demo-/, 'STOP: only demo project IDs are permitted');
  const [hostname, portString] = host.split(':');
  assert.ok(hostname && /^\d+$/.test(portString), 'Invalid emulator host: ' + host);
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: hostname, port: Number(portString),
      rules: readFileSync(new URL('../firestore.rules.CANDIDATE_CP21', import.meta.url), 'utf8') },
  });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(ref(db, 'users', UID.student), account(UID.student, 'student')),
      setDoc(ref(db, 'users', UID.other), account(UID.other, 'student')),
      setDoc(ref(db, 'users', UID.teacher), account(UID.teacher, 'teacher')),
      setDoc(ref(db, 'users', UID.parent), account(UID.parent, 'parent')),
      setDoc(ref(db, 'users', UID.admin), account(UID.admin, 'admin')),
      setDoc(ref(db, 'users', UID.inactive), account(UID.inactive, 'student', false)),
      setDoc(ref(db, 'users', UID.missingActive), (() => {
        const u = account(UID.missingActive, 'student'); delete u.active; return u;
      })()),
    ]);
  });
});
after(async () => { await env?.cleanup(); });

// User lifecycle: no client role escalation, no arbitrary read/list.
test('U01 unauthenticated user cannot read an account', async () => {
  await assertFails(getDoc(ref(anonymous(), 'users', UID.student)));
});
test('U02 active user reads only own users document', async () => {
  await assertSucceeds(getDoc(ref(dbAs(UID.student), 'users', UID.student)));
  await assertFails(getDoc(ref(dbAs(UID.student), 'users', UID.other)));
});
test('U03 list users denied even to admin', async () => {
  await assertFails(getDocs(collection(dbAs(UID.admin), 'users')));
});
test('U04 student may register but not self-register admin', async () => {
  const good = 'newstudent_001';
  await assertSucceeds(setDoc(ref(dbAs(good), 'users', good), account(good, 'student')));
  const bad = 'newadmin_001';
  await assertFails(setDoc(ref(dbAs(bad), 'users', bad), account(bad, 'admin')));
});
test('U05 role, active and account deletion cannot be modified client-side', async () => {
  await assertFails(updateDoc(ref(dbAs(UID.student), 'users', UID.student), { role: 'admin' }));
  await assertFails(updateDoc(ref(dbAs(UID.student), 'users', UID.student), { active: false }));
  await assertFails(deleteDoc(ref(dbAs(UID.student), 'users', UID.student)));
});
test('U06 inactive and missing-active student cannot read/write protected records', async () => {
  for (const uid of [UID.inactive, UID.missingActive]) {
    await assertFails(setDoc(ref(dbAs(uid), 'learning_profiles', uid), profile(uid)));
    await assertFails(getDoc(ref(dbAs(uid), 'student_transcripts', uid)));
  }
});

// Student-owned academic profile and transcript, including a full atomic UI save.
test('S01 student reads and writes only own profile', async () => {
  await assertSucceeds(setDoc(ref(dbAs(UID.student), 'learning_profiles', UID.student), profile(UID.student)));
  await assertSucceeds(getDoc(ref(dbAs(UID.student), 'learning_profiles', UID.student)));
  await assertFails(getDoc(ref(dbAs(UID.other), 'learning_profiles', UID.student)));
  await assertFails(setDoc(ref(dbAs(UID.other), 'learning_profiles', UID.student), profile(UID.student)));
});
test('S02 teacher and parent cannot read private transcript', async () => {
  await assertSucceeds(setDoc(ref(dbAs(UID.student), 'student_transcripts', UID.student), transcript(UID.student)));
  for (const uid of [UID.teacher, UID.parent, UID.admin]) {
    await assertFails(getDoc(ref(dbAs(uid), 'student_transcripts', UID.student)));
  }
});
test('S03 student transcript stores real zero and supports read-back', async () => {
  await assertSucceeds(setDoc(ref(dbAs(UID.student), 'student_transcripts', UID.student), transcript(UID.student)));
  const result = await assertSucceeds(getDoc(ref(dbAs(UID.student), 'student_transcripts', UID.student)));
  assert.equal(result.data().transcript.grade12.semester1['Toán'].regular[0], '0');
});
test('S04 reject invalid, duplicate, or unlocked elective selections', async () => {
  const db = dbAs(UID.student);
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student,
    ['Vật lý', 'Vật lý', 'Sinh học', 'Tin học'])));
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student,
    ['Vật lý', 'Hóa học', 'Sinh học', 'Môn không hợp lệ'])));
  const unlocked = profile(UID.student); unlocked.curriculum.electiveSelectionLocked = false;
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), unlocked));
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student,
    ['Vật lý', 'Hóa học', 'Sinh học'])));
});
test('S04b reject empty or repeated foreign-language subject', async () => {
  const db = dbAs(UID.student);
  for (const language of ['', 'Vật lý']) {
    const value = profile(UID.student);
    value.curriculum.foreignLanguage = language;
    value.curriculum.gradedSubjects[2] = language;
    await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), value));
  }
});
test('S05 server locks four electives in learning_profiles across updates', async () => {
  const db = dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student)));
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student, ALT_ELECTIVES)));
});
test('S06 server locks four electives in student_transcripts across updates', async () => {
  const db = dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db, 'student_transcripts', UID.student), transcript(UID.student)));
  await assertFails(setDoc(ref(db, 'student_transcripts', UID.student), transcript(UID.student, ALT_ELECTIVES)));
});
test('S07 selected electives must agree with existing other academic document', async () => {
  const db = dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student)));
  await assertFails(setDoc(ref(db, 'student_transcripts', UID.student), transcript(UID.student, ALT_ELECTIVES)));
});
test('S08 atomic write of profile, transcript and history succeeds for student UID', async () => {
  const db = dbAs(UID.student);
  const batch = writeBatch(db);
  batch.set(ref(db, 'learning_profiles', UID.student), profile(UID.student));
  batch.set(ref(db, 'student_transcripts', UID.student), transcript(UID.student));
  batch.set(doc(db, 'learning_profiles', UID.student, 'cognitive_history', 'snap_01'),
    { studentId: UID.student, dataScope: 'student', SCI: 70, createdAt: serverTimestamp() });
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(ref(db, 'student_transcripts', UID.student)));
});
test('S09 invalid batch cannot partially write profile and transcript', async () => {
  const db = dbAs(UID.student);
  const batch = writeBatch(db);
  batch.set(ref(db, 'learning_profiles', UID.student), profile(UID.student));
  batch.set(ref(db, 'student_transcripts', UID.other), transcript(UID.other));
  await assertFails(batch.commit());
  const snap = await assertSucceeds(getDoc(ref(db, 'learning_profiles', UID.student)));
  assert.equal(snap.exists(), false);
});
test('S10 cognitive snapshots are append-only and cannot forge other user ID', async () => {
  const db = dbAs(UID.student);
  const r = doc(db, 'learning_profiles', UID.student, 'cognitive_history', 's001');
  await assertSucceeds(setDoc(r, { studentId: UID.student, dataScope: 'student', SCI: 30 }));
  await assertFails(updateDoc(r, { SCI: 100 }));
  await assertFails(deleteDoc(r));
  await assertFails(setDoc(doc(db, 'learning_profiles', UID.student, 'cognitive_history', 's002'),
    { studentId: UID.other, dataScope: 'student' }));
});
test('S11 list and delete of owner profile/transcript are denied', async () => {
  const db = dbAs(UID.student);
  await assertFails(getDocs(collection(db, 'student_transcripts')));
  await assertFails(getDocs(collection(db, 'learning_profiles')));
  await assertFails(deleteDoc(ref(db, 'learning_profiles', UID.student)));
  await assertFails(deleteDoc(ref(db, 'student_transcripts', UID.student)));
});

test('S14 profile writes require schemaVersion 1, including admin demo', async () => {
  const studentDb = dbAs(UID.student);
  const noVersion = profile(UID.student); delete noVersion.schemaVersion;
  await assertFails(setDoc(ref(studentDb, 'learning_profiles', UID.student), noVersion));
  const futureVersion = profile(UID.student); futureVersion.schemaVersion = 99;
  await assertFails(setDoc(ref(studentDb, 'learning_profiles', UID.student), futureVersion));
  await assertSucceeds(setDoc(ref(studentDb, 'learning_profiles', UID.student), profile(UID.student)));
  const adminInvalid = profile(UID.admin, ELECTIVES, 'demo'); adminInvalid.schemaVersion = 99;
  await assertFails(setDoc(ref(dbAs(UID.admin), 'learning_profiles', UID.admin), adminInvalid));
});
test('S12 profile and history retain actual 0 distinct from unknown null in atomic save', async () => {
  const db = dbAs(UID.student);
  const batch = writeBatch(db);
  batch.set(ref(db, 'learning_profiles', UID.student), profile(UID.student));
  batch.set(ref(db, 'student_transcripts', UID.student), transcript(UID.student));
  batch.set(doc(db, 'learning_profiles', UID.student, 'cognitive_history', 'missing01'), {
    studentId: UID.student, dataScope: 'student', SCI: 0,
    gpaOverall: null, studyHoursPerWeek: null, practiceTestsPerWeek: 0,
    planCompletionRate: 0, motivationLevel: null, createdAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
  const history = await assertSucceeds(getDoc(doc(db, 'learning_profiles', UID.student, 'cognitive_history', 'missing01')));
  assert.equal(history.data().gpaOverall, null);
  assert.equal(history.data().practiceTestsPerWeek, 0);
  assert.equal(history.data().planCompletionRate, 0);
});
test('S13 teacher and unrelated student cannot read another student cognitive history', async () => {
  const db = dbAs(UID.student);
  const path = ['learning_profiles', UID.student, 'cognitive_history', 'a1'];
  await assertSucceeds(setDoc(doc(db, ...path), {studentId: UID.student, dataScope: 'student', SCI: 71}));
  await assertFails(getDoc(doc(dbAs(UID.teacher), ...path)));
  await assertFails(getDoc(doc(dbAs(UID.other), ...path)));
});

// Admin Demo acts under own UID only, with explicit demo scope.
test('A01 admin may write only own demo profile/transcript and read back', async () => {
  const db = dbAs(UID.admin);
  await assertSucceeds(setDoc(ref(db, 'learning_profiles', UID.admin), profile(UID.admin, ELECTIVES, 'demo')));
  await assertSucceeds(setDoc(ref(db, 'student_transcripts', UID.admin), transcript(UID.admin, ELECTIVES, 'demo')));
  await assertSucceeds(getDoc(ref(db, 'student_transcripts', UID.admin)));
});
test('A02 admin cannot mislabel demo as student or edit student document', async () => {
  const db = dbAs(UID.admin);
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.admin), profile(UID.admin, ELECTIVES, 'student')));
  await assertFails(setDoc(ref(db, 'student_transcripts', UID.admin), transcript(UID.admin, ELECTIVES, 'student')));
  await assertFails(setDoc(ref(db, 'student_transcripts', UID.student), transcript(UID.student)));
});
test('A03 student cannot forge dataScope demo', async () => {
  const db = dbAs(UID.student);
  await assertFails(setDoc(ref(db, 'student_transcripts', UID.student), transcript(UID.student, ELECTIVES, 'demo')));
  await assertFails(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student, ELECTIVES, 'demo')));
});

// Owner-specific drafts: no cross-UID reads/writes, no open health collection.
test('M01 student owns Atlas/Orion/Pulse/Haven drafts', async () => {
  const db = dbAs(UID.student);
  const cases = [
    ['atlas_workspaces', { userId: UID.student, schemaVersion: 1,
      universities: [], sources: [], programs: [], updatedAt: serverTimestamp() }],
    ...['orion_drafts', 'pulse_drafts', 'haven_drafts'].map(col => [col,
      { userId: UID.student, schemaVersion: 1, data: {}, updatedAt: serverTimestamp() }]),
  ];
  for (const [col, data] of cases) {
    await assertSucceeds(setDoc(ref(db, col, UID.student), data));
    await assertSucceeds(getDoc(ref(db, col, UID.student)));
    await assertFails(getDoc(ref(dbAs(UID.other), col, UID.student)));
    await assertFails(setDoc(ref(dbAs(UID.teacher), col, UID.student), data));
  }
});
test('M02 admin can only read its own drafts and cannot enumerate users', async () => {
  const db = dbAs(UID.admin);
  await assertSucceeds(setDoc(ref(db, 'orion_drafts', UID.admin),
    { userId: UID.admin, schemaVersion: 1, data: {}, updatedAt: serverTimestamp() }));
  await assertFails(getDocs(collection(db, 'orion_drafts')));
  await assertFails(getDoc(ref(db, 'orion_drafts', UID.student)));
});
test('M03 unknown collections and public system_health writes are denied', async () => {
  await assertFails(setDoc(ref(dbAs(UID.student), 'surprise_collection', UID.student), { hello: true }));
  await assertFails(getDoc(ref(dbAs(UID.admin), 'system_health', 'status')));
  await assertFails(setDoc(ref(dbAs(UID.admin), 'system_health', 'status'), { healthy: true }));
});

// Student-authorized link/report flow, teacher one-time feedback and revocation.
test('L01 only student can create link to actual teacher or parent role', async () => {
  await assertSucceeds(writeLink(dbAs(UID.student)));
  await assertSucceeds(writeLink(dbAs(UID.student), UID.student, UID.parent, 'parent'));
  await assertFails(writeLink(dbAs(UID.student), UID.student, UID.teacher, 'parent'));
  await assertFails(writeLink(dbAs(UID.teacher), UID.student, UID.parent, 'parent'));
});
test('L02 Teacher can list only their links, not other user links', async () => {
  await assertSucceeds(writeLink(dbAs(UID.student)));
  await assertSucceeds(getDocs(query(collection(dbAs(UID.teacher), 'student_links'),
    where('viewerId', '==', UID.teacher), limit(40))));
  await assertFails(getDocs(query(collection(dbAs(UID.other), 'student_links'),
    where('viewerId', '==', UID.teacher), limit(40))));
});
test('L03 viewer cannot read report without explicit link', async () => {
  await assertFails(writeReport(dbAs(UID.student)));
});
test('L04 only student can share report; intended viewer can read', async () => {
  await writeLink(dbAs(UID.student));
  await assertSucceeds(writeReport(dbAs(UID.student)));
  await assertSucceeds(getDoc(ref(dbAs(UID.teacher), 'student_shared_reports', linkId(UID.student, UID.teacher))));
  await assertFails(getDoc(ref(dbAs(UID.parent), 'student_shared_reports', linkId(UID.student, UID.teacher))));
  await assertFails(getDoc(ref(dbAs(UID.admin), 'student_shared_reports', linkId(UID.student, UID.teacher))));
});
test('L05 teacher can review once but cannot edit report summary', async () => {
  await writeLink(dbAs(UID.student)); await writeReport(dbAs(UID.student));
  const report = ref(dbAs(UID.teacher), 'student_shared_reports', linkId(UID.student, UID.teacher));
  await assertFails(updateDoc(report, { summary: 'Forged', feedback: 'Tốt lắm',
    status: 'reviewed', reviewedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(report, { feedback: 'Hoàn thành tốt',
    status: 'reviewed', reviewedAt: serverTimestamp() }));
  await assertFails(updateDoc(report, { feedback: 'Một lần nữa',
    status: 'reviewed', reviewedAt: serverTimestamp() }));
});
test('L06 revoke report first then link; link cannot be deleted while shared', async () => {
  await writeLink(dbAs(UID.student)); await writeReport(dbAs(UID.student));
  const link = ref(dbAs(UID.student), 'student_links', linkId(UID.student, UID.teacher));
  const report = ref(dbAs(UID.student), 'student_shared_reports', linkId(UID.student, UID.teacher));
  await assertFails(deleteDoc(link));
  await assertSucceeds(deleteDoc(report));
  await assertSucceeds(deleteDoc(link));
  await assertFails(getDoc(ref(dbAs(UID.teacher), 'student_shared_reports', linkId(UID.student, UID.teacher))));
});
