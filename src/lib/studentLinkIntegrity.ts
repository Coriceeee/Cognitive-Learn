/** CP29 F4 — fail-closed presentation contract for student share-link metadata.
 * Firestore Rules (and the server consent cleanup) remain the authorization source.
 */
export type LinkViewMode = 'student' | 'teacher' | 'parent';
export type ValidStudentLink = Readonly<{
  id: string;
  studentId: string;
  viewerId: string;
  studentName: string;
  viewerRole: 'teacher' | 'parent';
  createdAt?: unknown;
}>;

const validUid = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{6,128}$/.test(value);

export function validLinkForAccount(
  id: string, raw: unknown, uid: string, mode: LinkViewMode,
): ValidStudentLink | null {
  if (!validUid(uid) || !raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const {studentId, viewerId, viewerRole, studentName, createdAt} = record;
  const timestamp = createdAt && typeof createdAt === 'object' && !Array.isArray(createdAt)
    ? createdAt as Record<string, unknown> : null;
  if (!validUid(studentId) || !validUid(viewerId) || studentId === viewerId
    || (viewerRole !== 'teacher' && viewerRole !== 'parent')
    || typeof studentName !== 'string' || studentName.length > 80
    || !timestamp || typeof timestamp.seconds !== 'number' || typeof timestamp.nanoseconds !== 'number'
    || !Number.isSafeInteger(timestamp.seconds) || !Number.isInteger(timestamp.nanoseconds)
    || timestamp.nanoseconds < 0 || timestamp.nanoseconds >= 1_000_000_000
    || id !== `${studentId}_${viewerId}`) return null;
  if (mode !== 'student' || studentId !== uid) return null;
  return { id, studentId, viewerId, viewerRole: viewerRole as 'teacher' | 'parent', studentName,
    createdAt: record.createdAt };
}

export function verifiedAccountRole(account: unknown, expectedRole: LinkViewMode): boolean {
  if (!account || typeof account !== 'object' || Array.isArray(account)) return false;
  const data = account as Record<string, unknown>;
  return expectedRole === 'student' && data.active === true && data.role === expectedRole;
}
