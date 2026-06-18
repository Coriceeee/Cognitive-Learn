import type { ScoreConversionReport } from "./admissionTypes";
import {
  validateAdmissionPrograms,
  type AdmissionEligibilityResult,
  type AdmissionProgramRule,
} from "./admissionRules";
import {
  buildAspirationPlan,
  type AspirationPlan,
} from "./aspirationPlanner";

export type AdmissionEngineInput = {
  scoreReport: ScoreConversionReport;
  programs: AdmissionProgramRule[];
  targetMajor?: string;
  maxAspirations?: number;
};

export type AdmissionEngineResult = {
  eligibilityResults: AdmissionEligibilityResult[];
  aspirationPlan: AspirationPlan;
  recommendedMajors: string[];
  safeSchools: string[];
  targetSchools: string[];
  reachSchools: string[];
  warnings: string[];
  summary: string;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getSchoolsByRisk(
  results: AdmissionEligibilityResult[],
  riskLevel: AdmissionEligibilityResult["riskLevel"]
) {
  return unique(
    results
      .filter((result) => result.valid && result.riskLevel === riskLevel)
      .map((result) => result.program.universityName)
  );
}

function getRecommendedMajors(results: AdmissionEligibilityResult[]) {
  return unique(
    results
      .filter((result) => result.valid)
      .sort(
        (a, b) =>
          (b.bestOption?.normalizedScore || 0) -
          (a.bestOption?.normalizedScore || 0)
      )
      .map((result) => result.program.majorName)
  ).slice(0, 8);
}

function buildSummary(result: {
  eligibilityResults: AdmissionEligibilityResult[];
  aspirationPlan: AspirationPlan;
}) {
  const validCount = result.eligibilityResults.filter(
    (item) => item.valid
  ).length;

  const aspirationCount = result.aspirationPlan.items.length;

  if (validCount === 0) {
    return "Atlas chưa tìm thấy ngành/trường đủ điều kiện từ dữ liệu hiện có.";
  }

  return `Atlas tìm thấy ${validCount} lựa chọn phù hợp và đã xếp ${aspirationCount} nguyện vọng đề xuất.`;
}

export function runAdmissionEngine({
  scoreReport,
  programs,
  targetMajor,
  maxAspirations = 15,
}: AdmissionEngineInput): AdmissionEngineResult {
  const eligibilityResults = validateAdmissionPrograms({
    programs,
    scoreReport,
  });

  const aspirationPlan = buildAspirationPlan({
    results: eligibilityResults,
    targetMajor,
    maxAspirations,
  });

  const warnings = [
    ...scoreReport.warnings,
    ...eligibilityResults.flatMap((result) => result.warnings),
    ...eligibilityResults.flatMap((result) => result.missingRequirements),
    ...aspirationPlan.warnings,
  ];

  const result = {
    eligibilityResults,
    aspirationPlan,
    recommendedMajors: getRecommendedMajors(eligibilityResults),
    safeSchools: getSchoolsByRisk(eligibilityResults, "SAFE"),
    targetSchools: getSchoolsByRisk(eligibilityResults, "TARGET"),
    reachSchools: getSchoolsByRisk(eligibilityResults, "REACH"),
    warnings: Array.from(new Set(warnings)),
    summary: "",
  };

  return {
    ...result,
    summary: buildSummary(result),
  };
}