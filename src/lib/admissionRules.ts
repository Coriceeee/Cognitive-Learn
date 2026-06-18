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
  if (typeof program.minNormalizedScore === "number") {
    return program.minNormalizedScore;
  }

  if (typeof program.benchmarkScore === "number") {
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
    combination.missingSubjects.length === 0 &&
    combination.convertedScore > 0
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
  if (!bestOption) return "INVALID";

  const benchmarkNormalized = getBenchmarkNormalized(program);

  if (benchmarkNormalized === null) {
    if (bestOption.normalizedScore >= 82) return "SAFE";
    if (bestOption.normalizedScore >= 68) return "TARGET";
    return "REACH";
  }

  const gap = bestOption.normalizedScore - benchmarkNormalized;

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

  if (!bestOption) {
    return `Chưa đủ dữ liệu để xét ngành ${program.majorName}.`;
  }

  if (riskLevel === "SAFE") {
    return `${program.majorName} thuộc nhóm an toàn hơn vì phương án ${bestOption.label} đang có điểm chuẩn hóa tốt.`;
  }

  if (riskLevel === "TARGET") {
    return `${program.majorName} thuộc nhóm vừa sức, có thể đưa vào nhóm nguyện vọng ưu tiên nếu phù hợp mục tiêu.`;
  }

  return `${program.majorName} thuộc nhóm bứt phá, có thể cân nhắc nhưng cần thêm phương án an toàn đi kèm.`;
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

  const bestOption = eligibleOptions[0] || null;
  const riskLevel = classifyRisk(program, bestOption);

  const methodWarnings = eligibleOptions.flatMap((option) => option.warnings);

  return {
    program,
    valid: eligibleOptions.length > 0,
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