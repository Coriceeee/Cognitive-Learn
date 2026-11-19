/**
 * CP28 optional server-side withdrawal cleanup.
 * Dedicated Functions codebase, NOT included in default firebase.json.
 * Deploy ONLY after privacy review, Emulator testing and explicit authorization.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { asMillis, cleanupWithdrawnStudentLinks, isProductConsentWithdrawal,
  PAGE_SIZE, verifyWithdrawnLinkCleanup } from './src/consentCleanup.mjs';
import { makeFirestoreCleanupAdapter } from './src/firestoreAdapter.mjs';

initializeApp();
const db = getFirestore();


export const claConsentWithdrawalCleanup = onDocumentWritten({
  document: 'student_consents/{uid}',
  retry: true,
  timeoutSeconds: 540,
  memory: '256MiB',
}, async event => {
  if (process.env.CLA_CONSENT_REVOCATION_ENABLED !== 'true') {
    console.log('CLA privacy cleanup disabled by deployment configuration.');
    return;
  }
  const uid = event.params.uid;
  const before = event.data?.before?.data() ?? null;
  const after = event.data?.after?.data() ?? null;
  if (!isProductConsentWithdrawal(before, after, uid)) return;
  const cutoffMs = asMillis(after?.updatedAt);
  if (cutoffMs === null) throw new Error('CP28_WITHDRAWAL_TIMESTAMP_MISSING');
  try {
    const result = await cleanupWithdrawnStudentLinks({
      uid, cutoffMs, adapter: makeFirestoreCleanupAdapter(db, FieldPath), pageSize: PAGE_SIZE,
    });
    const verification = await verifyWithdrawnLinkCleanup({
      uid, cutoffMs, adapter: makeFirestoreCleanupAdapter(db, FieldPath), pageSize: PAGE_SIZE,
    });
    // A concurrent or deferred stale link must force a retry, never a false
    // completion message. The verified result contains counts only, no PII.
    if (verification.remaining !== 0) throw new Error('CP28_REVOCATION_INCOMPLETE');
    console.log('CLA withdrawal cleanup', {
      status:'verified-at-check-time', deleted:result.deleted,
      examined:result.examined, remaining:verification.remaining,
    });
  } catch (error) {
    console.error('CLA withdrawal cleanup failed (retry pending)', {
      code: error?.code ?? error?.message ?? 'unknown',
    });
    throw error;
  }
});
