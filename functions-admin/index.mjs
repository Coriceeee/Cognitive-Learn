/**
 * CP29 OPTIONAL account administration. Not referenced by default firebase.json.
 * Fail closed unless enabled + operator UID allowlisted + custom claim + MFA +
 * recent sign-in + authoritative Admin profile, with revocation-checked ID token.
 * No Admin creation, no mass listing, no self-management, no Auth deletion.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AdminAccountError, performAdminAccountOperation } from './src/accountPolicy.mjs';

initializeApp();
const db = getFirestore();

export const claAdminAccountOperation = onCall({
  region:'asia-southeast1', timeoutSeconds:30, memory:'256MiB', maxInstances:2,
}, async request => {
  try {
    if (process.env.CLA_ADMIN_ACCOUNTS_ENABLED !== 'true') {
      throw new AdminAccountError('FEATURE_DISABLED');
    }
    if (!request.auth?.uid) throw new AdminAccountError('UNAUTHENTICATED');
    const raw = request.rawRequest.headers.authorization;
    if (typeof raw !== 'string' || !/^Bearer [A-Za-z0-9._-]+$/.test(raw)) {
      throw new AdminAccountError('UNAUTHENTICATED');
    }
    // Callable's authentication is not a revocation check. Explicitly recheck it.
    let claims;
    try { claims = await getAuth().verifyIdToken(raw.slice('Bearer '.length), true); }
    catch { throw new AdminAccountError('UNAUTHENTICATED'); }
    if (claims.uid !== request.auth.uid) throw new AdminAccountError('UNAUTHENTICATED');
    const allowlist = (process.env.CLA_ADMIN_OPERATOR_UIDS ?? '').split(',').map(v => v.trim()).filter(Boolean);
    return await performAdminAccountOperation({
      db, claims, input:request.data, enabled:process.env.CLA_ADMIN_ACCOUNTS_ENABLED,
      allowlist, nowSeconds:Math.floor(Date.now()/1000), timestamp:FieldValue.serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof AdminAccountError) {
      const unauth = error.code === 'UNAUTHENTICATED';
      throw new HttpsError(unauth ? 'unauthenticated' : 'permission-denied', error.code);
    }
    // No raw account or Firebase data in logs.
    console.error('CLA admin account operation failed', {type:'internal-error'});
    throw new HttpsError('internal', 'ACCOUNT_OPERATION_FAILED');
  }
});
