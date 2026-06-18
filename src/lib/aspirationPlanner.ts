import {
  getRiskPriority,
  type AdmissionEligibilityResult,
} from "./admissionRules";

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
  const pedagogyScore = result.program.isPedagogy ? 5 : 0;

  return (
    bestOption.normalizedScore * 0.55 +
    riskScore +
    majorScore +
    verifiedScore +
    pedagogyScore
  );
}

function enforcePedagogyPriority(
  results: AdmissionEligibilityResult[],
  maxAspirations: number,
  warnings: string[]
) {
  const pedagogyItems = results.filter(
    (result) => result.program.isPedagogy && result.valid
  );

  const normalItems = results.filter(
    (result) => !(result.program.isPedagogy && result.valid)
  );

  if (pedagogyItems.length > 0) {
    warnings.push(
      "Ngành Sư phạm được phát hiện trong danh sách đề xuất và đã được ưu tiên trong nhóm NV1–NV5."
    );
  }

  if (pedagogyItems.length > 5) {
    warnings.push(
      "Có nhiều hơn 5 ngành Sư phạm phù hợp, hệ thống chỉ ưu tiên tối đa 5 ngành đầu trong NV1–NV5."
    );
  }

  const topPedagogyItems = pedagogyItems.slice(0, 5);
  const restPedagogyItems = pedagogyItems.slice(5);

  return [...topPedagogyItems, ...normalItems, ...restPedagogyItems].slice(
    0,
    maxAspirations
  );
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

  const safeMaxAspirations = Math.min(Math.max(maxAspirations, 1), 15);

  if (maxAspirations > 15) {
    warnings.push("Số nguyện vọng vượt quá 15, hệ thống tự giới hạn còn 15.");
  }

  const validResults = results
    .filter((result) => result.valid && result.bestOption)
    .sort(
      (a, b) =>
        getPlanningScore(b, targetMajor) - getPlanningScore(a, targetMajor)
    );

  const orderedResults = enforcePedagogyPriority(
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
      isPedagogy: Boolean(result.program.isPedagogy),
      reason: result.explanation,
    };
  });

  if (items.length === 0) {
    warnings.push("Chưa có ngành/trường đủ điều kiện để xếp nguyện vọng.");
  }

  return {
    maxAspirations: safeMaxAspirations,
    items,
    warnings: Array.from(new Set(warnings)),
  };
}