/**
 * STEP 05B — isolated Firestore-document roundtrip and account-switch regression.
 * These tests do NOT contact Firebase production. Real Firestore/role E2E remains pending.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function transpile(file, mocked = {}) {
  const filename = path.resolve(root, file);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const requireLocal = (name) => {
    if (Object.prototype.hasOwnProperty.call(mocked, name)) return mocked[name];
    if (name.startsWith('.')) {
      const candidate = path.resolve(path.dirname(filename), name);
      if (fs.existsSync(candidate + '.ts')) return transpile(path.relative(root, candidate + '.ts'), mocked);
    }
    return require(name);
  };
  new Function('module', 'exports', 'require', js)(module, module.exports, requireLocal);
  return module.exports;
}

const transcript = transpile('src/page/seed/services/transcriptData.ts');
const academic = transpile('src/engines/academic-semester-engine.ts');
const curriculum = transpile('src/page/seed/services/academicCurriculum.ts');
const ELECTIVES = ['Vật lý', 'Hóa học', 'Sinh học', 'Tin học'];
const SUBJECTS = curriculum.getNineGradedSubjects('Tiếng Anh', ELECTIVES);
const completed = value => ({ regular: [String(value), '', '', '', ''], midterm: String(value), final: String(value) });
const empty = () => ({ regular: ['', '', '', '', ''], midterm: '', final: '' });
function makeDocument(options = {}) {
  const scores = {};
  for (const [index, grade] of transcript.GRADES.entries()) {
    scores[grade.key] = {};
    for (const semester of transcript.SEMESTERS) {
      scores[grade.key][semester.key] = Object.fromEntries(SUBJECTS.map(subject => [subject, completed(index + 6)]));
    }
  }
  if (options.incomplete) {
    scores.grade12.semester2['Toán'] = empty();
  }
  if (options.realZero) {
    scores.grade12.semester2['Toán'] = completed(0);
  }
  return {
    userId: 'student-demo',
    schemaVersion: 1,
    curriculum: { foreignLanguage: 'Tiếng Anh', selectedElectives: ELECTIVES, gradedSubjects: SUBJECTS },
    transcript: scores,
    gpaSummary: {
      grade10: 6, grade11: 7, grade12: options.incomplete ? null : 8,
      overall: options.incomplete ? 6.5 : 7,
    },
  };
}

test('05B-01: six saved semesters are reconstructed as six observed terms and nine subjects', () => {
  const view = transcript.buildTranscriptView(makeDocument());
  assert.equal(view.terms.length, 6);
  assert.equal(view.subjects.length, 9);
  assert.ok(view.terms.every(term => term.summary.completedSubjects === 9 && term.summary.status === 'COMPLETE'));
});
test('05B-02: GPA after roundtrip matches Seed summary across all three years', () => {
  const saved = makeDocument();
  const view = transcript.buildTranscriptView(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(view.yearly, {grade10: 6, grade11: 7, grade12: 8});
  assert.equal(academic.calculateCompletedYearsAverage(Object.values(view.yearly)), saved.gpaSummary.overall);
});
test('05B-03: a missing required term score is missing, not a fabricated completed GPA', () => {
  const view = transcript.buildTranscriptView(makeDocument({ incomplete: true }));
  const lastTerm = view.terms.find(x => x.grade === 'grade12' && x.semester === 'semester2');
  assert.equal(lastTerm.summary.status, 'PARTIAL');
  assert.equal(lastTerm.summary.gpa, null);
  assert.equal(view.yearly.grade12, null);
  assert.equal(academic.calculateCompletedYearsAverage(Object.values(view.yearly)), 6.5);
});
test('05B-04: a real zero survives serialization and is not treated as missing', () => {
  const view = transcript.buildTranscriptView(JSON.parse(JSON.stringify(makeDocument({ realZero: true }))));
  const math = view.terms.find(x => x.grade === 'grade12' && x.semester === 'semester2').subjects.find(x => x.subject === 'Toán');
  assert.equal(math.average, 0);
  assert.equal(math.status, 'COMPLETE');
  assert.equal(math.row.final, '0');
});
test('05B-05: latest Seed scores expose provenance and partial scores stay visibly partial', () => {
  const saved = makeDocument();
  saved.transcript.grade12.semester2['Toán'] = { regular: ['0', '', '', '', ''], midterm: '', final: '' };
  const latest = transcript.getLatestSubjectGrades(transcript.buildTranscriptView(saved));
  const math = latest.find(x => x.subject === 'Toán');
  assert.equal(math.provisional, 0);
  assert.equal(math.average, null);
  assert.equal(math.status, 'PARTIAL');
  assert.match(math.label, /tạm tính/);
  assert.match(math.label, /Lớp 12/);
});
test('05B-06: legacy learning_profiles transcript shape still loads', () => {
  const legacy = makeDocument();
  legacy.profile = { fullName: 'Legacy' };
  const view = transcript.buildTranscriptView(legacy);
  assert.equal(view.yearly.grade11, 7);
});

test('05B-07: Seed profile reader discards slow result from previous UID', async () => {
  const auth = { currentUser: null };
  let notifyAuth;
  let effectCleanup;
  const pending = new Map();
  const states = [];
  let cursor = 0;
  const fakeReact = {
    useState(initial) {
      const index = cursor++;
      states[index] = initial;
      return [initial, value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect(callback) { effectCleanup = callback(); },
  };
  const defaultProfile = { fullName: 'Chưa có dữ liệu', gpaOverall: 0 };
  const defaultCognitive = { SCI: 0, MAS: 0, CSL: 0, GVI: 0, BDI: 0, FRI: 0, CRI: 0 };
  const mock = {
    'react': fakeReact,
    'firebase/auth': { onAuthStateChanged: (_auth, cb) => { notifyAuth = cb; return () => {}; } },
    'firebase/firestore': {
      doc: (_db, _collection, uid) => uid,
      getDoc: uid => new Promise(resolve => pending.set(uid, resolve)),
    },
    '../../../lib/firebase': { auth, db: {} },
    '../../../engines/cognitive/cognitiveEngine': { calculateCognitive: () => defaultCognitive },
    '../../../engines/history/cognitiveHistoryRepository': { getCognitiveHistory: async () => [] },
    '../../../engines/history/cognitiveHistoryEngine': { createSnapshotFromResult: () => ({}) },
    '../../../engines/history/cognitiveGrowthAnalytics': { analyzeCognitiveGrowth: () => ({}) },
    '../types': { defaultStudentProfile: defaultProfile, defaultCognitiveResult: defaultCognitive },
  };
  const previousWindow = globalThis.window;
  globalThis.window = { location: { search: '' } };
  try {
    const hook = transpile('src/page/seed/hooks/useStudentProfile.ts', mock);
    hook.useStudentProfile();
    const userA = { uid: 'student-A' };
    const userB = { uid: 'student-B' };
    auth.currentUser = userA;
    const processA = notifyAuth(userA);
    auth.currentUser = userB;
    const processB = notifyAuth(userB);
    pending.get('student-B')({ exists: () => true, data: () => ({profile: {fullName:'Student B'}, gpaSummary: {overall:8}}) });
    await processB;
    pending.get('student-A')({ exists: () => true, data: () => ({profile: {fullName:'Student A'}, gpaSummary: {overall:2}}) });
    await processA;
    assert.equal(states[0].fullName, 'Student B');
    assert.equal(states[0].gpaOverall, 8);
    assert.equal(states[4], true); // hasProfile
    effectCleanup();
  } finally {
    globalThis.window = previousWindow;
  }
});

test('05B-08: Orion does not mark an empty Seed transcript as already prefilled', () => {
  const source = fs.readFileSync(path.join(root, 'src/page/orion/OrionPage.tsx'), 'utf8');
  const check = source.indexOf('if (supportedGrades.length === 0) return;');
  const lock = source.indexOf('seededFromTranscript.current = true;');
  assert.ok(check > 0 && lock > check);
});

test('05B-09: saving Seed remains atomic and downstream reads use the same Firestore collections', () => {
  const seed = fs.readFileSync(path.join(root, 'src/page/seed/StudentProfilePage.tsx'), 'utf8');
  const transcriptReader = fs.readFileSync(path.join(root, 'src/page/seed/hooks/useStudentTranscript.ts'), 'utf8');
  const profileReader = fs.readFileSync(path.join(root, 'src/page/seed/hooks/useStudentProfile.ts'), 'utf8');
  assert.match(seed, /batch\.set\(doc\(db, "learning_profiles", currentUser\.uid\)/);
  assert.match(seed, /batch\.set\(doc\(db, "student_transcripts", currentUser\.uid\)/);
  assert.match(seed, /await batch\.commit\(\)/);
  assert.match(transcriptReader, /onSnapshot\(doc\(db, "student_transcripts", uid\)/);
  assert.match(profileReader, /"learning_profiles",\s+user\.uid/);
});
