import {
  getRiskPriority,
  type AdmissionEligibilityResult,
} from "./admissionRules";

/** Article 14(3), Circular 06/2026/TT-BGDDT (official Government portal).
 * For the 2026 admissions cycle only; do not silently reuse for future years.
 */
export const ADMISSION_POLICY_2026 = {
  year: 2026,
  maxAspirations: 15,
  teacherTrainingLastPriority: 5,
  document: "06/2026/TT-BGDĐT",
  article: "Khoản 3 Điều 14",
  officialUrl: "https://vanban.chinhphu.vn/?classid=1&docid=217071&pageid=27160",
} as const;

export type AspirationItem = {
  order: number;
  programId: string;
  universityName: string;
  majorName: string;
  majorCode: string;
  riskLevel: AdmissionEligibilityResult["riskLevel"];
  bestMethodLabel: string;
  score: number;
  normalizedScore: number;
  isPedagogy: boolean;
  reason: string;
};

export type AspirationPlan = {
  maxAspirations: number;
  items: AspirationItem[];
  warnings: string[];
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function getMajorMatchScore(majorName: string, targetMajor?: string) {
  if (!targetMajor) return 0;

  const normalizedMajor = normalizeText(majorName);
  const normalizedTarget = normalizeText(targetMajor);

  if (!normalizedTarget) return 0;
  if (normalizedMajor.includes(normalizedTarget)) return 18;

  const targetWords = normalizedTarget.split(/\s+/).filter(Boolean);
  const matchedWords = targetWords.filter((word) =>
    normalizedMajor.includes(word)
  );

  return Math.min(14, matchedWords.length * 4);
}

function getPlanningScore(
  result: AdmissionEligibilityResult,
  targetMajor?: string
) {
  const bestOption = result.bestOption;

  if (!bestOption || result.riskLevel === "INVALID") return -1;

  const riskScore = getRiskPriority(result.riskLevel) * 12;
  const majorScore = getMajorMatchScore(result.program.majorName, targetMajor);
  const verifiedScore = result.program.verified ? 8 : 0;

  return (
    bestOption.normalizedScore * 0.55 +
    riskScore +
    majorScore +
    verifiedScore
  );
}

/**
 * Conservative identification of teacher-training programmes.
 * Do NOT infer teacher-training from a university's name. The official
 * programme category/code still needs checking when importing source data.
 */
export function isTeacherTrainingProgram(
  program: AdmissionEligibilityResult["program"]
): boolean {
  if (program.isPedagogy === true) return true;
  const code = (program.majorCode || "").replace(/[.\s-]/g, "");
  if (/^71402\d{2}$/.test(code) || code === "51140201") return true;

  const name = normalizeText(program.majorName || "");
  return /(?:^|\s)su pham(?:\s|$)/.test(name) ||
    /^giao duc (?:mam non|tieu hoc|dac biet|the chat|chinh tri|cong dan|quoc phong(?: va an ninh)?)(?:\s|$)/.test(name);
}

/**
 * Suggest, never silently register/reorder a student's actual preferences.
 * Extra teacher-training choices MUST be omitted rather than placed at NV6+.
 */
function enforceTeacherTrainingSlots(
  results: AdmissionEligibilityResult[],
  maxAspirations: number,
  warnings: string[]
): AdmissionEligibilityResult[] {
  const teacher = results.filter((r) => isTeacherTrainingProgram(r.program));
  const other = results.filter((r) => !isTeacherTrainingProgram(r.program));
  const teacherLimit = Math.min(maxAspirations, ADMISSION_POLICY_2026.teacherTrainingLastPriority);
  const selectedTeacher = teacher.slice(0, teacherLimit);
  const excludedTeacher = teacher.length - selectedTeacher.length;

  if (teacher.length) {
    warnings.push(
      "Theo Thông tư 06/2026/TT-BGDĐT, chương trình đào tạo giáo viên chỉ được xét tuyển ở NV1–NV5. Thứ tự này là đề xuất tự động, không thay thế lựa chọn ưu tiên của học sinh."
    );
  }
  if (excludedTeacher) {
    warnings.push(
      `Đã loại ${excludedTeacher} lựa chọn đào tạo giáo viên khỏi danh sách đề xuất vì không còn vị trí hợp lệ trong NV1–NV5; không chuyển chúng xuống NV6 trở đi.`
    );
  }

  return [...selectedTeacher, ...other].slice(0, maxAspirations);
}

export function buildAspirationPlan({
  results,
  targetMajor,
  maxAspirations = 15,
}: {
  results: AdmissionEligibilityResult[];
  targetMajor?: string;
  maxAspirations?: number;
}): AspirationPlan {
  const warnings: string[] = [];

  const safeMaxAspirations = Number.isFinite(maxAspirations)
    ? Math.min(Math.max(Math.trunc(maxAspirations), 1), ADMISSION_POLICY_2026.maxAspirations)
    : ADMISSION_POLICY_2026.maxAspirations;

  if (maxAspirations > ADMISSION_POLICY_2026.maxAspirations) {
    warnings.push("Quy chế 2026 cho phép tối đa 15 nguyện vọng; CLA chỉ đề xuất tối đa 15.");
  }

  const historicalCount = results.filter(
    (result) => result.valid && result.program.sourceYear !== ADMISSION_POLICY_2026.year
  ).length;
  if (historicalCount > 0) {
    warnings.push(
      `Có ${historicalCount} lựa chọn thuộc năm khác 2026; không sử dụng dữ liệu lịch sử để lập danh sách nguyện vọng cho kỳ 2026.`
    );
  }

  const validResults = results
    .filter((result) =>
      result.valid &&
      result.bestOption &&
      result.riskLevel !== "INVALID" &&
      result.program.sourceYear === ADMISSION_POLICY_2026.year
    )
    .sort(
      (a, b) =>
        getPlanningScore(b, targetMajor) - getPlanningScore(a, targetMajor)
    );

  const orderedResults = enforceTeacherTrainingSlots(
    validResults,
    safeMaxAspirations,
    warnings
  );

  const items: AspirationItem[] = orderedResults.map((result, index) => {
    const bestOption = result.bestOption;

    return {
      order: index + 1,
      programId: result.program.id,
      universityName: result.program.universityName,
      majorName: result.program.majorName,
      majorCode: result.program.majorCode,
      riskLevel: result.riskLevel,
      bestMethodLabel: bestOption?.label || "Chưa rõ",
      score: bestOption?.score || 0,
      normalizedScore: bestOption?.normalizedScore || 0,
      isPedagogy: isTeacherTrainingProgram(result.program),
      reason: result.explanation,
    };
  });

  if (items.length === 0) {
    warnings.push("Chưa có ngành/trường đủ điều kiện và dữ liệu năm 2026 để đề xuất nguyện vọng.");
  }

  return {
    maxAspirations: safeMaxAspirations,
    items,
    warnings: Array.from(new Set(warnings)),
  };
}