export type AtlasSourceStatus =
  | "verified"
  | "pending"
  | "rejected";

export type AtlasSourceType =
  | "official_website"
  | "admission_scheme"
  | "pdf"
  | "manual";

export type AtlasExtractedBy =
  | "Gemini"
  | "Admin"
  | "Manual";

export type AtlasAdmissionMethod =
  | "THPT"
  | "HOC_BA"
  | "HSA"
  | "DGNL_HCM"
  | "TSA"
  | "VSAT"
  | "V_ACT"
  | "SAT"
  | "ACT"
  | "IELTS"
  | "TOEFL"
  | "VSTEP";

export type AtlasBenchmarkEvidence = {
  value: number;
  year: number;
  method?: string;
  sourceIds: string[];
  status: AtlasSourceStatus;
};

export type AtlasUniversity = {
  id: string;
  name: string;
  shortName: string;
  region: string;
  website: string;
  verified: boolean;
};

export type AtlasAdmissionSource = {
  id: string;
  universityId: string;
  title: string;
  sourceType: AtlasSourceType;
  sourceUrl: string;
  sourceYear: number;
  extractedBy: AtlasExtractedBy;
  reviewedBy?: string;
  status: AtlasSourceStatus;
  updatedAt: string;
};

export type AtlasProgram = {
  id: string;
  universityId: string;

  majorName: string;
  majorCode: string;

  combinations: string[];

  methods: AtlasAdmissionMethod[];

  tuitionLabel: string;
  scholarshipLabel: string;

  sourceIds: string[];

  sourceYear: number;

  status: AtlasSourceStatus;

  benchmark?: AtlasBenchmarkEvidence;
};

export type AtlasStats = {
  totalUniversities: number;
  totalPrograms: number;
  totalSources: number;

  verifiedSources: number;
  pendingSources: number;
  verifiedPrograms: number;

  benchmarkedPrograms: number;
  verifiedBenchmarks: number;
};

export const admissionMethodLabels: Record<
  AtlasAdmissionMethod,
  string
> = {
  THPT: "THPT",
  HOC_BA: "Học bạ",
  HSA: "HSA",
  DGNL_HCM: "ĐGNL HCM",
  TSA: "TSA",
  VSAT: "VSAT",
  V_ACT: "V-ACT",
  SAT: "SAT",
  ACT: "ACT",
  IELTS: "IELTS",
  TOEFL: "TOEFL",
  VSTEP: "VSTEP",
};

export function getStatusLabel(
  status: AtlasSourceStatus
) {
  if (status === "verified") {
    return "Đã xác minh";
  }

  if (status === "pending") {
    return "Chờ duyệt";
  }

  return "Từ chối";
}

export function getStatusClass(
  status: AtlasSourceStatus
) {
  return status;
}

export function getSourceTypeLabel(
  type: AtlasSourceType
) {
  if (
    type === "official_website"
  ) {
    return "Website chính thức";
  }

  if (
    type === "admission_scheme"
  ) {
    return "Đề án tuyển sinh";
  }

  if (type === "pdf") {
    return "PDF";
  }

  return "Nhập tay";
}

export function buildSourceMap(
  sources: AtlasAdmissionSource[]
) {
  return sources.reduce<
    Record<
      string,
      AtlasAdmissionSource
    >
  >(
    (map, source) => {
      map[source.id] = source;

      return map;
    },
    {}
  );
}

export function getProgramSources(
  program: AtlasProgram,
  sources: AtlasAdmissionSource[]
) {
  const sourceMap =
    buildSourceMap(
      sources
    );

  return program.sourceIds
    .map(
      (sourceId) =>
        sourceMap[sourceId]
    )
    .filter(
      Boolean
    );
}

export function getProgramVerification(
  program: AtlasProgram,
  sources: AtlasAdmissionSource[]
): AtlasSourceStatus {
  const programSources =
    getProgramSources(
      program,
      sources
    );

  if (
    program.status ===
    "rejected"
  ) {
    return "rejected";
  }

  if (
    programSources.length === 0
  ) {
    return "pending";
  }

  const hasRejectedSource =
    programSources.some(
      (source) =>
        source.status ===
        "rejected"
    );

  if (
    hasRejectedSource
  ) {
    return "rejected";
  }

  const allSourcesVerified =
    programSources.every(
      (source) =>
        source.status ===
        "verified"
    );

  return allSourcesVerified
    ? "verified"
    : "pending";
}

export function getBenchmarkVerification(
  benchmark:
    | AtlasBenchmarkEvidence
    | undefined,
  sources: AtlasAdmissionSource[]
): AtlasSourceStatus {
  if (!benchmark) {
    return "pending";
  }

  if (
    !Number.isFinite(
      benchmark.value
    ) ||
    benchmark.value < 0
  ) {
    return "rejected";
  }

  if (
    !Number.isFinite(
      benchmark.year
    ) ||
    benchmark.year <= 0
  ) {
    return "pending";
  }

  if (
    benchmark.sourceIds.length === 0
  ) {
    return "pending";
  }

  const sourceMap =
    buildSourceMap(
      sources
    );

  const linkedSources =
    benchmark.sourceIds
      .map(
        (sourceId) =>
          sourceMap[sourceId]
      )
      .filter(
        Boolean
      );

  if (
    linkedSources.length === 0
  ) {
    return "pending";
  }

  if (
    linkedSources.some(
      (source) =>
        source.status ===
        "rejected"
    )
  ) {
    return "rejected";
  }

  const allSourcesVerified =
    linkedSources.every(
      (source) =>
        source.status ===
        "verified"
    );

  return allSourcesVerified
    ? "verified"
    : "pending";
}

export function getAtlasStats(
  universities: AtlasUniversity[],
  programs: AtlasProgram[],
  sources: AtlasAdmissionSource[]
): AtlasStats {
  const benchmarkedPrograms =
    programs.filter(
      (program) =>
        Boolean(
          program.benchmark
        )
    );

  const verifiedBenchmarks =
    benchmarkedPrograms.filter(
      (program) =>
        program.benchmark?.status ===
        "verified"
    );

  return {
    totalUniversities:
      universities.length,

    totalPrograms:
      programs.length,

    totalSources:
      sources.length,

    verifiedSources:
      sources.filter(
        (source) =>
          source.status ===
          "verified"
      ).length,

    pendingSources:
      sources.filter(
        (source) =>
          source.status ===
          "pending"
      ).length,

    verifiedPrograms:
      programs.filter(
        (program) =>
          program.status ===
          "verified"
      ).length,

    benchmarkedPrograms:
      benchmarkedPrograms.length,

    verifiedBenchmarks:
      verifiedBenchmarks.length,
  };
}