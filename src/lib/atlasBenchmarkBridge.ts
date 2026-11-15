import type { AdmissionProgramRule } from "./admissionRules";
import type {
  AtlasAdmissionSource,
  AtlasProgram,
  AtlasUniversity,
} from "./atlasKnowledgeBase";

/**
 * Adapter between the user-owned Atlas workspace and the admission comparison.
 * Approval flags are data-entry metadata, not independent proof of authenticity.
 * Never synthesize a cutoff, infer a 2026 cutoff from prior years, or mix methods.
 */
export type ComparableAtlasBenchmark = {
  value: number;
  year: number;
  method: "THPT";
  sourceUrls: string[];
};

function hasUsableSourceUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      Boolean(host) &&
      !url.username &&
      !url.password &&
      host !== "localhost" &&
      !host.endsWith(".local") &&
      !host.endsWith(".example") &&
      host !== "example.com" &&
      host !== "example.org" &&
      host !== "example.net" &&
      host !== "127.0.0.1" &&
      host !== "0.0.0.0"
    );
  } catch {
    return false;
  }
}

function allSourcesApproved({
  ids,
  sources,
  program,
  year,
}: {
  ids: string[];
  sources: AtlasAdmissionSource[];
  program: AtlasProgram;
  year: number;
}): AtlasAdmissionSource[] | null {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const groups = ids.map((id) => sources.filter((source) => source.id === id));
  // Duplicate IDs are ambiguous: do not silently take the first record.
  if (groups.some((group) => group.length !== 1)) return null;
  const matches = groups.map((group) => group[0]);
  if (
    matches.some(
      (source) =>
        !source ||
        source.status !== "verified" ||
        source.universityId !== program.universityId ||
        source.sourceYear !== year ||
        !hasUsableSourceUrl(source.sourceUrl)
    )
  ) {
    return null;
  }
  return matches as AtlasAdmissionSource[];
}

/** Return null until the program AND its cutoff have matching approved evidence. */
export function getComparableAtlasBenchmark(
  program: AtlasProgram,
  sources: AtlasAdmissionSource[]
): ComparableAtlasBenchmark | null {
  const benchmark = program.benchmark;
  if (
    program.status !== "verified" ||
    !program.methods.includes("THPT") ||
    !program.majorName?.trim() ||
    !program.majorCode?.trim() ||
    !benchmark ||
    benchmark.status !== "verified" ||
    benchmark.method !== "THPT" ||
    benchmark.year !== program.sourceYear ||
    !Number.isInteger(benchmark.year) ||
    !Number.isFinite(benchmark.value) ||
    benchmark.value < 0 ||
    benchmark.value > 30
  ) {
    return null;
  }

  // The source for the program and the source for its cutoff can be distinct.
  // Every declared source reference must resolve, match the same institution
  // and year, be approved, and contain a valid HTTPS link.
  const programSources = allSourcesApproved({
    ids: program.sourceIds,
    sources,
    program,
    year: program.sourceYear,
  });
  const benchmarkSources = allSourcesApproved({
    ids: benchmark.sourceIds,
    sources,
    program,
    year: benchmark.year,
  });
  if (!programSources || !benchmarkSources) return null;

  return {
    value: benchmark.value,
    year: benchmark.year,
    method: "THPT",
    sourceUrls: Array.from(new Set(benchmarkSources.map((source) => source.sourceUrl))),
  };
}

export function mapAtlasProgramsToAdmissionRules(
  programs: AtlasProgram[],
  sources: AtlasAdmissionSource[],
  universityMap: Record<string, AtlasUniversity>
): AdmissionProgramRule[] {
  return programs.map((program) => {
    const benchmark = getComparableAtlasBenchmark(program, sources);
    const normalizedMajorName = program.majorName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    return {
      id: program.id,
      universityName: universityMap[program.universityId]?.name || "Trường chưa xác định",
      majorName: program.majorName,
      majorCode: program.majorCode,
      combinations: program.combinations,
      methods: program.methods,
      benchmarkScore: benchmark?.value,
      benchmarkVerified: Boolean(benchmark),
      benchmarkYear: benchmark?.year,
      benchmarkMethod: benchmark?.method,
      sourceYear: program.sourceYear,
      // A verified flag alone is insufficient; sources must match this program.
      verified: program.status === "verified" && Boolean(
        allSourcesApproved({
          ids: program.sourceIds,
          sources,
          program,
          year: program.sourceYear,
        })
      ),
      tuitionLabel: program.tuitionLabel,
      scholarshipLabel: undefined,
      isPedagogy: normalizedMajorName.includes("su pham"),
    };
  });
}
