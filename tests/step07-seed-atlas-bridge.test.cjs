/**
 * Seed → Atlas read-only bridge regression; does not use Firebase production.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file, mocks = {}) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(filename, mod.exports);
  new Function('module', 'exports', 'require', output)(mod, mod.exports, (name) => {
    if (Object.prototype.hasOwnProperty.call(mocks, name)) return mocks[name];
    if (name.startsWith('.')) {
      const candidate = path.resolve(path.dirname(filename), name);
      // TypeScript source imports may already include their .ts extension.
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return load(path.relative(root, candidate), mocks);
      }
      for (const ext of ['.ts', '.tsx', '.js']) {
        if (fs.existsSync(candidate + ext)) return load(path.relative(root, candidate + ext), mocks);
      }
    }
    return require(name);
  });
  cache.set(filename, mod.exports);
  return mod.exports;
}
const bridge = load('src/lib/seedAtlasScoreAdapter.ts');
const transcript = load('src/page/seed/services/transcriptData.ts');
const curriculum = load('src/page/seed/services/academicCurriculum.ts');
const originals = ['Vật lý', 'Hóa học', 'Sinh học', 'Tin học'];
const subjects = curriculum.getNineGradedSubjects('Tiếng Anh', originals);
const completed = score => ({ regular: [String(score)], midterm: String(score), final: String(score) });
const partial = score => ({ regular: [String(score)], midterm: '', final: '' });
const empty = () => ({ regular: [], midterm: '', final: '' });
function makeDoc(overrides = {}, electives = originals, foreignLanguage = 'Tiếng Anh') {
  const all = curriculum.getNineGradedSubjects(foreignLanguage, electives);
  const grades = {};
  for (const g of transcript.GRADES) {
    grades[g.key] = {};
    for (const t of transcript.SEMESTERS) {
      grades[g.key][t.key] = Object.fromEntries(all.map(sub => [sub, empty()]));
    }
  }
  for (const [key, value] of Object.entries(overrides)) {
    const [grade, semester, subject] = key.split('|');
    grades[grade][semester][subject] = value;
  }
  return { curriculum: { selectedElectives: electives, foreignLanguage }, transcript: grades };
}
function withTermScores(grade='grade12', semester='semester2', marks={Toán: 8, 'Ngữ văn': 7, 'Tiếng Anh': 9}) {
  return Object.fromEntries(Object.entries(marks).map(([sub, score]) => [`${grade}|${semester}|${sub}`, completed(score)]));
}

test('07-01: same-term D01 8+7+9 gives 24, no exam or probability label', () => {
  const view = transcript.buildTranscriptView(makeDoc(withTermScores()));
  const snapshot = bridge.chooseSeedAtlasScoreSnapshot(view);
  assert.equal(snapshot.termLabel, 'Lớp 12 · Học kỳ II');
  assert.deepEqual([snapshot.scores.math,snapshot.scores.literature,snapshot.scores.english], [8,7,9]);
  assert.ok(snapshot.availableCombinations.includes('D01'));
  assert.equal(snapshot.source, 'seed_school_transcript');
  assert.equal(snapshot.scores.math + snapshot.scores.literature + snapshot.scores.english, 24);
});

test('07-02: zero really is an observed completed score', () => {
  const view = transcript.buildTranscriptView(makeDoc(withTermScores('grade12','semester2',{Toán:0,'Ngữ văn':7,'Tiếng Anh':9})));
  const snapshot = bridge.chooseSeedAtlasScoreSnapshot(view);
  assert.equal(snapshot.scores.math, 0);
  assert.ok(snapshot.availableCombinations.includes('D01'));
});

test('07-03: partial scores are never promoted to completed semester averages', () => {
  const doc = makeDoc({...withTermScores(), 'grade12|semester2|Toán': partial(9)});
  const snap = bridge.chooseSeedAtlasScoreSnapshot(transcript.buildTranscriptView(doc));
  assert.equal(snap.scores.math, undefined);
  assert.ok(snap.skippedPartialSubjects.includes('Toán'));
  assert.ok(!snap.availableCombinations.includes('D01'));
});

test('07-04: cannot combine subjects from different semesters to fabricate D01', () => {
  const doc = makeDoc({
    ...withTermScores('grade12','semester2',{Toán:8}),
    ...withTermScores('grade12','semester1',{'Ngữ văn':7,'Tiếng Anh':9}),
  });
  const snap = bridge.chooseSeedAtlasScoreSnapshot(transcript.buildTranscriptView(doc));
  assert.deepEqual(snap.availableCombinations, []);
  assert.equal(snap.scores.math, 8);
  assert.equal(snap.scores.literature, undefined);
});

test('07-05: prefers most recent term with a complete supported combination', () => {
  const doc = makeDoc({
    ...withTermScores('grade12','semester1'),
    ...withTermScores('grade12','semester2',{Toán:9}),
  });
  const snap = bridge.chooseSeedAtlasScoreSnapshot(transcript.buildTranscriptView(doc));
  assert.equal(snap.termId, 'grade12:semester1');
  assert.equal(snap.scores.math, 8);
});

test('07-06: returns null on transcript with no completed subject grades', () => {
  assert.equal(bridge.chooseSeedAtlasScoreSnapshot(transcript.buildTranscriptView(makeDoc())),null);
});

test('07-07: mapping covers new-programme electives and excludes unrelated subjects', () => {
  const doc = makeDoc(withTermScores('grade12','semester2', {Toán:8,'Ngữ văn':7,'Tiếng Anh':9,'Tin học':10}));
  const snap = bridge.chooseSeedAtlasScoreSnapshot(transcript.buildTranscriptView(doc));
  assert.equal(snap.scores.informatics,10);
  assert.equal(snap.scores.technology,undefined);
  assert.equal('nationalDefense' in snap.scores,false);
});

test('07-08: non-English foreign language is not silently mapped to English', () => {
  const doc = makeDoc(withTermScores('grade12','semester2',{Toán:8,'Ngữ văn':7,'Tiếng Nhật':9}), originals,'Tiếng Nhật');
  const snap = bridge.chooseSeedAtlasScoreSnapshot(transcript.buildTranscriptView(doc));
  assert.equal(snap.scores.english,undefined);
  assert.ok(snap.unsupportedSubjects.includes('Tiếng Nhật'));
  assert.ok(!snap.availableCombinations.includes('D01'));
});

test('07-09: read-only adapter does not mutate Seed transcript', () => {
  const view = transcript.buildTranscriptView(makeDoc(withTermScores()));
  const before = JSON.stringify(view);
  bridge.chooseSeedAtlasScoreSnapshot(view);
  assert.equal(JSON.stringify(view),before);
});

test('07-10: Atlas reads user-bound Seed hook, only for school marks', () => {
  const source = fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  assert.match(source,/const verifiedProfile = useVerifiedStudentProfile\(\);/);
  assert.match(source,/const transcript = verifiedProfile\.transcript;/);
  assert.match(source,/loadSeedSchoolMarks\(seedSnapshot\)/);
  assert.match(source,/setScoreBasis\("school"\)/);
  assert.match(source,/importedSeedKeys\.length === 0/);
  assert.match(source,/setSubjectScores\(\{ \.\.\.defaultSubjectScores \}\)/);
  assert.match(source,/hasEditedScore\.current/);
});

test('07-11: changing score basis clears old marks and never reuses school marks as official THPT', () => {
  const source = fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  const body = source.slice(source.indexOf('function changeScoreBasis('), source.indexOf('function resetScores()'));
  assert.match(body,/setSubjectScores\(\{ \.\.\.defaultSubjectScores \}\)/);
  assert.match(body,/setImportedSeedKeys\(\[\]\)/);
  assert.match(body,/setScoreBasis\(basis\)/);
});

test('07-12: hook clears account-specific data and blocks callbacks from old UID', () => {
  const source = fs.readFileSync(path.join(root,'src/page/seed/hooks/useStudentTranscript.ts'),'utf8');
  assert.match(source,/setUserId\(activeUid\)/);
  assert.match(source,/if \(activeUid !== uid\) return;/);
  assert.match(source,/setData\(null\)/);
});

test('07-13: delayed Firestore snapshot for a signed-out account cannot overwrite new student', () => {
  const values = [];
  let index = 0;
  let authChanged;
  let onCleanup;
  const callbacks = new Map();
  const fakeReact = {
    useState: value => {
      const i = index++;
      values[i] = value;
      return [value, next => { values[i] = typeof next === 'function' ? next(values[i]) : next; }];
    },
    useEffect: callback => { onCleanup = callback(); },
  };
  const mocks = {
    react: fakeReact,
    'firebase/auth': { onAuthStateChanged: (_auth, callback) => { authChanged = next => { _auth.currentUser = next; callback(next); }; return () => {}; } },
    'firebase/firestore': {
      doc: (_db, collection, uid) => `${collection}:${uid}`,
      onSnapshot: (ref, options, cb) => { callbacks.set(ref, cb); return () => {}; },
    },
    '../../../lib/firebase': { auth: {}, db: {} },
    '../services/realtimeReadPolicy': {
      isServerConfirmedSnapshot: metadata => metadata?.fromCache === false && metadata?.hasPendingWrites === false,
      isMatchingAccountRecord: (raw, uid) => Boolean(raw && raw.userId === uid),
    },
    '../services/legacyTranscriptPolicy': {
      assessCanonicalTranscript: () => ({readable:true}),
      assessLegacyTranscript: () => ({readable:true}),
    },
    '../services/transcriptData': {
      buildTranscriptView: raw => ({ terms: [{ subjects: [{ provisional: raw.score }] }], marker: raw.marker }),
    },
  };
  const { useStudentTranscript } = load('src/page/seed/hooks/useStudentTranscript.ts', mocks);
  useStudentTranscript();
  authChanged({uid:'Student_A_001'});
  const oldCallback = callbacks.get('student_transcripts:Student_A_001');
  authChanged({uid:'Student_B_002'});
  callbacks.get('student_transcripts:Student_B_002')({metadata:{fromCache:false,hasPendingWrites:false}, exists: () => true, data: () => ({userId:'Student_B_002',marker: 'B',score:9})});
  oldCallback({metadata:{fromCache:false,hasPendingWrites:false}, exists: () => true, data: () => ({userId:'Student_A_001',marker: 'A',score:3})});
  assert.equal(values[0].marker, 'B');
  assert.equal(values[1], 'ready');
  assert.equal(values[4], 'Student_B_002');
  onCleanup();
});
