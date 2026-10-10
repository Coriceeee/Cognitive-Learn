import type {
  AtlasAdmissionSource,
  AtlasProgram,
  AtlasUniversity,
} from "./atlasKnowledgeBase";

export type AtlasEvidenceStatus =
  | "VERIFIED"
  | "PENDING"
  | "MISSING"
  | "REJECTED";

export type AtlasEvidenceRecord = {
  entityType: "UNIVERSITY" | "PROGRAM" | "SOURCE";
  entityId: string;

  sourceIds: string[];

  status: AtlasEvidenceStatus;

  sourceYear?: number;

  sourceUrls: string[];

  sourceTitles: string[];

  extractedBy?: string;

  verificationNote: string;
};

export type AtlasBenchmarkEvidence = {
  value: number;
  year: number;
  method?: string;
  sourceIds: string[];
  status: AtlasEvidenceStatus;
};

function getSourceEvidence(
  sourceIds: string[],
  sources: AtlasAdmissionSource[]
): AtlasAdmissionSource[] {
  const idSet = new Set(sourceIds);

  return sources.filter((source) =>
    idSet.has(source.id)
  );
}

export function buildProgramEvidence(
  program: AtlasProgram,
  sources: AtlasAdmissionSource[]
): AtlasEvidenceRecord {
  const linkedSources =
    getSourceEvidence(
      program.sourceIds,
      sources
    );

  const sourceUrls =
    linkedSources
      .map(
        (source) =>
          source.sourceUrl.trim()
      )
      .filter(
        (url) =>
          url.length > 0 &&
          url !== "#"
      );

  const status =
    linkedSources.some(
      (source) =>
        source.status === "verified"
    )
      ? "VERIFIED"
      : linkedSources.some(
            (source) =>
              source.status ===
              "pending"
          )
        ? "PENDING"
        : linkedSources.length
          ? "REJECTED"
          : "MISSING";

  return {
    entityType: "PROGRAM",

    entityId: program.id,

    sourceIds:
      linkedSources.map(
        (source) => source.id
      ),

    status,

    sourceYear:
      program.sourceYear ??
      linkedSources[0]?.sourceYear,

    sourceUrls,

    sourceTitles:
      linkedSources.map(
        (source) => source.title
      ),

    extractedBy:
      linkedSources[0]?.extractedBy,

    verificationNote:
      status === "VERIFIED"
        ? "Nguồn đã được xác minh trước khi sử dụng cho quyết định tuyển sinh."
        : status === "PENDING"
          ? "Dữ liệu có nguồn nhưng chưa được xác minh; không được coi là fact tuyển sinh đã xác nhận."
          : "Chưa có nguồn tuyển sinh hợp lệ đã xác minh.",
  };
}

export function buildUniversityEvidence(
  university: AtlasUniversity,
  sources: AtlasAdmissionSource[]
): AtlasEvidenceRecord {
  const linkedSources =
    sources.filter(
      (source) =>
        source.universityId ===
        university.id
    );

  const sourceUrls =
    linkedSources
      .map(
        (source) =>
          source.sourceUrl.trim()
      )
      .filter(
        (url) =>
          url.length > 0 &&
          url !== "#"
      );

  const status =
    university.verified
      ? "VERIFIED"
      : linkedSources.some(
            (source) =>
              source.status ===
              "pending"
          )
        ? "PENDING"
        : "MISSING";

  return {
    entityType: "UNIVERSITY",

    entityId: university.id,

    sourceIds:
      linkedSources.map(
        (source) => source.id
      ),

    status,

    sourceYear:
      linkedSources[0]?.sourceYear,

    sourceUrls,

    sourceTitles:
      linkedSources.map(
        (source) => source.title
      ),

    extractedBy:
      linkedSources[0]?.extractedBy,

    verificationNote:
      status === "VERIFIED"
        ? "University record đã được đánh dấu verified."
        : "University record chưa có xác minh chính thức.",
  };
}

export function getBenchmarkEvidence(
  program: AtlasProgram
): AtlasBenchmarkEvidence | null {
  const candidate =
    program as AtlasProgram & {
      benchmarkScore?: number;
      benchmarkYear?: number;
      benchmarkMethod?: string;
      benchmarkSourceIds?: string[];
    };

  if (
    typeof candidate.benchmarkScore !==
      "number" ||
    !Number.isFinite(
      candidate.benchmarkScore
    )
  ) {
    return null;
  }

  return {
    value:
      candidate.benchmarkScore,

    year:
      candidate.benchmarkYear ??
      program.sourceYear,

    method:
      candidate.benchmarkMethod,

    sourceIds:
      candidate.benchmarkSourceIds ??
      program.sourceIds,

    status:
      candidate.benchmarkSourceIds
        ?.length
        ? "PENDING"
        : "MISSING",
  };
}