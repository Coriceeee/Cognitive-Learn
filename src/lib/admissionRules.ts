import type {
  AdmissionMethod,
  CombinationScoreResult,
  ExternalScoreResult,
  ScoreConversionReport,
} from "./admissionTypes";

export type AdmissionRiskLevel = "SAFE" | "TARGET" | "REACH" | "INVALID";

export type AdmissionProgramRule = {
  id: string;
  universityName: string;
  majorName: string;
  majorCode: string;
  combinations: string[];
  methods: AdmissionMethod[];
  benchmarkScore?: number;
  minNormalizedScore?: number;
  /** Benchmark provenance is distinct from program verification. */
  benchmarkVerified?: boolean;
  benchmarkYear?: number;
  benchmarkMethod?: AdmissionMethod;
  sourceYear: number;
  verified: boolean;
  isPedagogy?: boolean;
  tuitionLabel?: string;
  scholarshipLabel?: string;
};

export type AdmissionOptionResult = {
  label: string;
  method: AdmissionMethod | "COMBINATION";
  score: number;
  normalizedScore: number;
  verified: boolean;
  warnings: string[];
};

export type AdmissionEligibilityResult = {
  program: AdmissionProgramRule;
  valid: boolean;
  riskLevel: AdmissionRiskLevel;
  bestOption: AdmissionOptionResult | null;
  eligibleOptions: AdmissionOptionResult[];
  missingRequirements: string[];
  warnings: string[];
  explanation: string;
};

function round2(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function getBenchmarkNormalized(program: AdmissionProgramRule) {
  // Do not silently accept missing, non-finite or out-of-scale cutoffs.
  if (
    typeof program.minNormalizedScore === "number" &&
    Number.isFinite(program.minNormalizedScore) &&
    program.minNormalizedScore >= 0 &&
    program.minNormalizedScore <= 100
  ) {
    return program.minNormalizedScore;
  }

  if (
    typeof program.benchmarkScore === "number" &&
    Number.isFinite(program.benchmarkScore) &&
    program.benchmarkScore >= 0 &&
    program.benchmarkScore <= 30
  ) {
    return round2((program.benchmarkScore / 30) * 100);
  }

  return null;
}

function getCombinationOption(
  combination: CombinationScoreResult
): AdmissionOptionResult {
  return {
    label: combination.combinationCode,
    method: "COMBINATION",
    score: combination.convertedScore,
    normalizedScore: combination.normalizedScore,
    verified: combination.missingSubjects.length === 0,
    warnings: combination.warnings,
  };
}

function getExternalOption(external: ExternalScoreResult): AdmissionOptionResult {
  return {
    label: external.methodLabel,
    method: external.method,
    score: external.convertedScore ?? external.rawScore,
    normalizedScore: external.normalizedScore,
    verified: external.verified,
    warnings: external.warnings,
  };
}

function isCombinationEligible(
  program: AdmissionProgramRule,
  combination: CombinationScoreResult
) {
  return (
    program.combinations.includes(combination.combinationCode) &&
    combination.missingSubjects.length === 0
  );
}

function isExternalEligible(
  program: AdmissionProgramRule,
  external: ExternalScoreResult
) {
  return program.methods.includes(external.method) && external.rawScore > 0;
}

function classifyRisk(
  program: AdmissionProgramRule,
  bestOption: AdmissionOptionResult | null
): AdmissionRiskLevel {
  // A student score alone cannot establish a program's admission risk.
  // The underlying program and comparison benchmark must be verified.
  if (!program.verified || !bestOption || !bestOption.verified) return "INVALID";
  if (
    program.benchmarkVerified !== true ||
    program.benchmarkMethod !== "THPT" ||
    program.benchmarkYear !== program.sourceYear
  ) return "INVALID";

  const benchmarkNormalized = getBenchmarkNormalized(program);
  if (benchmarkNormalized === null) return "INVALID";

  // Until Atlas has institution/year-specific conversion rules, do not
  // compare SAT/HSA/IELTS/etc. 0-100 proxies against a THPT benchmark.
  if (bestOption.method !== "COMBINATION") return "INVALID";

  const gap = bestOption.normalizedScore - benchmarkNormalized;

  // These are descriptive prototype bands, NOT admission probabilities.
  if (gap >= 8) return "SAFE";
  if (gap >= -2) return "TARGET";
  return "REACH";
}

function buildExplanation(
  result: {
    program: AdmissionProgramRule;
    riskLevel: AdmissionRiskLevel;
    bestOption: AdmissionOptionResult | null;
  }
) {
  const { program, riskLevel, bestOption } = result;

  if (riskLevel === "INVALID") {
    return `Chưa thể phân nhóm nguyện vọng cho ${program.majorName}: cần chương trình, điểm chuẩn và phương thức đối chiếu có căn cứ.`;
  }

  if (riskLevel === "SAFE") {
    return `${program.majorName} có điểm tổ hợp cao hơn mốc tham chiếu theo quy tắc thử nghiệm; không phải bảo đảm trúng tuyển.`;
  }

  if (riskLevel === "TARGET") {
    return `${program.majorName} nằm gần mốc tham chiếu theo quy tắc thử nghiệm; cần kiểm tra phương thức và năm tuyển sinh.`;
  }

  return `${program.majorName} nằm dưới mốc tham chiếu theo quy tắc thử nghiệm; không phải dự báo xác suất trúng tuyển.`;
}

export function validateAdmissionProgram({
  program,
  scoreReport,
}: {
  program: AdmissionProgramRule;
  scoreReport: ScoreConversionReport;
}): AdmissionEligibilityResult {
  const warnings: string[] = [];
  const missingRequirements: string[] = [];

  const combinationOptions = scoreReport.combinationOptions
    .filter((combination) => isCombinationEligible(program, combination))
    .map(getCombinationOption);

  const externalOptions = scoreReport.externalOptions
    .filter((external) => isExternalEligible(program, external))
    .map(getExternalOption);

  const eligibleOptions = [...combinationOptions, ...externalOptions].sort(
    (a, b) => b.normalizedScore - a.normalizedScore
  );

  if (program.combinations.length === 0 && program.methods.length === 0) {
    missingRequirements.push("Chưa có tổ hợp hoặc phương thức xét tuyển.");
  }

  if (!program.verified) {
    warnings.push("Thông tin ngành/trường chưa được xác minh nguồn chính thức.");
  }

  if (eligibleOptions.length === 0) {
    missingRequirements.push("Chưa có phương án điểm phù hợp với ngành này.");
  }

  if (getBenchmarkNormalized(program) === null) {
    missingRequirements.push("Chưa có điểm chuẩn hợp lệ để đối chiếu ngành/trường; không xếp nhóm nguyện vọng.");
  }

  if (
    program.benchmarkVerified !== true ||
    program.benchmarkMethod !== "THPT" ||
    program.benchmarkYear !== program.sourceYear
  ) {
    missingRequirements.push("Chưa xác minh được nguồn, phương thức THPT và năm áp dụng của điểm chuẩn.");
  }

  if (!program.verified) {
    missingRequirements.push("Chương trình tuyển sinh chưa được xác minh; không xếp nhóm nguyện vọng.");
  }

  // Only a complete THPT subject combination is currently comparable to a
  // THPT cutoff. External methods need source-specific conversion rules.
  const bestOption = eligibleOptions.find((option) =>
    option.method === "COMBINATION" && option.verified
  ) || null;
  if (!bestOption && externalOptions.length > 0) {
    missingRequirements.push("Điểm phương thức khác cần quy tắc quy đổi chính thức trước khi so sánh điểm chuẩn THPT.");
  }

  const riskLevel = classifyRisk(program, bestOption);
  const methodWarnings = eligibleOptions.flatMap((option) => option.warnings);

  return {
    program,
    valid: riskLevel !== "INVALID",
    riskLevel,
    bestOption,
    eligibleOptions,
    missingRequirements,
    warnings: Array.from(new Set([...warnings, ...methodWarnings])),
    explanation: buildExplanation({
      program,
      riskLevel,
      bestOption,
    }),
  };
}

export function validateAdmissionPrograms({
  programs,
  scoreReport,
}: {
  programs: AdmissionProgramRule[];
  scoreReport: ScoreConversionReport;
}) {
  return programs.map((program) =>
    validateAdmissionProgram({
      program,
      scoreReport,
    })
  );
}

export function getRiskLabel(riskLevel: AdmissionRiskLevel) {
  if (riskLevel === "SAFE") return "An toàn";
  if (riskLevel === "TARGET") return "Vừa sức";
  if (riskLevel === "REACH") return "Bứt phá";
  return "Chưa hợp lệ";
}

export function getRiskPriority(riskLevel: AdmissionRiskLevel) {
  if (riskLevel === "TARGET") return 4;
  if (riskLevel === "SAFE") return 3;
  if (riskLevel === "REACH") return 2;
  return 0;
}