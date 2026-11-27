'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.resolve(__dirname,'../src');
const cache=new Map();
function load(relative) {
  const target=path.resolve(root,relative);
  if(cache.has(target)) return cache.get(target).exports;
  const module={exports:{}}; cache.set(target,module);
  const js=ts.transpileModule(fs.readFileSync(target,'utf8'),{
    fileName:target,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('module','exports','require',js)(module,module.exports,name=>{
    if(!name.startsWith('.')) return require(name);
    const resolved=path.resolve(path.dirname(target),name);
    const file=fs.existsSync(resolved) ? resolved : `${resolved}.ts`;
    return load(path.relative(root,file));
  });
  return module.exports;
}
const {assessLegacyTranscript,assessCanonicalTranscript}=load('page/seed/services/legacyTranscriptPolicy.ts');
const uid='cp30_legacy_student_01';
const electives=['Vật lý','Hóa học','Sinh học','Tin học'];
const curriculum={program:'GDPT 2018',foreignLanguage:'Tiếng Anh',selectedElectives:electives,
  gradedSubjects:['Toán','Ngữ văn','Tiếng Anh','Lịch sử','Giáo dục quốc phòng và an ninh',...electives],electiveSelectionLocked:true};
const raw=()=>({userId:uid,dataScope:'student',curriculum:structuredClone(curriculum),
  transcript:{grade10:{semester1:{'Toán':{regular:['0','','','',''],midterm:'0',final:'0'}}}}});
const result=value=>assessLegacyTranscript(value,uid);
const allowed=value=>assert.equal(result(value).readable,true);
const blocked=value=>assert.equal(result(value).readable,false);
test('LEG01 valid observed zero with six-semester omissions is read-only readable',()=>allowed(raw()));
test('LEG02 valid legacy with no UID remains within only the owner UID-scoped path',()=>{
  const data=raw();delete data.userId;allowed(data);
});
test('LEG03 foreign userId, dataScope and invalid UID are denied',()=>{
  for(const [field,value] of [['userId','another_user'],['dataScope','production']]){
    const data=raw();data[field]=value;blocked(data);
  }
  assert.equal(assessLegacyTranscript(raw(),'bad/slash').readable,false);
});
test('LEG04 missing or forged curriculum is quarantined rather than guessed',()=>{
  for(const bad of [null,{}, {...curriculum,selectedElectives:['Vật lý','Vật lý','Sinh học','Tin học']},
    {...curriculum,program:'other'}, {...curriculum,gradedSubjects:['Toán'] }]){
    const data=raw();data.curriculum=bad;blocked(data);
  }
});
test('LEG05 unknown grade or semester is quarantined',()=>{
  const grade=raw();grade.transcript.grade13={};blocked(grade);
  const term=raw();term.transcript.grade10.semester3={};blocked(term);
});
test('LEG06 subjects outside locked nine are never hidden in computation',()=>{
  const data=raw();data.transcript.grade10.semester1['Địa lý']={regular:['9'],midterm:'9',final:'9'};blocked(data);
});
test('LEG07 invalid scores are rejected instead of treated as missing or zero',()=>{
  for(const score of ['11','-1','1e0','NaN',Infinity,-1,11,{},true]){
    const data=raw();data.transcript.grade10.semester1['Toán'].regular[0]=score;blocked(data);
  }
});
test('LEG08 malformed row, overlong regular series and invalid mark fields denied',()=>{
  for(const bad of [[],null,{}, {regular:new Array(6).fill('1'),midterm:'1',final:'1'},
    {regular:[],midterm:[],final:''}]){
    const data=raw();data.transcript.grade10.semester1['Toán']=bad;blocked(data);
  }
});
test('LEG09 missing partial marks, comma decimals and true zero remain valid',()=>{
  const data=raw();data.transcript.grade10.semester1['Toán']={regular:[0,'8,5',''],midterm:null,final:undefined};allowed(data);
});
test('LEG10 payload is never mutated or migrated by read-only validation',()=>{
  const data=raw();const before=JSON.stringify(data);allowed(data);assert.equal(JSON.stringify(data),before);
});
test('LEG11 UI labels verified legacy schema as unverified historical grades',()=>{
  const ui=fs.readFileSync(path.join(root,'page/seed/StudentTranscriptPage.tsx'),'utf8');
  assert.match(ui,/Bảng điểm lịch sử chỉ được đọc sau kiểm tra cấu trúc/);
  assert.match(ui,/onClick=\{retry\}/);
  assert.match(ui,/không tự di chuyển|Không tự di chuyển/);
});
test('LEG12 primary and legacy subscriptions remain owner/session/server scoped',()=>{
  const hook=fs.readFileSync(path.join(root,'page/seed/hooks/useStudentTranscript.ts'),'utf8');
  assert.match(hook,/assessLegacyTranscript\(legacy\.data\(\), uid\)/);
  assert.match(hook,/isServerConfirmedSnapshot\(legacy\.metadata\)/);
  assert.match(hook,/if \(!isCurrent\(\) \|\| capturedLegacyEpoch !== legacyEpoch\) return/);
  assert.match(hook,/\[retryGeneration\]/);
  assert.match(hook,/setRetryGeneration\(value => value \+ 1\)/);
});

const canonical=value=>assessCanonicalTranscript(value,uid);
const canonicalRaw=()=>({...raw(),schemaVersion:1});
test('CAN01 canonical transcript requires exact UID and schema version',()=>{
  assert.equal(canonical(canonicalRaw()).readable,true);
  for(const changes of [{userId:'another_student'},{userId:undefined},{schemaVersion:2},{schemaVersion:undefined}]){
    assert.equal(canonical({...canonicalRaw(),...changes}).readable,false);
  }
});
test('CAN02 canonical transcript rejects missing or forged nine-subject identity',()=>{
  for(const bad of [null,{}, {...curriculum,selectedElectives:['Vật lý','Vật lý','Sinh học','Tin học']},
    {...curriculum,program:'other'}, {...curriculum,gradedSubjects:['Toán'] }]){
    const data=canonicalRaw();data.curriculum=bad;
    assert.equal(canonical(data).readable,false);
  }
});
test('CAN03 canonical transcript rejects foreign subjects, malformed rows and impossible scores',()=>{
  const foreign=canonicalRaw();foreign.transcript.grade10.semester1['Môn lạ']={regular:['9'],midterm:'9',final:'9'};
  assert.equal(canonical(foreign).readable,false);
  for(const bad of [{regular:new Array(6).fill('1'),midterm:'1',final:'1'},
    {regular:['11'],midterm:'1',final:'1'},{regular:['1'],midterm:[],final:''}]){
    const data=canonicalRaw();data.transcript.grade10.semester1['Toán']=bad;
    assert.equal(canonical(data).readable,false);
  }
});
test('CAN04 canonical transcript accepts true zero and partial/missing observations',()=>{
  const data=canonicalRaw();
  data.transcript.grade10.semester1['Toán']={regular:[0,'8,5',''],midterm:null,final:undefined};
  assert.equal(canonical(data).readable,true);
});
test('CAN05 primary canonical listener validates before building a verified view',()=>{
  const source=fs.readFileSync(path.join(root,'page/seed/hooks/useStudentTranscript.ts'),'utf8');
  assert.match(source,/assessCanonicalTranscript\(raw, uid\)/);
  assert.match(source,/canonical-invalid/);
  assert.match(source,/assessLegacyTranscript\(raw, uid\)/);
});
