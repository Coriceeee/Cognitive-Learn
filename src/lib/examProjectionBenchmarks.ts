/**
 * Compare a two-mock subject projection with exact, source-linked 2026 THPT cutoffs.
 * This is a historical distance check only: it is not eligibility, a probability,
 * or a validated forecast. Non-THPT and converted-composite methods are excluded.
 */
import { discoverNationalPrograms, type DiscoveryQuery } from "./nationalProgramDiscovery.ts";
import { safePathwayUrl } from "./nationalAdmissionPathways2026.ts";
import type { SubjectCode, SubjectScoreMap } from "./admissionTypes.ts";

export const EXAM_PROJECTION_BENCHMARK_VERSION = "exam-projection-thpt-reference-v1";
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

export type ExamProjectionBenchmark = {
  id: string;
  universityId: string;
  universityName: string;
  campus: string;
  majorName: string;
  majorCode: string;
  combinationCode: string;
  subjects: SubjectCode[];
  projectedScore: number;
  cutoff: number;
  gap: number;
  relation: "ABOVE" | "EQUAL" | "BELOW";
  method: string;
  referenceYear: 2026;
  cutoffSource: string;
  schemeSource: string;
  reviewedAt: string;
  eligibility: "NOT_EVALUATED";
  probability: null;
};

export type ExamProjectionBenchmarkReport = {
  version: typeof EXAM_PROJECTION_BENCHMARK_VERSION;
  referenceYear: 2026;
  rows: ExamProjectionBenchmark[];
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
    "Chỉ đối chiếu điểm dự báo theo từng môn với điểm chuẩn THPT 2026 có cùng thang 30 và tổ hợp được nguồn đề án công bố.",
    "Không dùng điểm chuẩn tổng hợp, học bạ, HSA, TSA, SAT hoặc phương thức khác để thay thế điểm thi THPT.",
    "Chênh lệch với điểm chuẩn lịch sử không phải xác suất trúng tuyển, điều kiện đủ, hay dự báo cho kỳ tuyển sinh tiếp theo.",
  ];
  if (referenceYear !== REFERENCE_YEAR || Object.values(scores).some(value => value !== undefined && !observed(value))) {
    return { version: EXAM_PROJECTION_BENCHMARK_VERSION, referenceYear: REFERENCE_YEAR, rows: [], limitations };
  }

  const query: DiscoveryQuery = { year: REFERENCE_YEAR, interest, region, combination: "" };
  const programs = discoverNationalPrograms(query);
  const rows: ExamProjectionBenchmark[] = [];
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
        if (!values.every(observed)) continue;
        const schemeSource = safePathwayUrl(item.source) ?? safePathwayUrl(program.sourceUrl);
        if (!schemeSource) continue;
        const projectedScore = Math.round((values as number[]).reduce((sum, value) => sum + value, 0) * 100) / 100;
        const gap = Math.round((projectedScore - cutoff.cutoff) * 100) / 100;
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
          projectedScore,
          cutoff: cutoff.cutoff,
          gap,
          relation: gap > 0 ? "ABOVE" : gap < 0 ? "BELOW" : "EQUAL",
          method: cutoff.label,
          referenceYear: REFERENCE_YEAR,
          cutoffSource,
          schemeSource,
          reviewedAt: cutoff.reviewedAt,
          eligibility: "NOT_EVALUATED",
          probability: null,
        });
      }
    }
  }

  rows.sort((a, b) => b.gap - a.gap ||
    a.universityName.localeCompare(b.universityName, "vi") ||
    a.majorName.localeCompare(b.majorName, "vi") ||
    a.combinationCode.localeCompare(b.combinationCode));

  return { version: EXAM_PROJECTION_BENCHMARK_VERSION, referenceYear: REFERENCE_YEAR, rows, limitations };
}
