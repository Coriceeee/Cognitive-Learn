import { useEffect, useMemo, useState } from "react";
import type { GeminiAdmissionDraft } from "../../../lib/geminiAdmissionClient";
import {
  getAtlasStats,
  type AtlasAdmissionMethod,
  type AtlasAdmissionSource,
  type AtlasProgram,
  type AtlasSourceStatus,
  type AtlasSourceType,
  type AtlasUniversity,
} from "../../../lib/atlasKnowledgeBase";

const ATLAS_STORAGE_KEY = "cla_atlas_knowledge_base_v1";

const validAdmissionMethods: AtlasAdmissionMethod[] = [
  "THPT",
  "HOC_BA",
  "HSA",
  "DGNL_HCM",
  "TSA",
  "VSAT",
  "V_ACT",
  "SAT",
  "ACT",
  "IELTS",
  "TOEFL",
  "VSTEP",
];

const validSourceTypes: AtlasSourceType[] = [
  "official_website",
  "admission_scheme",
  "pdf",
  "manual",
];

type AtlasStorageData = {
  universities: AtlasUniversity[];
  sources: AtlasAdmissionSource[];
  programs: AtlasProgram[];
};

const emptyAtlasData: AtlasStorageData = {
  universities: [],
  sources: [],
  programs: [],
};

function loadAtlasStorage(): AtlasStorageData {
  if (typeof window === "undefined") return emptyAtlasData;

  try {
    const raw = localStorage.getItem(ATLAS_STORAGE_KEY);

    if (!raw) return emptyAtlasData;

    const parsed = JSON.parse(raw) as Partial<AtlasStorageData>;

    return {
      universities: Array.isArray(parsed.universities)
        ? parsed.universities
        : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
    };
  } catch {
    return emptyAtlasData;
  }
}

function saveAtlasStorage(data: AtlasStorageData) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ATLAS_STORAGE_KEY, JSON.stringify(data));
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createId(value: string) {
  return normalizeText(value) || `atlas-${Date.now()}`;
}

function getShortName(draft: GeminiAdmissionDraft) {
  const shortName = draft.shortName?.trim();

  if (shortName) return shortName.toUpperCase();

  const universityName = draft.universityName?.trim() || "ATLAS";

  return universityName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 8)
    .toUpperCase();
}

function getSourceType(value?: string): AtlasSourceType {
  const normalized = value?.trim().toLowerCase() || "";

  if (validSourceTypes.includes(normalized as AtlasSourceType)) {
    return normalized as AtlasSourceType;
  }

  if (normalized.includes("pdf")) return "pdf";

  if (
    normalized.includes("đề án") ||
    normalized.includes("de an") ||
    normalized.includes("de-an") ||
    normalized.includes("admission")
  ) {
    return "admission_scheme";
  }

  if (
    normalized.includes("website") ||
    normalized.includes("official") ||
    normalized.includes("chính thức") ||
    normalized.includes("chinh thuc")
  ) {
    return "official_website";
  }

  return "manual";
}

function getMethods(methods?: string[]): AtlasAdmissionMethod[] {
  if (!Array.isArray(methods)) return [];

  return Array.from(
    new Set(
      methods
        .map((method) => method.trim().toUpperCase())
        .filter((method): method is AtlasAdmissionMethod =>
          validAdmissionMethods.includes(method as AtlasAdmissionMethod)
        )
    )
  );
}

function getCombinations(combinations?: string[]) {
  if (!Array.isArray(combinations)) return [];

  return Array.from(
    new Set(
      combinations
        .map((combination) => combination.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

function cleanLabel(value?: string, fallback = "Chưa có dữ liệu") {
  const text = value?.trim();

  if (!text) return fallback;

  const normalized = text.toLowerCase();

  if (
    normalized.includes("chờ xác minh") ||
    normalized.includes("chưa xác minh") ||
    normalized.includes("cho xac minh") ||
    normalized.includes("chua xac minh")
  ) {
    return fallback;
  }

  return text;
}

function getStatusFromDraft(draft: GeminiAdmissionDraft): AtlasSourceStatus {
  const confidence = Number(draft.confidence) || 0;
  const hasSource = Boolean(draft.sourceUrl?.trim());
  const hasPrograms = Boolean(draft.programs?.length);

  if (hasSource && hasPrograms && confidence >= 50) {
    return "verified";
  }

  if (hasPrograms) {
    return "pending";
  }

  return "rejected";
}

function buildUniversityFromDraft({
  draft,
  universityId,
  sourceStatus,
}: {
  draft: GeminiAdmissionDraft;
  universityId: string;
  sourceStatus: AtlasSourceStatus;
}): AtlasUniversity {
  const universityName = cleanLabel(
    draft.universityName,
    "Trường chưa xác định"
  );

  return {
    id: universityId,
    name: universityName,
    shortName: getShortName(draft),
    region: "Việt Nam",
    website: draft.sourceUrl?.trim() || "",
    verified: sourceStatus === "verified",
  };
}

function buildSourceFromDraft({
  draft,
  sourceId,
  universityId,
  universityName,
  sourceYear,
  sourceStatus,
}: {
  draft: GeminiAdmissionDraft;
  sourceId: string;
  universityId: string;
  universityName: string;
  sourceYear: number;
  sourceStatus: AtlasSourceStatus;
}): AtlasAdmissionSource {
  return {
    id: sourceId,
    universityId,
    title:
      draft.sourceTitle?.trim() ||
      `${universityName} - dữ liệu tuyển sinh ${sourceYear}`,
    sourceType: getSourceType(draft.sourceType),
    sourceUrl: draft.sourceUrl?.trim() || "",
    sourceYear,
    extractedBy: "Gemini",
    status: sourceStatus,
    updatedAt: new Date().toISOString(),
  };
}

function buildProgramsFromDraft({
  draft,
  universityId,
  sourceId,
  sourceYear,
  sourceStatus,
}: {
  draft: GeminiAdmissionDraft;
  universityId: string;
  sourceId: string;
  sourceYear: number;
  sourceStatus: AtlasSourceStatus;
}): AtlasProgram[] {
  return (draft.programs || [])
    .map((program, index) => {
      const majorName = cleanLabel(program.majorName, "Chưa có dữ liệu");
      const majorCode = cleanLabel(program.majorCode, "Chưa có dữ liệu");

      return {
        id: createId(`${universityId}-${majorCode}-${majorName}-${index}`),
        universityId,
        majorName,
        majorCode,
        combinations: getCombinations(program.combinations),
        methods: getMethods(program.methods),
        tuitionLabel: cleanLabel(program.tuitionLabel),
        scholarshipLabel: cleanLabel(program.scholarshipLabel),
        sourceIds: [sourceId],
        sourceYear,
        status: sourceStatus,
      };
    })
    .filter((program) => program.majorName !== "Chưa có dữ liệu");
}

export function useAtlasKnowledge() {
  const initialData = useMemo(() => loadAtlasStorage(), []);

  const [universities, setUniversities] = useState<AtlasUniversity[]>(
    initialData.universities
  );
  const [sources, setSources] = useState<AtlasAdmissionSource[]>(
    initialData.sources
  );
  const [programs, setPrograms] = useState<AtlasProgram[]>(
    initialData.programs
  );

  useEffect(() => {
    saveAtlasStorage({
      universities,
      sources,
      programs,
    });
  }, [universities, sources, programs]);

  const universityMap = useMemo(() => {
    return universities.reduce<Record<string, AtlasUniversity>>(
      (map, university) => {
        map[university.id] = university;
        return map;
      },
      {}
    );
  }, [universities]);

  const stats = useMemo(() => {
    return getAtlasStats(universities, programs, sources);
  }, [universities, programs, sources]);

  function addGeminiDraft(draft: GeminiAdmissionDraft) {
    const universityName = cleanLabel(
      draft.universityName,
      "Trường chưa xác định"
    );

    const shortName = getShortName(draft);
    const sourceYear = Number(draft.sourceYear) || new Date().getFullYear();
    const sourceStatus = getStatusFromDraft(draft);

    const universityId = createId(`${shortName}-${universityName}`);
    const sourceId = createId(`${universityId}-gemini-source-${sourceYear}`);

    const university = buildUniversityFromDraft({
      draft,
      universityId,
      sourceStatus,
    });

    const source = buildSourceFromDraft({
      draft,
      sourceId,
      universityId,
      universityName,
      sourceYear,
      sourceStatus,
    });

    const nextPrograms = buildProgramsFromDraft({
      draft,
      universityId,
      sourceId,
      sourceYear,
      sourceStatus,
    });

    setUniversities((current) => {
      const withoutOld = current.filter((item) => item.id !== universityId);
      return [university, ...withoutOld];
    });

    setSources((current) => {
      const withoutOld = current.filter(
        (item) => item.universityId !== universityId
      );

      return [source, ...withoutOld];
    });

    setPrograms((current) => {
      const withoutOld = current.filter(
        (item) => item.universityId !== universityId
      );

      return [...nextPrograms, ...withoutOld];
    });
  }

  function clearAtlasData() {
    setUniversities([]);
    setSources([]);
    setPrograms([]);

    if (typeof window !== "undefined") {
      localStorage.removeItem(ATLAS_STORAGE_KEY);
    }
  }

  return {
    universities,
    sources,
    programs,
    stats,
    universityMap,
    addGeminiDraft,
    clearAtlasData,
  };
}