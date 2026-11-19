import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validLinkForAccount, verifiedAccountRole } from '../src/lib/studentLinkIntegrity.ts';
const student='student_001', teacher='teacher_001', parent='parent_001';
const make=(viewer=teacher,role='teacher')=>({studentId:student,viewerId:viewer,viewerRole:role,studentName:'Học sinh CLA',createdAt:{seconds:1763200000,nanoseconds:0}});
const id=viewer=>`${student}_${viewer}`;
test('F4 only owner can inspect legacy link for cleanup',()=>{
  assert.equal(validLinkForAccount(id(teacher),make(),student,'student')?.viewerId,teacher);
  assert.equal(validLinkForAccount(id(teacher),make(),teacher,'teacher'),null);
  assert.equal(validLinkForAccount(id(parent),make(parent,'parent'),parent,'parent'),null);
});
test('F4 missing and malformed server timestamps must not look like valid links',()=>{
  assert.equal(validLinkForAccount(id(teacher),{...make(),createdAt:null},student,'student'),null);
  assert.equal(validLinkForAccount(id(teacher),{...make(),createdAt:{seconds:5,nanoseconds:1000000000}},student,'student'),null);
});
test('F4 rejects orphaned or corrupted identifiers',()=>{
  for(const key of ['other_'+teacher,id(parent),'']) assert.equal(validLinkForAccount(key,make(),student,'student'),null);
  assert.equal(validLinkForAccount(id(teacher),{...make(),studentId:'other_001'},teacher,'teacher'),null);
});
test('F4 rejects cross-account and role mismatch',()=>{
  assert.equal(validLinkForAccount(id(teacher),make(),'student_002','student'),null);
  assert.equal(validLinkForAccount(id(teacher),make(),teacher,'parent'),null);
});
test('F4 refuses invalid role, malformed names and same account links',()=>{
  assert.equal(validLinkForAccount(id(teacher),{...make(),viewerRole:'admin'},student,'student'),null);
  assert.equal(validLinkForAccount(id(teacher),{...make(),studentName:1},student,'student'),null);
  assert.equal(validLinkForAccount(id(student),{...make(),viewerId:student},student,'student'),null);
});
test('F4 exact active boolean and role are mandatory',()=>{
  assert.equal(verifiedAccountRole({active:true,role:'student'},'student'),true);
  assert.equal(verifiedAccountRole({active:true,role:'teacher'},'teacher'),false);
  for(const input of [null,{}, {active:'true',role:'teacher'},{active:false,role:'teacher'},{active:true,role:'admin'}]) {
    assert.equal(verifiedAccountRole(input,'teacher'),false);
  }
});
test('F4 retired link and report UI cannot mount',()=>{
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  const studentPage=readFileSync(new URL('../src/page/seed/StudentPage.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(app,/TrangVaiTro|RolePage/);
  assert.doesNotMatch(studentPage,/StudentLinkManager|SharedReportPanel/);
});
test('F4 partial legacy removal is explicitly reported and retryable',()=>{
  const code=readFileSync(new URL('../src/page/seed/StudentConsentPage.tsx',import.meta.url),'utf8');
  assert.match(code,/if \(!result\.verifiedEmpty\)/);
  assert.match(code,/Thử thu hồi liên kết còn tồn/);
});
test('F4 legacy cleanup uses server-only reads',()=>{
  const code=readFileSync(new URL('../src/page/seed/StudentConsentPage.tsx',import.meta.url),'utf8');
  assert.match(code,/getDocsFromServer\(q\)/);
  assert.match(code,/where\("studentId", "==", ownerUid\), limit\(40\)/);
});
