/**
 * CP29 C1/C5 — fail-closed, framework-free contract for the TWO Seed documents.
 * This is a client-side concurrency guard, NOT a substitute for Firestore Rules.
 * Missing/unversioned legacy records require an explicit migration, never a blind overwrite.
 */
import { findForeignTranscriptSubject, parseAcademicIdentity, sameAcademicIdentity, type AcademicIdentity } from './academicIdentity.ts';

export const SEED_SCHEMA_VERSION = 1;
export type SeedScope = 'student' | 'demo';
export type SeedRecord = Readonly<{ exists: boolean; data: unknown }>;
export type SeedBaseline = Readonly<{ profileVersion: string; transcriptVersion: string }>;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

/** Firestore Timestamp: exact nanosecond precision; do not use local time or Date.now(). */
export function documentVersion(record: SeedRecord): string | null {
  if (!record.exists) return 'absent';
  const data = object(record.data);
  const stamp = object(data?.updatedAt);
  if (!stamp || typeof stamp.seconds !== 'number' || typeof stamp.nanoseconds !== 'number'
    || !Number.isSafeInteger(stamp.seconds) || !Number.isInteger(stamp.nanoseconds)
    || stamp.nanoseconds < 0 || stamp.nanoseconds >= 1_000_000_000) return null;
  return `present:${stamp.seconds}:${stamp.nanoseconds}`;
}

export function captureSeedBaseline(profile: SeedRecord, transcript: SeedRecord): SeedBaseline | null {
  const profileVersion = documentVersion(profile);
  const transcriptVersion = documentVersion(transcript);
  if (profileVersion === null || transcriptVersion === null) return null;
  return { profileVersion, transcriptVersion };
}

function validExistingRecord(record: SeedRecord, uid: string, scope: SeedScope): boolean {
  if (!record.exists) return true;
  const data = object(record.data);
  return !!data && data.userId === uid && data.schemaVersion === SEED_SCHEMA_VERSION
    && data.dataScope === scope && parseAcademicIdentity(data.curriculum) !== null;
}

/**
 * Runs again INSIDE Firestore transaction after reading all current documents.
 * Reject both concurrent updates and a previously missing document created elsewhere.
 * Identity checks on BOTH documents prevent partial/legacy corruption or an account mix-up.
 */
export function verifySeedTransaction(
  uid: string, scope: SeedScope, baseline: SeedBaseline,
  previousProfile: SeedRecord, previousTranscript: SeedRecord,
  requestedIdentity: AcademicIdentity,
): string | null {
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) return 'Mã người dùng không hợp lệ.';
  if (documentVersion(previousProfile) !== baseline.profileVersion
    || documentVersion(previousTranscript) !== baseline.transcriptVersion) {
    return 'Hồ sơ hoặc bảng điểm vừa được cập nhật từ phiên khác. Hãy tải lại trước khi lưu để tránh ghi đè.';
  }
  if (!validExistingRecord(previousProfile, uid, scope) || !validExistingRecord(previousTranscript, uid, scope)) {
    return 'Tài liệu cũ có sai lệch schema, UID hoặc phạm vi dữ liệu. Cần đối soát trước khi lưu.';
  }
  const profileData = object(previousProfile.data);
  const transcriptData = object(previousTranscript.data);
  const profileIdentity = previousProfile.exists ? parseAcademicIdentity(profileData?.curriculum) : null;
  const transcriptIdentity = previousTranscript.exists ? parseAcademicIdentity(transcriptData?.curriculum) : null;
  if (profileIdentity && !sameAcademicIdentity(profileIdentity, requestedIdentity))
    return 'Tổ hợp môn của hồ sơ đã được khóa. Không thể thay đổi từ trình duyệt.';
  if (transcriptIdentity && !sameAcademicIdentity(transcriptIdentity, requestedIdentity))
    return 'Tổ hợp môn của bảng điểm đã được khóa. Không thể thay đổi từ trình duyệt.';
  if (profileIdentity && transcriptIdentity && !sameAcademicIdentity(profileIdentity, transcriptIdentity))
    return 'Hồ sơ và bảng điểm lưu trên máy chủ không nhất quán.';
  if (previousTranscript.exists && findForeignTranscriptSubject(transcriptData?.transcript, requestedIdentity))
    return 'Bảng điểm cũ có môn hoặc học kỳ không hợp lệ; cần đối soát trước khi lưu.';
  return null;
}
