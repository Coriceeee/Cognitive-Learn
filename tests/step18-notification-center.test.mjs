import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  pushAppNotice, subscribeAppNotices, getAppNotices, clearAppNotices,
  dismissAppToast, markAppNoticesRead,
} from '../src/lib/appNotices.ts';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('NC01 toast store starts empty and ignores blank messages',()=>{
  clearAppNotices();
  assert.equal(getAppNotices().length,0);
  pushAppNotice({kind:'info',title:'  ',detail:'x'});
  pushAppNotice({kind:'info',title:'x',detail:''});
  assert.equal(getAppNotices().length,0);
});
test('NC02 notice broadcasts, includes type, and allows manual dismissal',()=>{
  clearAppNotices();let calls=0;
  const unsub=subscribeAppNotices(()=>calls++);
  pushAppNotice({kind:'success',title:'Phân tích xong',detail:'Đã nhận kết quả'});
  const [notice]=getAppNotices();
  assert.equal(notice.kind,'success');assert.equal(notice.visible,true);
  assert.equal(notice.seen,false);assert.equal(calls,1);
  dismissAppToast(notice.id);
  assert.equal(getAppNotices()[0].visible,false);
  assert.equal(getAppNotices().length,1);
  unsub();
  assert.equal(calls,2);
});
test('NC03 duplicate events are suppressed within 45s',()=>{
  clearAppNotices();
  const input={kind:'error',title:'Mất mạng',detail:'Kiểm tra kết nối',dedupeKey:'network'};
  pushAppNotice(input);pushAppNotice(input);
  assert.equal(getAppNotices().length,1);
});
test('NC04 notifications respect size limits and history cap',()=>{
  clearAppNotices();
  for(let i=0;i<29;i++) pushAppNotice({kind:'info',title:'T'.repeat(200),detail:'D'.repeat(500),dedupeKey:`${i}`});
  assert.equal(getAppNotices().length,20);
  assert.ok(getAppNotices().every(n=>n.title.length<=90 && n.detail.length<=260));
});
test('NC05 opening inbox marks current notices read',()=>{
  clearAppNotices();
  pushAppNotice({kind:'reminder',title:'Kỳ thi',detail:'Đăng ký đúng hạn'});
  markAppNoticesRead();
  assert.ok(getAppNotices().every(n=>n.seen));
});
test('NC06 all authorized routes share the same notification viewport',()=>{
  const app=read('../src/App.tsx');
  assert.match(app,/<AccessGate path=\{path\}>[\s\S]*?<AppNotificationCenter \/>/);
  const userMenu=read('../src/components/common/UserMenu.tsx');
  assert.match(userMenu,/<NotificationBell \/>/);
});
test('NC07 popup is below navigation and is mobile responsive',()=>{
  const css=read('../src/styles/31-notification-center.css');
  assert.match(css,/\.cla-toast-viewport[^}]*top:84px/);
  assert.match(css,/@media\(max-width:650px\)/);
  assert.match(css,/prefers-reduced-motion/);
});
test('NC08 no fake analysis completed on initial page mount',()=>{
  const lumen=read('../src/page/lumen/hooks/useLumenIntelligence.ts');
  const atlas=read('../src/page/atlas/components/AtlasGeminiReaderPanel.tsx');
  assert.ok(lumen.indexOf('Phân tích Lumen đã hoàn tất') > lumen.indexOf('await requestGeminiLumenExplanation'));
  assert.ok(atlas.indexOf('Đã hoàn tất tra cứu Atlas') > atlas.indexOf('await extractAdmissionData'));
  assert.match(lumen,/if \(!controller\.signal\.aborted\)/);
});
test('NC09 save success only after Firestore commit, error on failure',()=>{
  const profile=read('../src/page/seed/StudentProfilePage.tsx');
  assert.ok(profile.indexOf('title:"Đã lưu hồ sơ học tập"') > profile.indexOf('await batch.commit()'));
  assert.match(profile,/title:"Lưu hồ sơ thất bại"/);
});
test('NC10 exam reminders use real saved milestones and session dedupe',()=>{
  const src=read('../src/components/student/ExamReminderBoard.tsx');
  assert.match(src,/examAlerts\(events,today\)/);
  assert.match(src,/window\.sessionStorage\.getItem\(key\)/);
  assert.match(src,/kind:"reminder"/);
  assert.doesNotMatch(src,/Notification\.requestPermission/);
});
test('NC11 network events are handled without claiming Firebase save success',()=>{
  const src=read('../src/components/common/AppNotificationCenter.tsx');
  assert.match(src,/window\.addEventListener\("offline", offline\)/);
  assert.match(src,/window\.addEventListener\("online", online\)/);
  assert.match(src,/Bạn vẫn có thể xem phân tích nội bộ|Kiểm tra Internet/);
});
test('NC12 no notification persists in server or between user logouts',()=>{
  const app=read('../src/lib/appNotices.ts');
  const menu=read('../src/components/common/UserMenu.tsx');
  assert.doesNotMatch(app,/localStorage|setDoc\(|pushSubscription/);
  assert.match(menu,/clearAppNotices\(\)/);
  clearAppNotices();
});

test('NC13 success notification remains visible after the profile-to-dashboard redirect',()=>{
  const profile=read('../src/page/seed/StudentProfilePage.tsx');
  const dashboard=read('../src/page/seed/StudentPage.tsx');
  assert.match(profile,/sessionStorage\.setItem\(`cla-seed-save-flash:/);
  assert.match(dashboard,/sessionStorage\.removeItem\(key\)/);
  assert.match(dashboard,/Hồ sơ đã được cập nhật/);
});
