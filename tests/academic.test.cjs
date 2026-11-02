const fs = require('fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
function load(file) {
  const output = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  const module = {exports:{}};
  new Function('module','exports',output)(module,module.exports);
  return module.exports;
}
const root=path.resolve(__dirname,'../src');
const academic=load(root+'/engines/academic-semester-engine.ts');
const subjects=load(root+'/page/seed/services/academicCurriculum.ts');
let done=0;
function test(title,fn){fn();done++; console.log('PASS',title)}
test('nine graded subjects exactly',()=>assert.equal(subjects.getNineGradedSubjects('Tiếng Anh',['Vật lý','Hóa học','Sinh học','Tin học']).length,9));
test('elective duplicate blocked',()=>assert.equal(subjects.isValidElectiveSelection(['Vật lý','Vật lý','Sinh học','Tin học']),false));
test('elective invalid blocked',()=>assert.equal(subjects.isValidElectiveSelection(['Vật lý','Tin học','Sinh học','Thể dục']),false));
test('0 valid',()=>assert.equal(academic.parseEnteredScore('0'),0));
test('10 valid',()=>assert.equal(academic.parseEnteredScore('10'),10));
test('comma decimal valid',()=>assert.equal(academic.parseEnteredScore('7,5'),7.5));
test('dot decimal valid',()=>assert.equal(academic.parseEnteredScore('8.25'),8.25));
test('blank missing',()=>assert.equal(academic.parseEnteredScore(''),null));
test('invalid negative',()=>assert.equal(academic.parseEnteredScore('-1'),null));
test('invalid >10',()=>assert.equal(academic.parseEnteredScore('10.01'),null));
test('invalid 1e0 syntax',()=>assert.equal(academic.parseEnteredScore('1e0'),null));
test('provisional not complete',()=>{const r={regular:['8','','','',''],midterm:'',final:''};assert.equal(academic.calculateSemesterAverage(r),null);assert.equal(academic.calculateProvisionalAverage(r),8)});
test('term complete with 0 score',()=>{const r={regular:['0','','','',''],midterm:'0',final:'0'};assert.equal(academic.calculateSemesterAverage(r),0)});
test('year requires both completed terms',()=>{const t1={gpa:8};const t2={gpa:null}; assert.equal(academic.calculateYearAverage(t1,t2),null)});
console.log(`ACADEMIC TESTS: ${done}/${done} PASS`);
