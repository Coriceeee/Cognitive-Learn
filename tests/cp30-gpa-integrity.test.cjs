'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.join(__dirname,'../src');
const cache=new Map();
function load(relativeFile) {
  const filename=path.resolve(root,relativeFile);
  if(cache.has(filename)) return cache.get(filename).exports;
  const mod={exports:{}};cache.set(filename,mod);
  const source=fs.readFileSync(filename,'utf8');
  const compiled=ts.transpileModule(source,{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('module','exports','require',compiled)(mod,mod.exports,p=>{
    if(!p.startsWith('.')) return require(p);
    const resolved=path.resolve(path.dirname(filename),p);
    const candidate=fs.existsSync(resolved) ? resolved : `${resolved}.ts`;
    return load(path.relative(root,candidate));
  });
  return mod.exports;
}
const {auditAcademicGpa}=load('page/seed/services/academicGpaIntegrity.ts');
const {getNineGradedSubjects}=load('page/seed/services/academicCurriculum.ts');
const uid='student_cp30_001';
const electives=['Vật lý','Hóa học','Sinh học','Tin học'];
const curriculum={program:'GDPT 2018', foreignLanguage:'Tiếng Anh', selectedElectives:electives,
  gradedSubjects:getNineGradedSubjects('Tiếng Anh',electives),electiveSelectionLocked:true};
const grades=['grade10','grade11','grade12'],semesters=['semester1','semester2'];
function build(score='0'){
  const transcript={};
  for(const g of grades){transcript[g]={};for(const s of semesters){transcript[g][s]={};
    for(const subject of curriculum.gradedSubjects) transcript[g][s][subject]={regular:[score,'','','',''],midterm:score,final:score};
  }}
  return transcript;
}
function summary(score=0){
  const coverage={};for(const g of grades){coverage[g]={};for(const s of semesters){
    coverage[g][s]={status:'COMPLETE',completedSubjects:9,observedSubjects:9,expectedSubjects:9,gpa:score,provisionalAverage:score};
  }}
  return {grade10:score,grade11:score,grade12:score,overall:score,calculationVersion:'cla-academic-semester-v2-nine-subjects',coverage};
}
function documents(score='0'){
  const common={schemaVersion:1,userId:uid,dataScope:'student',curriculum};
  const gpaSummary=summary(Number(score));
  return [{...common,gpaSummary},{...common,transcript:build(score),gpaSummary:structuredClone(gpaSummary)}];
}
const audit=(pair)=>auditAcademicGpa(uid,...pair);
const expectStatus=(pair,status)=>assert.equal(audit(pair).status,status);

test('GPA01 valid zero is VERIFIED, distinct from missing score',()=>{
  const result=audit(documents());assert.equal(result.status,'VERIFIED');
  assert.deepEqual(result.derived,{grade10:0,grade11:0,grade12:0,overall:0});
});
test('GPA02 completed score 8 from six terms verifies for three years',()=>expectStatus(documents('8'),'VERIFIED'));
test('GPA03 falsified profile GPA rejected',()=>{
  const pair=documents('8');pair[0].gpaSummary.grade10=9;expectStatus(pair,'MISMATCH');
});
test('GPA04 falsified transcript GPA rejected independently',()=>{
  const pair=documents('8');pair[1].gpaSummary.overall=7;expectStatus(pair,'MISMATCH');
});
test('GPA05 missing GPA cannot be stored as numeric zero',()=>{
  const pair=documents('0');delete pair[0].gpaSummary.grade12;expectStatus(pair,'MISMATCH');
  pair[0].gpaSummary.grade12=null;expectStatus(pair,'MISMATCH');
});
test('GPA06 fake coverage, partial status, observed count rejected',()=>{
  const pair=documents('8');pair[0].gpaSummary.coverage.grade10.semester1.observedSubjects=8;expectStatus(pair,'MISMATCH');
  pair[0].gpaSummary.coverage.grade10.semester1.observedSubjects=9;
  pair[1].gpaSummary.coverage.grade10.semester1.status='PARTIAL';expectStatus(pair,'MISMATCH');
});
test('GPA07 extra subject outside nine cannot be silently excluded',()=>{
  const pair=documents();pair[1].transcript.grade10.semester1['Môn lạ']={regular:['9'],midterm:'9',final:'9'};
  expectStatus(pair,'MISMATCH');
});
test('GPA08 malformed 10+, negative or syntax rejected rather than missing',()=>{
  for(const bad of ['11','-1','1e0','NaN']){
    const pair=documents();pair[1].transcript.grade10.semester1['Toán'].regular[0]=bad;expectStatus(pair,'MISMATCH');
  }
});
test('GPA09 absent rows or one missing semester is never verified as 0',()=>{
  const pair=documents();pair[1].transcript.grade10.semester2={};expectStatus(pair,'MISMATCH');
});
test('GPA10 empty row can be MISSING, with null year but observed zero elsewhere',()=>{
  const pair=documents();
  for(const subject of curriculum.gradedSubjects) pair[1].transcript.grade11.semester2[subject]={regular:['','','','',''],midterm:'',final:''};
  pair[0].gpaSummary.grade11=null;pair[1].gpaSummary.grade11=null;
  pair[0].gpaSummary.coverage.grade11.semester2={status:'MISSING',completedSubjects:0,observedSubjects:0,expectedSubjects:9,gpa:null,provisionalAverage:null};
  pair[1].gpaSummary.coverage.grade11.semester2=structuredClone(pair[0].gpaSummary.coverage.grade11.semester2);
  const result=audit(pair);
  assert.equal(result.status,'VERIFIED');assert.deepEqual(result.derived,{grade10:0,grade11:null,grade12:0,overall:0});
});
test('GPA11 two absent docs are INCOMPLETE, not VERIFIED',()=>{
  expectStatus([null,null],'INCOMPLETE');expectStatus([documents()[0],null],'INCOMPLETE');
});
test('GPA12 missing summary is LEGACY, never verified',()=>{
  const pair=documents();delete pair[0].gpaSummary;expectStatus(pair,'LEGACY');
});
test('GPA13 UID, dataScope and schema tamper rejected',()=>{
  for(const [key,value] of [['userId','foreign_uid'],['dataScope','demo'],['schemaVersion',2]]){
    const pair=documents();pair[1][key]=value;expectStatus(pair,'MISMATCH');
  }
});
test('GPA14 mismatched foreign language or electives rejected',()=>{
  const pair=documents();pair[1].curriculum={...curriculum,foreignLanguage:'Tiếng Pháp'};expectStatus(pair,'MISMATCH');
});
test('GPA15 calculation version and stringified zero both rejected',()=>{
  const pair=documents();pair[0].gpaSummary.calculationVersion='legacy';expectStatus(pair,'MISMATCH');
  pair[0].gpaSummary.calculationVersion='cla-academic-semester-v2-nine-subjects';
  pair[0].gpaSummary.grade10='0';expectStatus(pair,'MISMATCH');
});
test('GPA16 no modification of underlying Firestore documents',()=>{
  const pair=documents('8');const original=JSON.stringify(pair);
  audit(pair);assert.equal(JSON.stringify(pair),original);
});
test('GPA17 UI discloses unverified/mismatch status and does not claim school validation',()=>{
  const ui=fs.readFileSync(path.join(root,'page/seed/StudentTranscriptPage.tsx'),'utf8');
  assert.match(ui,/useAcademicGpaIntegrity/);assert.match(ui,/integrity\.status === "MISMATCH"/);
  assert.match(ui,/Không phải xác nhận của nhà trường/);
});
test('GPA18 realtime GPA audit independently subscribes to both verified server documents',()=>{
  const hook=fs.readFileSync(path.join(root,'page/seed/hooks/useAcademicGpaIntegrity.ts'),'utf8');
  assert.match(hook,/learning_profiles.*student_transcripts/);
  assert.match(hook,/includeMetadataChanges:\s*true/);
  assert.match(hook,/isServerConfirmedSnapshot/);
  assert.match(hook,/auth\.currentUser\?\.uid === uid/);
  assert.match(hook,/received\.clear\(\)/);
});
