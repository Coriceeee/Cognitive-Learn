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
const studentConsent = (uid, accepted = true, extra = {}) => ({
  userId: uid, schemaVersion: 1, noticeVersion: 'cla-student-privacy-v1',
  productAccepted: accepted, researchConsent: false, updatedAt: serverTimestamp(), ...extra,
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
  assert.ok(['127.0.0.1', 'localhost'].includes(hostname) && /^\d+$/.test(portString)
    && Number(portString) >= 1024 && Number(portString) <= 65535,
    'SECURITY STOP: Firestore Emulator must be a local loopback host, never a remote database.');
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
      setDoc(ref(db, 'student_consents', UID.student), studentConsent(UID.student)),
      setDoc(ref(db, 'student_consents', UID.other), studentConsent(UID.other)),
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


// CP24 — persisted pipeline provenance: privacy/minimal payload, owner-only and append-only.
const auditRef = (db, uid, id = 'audit_001') => doc(db, 'pipeline_evidence', uid, 'checks', id);
const auditRecord = (scope = 'student', extra = {}) => ({
  schemaVersion: 1, evidenceVersion: 'cla-pipeline-evidence-v1',
  recordType: 'technical-lineage', dataScope: scope,
  checkedAt: '2026-11-08T08:15:00.000Z', createdAt: serverTimestamp(),
  complete: false,
  stages: { seed:'PRESENT', lumen:'LIMITED', orion:'MISSING', pulse:'MISSING' },
  historyStatus:'NONE', historyCount:0, ...extra,
});
test('E01 student creates and reads back own technical evidence', async () => {
  const db = dbAs(UID.student);
  await assertSucceeds(setDoc(auditRef(db,UID.student),auditRecord()));
  const loaded = await assertSucceeds(getDoc(auditRef(db,UID.student)));
  assert.equal(loaded.data().recordType,'technical-lineage');
  assert.equal(loaded.data().complete,false);
  assert.equal('userId' in loaded.data(),false);
});
test('E02 unauthenticated, other student, teacher and parent cannot read evidence', async () => {
  await assertSucceeds(setDoc(auditRef(dbAs(UID.student),UID.student),auditRecord()));
  for (const db of [anonymous(),dbAs(UID.other),dbAs(UID.teacher),dbAs(UID.parent),dbAs(UID.admin)]) {
    await assertFails(getDoc(auditRef(db,UID.student)));
  }
});
test('E03 no cross-UID create, including admin', async () => {
  for (const uid of [UID.other,UID.teacher,UID.parent,UID.admin]) {
    await assertFails(setDoc(auditRef(dbAs(uid),UID.student),auditRecord()));
  }
});
test('E04 admin own demo is allowed but mislabeled student evidence is denied', async () => {
  const db=dbAs(UID.admin);
  await assertSucceeds(setDoc(auditRef(db,UID.admin,'demo_valid'),auditRecord('demo')));
  await assertFails(setDoc(auditRef(db,UID.admin,'demo_forged'),auditRecord('student')));
  await assertFails(setDoc(auditRef(dbAs(UID.student),UID.student,'student_forged'),auditRecord('demo')));
});
test('E05 false completion, arbitrary scores and user details cannot be stored', async () => {
  const db=dbAs(UID.student);
  for (const extra of [{complete:true},{studentName:'SENSITIVE'},{overallScore:100},{recordType:'validated-outcome'}]) {
    await assertFails(setDoc(auditRef(db,UID.student,'fake_'+Object.keys(extra)[0]),auditRecord('student',extra)));
  }
});
test('E06 technical record is append-only and cannot be erased', async () => {
  const db=dbAs(UID.student),record=auditRef(db,UID.student);
  await assertSucceeds(setDoc(record,auditRecord()));
  await assertFails(updateDoc(record,{historyCount:10}));
  await assertFails(deleteDoc(record));
});
test('E07 invalid stage schema, history count, timestamp, versions are rejected', async () => {
  const db=dbAs(UID.student);
  const errors=[
    {stages:{seed:'PRESENT',lumen:'LIMITED',orion:'MISSING',pulse:'EFFECTIVE'}},
    {stages:{seed:'PRESENT',lumen:'LIMITED',orion:'MISSING',pulse:'MISSING',name:'private'}},
    {historyStatus:'NONE',historyCount:1},
    {historyCount:100},
    {schemaVersion:2},
    {checkedAt:12345},
  ];
  for(let i=0;i<errors.length;i++) {
    await assertFails(setDoc(auditRef(db,UID.student,'invalid_'+i),auditRecord('student',errors[i])));
  }
});
test('E08 owner can list max 20 evidence records, strangers cannot list', async () => {
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(auditRef(db,UID.student),auditRecord()));
  const own=collection(db,'pipeline_evidence',UID.student,'checks');
  await assertSucceeds(getDocs(query(own,limit(20))));
  await assertFails(getDocs(query(own,limit(21))));
  await assertFails(getDocs(query(collection(dbAs(UID.other),'pipeline_evidence',UID.student,'checks'),limit(10))));
});
test('E09 disabled student may not persist technical evidence', async () => {
  await assertFails(setDoc(auditRef(dbAs(UID.inactive),UID.inactive),auditRecord()));
});

// P0 Student Data Consent — product use only, research not enrolled.
test('C01 no consent means no new student profile or transcript writes', async () => {
  const studentDb = dbAs(UID.student);
  await env.withSecurityRulesDisabled(async context => {
    await deleteDoc(ref(context.firestore(), 'student_consents', UID.student));
  });
  await assertFails(setDoc(ref(studentDb, 'learning_profiles', UID.student), profile(UID.student)));
  await assertFails(setDoc(ref(studentDb, 'student_transcripts', UID.student), transcript(UID.student)));
  await assertFails(setDoc(ref(studentDb, 'orion_drafts', UID.student), { userId: UID.student, schemaVersion: 1, data: {}, updatedAt: serverTimestamp() }));
  await assertSucceeds(setDoc(ref(studentDb, 'student_consents', UID.student), studentConsent(UID.student)));
  await assertSucceeds(setDoc(ref(studentDb, 'learning_profiles', UID.student), profile(UID.student)));
});
test('C02 student can withdraw and revoke future writes but still read old own records', async () => {
  const db = dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db, 'learning_profiles', UID.student), profile(UID.student)));
  await assertSucceeds(setDoc(ref(db, 'student_consents', UID.student), studentConsent(UID.student, false)));
  await assertSucceeds(getDoc(ref(db, 'learning_profiles', UID.student)));
  await assertFails(setDoc(ref(db, 'student_transcripts', UID.student), transcript(UID.student)));
});
test('C03 Research consent cannot be activated in product UX', async () => {
  await assertFails(setDoc(ref(dbAs(UID.student), 'student_consents', UID.student), studentConsent(UID.student, true, { researchConsent: true })));
});
test('C04 cross-account consent reads, writes and collection listing fail', async () => {
  await assertFails(getDoc(ref(dbAs(UID.other), 'student_consents', UID.student)));
  await assertFails(setDoc(ref(dbAs(UID.other), 'student_consents', UID.student), studentConsent(UID.student)));
  await assertFails(getDocs(collection(dbAs(UID.student), 'student_consents')));
  await assertFails(getDoc(ref(anonymous(), 'student_consents', UID.student)));
});
test('C05 forged consent schema, notice version, and fields rejected', async () => {
  const db = dbAs(UID.student);
  for (const forged of [
    { noticeVersion: 'unreviewed-v999' }, { randomField: 'secret' }, { userId: UID.other },
    { schemaVersion: 5 }, { productAccepted: 'true' },
  ]) {
    await assertFails(setDoc(ref(db, 'student_consents', UID.student), studentConsent(UID.student, true, forged)));
  }
});
test('C06 consent cannot be deleted or created by inactive user or admin', async () => {
  await assertFails(deleteDoc(ref(dbAs(UID.student), 'student_consents', UID.student)));
  await assertFails(setDoc(ref(dbAs(UID.inactive), 'student_consents', UID.inactive), studentConsent(UID.inactive)));
  await assertFails(setDoc(ref(dbAs(UID.admin), 'student_consents', UID.student), studentConsent(UID.student)));
});
test('C07 after withdrawal existing shared report becomes unreadable to teacher', async () => {
  const studentDb = dbAs(UID.student);
  await assertSucceeds(writeLink(studentDb));
  await assertSucceeds(writeReport(studentDb));
  await assertSucceeds(setDoc(ref(studentDb, 'student_consents', UID.student), studentConsent(UID.student, false)));
  await assertFails(getDoc(ref(dbAs(UID.teacher), 'student_shared_reports', linkId(UID.student, UID.teacher))));
  await assertSucceeds(getDoc(ref(studentDb, 'student_shared_reports', linkId(UID.student, UID.teacher))));
});
test('C08 Admin own demo draft remains possible without student consent', async () => {
  await assertSucceeds(setDoc(ref(dbAs(UID.admin), 'orion_drafts', UID.admin), {
    userId: UID.admin, schemaVersion: 1, data: {}, updatedAt: serverTimestamp(),
  }));
});

// Closed-Loop P0: client journey records must be student-owned, consent-bound and append-only.
const cyclePayload = (uid = UID.student, id = 'cycle_001') => ({
  id, userId: uid, schemaVersion: 1, origin: 'orion_simulation',
  scenarioId: 'balanced', scenarioTitle: 'Chiến lược cân bằng', targetMajor: 'Công nghệ',
  subjects: [{ key: 'math', label: 'Toán', baseline: 7, target: 8 }],
  plannedWeeklyHours: 10, weeksLeft: 8, startedAt: '2026-11-13T07:00:00.000Z',
  status: 'ACTIVE', checkIns: [], reassessment: null,
  createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
});
const cycleRef = (db, uid = UID.student, id = 'cycle_001') =>
  doc(db, 'learning_journeys', uid, 'cycles', id);
const stateRef = (db, uid = UID.student) => doc(db, 'learning_journeys', uid, 'state', 'current');
const statePayload = (uid = UID.student, id = 'cycle_001') => ({
  userId: uid, schemaVersion: 1, activeCycleId: id, updatedAt: serverTimestamp(),
});
const createCycleAtomic = (uid = UID.student, id = 'cycle_001', overrides = {}) => {
  const db = dbAs(uid);
  const batch = writeBatch(db);
  batch.set(stateRef(db, uid), statePayload(uid, id));
  batch.set(cycleRef(db, uid, id), { ...cyclePayload(uid, id), ...overrides });
  return batch.commit();
};
const evidencePayload = (id = 'cycle_001') => ({
  resultId: `${id}-review`, resultType: 'recommendation',
  participantPseudonym: `local-cycle-${id}`, inputSnapshotId: id,
  engine: { name: 'CLA Closed-Loop Analyzer', version: '1.1.0' },
  datasetVersion: 'student-self-report-v1', featureVersion: 'closed-loop-v1',
  modelVersion: 'rule-based-unvalidated-v1',
  output: { value: 0.5, probability: null, unit: 'score-points-0-to-10' },
  uncertainty: { type: 'not_estimated', value: null },
  factors: [
    { name: 'hours_self_reported', value: 7, direction: '?', attribution: null },
    { name: 'task_completion_percent_self_reported', value: 66.67, direction: '?', attribution: null },
  ],
  evidenceRefs: ['self-report-checkin:check_001', `self-report-reassessment:${id}`],
  limitations: ['Self-report, not independently verified', 'No control group', 'No calibration'],
  sourceVersions: ['cla-closed-loop-v1'], codeCommitHash: 'not_recorded',
  createdAt: '2026-11-21T07:00:00.000Z', humanOverride: null,
});
const reviewCycleAtomic = (db, uid = UID.student, id = 'cycle_001', evidence = evidencePayload(id)) => {
  const batch = writeBatch(db);
  batch.update(cycleRef(db, uid, id), {
    reassessment: review, status: 'REVIEWED', evidenceRecord: evidence, updatedAt: serverTimestamp(),
  });
  batch.update(stateRef(db, uid), { activeCycleId: null, updatedAt: serverTimestamp() });
  return batch.commit();
};
const checkin = { id: 'check_001', week: 1, recordedAt: '2026-11-14T07:00:00.000Z',
  actualHours: 7, plannedActions: 3, completedActions: 2,
  note: 'Luyện đề', provenance: 'student_self_report' };
const review = { recordedAt: '2026-11-21T07:00:00.000Z',
  observations: [{ key: 'math', score: 7.5 }], note: 'Đề kiểm tra tự nhập',
  provenance: 'student_self_report' };

test('J01 student may create/read only their own cycle after product consent', async () => {
  await assertSucceeds(createCycleAtomic());
  await assertSucceeds(getDoc(cycleRef(dbAs(UID.student))));
  await assertSucceeds(getDocs(query(collection(dbAs(UID.student), 'learning_journeys', UID.student, 'cycles'), limit(8))));
  await assertFails(getDoc(cycleRef(dbAs(UID.other))));
  await assertFails(getDocs(query(collection(dbAs(UID.other), 'learning_journeys', UID.student, 'cycles'), limit(8))));
});
test('J02 no cross-account or teacher/admin writes, and no public read', async () => {
  await assertFails(setDoc(cycleRef(dbAs(UID.other)), cyclePayload()));
  await assertFails(setDoc(cycleRef(dbAs(UID.teacher)), cyclePayload()));
  await assertFails(setDoc(cycleRef(dbAs(UID.admin)), cyclePayload()));
  await assertFails(getDoc(cycleRef(anonymous())));
  await assertFails(getDocs(collection(dbAs(UID.student), 'learning_journeys', UID.student, 'cycles')));
});
test('J03 creation rejects forged provenance, unbounded values and fake reviews', async () => {
  await assertFails(createCycleAtomic(UID.student, 'cycle_001', { scenarioId: 'other' }));
  await assertFails(createCycleAtomic(UID.student, 'cycle_001', { plannedWeeklyHours: 300 }));
  await assertFails(createCycleAtomic(UID.student, 'cycle_001', { subjects: [{ key: 'math', label: 'Toán', baseline: -1, target: 8 }] }));
  await assertFails(createCycleAtomic(UID.student, 'cycle_001', { status: 'REVIEWED' }));
  await assertFails(createCycleAtomic(UID.student, 'cycle_001', { checkIns: [checkin] }));
});
test('J04 only append check-in, then self-reported review; reviewed cycle is immutable', async () => {
  const reference = cycleRef(dbAs(UID.student));
  await assertSucceeds(createCycleAtomic());
  await assertSucceeds(updateDoc(reference, { checkIns: [checkin], updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(reference, { checkIns: [{ ...checkin, actualHours: 500 }], updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(reference, { scenarioTitle: 'Thay dữ liệu gốc', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(reference, { checkIns: [], updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(reference, { reassessment: { ...review, provenance: 'verified_test' }, status: 'REVIEWED', updatedAt: serverTimestamp() }));
  await assertSucceeds(reviewCycleAtomic(dbAs(UID.student)));
  await assertFails(updateDoc(reference, { checkIns: [checkin, { ...checkin, id: 'check_002', week: 2 }], updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(reference));
});
test('J05 withdrawing product consent prevents new check-ins but allows reading history', async () => {
  const reference = cycleRef(dbAs(UID.student));
  await assertSucceeds(createCycleAtomic());
  await assertSucceeds(setDoc(ref(dbAs(UID.student), 'student_consents', UID.student), studentConsent(UID.student, false)));
  await assertSucceeds(getDoc(reference));
  await assertFails(updateDoc(reference, { checkIns: [checkin], updatedAt: serverTimestamp() }));
  await assertFails(setDoc(cycleRef(dbAs(UID.student), UID.student, 'cycle_002'), cyclePayload(UID.student, 'cycle_002')));
});

// v1.1 atomic mutex / lineage acceptance tests. These MUST run in the emulator;
// a grep/static test is not a substitute for these runtime assertions.
test('J06 cannot create a cycle without atomic state update', async () => {
  await assertFails(setDoc(cycleRef(dbAs(UID.student)), cyclePayload()));
  await assertSucceeds(createCycleAtomic());
  await assertFails(setDoc(cycleRef(dbAs(UID.student), UID.student, 'cycle_002'), cyclePayload(UID.student, 'cycle_002')));
});
test('J07 two competing creates cannot both become ACTIVE', async () => {
  const results = await Promise.allSettled([
    createCycleAtomic(UID.student, 'cycle_001'),
    createCycleAtomic(UID.student, 'cycle_002'),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const current = await getDoc(stateRef(dbAs(UID.student)));
  assert.ok(['cycle_001', 'cycle_002'].includes(current.data().activeCycleId));
});
test('J08 cannot release mutex without reviewing its cycle', async () => {
  await assertSucceeds(createCycleAtomic());
  await assertFails(updateDoc(stateRef(dbAs(UID.student)), { activeCycleId: null, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(stateRef(dbAs(UID.student)), { activeCycleId: 'cycle_002', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(stateRef(dbAs(UID.other)), statePayload(UID.student, 'cycle_001')));
  await assertFails(updateDoc(cycleRef(dbAs(UID.student)), {
    reassessment: review, status: 'REVIEWED', evidenceRecord: evidencePayload(), updatedAt: serverTimestamp(),
  }));
});
test('J09 legacy ACTIVE cycle can be claimed without overwriting it', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(cycleRef(ctx.firestore()), cyclePayload());
  });
  await assertSucceeds(setDoc(stateRef(dbAs(UID.student)), statePayload()));
  await assertSucceeds(updateDoc(cycleRef(dbAs(UID.student)), { checkIns: [checkin], updatedAt: serverTimestamp() }));
  await assertSucceeds(reviewCycleAtomic(dbAs(UID.student)));
});
test('J10 new cycle can start only after prior review atomically releases mutex', async () => {
  await assertSucceeds(createCycleAtomic());
  await assertSucceeds(updateDoc(cycleRef(dbAs(UID.student)), { checkIns: [checkin], updatedAt: serverTimestamp() }));
  await assertSucceeds(reviewCycleAtomic(dbAs(UID.student)));
  await assertSucceeds(createCycleAtomic(UID.student, 'cycle_002'));
  assert.equal((await getDoc(stateRef(dbAs(UID.student)))).data().activeCycleId, 'cycle_002');
  assert.equal((await getDoc(cycleRef(dbAs(UID.student)))).data().status, 'REVIEWED');
});
test('J11 forged probability or altered technical lineage fails review', async () => {
  await assertSucceeds(createCycleAtomic());
  await assertSucceeds(updateDoc(cycleRef(dbAs(UID.student)), { checkIns: [checkin], updatedAt: serverTimestamp() }));
  await assertFails(reviewCycleAtomic(dbAs(UID.student), UID.student, 'cycle_001', {
    ...evidencePayload(), output: { value: 0.5, probability: 0.95, unit: 'score-points-0-to-10' },
  }));
  await assertFails(reviewCycleAtomic(dbAs(UID.student), UID.student, 'cycle_001', {
    ...evidencePayload(), participantPseudonym: UID.student,
  }));
  await assertSucceeds(reviewCycleAtomic(dbAs(UID.student)));
  await assertFails(updateDoc(cycleRef(dbAs(UID.student)), { evidenceRecord: evidencePayload(), updatedAt: serverTimestamp() }));
});
test('J12 a second legacy ACTIVE cycle can be claimed after reviewing the first', async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(cycleRef(db), cyclePayload());
    await setDoc(cycleRef(db, UID.student, 'cycle_002'), cyclePayload(UID.student, 'cycle_002'));
  });
  await assertSucceeds(setDoc(stateRef(dbAs(UID.student)), statePayload()));
  await assertFails(updateDoc(stateRef(dbAs(UID.student)), { activeCycleId:'cycle_002', updatedAt:serverTimestamp() }));
  await assertSucceeds(updateDoc(cycleRef(dbAs(UID.student)), { checkIns:[checkin], updatedAt:serverTimestamp() }));
  await assertSucceeds(reviewCycleAtomic(dbAs(UID.student)));
  await assertSucceeds(updateDoc(stateRef(dbAs(UID.student)), { activeCycleId:'cycle_002', updatedAt:serverTimestamp() }));
  await assertSucceeds(updateDoc(cycleRef(dbAs(UID.student), UID.student, 'cycle_002'), {
    checkIns:[checkin], updatedAt:serverTimestamp(),
  }));
});
test('J13 metadata is private to authenticated student owner', async () => {
  await assertSucceeds(createCycleAtomic());
  await assertSucceeds(getDoc(stateRef(dbAs(UID.student))));
  await assertFails(getDoc(stateRef(dbAs(UID.other))));
  await assertFails(getDoc(stateRef(dbAs(UID.admin))));
  await assertFails(getDoc(stateRef(anonymous())));
  await assertFails(getDocs(collection(dbAs(UID.student), 'learning_journeys', UID.student, 'state')));
});

// Daily Companion V1 — an account-scoped, consent-bound schedule and check-in.
const companionRecord = (uid = UID.student, extra = {}) => ({
  userId: uid, schemaVersion: 1, enabled: true,
  schedule: {morning:'07:00', study:'19:30', checkIn:'21:00'},
  quietStart:'22:00', quietEnd:'06:30', completedDays:[],
  updatedAt: serverTimestamp(), ...extra,
});
test('DC-E01 owner with product consent creates and reads companion preferences', async () => {
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db,'daily_companion',UID.student),companionRecord()));
  await assertSucceeds(getDoc(ref(db,'daily_companion',UID.student)));
  await assertSucceeds(updateDoc(ref(db,'daily_companion',UID.student),{
    completedDays:['2026-11-13'],updatedAt:serverTimestamp(),
  }));
});
test('DC-E02 unauthorized, inactive and cross-account reads and writes fail', async () => {
  const db=dbAs(UID.other);
  await assertFails(getDoc(ref(db,'daily_companion',UID.student)));
  await assertFails(setDoc(ref(db,'daily_companion',UID.student),companionRecord()));
  await assertFails(getDoc(ref(anonymous(),'daily_companion',UID.student)));
  await assertFails(setDoc(ref(dbAs(UID.admin),'daily_companion',UID.admin),companionRecord(UID.admin)));
  await assertFails(setDoc(ref(dbAs(UID.inactive),'daily_companion',UID.inactive),companionRecord(UID.inactive)));
});
test('DC-E03 no consent or withdrawn consent forbids new check-in', async () => {
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db,'daily_companion',UID.student),companionRecord()));
  await assertSucceeds(setDoc(ref(db,'student_consents',UID.student),studentConsent(UID.student,false)));
  await assertSucceeds(getDoc(ref(db,'daily_companion',UID.student)));
  await assertFails(updateDoc(ref(db,'daily_companion',UID.student),{completedDays:['2026-11-13'],updatedAt:serverTimestamp()}));
});
test('DC-E04 malformed times, extra fields, and scores in reminder records fail', async () => {
  const db=dbAs(UID.student);
  for (const forged of [
    {schedule:{morning:'88:88',study:'19:30',checkIn:'21:00'}},
    {extra:'private-grade'},
    {completedDays:['bad-date']},
    {completedDays:Array(15).fill('2026-11-13')},
    {enabled:'yes'},
    {userId:UID.other},
  ]) await assertFails(setDoc(ref(db,'daily_companion',UID.student),companionRecord(UID.student,forged)));
});
test('DC-E05 cannot list or delete companion records', async () => {
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(ref(db,'daily_companion',UID.student),companionRecord()));
  await assertFails(getDocs(collection(db,'daily_companion')));
  await assertFails(deleteDoc(ref(db,'daily_companion',UID.student)));
});

// Optional Web Push transport. These assertions require Firestore Emulator;
// neither unit tests nor static grep can establish authorization behaviour.
const pushId='a'.repeat(32);
const pushRef=(db,owner=UID.student,device=pushId)=>
  doc(db,'companion_push_devices',owner,'subscriptions',device);
const pushRecord=(owner=UID.student,extra={})=>({
  userId:owner,schemaVersion:1,enabled:true,timeZone:'Asia/Ho_Chi_Minh',
  endpoint:'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)},
  updatedAt:serverTimestamp(),...extra,
});
test('WP-E01 student with product consent registers and reads own device',async()=>{
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(pushRef(db),pushRecord()));
  await assertSucceeds(getDoc(pushRef(db)));
  await assertSucceeds(updateDoc(pushRef(db),{timeZone:'Asia/Bangkok',updatedAt:serverTimestamp()}));
});
test('WP-E02 no cross-account, teacher, admin or anonymous device access',async()=>{
  const db=dbAs(UID.other);
  await assertFails(getDoc(pushRef(db)));
  await assertFails(setDoc(pushRef(db),pushRecord()));
  await assertFails(getDoc(pushRef(anonymous())));
  await assertFails(setDoc(pushRef(dbAs(UID.teacher)),pushRecord()));
  await assertFails(setDoc(pushRef(dbAs(UID.admin),UID.admin),pushRecord(UID.admin)));
});
test('WP-E03 declined or withdrawn product consent blocks registration, allows unsubscribing',async()=>{
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(pushRef(db),pushRecord()));
  await assertSucceeds(setDoc(ref(db,'student_consents',UID.student),studentConsent(UID.student,false)));
  await assertFails(updateDoc(pushRef(db),{timeZone:'Asia/Bangkok',updatedAt:serverTimestamp()}));
  await assertSucceeds(deleteDoc(pushRef(db)));
  await assertFails(setDoc(pushRef(db),pushRecord()));
});
test('WP-E04 endpoint SSRF attempts, malformed keys, malformed zones rejected',async()=>{
  const db=dbAs(UID.student);
  for(const invalid of [
    {endpoint:'http://localhost:5000/internal'},
    {endpoint:'https://google.com/webhook'},
    {endpoint:'https://fcm.googleapis.com.evil.test/fcm/send/x'},
    {keys:{p256dh:'bad',auth:'B'.repeat(22)}},
    {timeZone:'../secret'},
    {score:9.5},
    {userId:UID.other},
    {enabled:false},
  ]) await assertFails(setDoc(pushRef(db),pushRecord(UID.student,invalid)));
});
test('WP-E05 device cannot be listed by client even owner; bad doc id rejected',async()=>{
  const db=dbAs(UID.student);
  await assertSucceeds(setDoc(pushRef(db),pushRecord()));
  await assertFails(getDocs(collection(db,'companion_push_devices',UID.student,'subscriptions')));
  await assertFails(setDoc(pushRef(db,UID.student,'not-a-hex-id'),pushRecord()));
});
test('WP-E06 delivery claim ledger is server-only, including owner and admin',async()=>{
  const path=['companion_push_delivery',UID.student,'sent','2026-11-14_study_'+pushId];
  for(const db of [dbAs(UID.student),dbAs(UID.admin),anonymous()]){
    await assertFails(getDoc(doc(db,...path)));
    await assertFails(setDoc(doc(db,...path),{claimedAt:serverTimestamp()}));
  }
});
