import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  captureSeedBaseline, documentVersion, verifySeedTransaction,
} from '../src/page/seed/services/seedPersistenceContract.ts';
const uid='student_001', scope='student';
const electives=['Vật lý','Hóa học','Sinh học','Tin học'];
const identity={foreignLanguage:'Tiếng Anh',selectedElectives:electives};
const curriculum=()=>({program:'GDPT 2018', foreignLanguage:'Tiếng Anh',
  selectedElectives:electives, gradedSubjects:['Toán','Ngữ văn','Tiếng Anh','Lịch sử','Giáo dục quốc phòng và an ninh',...electives],
  electiveSelectionLocked:true});
const transcript={grade10:{semester1:{'Toán':{regular:['0'],midterm:'',final:''}},semester2:{}},grade11:{semester1:{},semester2:{}},grade12:{semester1:{},semester2:{}}};
const stamp=(s,n=0)=>({seconds:s,nanoseconds:n});
const rec=(kind='profile',changes={}, time=stamp(1763200000,1))=>({exists:true,data:{userId:uid,schemaVersion:1,dataScope:scope,curriculum:curriculum(),updatedAt:time,...(kind==='transcript'?{transcript}:{}),...changes}});
const absent={exists:false,data:null};
const versions=(a,b)=>captureSeedBaseline(a,b);
const verify=(a,b,baseline=versions(a,b),id=identity)=>verifySeedTransaction(uid,scope,baseline,a,b,id);

test('C1 empty initial collection is valid and does not invent a version',()=>{
  assert.deepEqual(versions(absent,absent),{profileVersion:'absent',transcriptVersion:'absent'});
  assert.equal(verify(absent,absent),null);
});
test('C1 real timestamp precision retained, including nanoseconds',()=>{
  assert.notEqual(documentVersion(rec('profile',{},stamp(1763200000,5))),documentVersion(rec('profile',{},stamp(1763200000,6))));
});
test('C1 missing, invalid and forged timestamp fails closed',()=>{
  for(const timestamp of [undefined,null,'yesterday',{seconds:2,nanoseconds:-1},{seconds:2,nanoseconds:1e9}]){
    assert.equal(captureSeedBaseline(rec('profile',{updatedAt:timestamp}),absent),null);
  }
});
test('C5 accepted initial load can commit a matching existing academic pair',()=>{
  assert.equal(verify(rec(),rec('transcript')),null);
});
test('C5 stale profile token rejects concurrent tab edits',()=>{
  const p=rec(),t=rec('transcript'),b=versions(p,t);
  assert.match(verifySeedTransaction(uid,scope,b,rec('profile',{},stamp(1763200001)),t,identity),/cập nhật từ phiên khác/);
});
test('C5 stale transcript token rejects concurrent term edits',()=>{
  const p=rec(),t=rec('transcript'),b=versions(p,t);
  assert.match(verifySeedTransaction(uid,scope,b,p,rec('transcript',{},stamp(1763200001)),identity),/cập nhật từ phiên khác/);
});
test('C5 phantom document created by another client rejects stale initial form',()=>{
  const b=versions(absent,absent);
  assert.match(verifySeedTransaction(uid,scope,b,rec(),rec('transcript'),identity),/cập nhật từ phiên khác/);
});
test('C1 invalid account owner, scope or schema fails closed',()=>{
  for(const changes of [{userId:'student_002'},{dataScope:'demo'},{schemaVersion:99},{curriculum:null}]) {
    assert.match(verify(rec('profile',changes),rec('transcript')),/sai lệch schema/);
  }
});
test('C1 corrupted/foreign transcript subject cannot be silently overwritten',()=>{
  const invalid={grade10:{semester1:{'Môn không hợp lệ':{}},semester2:{}}};
  assert.match(verify(rec(),rec('transcript',{transcript:invalid})),/môn hoặc học kỳ/);
});
test('C5 mismatched academic identity rejects cross-document overwrite',()=>{
  const alternate=['Vật lý','Hóa học','Địa lý','Tin học'];
  const altered=rec('transcript',{curriculum:{...curriculum(),selectedElectives:alternate,gradedSubjects:['Toán','Ngữ văn','Tiếng Anh','Lịch sử','Giáo dục quốc phòng và an ninh',...alternate]}});
  assert.match(verify(rec(),altered),/Tổ hợp môn/);
});
test('C5 student cannot save against admin demo document or wrong UID',()=>{
  assert.match(verify(rec(),rec('transcript',{dataScope:'demo'})),/sai lệch schema/);
  assert.match(verifySeedTransaction('bad/id','student',versions(absent,absent),absent,absent,identity),/Mã người dùng/);
});
test('C5 transaction reads account, profile, transcript BEFORE all writes',()=>{
  const ui=readFileSync(new URL('../src/page/seed/StudentProfilePage.tsx',import.meta.url),'utf8');
  const at=ui.indexOf('await runTransaction(db,');
  const account=ui.indexOf('transaction.get(userRef)',at);
  const profile=ui.indexOf('transaction.get(profileRef)',at);
  const transcriptRead=ui.indexOf('transaction.get(transcriptRef)',at);
  const verification=ui.indexOf('verifySeedTransaction(',at);
  const write=ui.indexOf('transaction.set(profileRef,',at);
  assert.ok(at>=0 && account>at && profile>account && transcriptRead>profile && verification>transcriptRead && write>verification);
  assert.ok(ui.indexOf('transaction.set(transcriptRef,',write)>write);
  assert.ok(ui.indexOf('transaction.set(historyRef,',write)>write);
  assert.doesNotMatch(ui,/const batch = writeBatch\(db\)/);
});
test('C5 failed transaction gets visible conflict, not false success',()=>{
  const ui=readFileSync(new URL('../src/page/seed/StudentProfilePage.tsx',import.meta.url),'utf8');
  assert.match(ui,/CLA_SEED_CONFLICT/);
  assert.match(ui,/Hãy tải lại trang/);
  assert.match(ui,/await runTransaction/);
});
