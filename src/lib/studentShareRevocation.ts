/**
 * CLA — best-effort cleanup of legacy sharing links owned by the student.
 * Product consent withdrawal MUST NOT wait for this cleanup to succeed.
 * This does not delete historical grades, browser caches or remote backups.
 */
export type ShareRevocationPort = {
  currentUid: () => string | null;
  listOwnedLinks: () => Promise<string[]>;
  deleteSharedReport: (linkId: string) => Promise<void>;
  deleteOwnedLink: (linkId: string) => Promise<void>;
};

export type ShareRevocationResult = {
  revoked: number;
  verifiedEmpty: boolean;
};

function assertSameOwner(uid: string, port: ShareRevocationPort): void {
  if (port.currentUid() !== uid) {
    throw new Error("CLA_SHARE_REVOKE_ACCOUNT_CHANGED");
  }
}

/**
 * Query the *server* in batches of <= 40 (Firestore Rules collection-list cap).
 * After removing each batch, query again, so no offset pagination can miss data.
 * This is intentionally bounded; incomplete cleanup must be surfaced to the UI.
 */
export async function revokeStudentShares(
  uid: string,
  port: ShareRevocationPort,
  maxBatches = 25,
): Promise<ShareRevocationResult> {
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) {
    throw new Error("CLA_SHARE_REVOKE_INVALID_OWNER");
  }
  if (!Number.isInteger(maxBatches) || maxBatches < 1 || maxBatches > 25) {
    throw new Error("CLA_SHARE_REVOKE_INVALID_LIMIT");
  }

  let revoked = 0;
  for (let batch = 0; batch < maxBatches; batch += 1) {
    assertSameOwner(uid, port);
    const linkIds = await port.listOwnedLinks();
    assertSameOwner(uid, port);
    if (!Array.isArray(linkIds) || linkIds.length > 40 || new Set(linkIds).size !== linkIds.length) {
      throw new Error("CLA_SHARE_REVOKE_INVALID_PAGE");
    }
    if (linkIds.length === 0) return { revoked, verifiedEmpty: true };
    for (const linkId of linkIds) {
      if (typeof linkId !== "string" || !linkId.startsWith(`${uid}_`)
        || !/^[A-Za-z0-9_-]{13,257}$/.test(linkId)) {
        throw new Error("CLA_SHARE_REVOKE_FOREIGN_LINK");
      }
      assertSameOwner(uid, port);
      // Firestore candidate Rules allow link removal ONLY after its report is absent.
      await port.deleteSharedReport(linkId);
      assertSameOwner(uid, port);
      await port.deleteOwnedLink(linkId);
      revoked += 1;
    }
  }
  return { revoked, verifiedEmpty: false };
}
