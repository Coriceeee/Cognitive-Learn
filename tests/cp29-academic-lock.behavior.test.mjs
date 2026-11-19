import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAcademicIdentity, sameAcademicIdentity, findForeignTranscriptSubject} from '../src/page/seed/services/academicIdentity.ts';

const electives = ['Vật lý', 'Hóa học', 'Sinh học', 'Tin học'];
const example = (changes={}) => ({
  program:'GDPT 2018', foreignLanguage:'Tiếng Anh', electiveSelectionLocked:true,
  selectedElectives: [...electives],
  gradedSubjects:['Toán','Ngữ văn','Tiếng Anh','Lịch sử','Giáo dục quốc phòng và an ninh',...electives],
  ...changes,
});
const subjectRows=(subject='Toán')=>({grade10:{semester1:{[subject]:{regular:['0'],midterm:'',final:''}},semester2:{}},grade11:{semester1:{},semester2:{}},grade12:{semester1:{},semester2:{}}});
test('CP29-C4-01 valid curriculum identity accepted without inventing scores',()=>{
  assert.deepEqual(parseAcademicIdentity(example()),{foreignLanguage:'Tiếng Anh',selectedElectives:electives});
});
test('CP29-C4-02 rejects duplicate, malformed and unknown elective',()=>{
  for (const value of [null,[],example({selectedElectives:[...electives.slice(0,3),'Vật lý']}),example({selectedElectives:['Vật lý']}),example({selectedElectives:[...electives.slice(0,3),'Giáo dục thể chất']})]) {
    assert.equal(parseAcademicIdentity(value),null);
  }
});
test('CP29-C4-03 rejects wrong graded subject catalogue and programme',()=>{
  for (const value of [example({program:'unknown'}),example({gradedSubjects:[...example().gradedSubjects.slice(0,8),'Địa lý']}),example({gradedSubjects:[]})])
    assert.equal(parseAcademicIdentity(value),null);
});
test('CP29-D3-01 exact four electives and foreign language remain immutable',()=>{
  const original=parseAcademicIdentity(example());
  assert.ok(original);
  assert.equal(sameAcademicIdentity(original,parseAcademicIdentity(example())),true);
  const alt=parseAcademicIdentity(example({selectedElectives:['Vật lý','Hóa học','Địa lý','Tin học'],gradedSubjects:['Toán','Ngữ văn','Tiếng Anh','Lịch sử','Giáo dục quốc phòng và an ninh','Vật lý','Hóa học','Địa lý','Tin học']}));
  assert.equal(sameAcademicIdentity(original,alt),false);
  const changed=parseAcademicIdentity(example({foreignLanguage:'Tiếng Pháp',gradedSubjects:['Toán','Ngữ văn','Tiếng Pháp','Lịch sử','Giáo dục quốc phòng và an ninh',...electives]}));
  assert.equal(sameAcademicIdentity(original,changed),false);
});
test('CP29-D3-02 flags unapproved subjects in grade10, grade11, grade12',()=>{
  const identity=parseAcademicIdentity(example());
  for(const grade of ['grade10','grade11','grade12']) {
    const transcript=subjectRows(); transcript[grade].semester2['Địa lý']={regular:[],midterm:'',final:''};
    assert.equal(findForeignTranscriptSubject(transcript,identity),`${grade}/semester2/Địa lý`);
  }
});
test('CP29-D3-03 accepts partial terms and real zero as valid school transcript',()=>{
  const identity=parseAcademicIdentity(example());
  assert.equal(findForeignTranscriptSubject(subjectRows(),identity),null);
  assert.equal(findForeignTranscriptSubject({grade12:{semester1:{Toán:{regular:['0'],midterm:'',final:''}}}},identity),null);
});
test('CP29-D3-04 invalid grades/terms/shape fail closed',()=>{
  const identity=parseAcademicIdentity(example());
  for (const transcript of [null,[],{grade13:{}},{grade12:{semester3:{}}},{grade10:42}])
    assert.notEqual(findForeignTranscriptSubject(transcript,identity),null);
});
