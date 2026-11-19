/** CP30: read-side session and server verification helpers (no Firebase imports). */
export type SnapshotMetadata = Readonly<{ fromCache: boolean; hasPendingWrites: boolean }>;

/** SDK metadata must explicitly confirm a server snapshot with no pending local writes. */
export function isServerConfirmedSnapshot(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  const value = metadata as Partial<SnapshotMetadata>;
  return value.fromCache === false && value.hasPendingWrites === false;
}

/** Fail closed on cross-owner records without breaking legacy documents with no userId. */
export function isMatchingAccountRecord(raw: unknown, uid: string): boolean {
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid) || !raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const record = raw as Record<string, unknown>;
  if (record.userId !== undefined && record.userId !== uid) return false;
  if (record.dataScope !== undefined && record.dataScope !== "student" && record.dataScope !== "demo") return false;
  return true;
}

export function isCurrentAccountInspection(
  expectedUid: string, actualUid: string | null | undefined,
  generation: number, currentGeneration: number,
): boolean {
  return expectedUid.length > 0 && expectedUid === actualUid && generation === currentGeneration;
}
