/**
 * List source-linked 2026 THPT cutoffs for combinations with complete projected
 * subject inputs. This intentionally does NOT compare scores: published cutoffs
 * may include school-specific bonus and priority adjustments that are not yet
 * computed from a student's verified admission profile.
 */
import { discoverNationalPrograms, type DiscoveryQuery } from "./nationalProgramDiscovery.ts";
import { safePathwayUrl } from "./nationalAdmissionPathways2026.ts";
import type { SubjectCode, SubjectScoreMap } from "./admissionTypes.ts";

export const EXAM_PROJECTION_BENCHMARK_VERSION = "exam-projection-reference-v2";
const REFERENCE_YEAR = 2026;
const THPT_METHODS = new Set([
  "THPT",
  "DTHU_THPT",
  "HUST_THPT_A00",
  "USSH_THPT_C00",
  "USSH_THPT_D01",
]);
const METHOD_COMBINATIONS: Readonly<Record<string, string>> = {
  HUST_THPT_A00: "A00",
  USSH_THPT_C00: "C00",
  USSH_THPT_D01: "D01",
};
const SUBJECT_CODES = new Set<SubjectCode>([
  "math", "literature", "english", "physics", "chemistry", "biology",
  "history", "geography", "civicEducation", "informatics", "technology",
]);
const observed = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;

export type ExamProjectionReference = {
  id: string;
  universityId: string;
  universityName: string;
  campus: string;
  majorName: string;
  majorCode: string;
  combinationCode: string;
  subjects: SubjectCode[];
  cutoff: number;
  method: string;
  referenceYear: 2026;
  cutoffSource: string;
  schemeSource: string;
  reviewedAt: string;
  comparisonStatus: "BLOCKED_ADJUSTMENT_RULES";
  eligibility: "NOT_EVALUATED";
  probability: null;
};

export type ExamProjectionBenchmarkReport = {
  version: typeof EXAM_PROJECTION_BENCHMARK_VERSION;
  referenceYear: 2026;
  rows: ExamProjectionReference[];
  limitations: string[];
};

export function compareProjectionToHistoricalCutoffs({
  scores,
  interest = "",
  region = "ALL",
  referenceYear = REFERENCE_YEAR,
}: {
  scores: SubjectScoreMap;
  interest?: string;
  region?: DiscoveryQuery["region"];
  referenceYear?: number;
}): ExamProjectionBenchmarkReport {
  const limitations = [
    "Các mốc dưới đây là điểm chuẩn THPT lịch sử năm 2026, không phải ngưỡng bảo đảm cho kỳ tuyển sinh tiếp theo.",
    "Điểm chuẩn công bố có thể đã gồm điểm cộng, điểm ưu tiên hoặc quy tắc quy đổi riêng theo trường/ngành. CLA chưa có đủ công thức và hồ sơ ưu tiên đã xác minh để quy đổi điểm dự báo tương đương.",
    "Vì vậy, CLA chỉ hiển thị mốc và nguồn; không tính chênh lệch, không xếp nhóm an toàn/vừa sức/bứt phá và không suy ra xác suất trúng tuyển.",
  ];
  if (referenceYear !== REFERENCE_YEAR || Object.values(scores).some(value => value !== undefined && !observed(value))) {
    return { version: EXAM_PROJECTION_BENCHMARK_VERSION, referenceYear: REFERENCE_YEAR, rows: [], limitations };
  }

  const query: DiscoveryQuery = { year: REFERENCE_YEAR, interest, region, combination: "" };
  const programs = discoverNationalPrograms(query);
  const rows: ExamProjectionReference[] = [];
  const seen = new Set<string>();

  for (const program of programs) {
    for (const cutoff of program.records) {
      if (cutoff.year !== REFERENCE_YEAR || cutoff.scale !== 30 || !THPT_METHODS.has(cutoff.method)) continue;
      const cutoffSource = safePathwayUrl(cutoff.source);
      if (!cutoffSource || !/^\d{4}-\d{2}-\d{2}$/.test(cutoff.reviewedAt)) continue;

      const methodCombination = METHOD_COMBINATIONS[cutoff.method];
      const evidence = program.publishedEvidence.filter(item =>
        (item.kind === "THPT_PUBLISHED" || item.kind === "BASE_COMBINATION") &&
        item.subjects !== null &&
        (!methodCombination || item.code === methodCombination) &&
        (!cutoff.combinations?.length || cutoff.combinations.includes(item.code))
      );

      for (const item of evidence) {
        if (!item.subjects || item.subjects.length !== 3 ||
            item.subjects.some(subject => !SUBJECT_CODES.has(subject as SubjectCode))) continue;
        const subjects = item.subjects as readonly SubjectCode[];
        const values = subjects.map(subject => scores[subject]);
        // A row is relevant only when all three projected subject marks exist.
        // Their sum is deliberately not compared with a published cutoff.
        if (!values.every(observed)) continue;
        const schemeSource = safePathwayUrl(item.source) ?? safePathwayUrl(program.sourceUrl);
        if (!schemeSource) continue;
        const id = [cutoff.universityId, cutoff.campus, cutoff.code, cutoff.method, item.code].join("|");
        if (seen.has(id)) continue;
        seen.add(id);
        rows.push({
          id,
          universityId: cutoff.universityId,
          universityName: program.university,
          campus: cutoff.campus,
          majorName: cutoff.major,
          majorCode: cutoff.code,
          combinationCode: item.code,
          subjects: [...subjects],
          cutoff: cutoff.cutoff,
          method: cutoff.label,
          referenceYear: REFERENCE_YEAR,
          cutoffSource,
          schemeSource,
          reviewedAt: cutoff.reviewedAt,
          comparisonStatus: "BLOCKED_ADJUSTMENT_RULES",
          eligibility: "NOT_EVALUATED",
          probability: null,
        });
      }
    }
  }

  rows.sort((a, b) =>
    a.universityName.localeCompare(b.universityName, "vi") ||
    a.majorName.localeCompare(b.majorName, "vi") ||
    a.combinationCode.localeCompare(b.combinationCode));

  return { version: EXAM_PROJECTION_BENCHMARK_VERSION, referenceYear: REFERENCE_YEAR, rows, limitations };
}
