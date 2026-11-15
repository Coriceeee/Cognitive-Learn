/** Optional standard Web Push transport for CLA installed PWA / supported browsers.
 * No Firebase messaging token or service-account key is shipped to the browser.
 * Subscription details are stored under the signed-in student's UID and never
 * logged or placed in the main daily_companion record.
 */
import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { STUDENT_CONSENT_GATE_ENABLED } from './studentConsentConfig';

const STORAGE_KEY='cla-companion-push-device-v1';
const PUBLIC_VAPID_KEY=import.meta.env.VITE_CLA_WEB_PUSH_VAPID_PUBLIC_KEY as string | undefined;
type LocalBinding={userId:string;deviceId:string};

function binding():LocalBinding|null {
  try {
    const value=JSON.parse(localStorage.getItem(STORAGE_KEY)??'null') as LocalBinding|null;
    return value && typeof value.userId==='string' && /^[a-f0-9]{32}$/.test(value.deviceId)
      ? value : null;
  } catch {return null;}
}
function keyBytes(base64Url:string):Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]{60,100}$/.test(base64Url)) throw new Error('Public VAPID key is invalid');
  const base64=base64Url.replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function deviceId():string {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function webPushAvailable():boolean {
  return typeof window!=='undefined' && window.isSecureContext && 'serviceWorker' in navigator
    && 'PushManager' in window && 'Notification' in window;
}
export function webPushConfigured():boolean {return !!PUBLIC_VAPID_KEY;}
async function registration() {
  return navigator.serviceWorker.register('/cla-companion-sw.js',{scope:'/'});
}
function ref(uid:string,id:string){return doc(db,'companion_push_devices',uid,'subscriptions',id);}

/** Called ONLY in response to a button click, after product consent and schedule. */
export async function enableCompanionWebPush(uid:string, consentAccepted:boolean, scheduleEnabled:boolean) {
  if (!STUDENT_CONSENT_GATE_ENABLED || !consentAccepted || !scheduleEnabled || auth.currentUser?.uid!==uid)
    throw new Error('Cần xác minh tài khoản, đồng ý dữ liệu và bật lịch trước khi đăng ký nhắc nền.');
  if (!webPushAvailable() || !PUBLIC_VAPID_KEY)
    throw new Error('Thiết bị hoặc dự án chưa cấu hình Web Push qua HTTPS và VAPID.');
  const permission=await Notification.requestPermission();
  if (permission!=='granted') throw new Error('Trình duyệt chưa cho phép gửi thông báo.');
  const sw=await registration();
  const existing=binding();
  if (existing && existing.userId!==uid) await revokeLocalPushSubscription();
  const subscription=await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(PUBLIC_VAPID_KEY)});
  const json=subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error('Subscription không đầy đủ.');
  const id=existing?.userId===uid ? existing.deviceId : deviceId();
  const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!zone || zone.length>64) throw new Error('Không xác định được múi giờ thiết bị.');
  if (auth.currentUser?.uid!==uid) {await subscription.unsubscribe();throw new Error('Tài khoản đã đổi trong lúc đăng ký.');}
  try {
    await setDoc(ref(uid,id),{userId:uid,schemaVersion:1,enabled:true,
      timeZone:zone,endpoint:json.endpoint,keys:{p256dh:json.keys.p256dh,auth:json.keys.auth},
      updatedAt:serverTimestamp()});
    localStorage.setItem(STORAGE_KEY,JSON.stringify({userId:uid,deviceId:id}));
  } catch (error) {
    // If local storage failed *after* the Firestore write, do not leave an orphaned
    // device registration pointing to an unusable client subscription.
    try {await deleteDoc(ref(uid,id));} catch {/* server TTL/404 cleanup remains */}
    await subscription.unsubscribe();
    throw error;
  }
}
/** Unsubscribes on the current browser even if cloud deletion is temporarily denied. */
export async function disableCompanionWebPush(uid?:string) {
  const current=binding();
  let cloudError:unknown;
  if (current && current.userId===uid && auth.currentUser?.uid===uid) {
    try {await deleteDoc(ref(current.userId,current.deviceId));} catch(e){cloudError=e;}
  }
  await revokeLocalPushSubscription();
  if (cloudError) throw new Error('Đã tắt nhắc trên thiết bị, nhưng chưa xóa được đăng ký trên Firestore.');
}
async function revokeLocalPushSubscription() {
  try {
    if ('serviceWorker' in navigator) {
      const sw=await navigator.serviceWorker.getRegistration('/');
      const subscription=await sw?.pushManager.getSubscription();
      await subscription?.unsubscribe();
    }
  } finally { try {localStorage.removeItem(STORAGE_KEY);}catch{/* private browsing */} }
}
/** Keep a shared device from receiving a former student's reminders after sign out/switch. */
export async function revokeForeignPushOwner(currentUid:string) {
  const previous=binding();
  if (previous && previous.userId!==currentUid) await revokeLocalPushSubscription();
}
export function localPushOwner(uid:string):boolean {return binding()?.userId===uid;}
