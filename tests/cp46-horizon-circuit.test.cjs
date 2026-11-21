const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const page=read('src/page/seed/StudentPage.tsx');
const horizon=read('src/components/student/ExamHorizon.tsx');
const circuit=read('src/page/seed/components/LearningCircuit.tsx');
const board=read('src/components/student/ExamReminderBoard.tsx');
test('CP46: calendar appears on student home after greeting and before analytic canvas',()=>{
  assert.ok(page.indexOf('<ExamHorizon />') > page.indexOf('cla-observatory-intro'));
  assert.ok(page.indexOf('<ExamHorizon />') < page.indexOf('<StudentDecisionCanvas'));
  assert.match(page,/!isAdminPreview && <ExamHorizon/);
  assert.match(page,/view === "\/student\/exams" && \(!isAdminPreview \? <ExamReminderBoard/);
});
test('CP46: student exams dedicated page is editing/settings',()=>{
  assert.match(board,/>Thiết lập lịch thi</);
  assert.match(board,/function add\(/);
  assert.match(board,/function saveDraft\(/);
  assert.match(board,/function remove\(/);
  assert.match(board,/href="\/student"/);
});
test('CP46: home reads ONLY validated local per-user events; never invents dates',()=>{
  assert.match(horizon,/isExamCalendarDocument\(data, uid\)/);
  assert.match(horizon,/examCalendarKey\(uid\)/);
  assert.match(horizon,/auth\.currentUser\?\.uid !== uid/);
  assert.match(horizon,/examMilestones\(calendar\.events, today\)/);
  assert.doesNotMatch(horizon,/EXAM_CATALOG\.map/);
  assert.match(horizon,/chưa đồng bộ đa thiết bị/);
});
test('CP46: account changes, same-tab updates, cross-tab updates and midnight update',()=>{
  assert.match(horizon,/onAuthStateChanged\(auth/);
  assert.match(horizon,/window\.addEventListener\("storage"/);
  assert.match(horizon,/EXAM_CALENDAR_UPDATED/);
  assert.match(horizon,/setInterval\(/);
  assert.match(board,/dispatchEvent\(new Event\(EXAM_CALENDAR_UPDATED\)\)/);
});
test('CP46: orbit links real module routes with accessible hover/focus preview',()=>{
  for(const href of ['\/student\/profile','\/lumen','\/atlas','\/orion','\/pulse','\/haven'])assert.ok(circuit.includes(href.replaceAll('\\','')));
  assert.match(circuit,/onMouseEnter=\{\(\)=>setActive\(i\)\}/);
  assert.match(circuit,/onFocus=\{\(\)=>setActive\(i\)\}/);
  assert.match(circuit,/aria-label=/);
  assert.doesNotMatch(page,/student-dash-module-grid/);
});
test('CP46: scoped CSS includes mobile fallback and reduced-motion guard',()=>{
  const css=read('src/styles/40-cla-exam-horizon-learning-circuit.css');
  assert.match(read('src/styles.css'),/40-cla-exam-horizon-learning-circuit.css/);
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/cla-circuit-mobile/);
  assert.match(css,/cla-horizon-track/);
});
