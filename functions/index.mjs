/** OPTIONAL server dispatch. Disabled unless CLA_PUSH_ENABLED=true is explicitly set.
 * Never deploy this from the default firebase.json. Use firebase.push.json after
 * Emulator/consent/privacy approvals, with a dedicated Cloud Functions secret.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import webpush from 'web-push';
import {deliveryKey, dueForDevice, hasActiveConsent, hasActiveStudentAccount,
  validDevice, PUSH_NOTIFICATION, safePayload} from './src/pushPolicy.mjs';

initializeApp();
const db=getFirestore();
const privateKey=defineSecret('CLA_WEB_PUSH_VAPID_PRIVATE_KEY');
const PAGE_SIZE=100;
const MAX_ACCOUNTS_PER_TICK=1500;
const MAX_DEVICES_PER_ACCOUNT=4;
const PENDING_EXPIRY_MS=45*24*60*60*1000;

async function claimOnce(uid, deviceId, reminder) {
  const id=deliveryKey(reminder.date,reminder.kind,deviceId);
  const ref=db.doc(`companion_push_delivery/${uid}/sent/${id}`);
  return db.runTransaction(async tx=>{
    if ((await tx.get(ref)).exists) return false;
    // Atomic claim BEFORE send: at-most-once attempt, but delivery is NOT guaranteed.
    tx.create(ref,{kind:reminder.kind,day:reminder.date,deviceId,
      claimedAt:new Date(),expireAt:new Date(Date.now()+PENDING_EXPIRY_MS)});
    return true;
  });
}

async function dispatchStudent(doc,now) {
  const uid=doc.id; const settings=doc.data();
  if (!settings?.enabled || settings?.userId!==uid || settings?.schemaVersion!==1) return 0;
  // Read all guards from the server for every tick; client-side cache is not authority.
  const [user,consent]=await Promise.all([
    db.doc(`users/${uid}`).get(), db.doc(`student_consents/${uid}`).get(),
  ]);
  if (!hasActiveStudentAccount(user.data()) || !hasActiveConsent(consent.data(),uid)) return 0;
  const devices=await db.collection(`companion_push_devices/${uid}/subscriptions`)
    .orderBy(FieldPath.documentId()).limit(MAX_DEVICES_PER_ACCOUNT+1).get();
  let attempted=0;
  for (const device of devices.docs.slice(0,MAX_DEVICES_PER_ACCOUNT)) {
    const d=device.data();
    if (!validDevice(d,uid) || !d.updatedAt?.toDate ||
        now.getTime()-d.updatedAt.toDate().getTime()>30*24*60*60*1000) continue;
    for (const reminder of dueForDevice(settings,d.timeZone,now)) {
      if (!await claimOnce(uid,device.id,reminder)) continue;
      try {
        await webpush.sendNotification({endpoint:d.endpoint,keys:d.keys},safePayload(reminder.kind),{
          TTL:300,urgency:'normal',contentEncoding:'aes128gcm'
        });
        attempted++;
      } catch (error) {
        // A dead subscription may be deleted; never log the endpoint or token.
        if (error?.statusCode===404 || error?.statusCode===410) await device.ref.delete();
        else console.error('CLA push send failed', {status:error?.statusCode??'unknown'});
      }
    }
  }
  return attempted;
}

export const claCompanionPushTick=onSchedule({
  schedule:'every 5 minutes',timeZone:'Etc/UTC',retryCount:0,
  secrets:[privateKey],timeoutSeconds:540,memory:'256MiB',
},async ()=>{
  if (process.env.CLA_PUSH_ENABLED!=='true') {
    console.log('CLA push disabled by server configuration.'); return;
  }
  const publicKey=process.env.CLA_WEB_PUSH_VAPID_PUBLIC_KEY;
  const contact=process.env.CLA_WEB_PUSH_CONTACT;
  if (!publicKey || !contact || !contact.startsWith('mailto:')) throw new Error('CLA push public configuration missing');
  webpush.setVapidDetails(contact,publicKey,privateKey.value());
  const now=new Date();let cursor=null,scanned=0,attempted=0;
  while (scanned<MAX_ACCOUNTS_PER_TICK) {
    let query=db.collection('daily_companion').orderBy(FieldPath.documentId())
      .limit(Math.min(PAGE_SIZE,MAX_ACCOUNTS_PER_TICK-scanned));
    if (cursor) query=query.startAfter(cursor);
    const batch=await query.get(); if (batch.empty) break;
    for (const record of batch.docs) {
      try {attempted+=await dispatchStudent(record,now);}
      catch(e){console.error('CLA push processing error', {code:e?.code??'unknown'});}
    }
    scanned+=batch.size;cursor=batch.docs.at(-1);
    if (batch.size<PAGE_SIZE) break;
  }
  console.log('CLA push tick complete', {scanned,attempted,limit:MAX_ACCOUNTS_PER_TICK});
});
