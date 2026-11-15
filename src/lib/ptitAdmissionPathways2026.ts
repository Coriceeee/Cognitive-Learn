/**
 * A deliberately bounded source-backed program explorer: PTIT, Hanoi campus
 * BVH, 2026, THPT subject combinations only. This is NOT a national catalog,
 * a cutoff comparison, an admission probability or an eligibility decision.
 *
 * Source: https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/
 * Source review in CLA data registry: 2026-11-08.
 */
import type { SubjectCode, SubjectScoreMap } from "./admissionTypes";
import type { ExamElective2026 } from "./examChoiceEngine";
import { verifiedPrograms, type VerifiedProgram } from "../data/verifiedAdmissionPrograms";

/** Codes shown in PTIT's 2026 official admissions notice for BVH. */
export const PTIT_2026_COMBINATION_SUBJECTS: Readonly<Record<string, readonly SubjectCode[]>> = {
  A00: ["math", "physics", "chemistry"],
  A01: ["math", "physics", "english"],
  X06: ["math", "physics", "informatics"],
  X26: ["math", "informatics", "english"],
  D01: ["math", "literature", "english"],
};

export type PublishedCombinationMatch = {
  code: string;
  subjects: readonly SubjectCode[];
  observedScore: number | null;
};

export type PublishedProgramMatch = {
  programId: string;
  majorCode: string;
  majorName: string;
  campus: "BVH";
  universityName: string;
  year: 2026;
  admissionMethod: "THPT";
  officialSource: string;
  matchesTarget: boolean;
  combinations: PublishedCombinationMatch[];
};

export type PublishedPairReport = {
  year: 2026;
  scope: "ptit_bvh_sample";
  sourceReviewedAt: "2026-11-08";
  matches: PublishedProgramMatch[];
  targetMatches: number;
  supportedCombinations: string[];
};

function isObserved(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

function official2026PtitUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "tuyensinh.ptit.edu.vn" &&
      url.pathname.includes("/de-an-tuyen-sinh/") && url.pathname.includes("2026") &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

/**
 * Caller supplies only the two electives explicitly confirmed by the learner.
 * 2026 PTIT publication accepts a combination iff all its three subjects are
 * among the two compulsory exams and the two selected electives. Lack of data
 * never becomes a zero score, and an academic total is never an admission odds.
 */
export function matchPtitPublishedPathways2026(input: {
  selectedElectives: readonly ExamElective2026[];
  scores: SubjectScoreMap;
  targetMajor?: string;
  programs?: readonly VerifiedProgram[];
}): PublishedPairReport {
  const result: PublishedPairReport = {
    year: 2026,
    scope: "ptit_bvh_sample",
    sourceReviewedAt: "2026-11-08",
    matches: [],
    targetMatches: 0,
    supportedCombinations: [],
  };
  const electives = Array.from(new Set(input.selectedElectives));
  if (electives.length !== 2 || input.selectedElectives.length !== 2) return result;

  const available = new Set<SubjectCode>(["math", "literature"]);
  for (const elective of electives) {
    // Technology streams cannot be inferred from Seed's generic technology mark.
    if (elective === "technologyIndustry" || elective === "technologyAgriculture") continue;
    available.add(elective);
  }
  const knownCombos = Object.entries(PTIT_2026_COMBINATION_SUBJECTS)
    .filter(([, subjects]) => subjects.every(subject => available.has(subject)));
  result.supportedCombinations = knownCombos.map(([code]) => code);
  const target = normalize(input.targetMajor ?? "");

  for (const program of input.programs ?? verifiedPrograms) {
    if (program.universityId !== "ptit" || program.campus !== "BVH" ||
        !program.availableYears.includes(2026) || !official2026PtitUrl(program.source2026) ||
        !program.methods2026.some(method => /(?:\b5\s*:|THPT)/i.test(method)) ||
        !program.major.trim() || !program.code.trim()) continue;
    const combinations: PublishedCombinationMatch[] = knownCombos.flatMap(([code, subjects]) => {
      if (!program.combinations2026.includes(code)) return [];
      const observedScore = subjects.every(subject => isObserved(input.scores[subject]))
        ? Math.round(subjects.reduce((sum, subject) => sum + input.scores[subject]!, 0) * 100) / 100
        : null;
      return [{code, subjects, observedScore}];
    });
    if (combinations.length === 0) continue;
    const matchesTarget = Boolean(target) && normalize(program.major).includes(target);
    result.matches.push({
      programId: `ptit-bvh-2026-${program.code}`,
      majorCode: program.code,
      majorName: program.major,
      campus: "BVH",
      universityName: "Học viện Công nghệ Bưu chính Viễn thông",
      year: 2026,
      admissionMethod: "THPT",
      officialSource: program.source2026,
      matchesTarget,
      combinations,
    });
  }
  result.matches.sort((a, b) => Number(b.matchesTarget) - Number(a.matchesTarget) ||
    a.majorName.localeCompare(b.majorName, "vi") || a.majorCode.localeCompare(b.majorCode));
  result.targetMatches = result.matches.filter(match => match.matchesTarget).length;
  return result;
}
