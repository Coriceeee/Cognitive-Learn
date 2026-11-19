/**
 * CP28 — Consent withdrawal, optional privileged cleanup.
 * Pure, dependency-injected policy. Does NOT grant read permissions or deploy itself.
 * Trigger delivery is at least once. The returned status is an audit aid, not proof
 * that all offline copies or external recipients have deleted old content.
 */
export const PAGE_SIZE = 80;
export const MAX_PAGES = 25;
const ID = /^[A-Za-z0-9_-]{6,128}$/;

export function isProductConsentWithdrawal(before, after, uid) {
  return ID.test(uid)
    && before?.userId === uid && before?.schemaVersion === 1
    && before?.noticeVersion === 'cla-student-privacy-v1'
    && before?.productAccepted === true && before?.researchConsent === false
    && after?.userId === uid && after?.schemaVersion === 1
    && after?.noticeVersion === 'cla-student-privacy-v1'
    && after?.productAccepted === false && after?.researchConsent === false;
}

export function asMillis(timestamp) {
  if (timestamp && typeof timestamp.toMillis === 'function') {
    const value = timestamp.toMillis();
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  }
  return null;
}

function validOwnedLink(link, uid) {
  return !!link && typeof link.id === 'string' && !!link.data
    && link.data.studentId === uid
    && typeof link.data.viewerId === 'string' && ID.test(link.data.viewerId)
    && link.id === `${uid}_${link.data.viewerId}`;
}

/**
 * Adapter.scan returns a stable, document-ID-ordered page and opaque next cursor;
 * deletePair atomically and conditionally deletes the exact link/report snapshots.
 * On concurrent edits it must THROW, letting the trigger retry. No stale mutation.
 */
export async function cleanupWithdrawnStudentLinks({
  uid, cutoffMs, adapter, pageSize = PAGE_SIZE, maxPages = MAX_PAGES,
}) {
  if (typeof uid !== 'string' || !ID.test(uid)) throw new Error('CP28_INVALID_UID');
  if (!Number.isSafeInteger(cutoffMs) || cutoffMs < 0) throw new Error('CP28_INVALID_CUTOFF');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > PAGE_SIZE
    || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > MAX_PAGES) {
    throw new Error('CP28_INVALID_BOUNDS');
  }
  if (!adapter || typeof adapter.scan !== 'function' || typeof adapter.deletePair !== 'function') {
    throw new Error('CP28_INVALID_ADAPTER');
  }
  let cursor = null;
  let deleted = 0;
  let examined = 0;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const page = await adapter.scan(uid, cursor, pageSize);
    if (!page || !Array.isArray(page.links) || page.links.length > pageSize) {
      throw new Error('CP28_INVALID_PAGE');
    }
    if (!page.links.length) return { deleted, examined, complete: true };
    if (page.links.length === pageSize && (page.nextCursor === null || page.nextCursor === undefined)) {
      throw new Error('CP28_INVALID_CURSOR');
    }
    for (const link of page.links) {
      if (!validOwnedLink(link, uid)) throw new Error('CP28_FOREIGN_OR_MALFORMED_LINK');
      examined += 1;
      // Old, timestamp-less legacy documents must be cleaned conservatively.
      // Verified NEW grants made after a subsequent re-consent are preserved.
      const createdAtMs = asMillis(link.data.createdAt);
      if (createdAtMs !== null && createdAtMs > cutoffMs) continue;
      await adapter.deletePair(link);
      deleted += 1;
    }
    if (page.links.length < pageSize) return { deleted, examined, complete: true };
    if (page.nextCursor === cursor) throw new Error('CP28_CURSOR_NOT_ADVANCING');
    cursor = page.nextCursor;
  }
  throw new Error('CP28_PAGE_LIMIT_RETRY_REQUIRED');
}


/**
 * Independent post-cleanup verification. It never mutates data and never
 * returns link IDs or personal details. This is a bounded snapshot check,
 * not a claim about offline exports, backup copies or later writes.
 *
 * If the audit cannot traverse the entire result set it fails closed instead
 * of reporting `remaining: 0` based on an incomplete page.
 */
export async function verifyWithdrawnLinkCleanup({
  uid, cutoffMs, adapter, pageSize = PAGE_SIZE, maxPages = MAX_PAGES,
}) {
  if (typeof uid !== 'string' || !ID.test(uid)) throw new Error('CP28_INVALID_UID');
  if (!Number.isSafeInteger(cutoffMs) || cutoffMs < 0) throw new Error('CP28_INVALID_CUTOFF');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > PAGE_SIZE
    || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > MAX_PAGES) {
    throw new Error('CP28_INVALID_BOUNDS');
  }
  if (!adapter || typeof adapter.scan !== 'function') throw new Error('CP28_INVALID_ADAPTER');
  let cursor = null;
  let remaining = 0;
  let examined = 0;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const page = await adapter.scan(uid, cursor, pageSize);
    if (!page || !Array.isArray(page.links) || page.links.length > pageSize) {
      throw new Error('CP28_INVALID_PAGE');
    }
    for (const link of page.links) {
      if (!validOwnedLink(link, uid)) throw new Error('CP28_FOREIGN_OR_MALFORMED_LINK');
      examined += 1;
      const createdAtMs = asMillis(link.data.createdAt);
      if (createdAtMs === null || createdAtMs <= cutoffMs) remaining += 1;
    }
    if (page.links.length < pageSize) return {remaining, examined, complete: true};
    if (page.nextCursor === null || page.nextCursor === undefined || page.nextCursor === cursor) {
      throw new Error('CP28_INVALID_CURSOR');
    }
    cursor = page.nextCursor;
  }
  throw new Error('CP28_VERIFICATION_PAGE_LIMIT');
}
