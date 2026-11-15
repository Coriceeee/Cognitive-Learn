import type {
  AdmissionMethod,
  CombinationScoreResult,
  ExternalExamScore,
  ExternalScoreResult,
  ScoreConversionReport,
  SubjectCode,
  SubjectScoreMap,
} from "./admissionTypes";
import {
  admissionCombinations,
  getAdmissionCombination,
  getAdmissionMethodRule,
} from "./examMethodRules";

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round2(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/**
 * A valid observed subject mark is a number in [0,10].
 * Missing and malformed marks stay absent; 0 is a valid observed mark.
 * Commas in student-entered decimal strings are accepted.
 */
export function parseSubjectScore(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 && value <= 10 ? value : undefined;
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!/^(?:\d{1,2})(?:[.,]\d+)?$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10 ? parsed : undefined;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeScore(rawScore: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return clamp(round2((rawScore / maxScore) * 100));
}

function hasSubjectScore(
  subjectScores: SubjectScoreMap,
  subject: SubjectCode
) {
  return parseSubjectScore(subjectScores[subject]) !== undefined;
}

function getSubjectScore(
  subjectScores: SubjectScoreMap,
  subject: SubjectCode
) {
  return parseSubjectScore(subjectScores[subject]) ?? 0;
}

export function calculateCombinationScore(
  subjectScores: SubjectScoreMap,
  combinationCode: string,
  priorityScore = 0
): CombinationScoreResult {
  const combination = getAdmissionCombination(combinationCode);
  const warnings: string[] = [];

  if (!combination) {
    return {
      combinationCode,
      combinationLabel: combinationCode,
      subjects: [],
      rawScore: 0,
      convertedScore: 0,
      normalizedScore: 0,
      missingSubjects: [],
      warnings: [`Chưa hỗ trợ tổ hợp ${combinationCode}.`],
    };
  }

  const missingSubjects = combination.subjects.filter(
    (subject) => !hasSubjectScore(subjectScores, subject)
  );

  if (missingSubjects.length > 0) {
    warnings.push("Thiếu điểm môn trong tổ hợp, kết quả chỉ mang tính tạm thời.");
  }

  const rawScore = combination.subjects.reduce(
    (sum, subject) => sum + getSubjectScore(subjectScores, subject),
    0
  );

  const convertedScore = clamp(round2(rawScore + priorityScore), 0, 30);
  const normalizedScore = normalizeScore(convertedScore, 30);

  return {
    combinationCode: combination.code,
    combinationLabel: combination.label,
    subjects: combination.subjects,
    rawScore: round2(rawScore),
    convertedScore,
    normalizedScore,
    missingSubjects,
    warnings,
  };
}

export function convertExternalExamScore(
  examScore: ExternalExamScore
): ExternalScoreResult {
  const rule = getAdmissionMethodRule(examScore.method);
  const maxScore = examScore.maxScore || rule.rawScaleMax;
  const rawScore = clamp(toNumber(examScore.rawScore), 0, maxScore);
  const normalizedScore = normalizeScore(rawScore, maxScore);

  const warnings: string[] = [];

  let convertedScore: number | null = null;

  if (rule.canConvertToScale30 && !rule.requiresOfficialRule) {
    convertedScore = round2((normalizedScore / 100) * 30);
  }

  if (rule.requiresOfficialRule) {
    warnings.push(
      `${rule.label} cần bảng quy đổi chính thức theo trường/ngành/năm. Hệ thống chỉ chuẩn hóa nội bộ 0–100.`
    );
  }

  if (!examScore.verified) {
    warnings.push("Điểm hoặc quy tắc chưa được xác minh nguồn chính thức.");
  }

  return {
    method: examScore.method,
    methodLabel: rule.label,
    rawScore,
    maxScore,
    normalizedScore,
    convertedScore,
    sourceYear: examScore.sourceYear,
    verified: Boolean(examScore.verified),
    warnings,
  };
}

function buildBestOption(
  combinationOptions: CombinationScoreResult[],
  _externalOptions: ExternalScoreResult[]
): ScoreConversionReport["bestOption"] {
  // Do not rank incomplete combinations (partial sums) or compare unrelated
  // external-exam scales without institution-specific conversion rules.
  const completeCombinations = combinationOptions
    .filter((option) => option.missingSubjects.length === 0)
    .map((option) => ({
      label: option.combinationCode,
      method: "COMBINATION" as const,
      score: option.convertedScore,
      normalizedScore: option.normalizedScore,
    }));

  return completeCombinations.sort(
    (a, b) => b.normalizedScore - a.normalizedScore
  )[0] ?? null;
}

export function buildScoreConversionReport({
  subjectScores,
  combinationCodes = admissionCombinations.map((item) => item.code),
  externalScores = [],
  priorityScore = 0,
}: {
  subjectScores: SubjectScoreMap;
  combinationCodes?: string[];
  externalScores?: ExternalExamScore[];
  priorityScore?: number;
}): ScoreConversionReport {
  const combinationOptions = combinationCodes.map((combinationCode) =>
    calculateCombinationScore(subjectScores, combinationCode, priorityScore)
  );

  const externalOptions = externalScores.map(convertExternalExamScore);

  const warnings = [
    ...combinationOptions.flatMap((option) => option.warnings),
    ...externalOptions.flatMap((option) => option.warnings),
  ];

  return {
    combinationOptions,
    externalOptions,
    bestOption: buildBestOption(combinationOptions, externalOptions),
    warnings: Array.from(new Set(warnings)),
  };
}

export function getDefaultCombinationCodes() {
  return admissionCombinations.map((combination) => combination.code);
}

export function isAdmissionMethod(value: string): value is AdmissionMethod {
  return [
    "THPT",
    "HOC_BA",
    "HSA",
    "DGNL_HCM",
    "TSA",
    "VSAT",
    "V_ACT",
    "SAT",
    "ACT",
    "IELTS",
    "TOEFL",
    "VSTEP",
  ].includes(value);
}