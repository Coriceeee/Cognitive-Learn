import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dueForDevice, civilTime, isValidZone, validPushEndpoint, validDevice,
  deliveryKey, hasActiveConsent, hasActiveStudentAccount, safePayload,
  PUSH_NOTIFICATION, isQuiet} from '../functions/src/pushPolicy.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const uid='student_001';
const settings=()=>({schemaVersion:1,userId:uid,enabled:true,
  schedule:{morning:'07:00',study:'19:30',checkIn:'21:00'},
  quietStart:'22:00',quietEnd:'06:30',completedDays:[]});
const device=()=>({userId:uid,schemaVersion:1,enabled:true,timeZone:'Asia/Ho_Chi_Minh',
  endpoint:'https://fcm.googleapis.com/fcm/send/123456',
  keys:{p256dh:'A'.repeat(87),auth:'B'.repeat(22)}});
const when=(iso)=>new Date(iso);
test('WP01 server evaluates time in device IANA zone, not UTC',()=>{
  assert.deepEqual(civilTime(when('2026-11-14T12:30:00Z'),'Asia/Ho_Chi_Minh'),{date:'2026-11-14',clock:'19:30'});
  assert.deepEqual(dueForDevice(settings(),'Asia/Ho_Chi_Minh',when('2026-11-14T12:30:00Z')),[{kind:'study',date:'2026-11-14'}]);
});
test('WP02 five-minute lookback handles scheduler delays, not arbitrary late sends',()=>{
  assert.equal(dueForDevice(settings(),'Asia/Ho_Chi_Minh',when('2026-11-14T12:34:00Z')).length,1);
  assert.equal(dueForDevice(settings(),'Asia/Ho_Chi_Minh',when('2026-11-14T12:35:00Z')).length,0);
});
test('WP03 notifications disabled by account setting and quiet hours',()=>{
  assert.deepEqual(dueForDevice({...settings(),enabled:false},'Asia/Ho_Chi_Minh',when('2026-11-14T12:30:00Z')),[]);
  assert.deepEqual(dueForDevice({...settings(),quietStart:'19:00',quietEnd:'20:00'},'Asia/Ho_Chi_Minh',when('2026-11-14T12:30:00Z')),[]);
});
test('WP04 completed day suppresses notifications',()=>{
  assert.deepEqual(dueForDevice({...settings(),completedDays:['2026-11-14']},'Asia/Ho_Chi_Minh',when('2026-11-14T12:30:00Z')),[]);
});
test('WP05 quiet periods spanning midnight work',()=>{
  assert.equal(isQuiet('23:59','22:00','06:30'),true);
  assert.equal(isQuiet('06:30','22:00','06:30'),false);
});
test('WP06 reject invalid timezone and schedule (fail-closed)',()=>{
  assert.equal(isValidZone('Invalid/City'),false);
  assert.equal(isValidZone('Asia/Ho_Chi_Minh'),true);
  assert.deepEqual(dueForDevice(settings(),'Invalid/City',new Date()),[]);
  assert.deepEqual(dueForDevice({...settings(),schedule:{...settings().schedule,study:'999'}},'Asia/Ho_Chi_Minh',new Date()),[]);
});
test('WP07 DST repeated local wall time does not create different delivery key',()=>{
  const date1='2026-11-01T05:30:00Z',date2='2026-11-01T06:30:00Z';
  const a=civilTime(when(date1),'America/New_York');const b=civilTime(when(date2),'America/New_York');
  assert.deepEqual(a,b);
  assert.equal(deliveryKey(a.date,'study','a'.repeat(32)),deliveryKey(b.date,'study','a'.repeat(32)));
});
test('WP08 new-day boundary across UTC and device time',()=>{
  assert.deepEqual(civilTime(when('2026-11-14T17:01:00Z'),'Asia/Ho_Chi_Minh'),{date:'2026-11-15',clock:'00:01'});
});
test('WP09 only active student and verified opt-in product consent qualify',()=>{
  const consent={userId:uid,schemaVersion:1,noticeVersion:'cla-student-privacy-v1',productAccepted:true,researchConsent:false};
  assert.equal(hasActiveConsent(consent,uid),true);
  assert.equal(hasActiveConsent({...consent,productAccepted:false},uid),false);
  assert.equal(hasActiveConsent({...consent,researchConsent:true},uid),false);
  assert.equal(hasActiveConsent(consent,'someone-else'),false);
  assert.equal(hasActiveStudentAccount({role:'student',active:true}),true);
  assert.equal(hasActiveStudentAccount({role:'admin',active:true}),false);
  assert.equal(hasActiveStudentAccount({role:'student',active:false}),false);
});
test('WP10 only recognized secure push service endpoints are accepted (SSRF guard)',()=>{
  assert.equal(validPushEndpoint(device().endpoint),true);
  assert.equal(validPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/test'),true);
  assert.equal(validPushEndpoint('https://web.push.apple.com/test'),true);
  for(const url of ['https://example.net/push','http://fcm.googleapis.com/x','https://127.0.0.1/x',
    'https://fcm.googleapis.com.evil.example/x','https://user:pass@fcm.googleapis.com/x','https://fcm.googleapis.com:8080/x'])
    assert.equal(validPushEndpoint(url),false,url);
});
test('WP11 malformed device owner/keys/zone cannot dispatch',()=>{
  assert.equal(validDevice(device(),uid),true);
  assert.equal(validDevice(device(),'another'),false);
  assert.equal(validDevice({...device(),timeZone:'Invalid/Zone'},uid),false);
  assert.equal(validDevice({...device(),keys:{...device().keys,auth:''}},uid),false);
});
test('WP12 delivery key is deterministic and scoped to device/date/kind',()=>{
  assert.equal(deliveryKey('2026-11-14','study','a'.repeat(32)),'2026-11-14_study_'+ 'a'.repeat(32));
  assert.notEqual(deliveryKey('2026-11-14','study','a'.repeat(32)),deliveryKey('2026-11-14','study','b'.repeat(32)));
  assert.throws(()=>deliveryKey('2026-11-14','study','../admin'));
});
test('WP13 payload is generic, does not include student data or remote URLs',()=>{
  const data=JSON.parse(safePayload('study'));
  assert.deepEqual(data,{type:'cla-companion-reminder',kind:'study'});
  assert.equal(PUSH_NOTIFICATION.url,'/student/companion');
  assert.doesNotMatch(safePayload('study'),/student_001|https:|điểm|môn yếu/i);
});
test('WP14 worker receives Web Push but does not cache authenticated pages or trust external redirect',()=>{
  const sw=read('../public/cla-companion-sw.js');
  assert.match(sw,/addEventListener\('push'/);
  assert.doesNotMatch(sw,/addEventListener\(['"]fetch['"]/);
  assert.match(sw,/new URL\('\/student\/companion',self.location.origin\)/);
});
test('WP15 opt-in and opt-out are distinct user-gesture actions',()=>{
  const page=read('../src/page/companion/DailyCompanionPage.tsx');
  const hook=read('../src/lib/companionWebPush.ts');
  assert.match(page,/onClick=\{\(\)=>void startBackgroundPush\(\)\}/);
  assert.match(page,/onClick=\{\(\)=>void stopBackgroundPush\(\)\}/);
  assert.match(hook,/Notification.requestPermission\(\)/);
  assert.match(hook,/deleteDoc\(ref\(/);
  assert.match(hook,/unsubscribe\(\)/);
  assert.match(hook,/auth.currentUser\?\.uid!==uid/);
});
test('WP16 server dispatch is disabled by default and is separately deployed',()=>{
  const server=read('../functions/index.mjs');
  assert.match(server,/process.env.CLA_PUSH_ENABLED!=='true'/);
  assert.match(server,/hasActiveConsent\(consent.data\(\),uid\)/);
  assert.match(server,/await claimOnce/);
  assert.match(server,/secrets:\[privateKey\]/);
  assert.match(server,/MAX_ACCOUNTS_PER_TICK/);
  assert.doesNotMatch(read('../firebase.json'),/"functions"/);
  assert.match(read('../firebase.push.json'),/"functions"/);
});
test('WP17 rules restrict subscription ownership and deny client delivery ledger access',()=>{
  const rules=read('../firestore.rules.CANDIDATE_CP21');
  assert.match(rules,/match \/companion_push_devices\/\{uid\}\/subscriptions\/\{deviceId\}/);
  assert.match(rules,/allow create, update: if validCompanionPushDevice\(uid, deviceId\)/);
  assert.match(rules,/allow delete: if studentOwns\(uid\)/);
  assert.match(rules,/match \/companion_push_delivery\/\{uid\}\/sent\/\{eventId\}/);
  assert.match(rules,/allow read, write: if false/);
});
test('WP18 service worker does not claim guaranteed background delivery',()=>{
  const page=read('../src/page/companion/DailyCompanionPage.tsx');
  assert.match(page,/chưa thể khẳng định nhắc khi đóng ứng dụng/);
  assert.match(page,/VAPID/);
});
