/* Atlas admission-2026 policy contract: local, synthetic, non-production data. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/lib/aspirationPlanner.ts'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText;
const moduleObject = { exports: {} };
new Function('module', 'exports', 'require', code)(moduleObject, moduleObject.exports, (request) => {
  if (request === './admissionRules') return {getRiskPriority: risk => ({SAFE: 3, TARGET: 2, REACH: 1, INVALID: 0}[risk] ?? 0)};
  throw new Error('Unexpected dependency: ' + request);
});
const {buildAspirationPlan, isTeacherTrainingProgram, ADMISSION_POLICY_2026} = moduleObject.exports;

const make = (n, options = {}) => ({
  program: {
    id: options.id || `program-${n}`,
    majorName: options.majorName || `Ngành ${n}`,
    majorCode: options.majorCode || `734${String(n).padStart(4,'0')}`,
    universityName: options.universityName || 'Đại học mẫu',
    sourceYear: options.year === undefined ? 2026 : options.year,
    verified: true,
    isPedagogy: options.isPedagogy,
  },
  valid: options.valid === undefined ? true : options.valid,
  riskLevel: options.riskLevel || 'TARGET',
  bestOption: options.noBest ? null : {score: 24, normalizedScore: options.score === undefined ? 75 : options.score, label:'A00'},
  explanation: 'Mô phỏng dữ liệu synthetic, không phải cam kết tuyển sinh',
});

test('P26-01 official policy is versioned and capped at 15 / teacher NV1-5', () => {
  assert.equal(ADMISSION_POLICY_2026.year, 2026);
  assert.equal(ADMISSION_POLICY_2026.maxAspirations, 15);
  assert.equal(ADMISSION_POLICY_2026.teacherTrainingLastPriority, 5);
  assert.match(ADMISSION_POLICY_2026.officialUrl, /^https:\/\/vanban\.chinhphu\.vn\//);
});
test('P26-02 classifier catches teacher-training by major code or explicit flag', () => {
  assert.equal(isTeacherTrainingProgram(make(1, {majorCode:'7140209', majorName:'Toán học'}).program),true);
  assert.equal(isTeacherTrainingProgram(make(2, {majorCode:'7140202', majorName:'Giáo dục Tiểu học'}).program),true);
  assert.equal(isTeacherTrainingProgram(make(3, {majorCode:'51140201', majorName:'Giáo dục Mầm non'}).program),true);
  assert.equal(isTeacherTrainingProgram(make(4, {majorCode:'7410123', isPedagogy:true}).program),true);
});
test('P26-03 classifier catches teacher names without misleading other education majors', () => {
  for (const majorName of ['Sư phạm Toán', 'Giáo dục Mầm non', 'Giáo dục Tiểu học', 'Giáo dục Thể chất', 'Sư phạm Tiếng Anh']) {
    assert.equal(isTeacherTrainingProgram(make(1,{majorCode:'-',majorName}).program), true, majorName);
  }
  for (const majorName of ['Công nghệ giáo dục', 'Quản lý giáo dục', 'Khoa học giáo dục']) {
    assert.equal(isTeacherTrainingProgram(make(1,{majorCode:'7140114',majorName}).program), false, majorName);
  }
});
test('P26-04 >5 teacher-training candidates never spill into NV6-NV15', () => {
  const results = [
    ...Array.from({length:7},(_,i)=>make(i,{majorCode:`71402${String(i+1).padStart(2,'0')}`,majorName:`Sư phạm ${i}`,score:90-i})),
    ...Array.from({length:12},(_,i)=>make(100+i,{score:80-i})),
  ];
  const plan = buildAspirationPlan({results});
  assert.equal(plan.items.length,15);
  assert.equal(plan.items.filter(i=>i.isPedagogy).length,5);
  assert.ok(plan.items.every(i=>!i.isPedagogy || i.order<=5));
  assert.ok(!plan.items.some(i=>i.programId==='program-5'||i.programId==='program-6'));
  assert.match(plan.warnings.join(' '),/loại 2 lựa chọn đào tạo giáo viên/);
});
test('P26-05 recommendations cannot contain more than 15 applications', () => {
  const plan=buildAspirationPlan({results: Array.from({length:28},(_,i)=>make(i)),maxAspirations:100});
  assert.equal(plan.items.length,15);
  assert.equal(plan.maxAspirations,15);
  assert.match(plan.warnings.join(' '),/tối đa 15/);
});
test('P26-06 user-chosen maximum below five also constrains teacher-training count', () => {
  const plan=buildAspirationPlan({results:Array.from({length:9},(_,i)=>make(i,{majorCode:`71402${String(i).padStart(2,'0')}`})),maxAspirations:3});
  assert.equal(plan.items.length,3);
  assert.ok(plan.items.every(i=>i.isPedagogy && i.order <= 3));
  assert.match(plan.warnings.join(' '),/loại 6 lựa chọn/);
});
test('P26-07 historical sources cannot silently become 2026 policy inputs', () => {
  const plan=buildAspirationPlan({results:[make(1,{year:2024}), make(2,{year:2025}),make(3,{year:2026})]});
  assert.deepEqual(plan.items.map(i=>i.programId),['program-3']);
  assert.match(plan.warnings.join(' '),/2 lựa chọn thuộc năm khác 2026/);
});
test('P26-08 invalid or missing-benchmark results are not offered',()=>{
  const plan=buildAspirationPlan({results:[make(1,{valid:false}),make(2,{riskLevel:'INVALID'}),make(3,{noBest:true}),make(4)]});
  assert.deepEqual(plan.items.map(i=>i.programId),['program-4']);
});
test('P26-09 ten non-teacher programmes preserve model ranking; no auto teacher bias score',()=>{
  const plan=buildAspirationPlan({results:[make(1,{score:60}),make(2,{score:95}),make(3,{score:80})]});
  assert.deepEqual(plan.items.map(i=>i.programId),['program-2','program-3','program-1']);
});
test('P26-10 unparseable cap falls back to legal maximum',()=>{
  const plan=buildAspirationPlan({results:[make(1)],maxAspirations:Number.NaN});
  assert.equal(plan.maxAspirations,15);
});
test('P26-11 no valid candidates produces no fabricated places',()=>{
  const plan=buildAspirationPlan({results:[make(1,{year:2025})]});
  assert.equal(plan.items.length,0);
  assert.match(plan.warnings.join(' '),/Chưa có ngành\/trường/);
});
test('P26-12 UI displays source, cap and teaching limitation even before recommendations',()=>{
  const ui=fs.readFileSync(path.join(root,'src/page/atlas/components/AtlasAdmissionEnginePanel.tsx'),'utf8');
  assert.match(ui,/ADMISSION_POLICY_2026\.officialUrl/);
  assert.match(ui,/ADMISSION_POLICY_2026\.maxAspirations/);
  assert.match(ui,/ADMISSION_POLICY_2026\.teacherTrainingLastPriority/);
  assert.match(ui,/item\.isPedagogy/);
  assert.match(ui,/aspirationPlan\.warnings/);
});

function loadActualEngine(relativeFile, cache = new Map()) {
  const file = path.resolve(root, relativeFile);
  if (cache.has(file)) return cache.get(file).exports;
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText;
  const holder = { exports: {} };
  cache.set(file, holder);
  new Function('module', 'exports', 'require', compiled)(holder, holder.exports, request => {
    if (request.startsWith('.')) return loadActualEngine(path.relative(root, path.resolve(path.dirname(file),request+'.ts')), cache);
    throw new Error(`Unexpected dependency ${request}`);
  });
  return holder.exports;
}

test('P26-13 integrated Admission Engine enforces teaching NV1–NV5 after real eligibility calculation', () => {
  const {runAdmissionEngine} = loadActualEngine('src/lib/admissionEngine.ts');
  const rules = [
    ...Array.from({length:7}, (_,i) => ({id:`T${i}`,majorName:`Sư phạm ${i}`,majorCode:`71402${String(i).padStart(2,'0')}`})),
    ...Array.from({length:10}, (_,i) => ({id:`N${i}`,majorName:`Ngành khác ${i}`,majorCode:`73401${String(i).padStart(2,'0')}`})),
  ].map(x => ({...x, universityName:'Trường ví dụ',combinations:['A00'], methods:['THPT'],
    benchmarkScore:24,benchmarkVerified:true,benchmarkYear:2026,benchmarkMethod:'THPT',sourceYear:2026, verified:true}));
  const scoreReport = {combinationOptions:[{combinationCode:'A00',convertedScore:24,normalizedScore:80,missingSubjects:[],warnings:[]}], externalOptions:[], warnings:[]};
  const result=runAdmissionEngine({scoreReport,programs:rules});
  assert.equal(result.eligibilityResults.filter(x=>x.valid).length,17);
  assert.equal(result.aspirationPlan.items.length,15);
  assert.ok(result.aspirationPlan.items.every(x=>!x.isPedagogy || x.order<=5));
  assert.equal(result.aspirationPlan.items.filter(x=>x.isPedagogy).length,5);
  assert.match(result.warnings.join(' '),/loại 2 lựa chọn đào tạo giáo viên/);
});

test('P26-14 integrated engine abstains if cutoff is unverified, despite policy-compliant ordering', () => {
  const {runAdmissionEngine} = loadActualEngine('src/lib/admissionEngine.ts');
  const scoreReport = {combinationOptions:[{combinationCode:'A00',convertedScore:24,normalizedScore:80,missingSubjects:[],warnings:[]}],externalOptions:[],warnings:[]};
  const program={id:'T1',majorName:'Giáo dục Tiểu học',majorCode:'7140202',universityName:'Trường ví dụ',
    combinations:['A00'],methods:['THPT'],benchmarkScore:24, benchmarkVerified:false,benchmarkYear:2026,benchmarkMethod:'THPT',sourceYear:2026,verified:true};
  const result=runAdmissionEngine({scoreReport,programs:[program]});
  assert.equal(result.aspirationPlan.items.length,0);
  assert.equal(result.eligibilityResults[0].riskLevel,'INVALID');
});
