import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EXAM_CATALOG, EXAM_CALENDAR_MAX_ITEMS, createExamReminder, daysUntil,
  examAlerts, examMilestones, formatExamDate, isExamCalendarDocument, isExamReminder,
  isValidDay, localDayKey, nextExamMilestone, safeExamUrl, upsertExamReminder,
} from '../src/lib/examCalendar.ts';

const src = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const item = (code, n=1) => createExamReminder(code, `exam_test_${n}`);
const configured = (code,n, examDate, registrationDeadline='') => ({
  ...item(code,n),examDate,registrationDeadline,
});
const document = (uid,events=[]) => ({schemaVersion:1,userId:uid,events});

test('EX01 catalog offers HSA, V-ACT, TSA, V-SAT, THPT and certificates',()=>{
  assert.deepEqual(['HSA','VACT','TSA','VSAT','THPT','IELTS','SAT'].map(k=>EXAM_CATALOG.some(c=>c.code===k)),Array(7).fill(true));
});
test('EX02 no invented exam or registration dates by default',()=>{
  for(const c of EXAM_CATALOG) {const e=item(c.code);assert.equal(e.examDate,'');assert.equal(e.registrationDeadline,'');}
});
test('EX03 leap years and invalid dates rejected',()=>{
  assert.equal(isValidDay('2028-02-29'),true);
  for(const d of ['2026-02-29','2026-02-30','2026-13-01','2026-00-01','2026-11-31','2026-1-03','garbage', '']) assert.equal(isValidDay(d),false,d);
});
test('EX04 countdown is calendar-day based over New Year',()=>{
  assert.equal(daysUntil('2027-01-01','2026-12-31'),1);
  assert.equal(daysUntil('2026-12-31','2027-01-01'),-1);
  assert.equal(daysUntil('2027-01-01','2027-01-01'),0);
});
test('EX05 DST-safe date-difference avoids elapsed-hour anomalies',()=>{
  assert.equal(daysUntil('2027-03-29','2027-03-28'),1);
  assert.equal(daysUntil('2027-10-31','2027-10-30'),1);
});
test('EX06 local date key uses local calendar instead of ISO UTC date',()=>{
  assert.equal(localDayKey(new Date(2026,10,14,0,2)), '2026-11-14');
});
test('EX07 invalid countdown inputs never produce NaN',()=>{
  assert.equal(daysUntil('','2026-11-14'),null);
  assert.equal(daysUntil('2026-11-14','wrong'),null);
});
test('EX08 multiple sittings of the same exam are supported',()=>{
  const a=configured('VSAT',1,'2027-01-10');const b=configured('VSAT',2,'2027-02-10');
  assert.equal(upsertExamReminder([a],b).length,2);
});
test('EX09 update does not append duplicate events',()=>{
  const a=item('HSA');const b={...a,title:'HSA đợt 2'};
  assert.deepEqual(upsertExamReminder([a],b),[b]);
});
test('EX10 cap prevents excessive local student records',()=>{
  const list=Array.from({length:EXAM_CALENDAR_MAX_ITEMS},(_,n)=>item('HSA',n+1));
  assert.throws(()=>upsertExamReminder(list,item('TSA',99)),/tối đa/);
});
test('EX11 registration deadline cannot come after exam date',()=>{
  const e=configured('HSA',1,'2027-02-01','2027-02-02');
  assert.equal(isExamReminder(e),false);
  assert.throws(()=>upsertExamReminder([],e));
});
test('EX12 source links must be HTTPS, never javascript or embedded credentials',()=>{
  assert.equal(safeExamUrl('https://www.hsa.edu.vn/trang-chu').startsWith('https://'),true);
  for(const v of ['javascript:alert(1)','data:text/html,a','http://foo.com','https://u:pass@example.com/','bad','']) assert.equal(safeExamUrl(v),'',v);
});
test('EX13 wrong-account calendar cannot be loaded',()=>{
  assert.equal(isExamCalendarDocument(document('uid_A',[item('HSA')]),'uid_B'),false);
});
test('EX14 corrupt storage and wrong version are rejected',()=>{
  assert.equal(isExamCalendarDocument({...document('uid_A'),schemaVersion:2},'uid_A'),false);
  assert.equal(isExamCalendarDocument({...document('uid_A'),events:'string'},'uid_A'),false);
  assert.equal(isExamCalendarDocument(document('uid_A',[item('HSA'),item('HSA')]),'uid_A'),false);
});
test('EX15 no-data reminder does not emit a countdown or warning',()=>{
  const list=[item('HSA')];
  assert.equal(nextExamMilestone(list,'2026-11-14'),null);
  assert.deepEqual(examAlerts(list,'2026-11-14'),[]);
});
test('EX16 nearest future milestone is registration deadline rather than exam',()=>{
  const list=[configured('HSA',1,'2027-01-15','2026-11-17'),configured('VACT',2,'2026-12-01')];
  assert.deepEqual([nextExamMilestone(list,'2026-11-14')?.kind,nextExamMilestone(list,'2026-11-14')?.days],['registration',3]);
});
test('EX17 when registered, registration reminders are suppressed',()=>{
  const a={...configured('HSA',1,'2026-11-20','2026-11-15'), registrationDone:true};
  const reminders=examAlerts([a],'2026-11-14');
  assert.equal(reminders.length,1); assert.equal(reminders[0].kind,'exam');
});
test('EX18 upcoming alerts capped at 14 days, past milestones excluded',()=>{
  const a=configured('HSA',1,'2026-11-29','2026-11-13');
  assert.equal(examAlerts([a],'2026-11-14').length,0);
  assert.equal(examAlerts([a],'2026-11-15')[0].days,14);
});
test('EX19 expired registrations do not mask an upcoming exam',()=>{
  const a=configured('HSA',1,'2026-11-20','2026-11-10');
  assert.equal(nextExamMilestone([a],'2026-11-14').kind,'exam');
});
test('EX20 deterministic sorting handles same day registration and exam',()=>{
  const list=[configured('TSA',1,'2026-11-15'),configured('HSA',2,'2026-11-15','2026-11-15')];
  const ms=examMilestones(list,'2026-11-14');
  assert.equal(ms.length,3);assert.equal(ms.every(m=>m.days===1),true);
});
test('EX21 invalid custom names, broken ids and extra-long urls are rejected',()=>{
  assert.equal(isExamReminder({...item('OTHER'),title:''}),false);
  assert.equal(isExamReminder({...item('HSA'),id:'<script>'}),false);
  assert.equal(isExamReminder({...item('HSA'),sourceUrl:'https://example.com/'+'a'.repeat(700)}),false);
});
test('EX22 format is stable Vietnamese day/month/year',()=>{
  assert.equal(formatExamDate('2027-02-07'),'07/02/2027');
  assert.equal(formatExamDate(''),'Chưa nhập ngày');
});
test('EX23 student dashboard places exam board after hero and priority cards',()=>{
  const page=src('../src/page/seed/StudentPage.tsx');
  assert.match(page,/!isAdminPreview && <ExamReminderBoard/);
  const exam = page.indexOf('<ExamReminderBoard />');
  assert.ok(exam > page.indexOf('student-dash-hero'));
  assert.ok(exam > page.indexOf('student-dash-focus'));
  assert.ok(exam < page.indexOf('student-dash-modules')); 
});
test('EX24 student selects visible exams, can remove or edit their own calendar',()=>{
  const board=src('../src/components/student/ExamReminderBoard.tsx');
  assert.match(board,/EXAM_CATALOG\.map\(option => <button/);
  assert.match(board,/onClick=\{\(\) => add\(option\.code\)\}/);
  assert.match(board,/events\.filter\(x => x\.id !== item\.id\)/);
  assert.match(board,/storageKey\(user\.uid\)/);
  assert.match(board,/auth\.currentUser\?\.uid !== uid/);
});
test('EX25 browser storage is explicit, versioned, cannot overwrite corrupt source silently',()=>{
  const board=src('../src/components/student/ExamReminderBoard.tsx');
  assert.match(board,/setBlockedStorage\(true\)/);
  assert.match(board,/if \(blockedStorage\)/);
  assert.match(board,/isExamCalendarDocument\(data, uid\)/);
  assert.match(board,/window\.confirm\(/);
});
test('EX26 reminder board never claims background push works',()=>{
  const board=src('../src/components/student/ExamReminderBoard.tsx');
  assert.match(board,/chưa gửi push nền cho lịch thi/);
  assert.doesNotMatch(board,/Notification\.requestPermission/);
});
test('EX27 custom exam and manual source URL are editable with a save action',()=>{
  const board=src('../src/components/student/ExamReminderBoard.tsx');
  assert.match(board,/Tên đợt thi \/ tên kỳ thi/);
  assert.match(board,/Link thông báo \(HTTPS, nếu có\)/);
  assert.match(board,/onClick=\{saveDraft\}/);
});
test('EX28 stylesheet included and responsive',()=>{
  const css=src('../src/styles.css');
  assert.match(css,/30-exam-reminder-board.css/);
  assert.match(src('../src/styles/30-exam-reminder-board.css'),/@media\(max-width:680px\)/);
});

test('EX29 Atlas and Companion can navigate to the student countdown board',()=>{
  assert.match(src('../src/page/atlas/AtlasPage.tsx'),/student#cla-exam-reminders/);
  assert.match(src('../src/page/companion/DailyCompanionPage.tsx'),/student#cla-exam-reminders/);
  assert.match(src('../src/page/seed/StudentPage.tsx'),/scrollIntoView/);
});
test('EX30 unsafe or modified date inputs cannot be persisted via save',()=>{
  const board=src('../src/components/student/ExamReminderBoard.tsx');
  assert.match(board,/if \(!isExamReminder\(draft\)\)/);
  assert.match(board,/function saveDraft\(\)/);
  assert.match(board,/window\.localStorage\.setItem/);
});
