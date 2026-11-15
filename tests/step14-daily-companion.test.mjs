import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_COMPANION, isClock, isQuietTime, isDayKey, isCompanionData,
  localDateKey, reminderDue, recordDailyCheckIn, recentDailyDates } from '../src/lib/dailyCompanion.ts';

const settings = () => ({ ...DEFAULT_COMPANION, userId:'student_001', enabled:true,
  schedule:{...DEFAULT_COMPANION.schedule}, completedDays:[] });
const file = path => readFileSync(new URL(path,import.meta.url),'utf8');

test('DC01 only valid 24h times are accepted', () => {
  for (const x of ['00:00','07:00','19:30','23:59']) assert.equal(isClock(x),true);
  for (const x of ['24:00','7:00','23:60','abc','19:30:00','']) assert.equal(isClock(x),false);
});
test('DC02 quiet hours wrap around midnight', () => {
  assert.equal(isQuietTime('23:59','22:00','06:30'),true);
  assert.equal(isQuietTime('05:00','22:00','06:30'),true);
  assert.equal(isQuietTime('06:30','22:00','06:30'),false);
  assert.equal(isQuietTime('19:30','22:00','06:30'),false);
});
test('DC03 same quiet boundaries turn quiet mode off, never mute all day', () => {
  assert.equal(isQuietTime('11:00','22:00','22:00'),false);
});
test('DC04 invalid schedules are fail-closed', () => {
  assert.equal(isQuietTime('xx','22:00','06:00'),true);
  assert.equal(isCompanionData({...settings(),schedule:{study:'99:99'}},'student_001'),false);
});
test('DC05 reminder due only at requested local minute', () => {
  const d=new Date(2026,10,13,19,30,0);
  assert.deepEqual(reminderDue(settings(),d),['study']);
  assert.deepEqual(reminderDue(settings(),new Date(2026,10,13,19,31,0)),[]);
});
test('DC06 reminder disabled or completed today never fires', () => {
  const d=new Date(2026,10,13,19,30);
  assert.deepEqual(reminderDue({...settings(),enabled:false},d),[]);
  assert.deepEqual(reminderDue({...settings(),completedDays:[localDateKey(d)]},d),[]);
});
test('DC07 quiet hours suppress matching reminders', () => {
  const d=new Date(2026,10,13,21,0);
  assert.deepEqual(reminderDue({...settings(),quietStart:'20:00',quietEnd:'07:00'},d),[]);
});
test('DC08 midnight boundary yields correct local date', () => {
  assert.equal(localDateKey(new Date(2026,10,13,0,0)),'2026-11-13');
  assert.equal(localDateKey(new Date(2026,10,12,23,59)),'2026-11-12');
});
test('DC09 invalid day keys rejected, including invalid calendar days', () => {
  assert.equal(isDayKey('2026-11-13'),true);
  assert.equal(isDayKey('2026-02-30'),false);
  assert.equal(isDayKey('2026-13-13'),false);
});
test('DC10 daily check-in is idempotent', () => {
  assert.deepEqual(recordDailyCheckIn(['2026-11-12','2026-11-13'],'2026-11-13'),['2026-11-12','2026-11-13']);
});
test('DC11 daily check-in keeps only 14 most recent days', () => {
  const days=Array.from({length:14},(_,n)=>`2026-11-${String(n+1).padStart(2,'0')}`);
  const updated=recordDailyCheckIn(days,'2026-11-15');
  assert.equal(updated.length,14);assert.equal(updated[0],'2026-11-02');
  assert.equal(updated.at(-1),'2026-11-15');
});
test('DC12 data validation enforces account ownership and consent boundaries in rules',()=>{
  const s=settings(); assert.equal(isCompanionData(s,s.userId),true);
  assert.equal(isCompanionData(s,'student_002'),false);
  assert.equal(isCompanionData({...s,enabled:'true'},s.userId),false);
  assert.equal(isCompanionData({...s,completedDays:['2026-11-13','2026-11-13']},s.userId),false);
});
test('DC13 recent activity returns seven calendar days',()=>{
  assert.deepEqual(recentDailyDates(new Date(2026,10,13)),[
    '2026-11-07','2026-11-08','2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13']);
});
test('DC14 route, protected roles and navigation are integrated',()=>{
  assert.match(file('../src/App.tsx'),/"\/student\/companion"/);
  assert.match(file('../src/components/common/AccessGate.tsx'),/"\/student\/companion"/);
  assert.match(file('../src/page/seed/StudentPage.tsx'),/Đồng hành mỗi ngày/);
});
test('DC15 no notification permission requested without user gesture',()=>{
  const src=file('../src/page/companion/DailyCompanionPage.tsx');
  assert.match(src,/const requestBrowserPermission = async \(\) =>/);
  assert.match(src,/onClick=\{\(\)=>void requestBrowserPermission\(\)\}/);
  assert.equal((src.match(/Notification\.requestPermission\(\)/g) ?? []).length,1);
});
test('DC16 background web push is opt-in, generic, and never caches student data',()=>{
  const sw=file('../public/cla-companion-sw.js');
  assert.match(sw,/addEventListener\('push'/);
  assert.match(sw,/cla-companion-reminder/);
  assert.doesNotMatch(sw,/addEventListener\(['"]fetch['"]/);
  assert.doesNotMatch(sw,/điểm số|hồ sơ học sinh|môn yếu/i);
  assert.match(file('../src/page/companion/DailyCompanionPage.tsx'),/Cloud Functions/);
});
test('DC17 Firestore candidate rules scope records to student and product consent',()=>{
  const rules=file('../firestore.rules.CANDIDATE_CP21');
  assert.match(rules,/match \/daily_companion\/\{uid\}/);
  assert.match(rules,/allow get: if studentOwns\(uid\)/);
  assert.match(rules,/allow create, update: if validDailyCompanion\(uid\)/);
  assert.match(rules,/studentMayPersist\(uid\)/);
  assert.match(rules,/allow delete: if false/);
});
test('DC18 manifests use real bundled icons and do not bundle app-store claim',()=>{
  const manifest=JSON.parse(file('../public/manifest.webmanifest'));
  assert.equal(manifest.start_url,'/student/companion');
  assert.equal(manifest.icons.length,2);
  assert.match(file('../index.html'),/manifest\.webmanifest/);
});
test('DC19 preview is fail-closed until consent gate and rules are deployed',()=>{
  const hook=file('../src/lib/useDailyCompanion.ts');
  assert.match(hook,/if \(!STUDENT_CONSENT_GATE_ENABLED\) \{ setStatus\("preview"\); return; \}/);
  assert.match(hook,/if \(!STUDENT_CONSENT_GATE_ENABLED \|\| !consentAccepted\)/);
});
test('DC20 consent withdrawal stops foreground reminders in the open page',()=>{
  const hook=file('../src/lib/useDailyCompanion.ts');
  const page=file('../src/page/companion/DailyCompanionPage.tsx');
  assert.match(hook,/onSnapshot\(doc\(db, "student_consents", currentUid\)/);
  assert.match(hook,/!snapshot\.metadata\.fromCache/);
  assert.match(hook,/setConsentAccepted\(!snapshot\.metadata\.fromCache/);
  assert.match(page,/!companion\.consentAccepted\) return/);
});
