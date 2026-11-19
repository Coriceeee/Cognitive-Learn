/**
 * CP30 Batch 3 — read-only, cross-document academic GPA reconciliation.
 * The result is an engineering consistency check, NOT school certification.
 * Never infer missing/invalid grades as observed zero; never rewrite user data.
 */
import { calculateCompletedYearsAverage, parseEnteredScore } from "../../../engines/academic-semester-engine";
import { buildTranscriptView, GRADES, SEMESTERS } from "./transcriptData";
import { findForeignTranscriptSubject, parseAcademicIdentity, sameAcademicIdentity } from "./academicIdentity";

const CALCULATION_VERSION = "cla-academic-semester-v2-nine-subjects";

type GPAValue = number | null;
export type GpaIntegrityStatus = "VERIFIED" | "MISMATCH" | "INCOMPLETE" | "LEGACY";
export type GpaIntegrityResult = Readonly<{
  status: GpaIntegrityStatus;
  reason: string;
  derived: { grade10: GPAValue; grade11: GPAValue; grade12: GPAValue; overall: GPAValue } | null;
}>;

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue : null;
}
function equalsNumberOrNull(saved: unknown, derived: GPAValue): boolean {
  // Strict comparison is intentional: undefined, NaN, "0", and 0 are not interchangeable.
  return derived === null ? saved === null
    : typeof saved === "number" && Number.isFinite(saved) && Math.abs(saved - derived) < 1e-9;
}
function isValidRowData(value: unknown): boolean {
  const row = record(value);
  if (!row || !Array.isArray(row.regular) || row.regular.length > 5
    || !["string", "number"].includes(typeof row.midterm)
    || !["string", "number"].includes(typeof row.final)) return false;
  const all = [...row.regular, row.midterm, row.final];
  return all.every(value => {
    if (typeof value !== "string" && typeof value !== "number") return false;
    if (typeof value === "string" && value.trim() === "") return true;
    return parseEnteredScore(String(value)) !== null;
  });
}
function hasValidTranscriptRows(value: unknown): boolean {
  const transcript = record(value);
  if (!transcript) return false;
  for (const [grade, terms] of Object.entries(transcript)) {
    if (!GRADES.some(item => item.key === grade)) return false;
    const termMap = record(terms);
    if (!termMap) return false;
    for (const [semester, subjects] of Object.entries(termMap)) {
      if (!SEMESTERS.some(item => item.key === semester)) return false;
      const subjectMap = record(subjects);
      if (!subjectMap || Object.values(subjectMap).some(row => !isValidRowData(row))) return false;
    }
  }
  return true;
}
function matchingSummary(savedValue: unknown, expected: RecordValue): boolean {
  const saved = record(savedValue);
  if (!saved || saved.calculationVersion !== CALCULATION_VERSION) return false;
  for (const key of ["grade10", "grade11", "grade12", "overall"]) {
    if (!Object.prototype.hasOwnProperty.call(saved, key) || !equalsNumberOrNull(saved[key], expected[key] as GPAValue)) return false;
  }
  const storedCoverage = record(saved.coverage);
  const expectedCoverage = record(expected.coverage);
  if (!storedCoverage || !expectedCoverage) return false;
  for (const { key: grade } of GRADES) {
    const actualYear = record(storedCoverage[grade]);
    const expectedYear = record(expectedCoverage[grade]);
    if (!actualYear || !expectedYear) return false;
    for (const { key: semester } of SEMESTERS) {
      const actualTerm = record(actualYear[semester]);
      const expectedTerm = record(expectedYear[semester]);
      if (!actualTerm || !expectedTerm) return false;
      for (const key of ["status", "completedSubjects", "observedSubjects", "expectedSubjects"]) {
        if (actualTerm[key] !== expectedTerm[key]) return false;
      }
      for (const key of ["gpa", "provisionalAverage"]) {
        if (!equalsNumberOrNull(actualTerm[key], expectedTerm[key] as GPAValue)) return false;
      }
    }
  }
  return true;
}
function fromTranscript(transcript: RecordValue) {
  const view = buildTranscriptView(transcript);
  const overall = calculateCompletedYearsAverage(GRADES.map(grade => view.yearly[grade.key]));
  const coverage: RecordValue = {};
  for (const { key: grade } of GRADES) {
    const terms: RecordValue = {};
    for (const { key: semester } of SEMESTERS) {
      terms[semester] = view.terms.find(term => term.grade === grade && term.semester === semester)!.summary;
    }
    coverage[grade] = terms;
  }
  return {
    grade10: view.yearly.grade10,
    grade11: view.yearly.grade11,
    grade12: view.yearly.grade12,
    overall,
    calculationVersion: CALCULATION_VERSION,
    coverage,
  };
}
/** Requires two already server-confirmed document payloads from the same auth session. */
export function auditAcademicGpa(
  uid: string, profileValue: unknown, transcriptValue: unknown,
): GpaIntegrityResult {
  const fail = (status: GpaIntegrityStatus, reason: string): GpaIntegrityResult => ({ status, reason, derived: null });
  if (!uid || uid.includes("/") || uid.length > 128) return fail("MISMATCH", "UID không hợp lệ.");
  const profile = record(profileValue);
  const transcript = record(transcriptValue);
  if (!profile || !transcript) return fail("INCOMPLETE", "Chưa có đủ hai tài liệu hồ sơ và bảng điểm trên máy chủ.");
  if (profile.schemaVersion !== 1 || transcript.schemaVersion !== 1
    || profile.userId !== uid || transcript.userId !== uid
    || !["student", "demo"].includes(String(profile.dataScope))
    || profile.dataScope !== transcript.dataScope) {
    return fail("MISMATCH", "Schema, tài khoản sở hữu hoặc phạm vi dữ liệu không nhất quán.");
  }
  const profileIdentity = parseAcademicIdentity(profile.curriculum);
  const transcriptIdentity = parseAcademicIdentity(transcript.curriculum);
  if (!profileIdentity || !transcriptIdentity || !sameAcademicIdentity(profileIdentity, transcriptIdentity)) {
    return fail("MISMATCH", "Tổ hợp môn học không khớp giữa hai tài liệu.");
  }
  const invalidSubject = findForeignTranscriptSubject(transcript.transcript, transcriptIdentity);
  if (invalidSubject || !hasValidTranscriptRows(transcript.transcript)) {
    return fail("MISMATCH", "Bảng điểm có học kỳ, môn hoặc số điểm không hợp lệ.");
  }
  if (profile.gpaSummary === undefined || transcript.gpaSummary === undefined) {
    return fail("LEGACY", "Thiếu gpaSummary; cần đối soát dữ liệu cũ, không tự xác nhận.");
  }
  const derived = fromTranscript(transcript);
  if (!matchingSummary(profile.gpaSummary, derived) || !matchingSummary(transcript.gpaSummary, derived)) {
    return { status: "MISMATCH", reason: "GPA hoặc độ bao phủ khác điểm gốc đã lưu; không dùng GPA này để kết luận.",
      derived: {grade10:derived.grade10,grade11:derived.grade11,grade12:derived.grade12,overall:derived.overall} };
  }
  return { status: "VERIFIED", reason: "Hai tài liệu khớp với GPA tính lại từ điểm đã nhập (không phải xác nhận của nhà trường).",
    derived: {grade10:derived.grade10,grade11:derived.grade11,grade12:derived.grade12,overall:derived.overall} };
}
