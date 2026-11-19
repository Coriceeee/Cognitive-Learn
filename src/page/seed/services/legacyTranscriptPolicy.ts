/**
 * CP30 Batch 4: validate a legacy learning_profiles/{uid}.transcript before rendering.
 * Read-only and conservative: incomplete grades are accepted; unknown subjects,
 * malformed academic identity and invalid observed scores are quarantined.
 * This is NOT a data migration or school certification.
 */
import { parseEnteredScore } from "../../../engines/academic-semester-engine";
import { findForeignTranscriptSubject, parseAcademicIdentity } from "./academicIdentity";
import { isMatchingAccountRecord } from "./realtimeReadPolicy";

export type LegacyTranscriptAssessment = Readonly<{
  readable: boolean;
  reason: string;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function validObservedScore(value: unknown): boolean {
  // Missing is not a score; string/number zero is a real, valid observation.
  if (value === null || value === undefined || value === "") return true;
  if (typeof value === "string") {
    if (value.trim() === "") return true;
    return parseEnteredScore(value) !== null;
  }
  return typeof value === "number" && Number.isFinite(value)
    && parseEnteredScore(String(value)) !== null;
}

export function assessLegacyTranscript(value: unknown, uid: string): LegacyTranscriptAssessment {
  const deny = (reason: string): LegacyTranscriptAssessment => ({ readable: false, reason });
  if (!isMatchingAccountRecord(value, uid)) {
    return deny("Bản ghi cũ không đúng tài khoản hoặc phạm vi dữ liệu.");
  }
  const doc = value as Record<string, unknown>;
  const identity = parseAcademicIdentity(doc.curriculum);
  if (!identity) {
    return deny("Bản ghi cũ thiếu tổ hợp 9 môn đã xác nhận. Cần đối soát, không tự suy đoán môn học.");
  }
  if (!isRecord(doc.transcript)) {
    return deny("Bảng điểm cũ không có cấu trúc hợp lệ.");
  }
  const foreign = findForeignTranscriptSubject(doc.transcript, identity);
  if (foreign !== null) {
    return deny("Bảng điểm cũ có môn hoặc học kỳ ngoài tổ hợp được khóa.");
  }
  for (const terms of Object.values(doc.transcript)) {
    if (!isRecord(terms)) return deny("Cấu trúc học kỳ cũ không hợp lệ.");
    for (const rows of Object.values(terms)) {
      if (!isRecord(rows)) return deny("Cấu trúc môn học cũ không hợp lệ.");
      for (const row of Object.values(rows)) {
        if (!isRecord(row) || !Array.isArray(row.regular)
          || row.regular.length > 5
          || row.regular.some(score => !validObservedScore(score))
          || !validObservedScore(row.midterm)
          || !validObservedScore(row.final)) {
          return deny("Bản ghi cũ có điểm không hợp lệ hoặc thiếu cấu trúc điểm; không hiển thị GPA suy đoán.");
        }
      }
    }
  }
  return { readable: true, reason: "Đã kiểm tra cấu trúc bản ghi cũ; cần đối soát và chuẩn hóa trước khi dùng chính thức." };
}
