import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import { useEffect, useMemo, useRef, useState } from "react";
import { isMatchingAccountRecord, isServerConfirmedSnapshot } from "../../seed/services/realtimeReadPolicy";
import { atlasWorkspacePayload, atlasWorkspaceVersion } from "../../../lib/atlasWorkspaceRevision";
import { assertDraftUnchanged, draftPayloadSignature, type DraftVersion } from "../../../lib/draftRevision";
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

function loadAtlasStorage(ownerUid: string): AtlasStorageData {
  if (typeof window === "undefined" || !ownerUid) return emptyAtlasData;

  try {
    const raw = window.localStorage.getItem(ATLAS_STORAGE_KEY);

    if (!raw) return emptyAtlasData;

    const parsed = JSON.parse(raw) as Partial<AtlasStorageData> & { userId?: unknown };
    // Older unscoped localStorage entries cannot prove which student owns them.
    // Never offer to import such data into the currently authenticated account.
    if (parsed.userId !== ownerUid) return emptyAtlasData;

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

function getStatusFromDraft(
  draft: GeminiAdmissionDraft
): AtlasSourceStatus {
  const hasPrograms =
    Boolean(
      draft.programs?.length
    );

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
  const [universities, setUniversities] = useState<AtlasUniversity[]>([]);
  const [sources, setSources] = useState<AtlasAdmissionSource[]>([]);
  const [programs, setPrograms] = useState<AtlasProgram[]>([]);
  const [uid, setUid] = useState("");
  const [storageStatus, setStorageStatus] = useState<"loading" | "syncing" | "ready" | "error" | "signed-out">("loading");
  const [storageError, setStorageError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const authEpoch = useRef(0);
  const lastVerified = useRef<{ uid: string; version: DraftVersion } | null>(null);
  const legacyAvailable = useMemo(() => {
    const data = loadAtlasStorage(uid);
    return data.universities.length + data.sources.length + data.programs.length > 0;
  }, [uid]);

  useEffect(() => {
    let mounted = true;
    let stopDoc: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, user => {
      if (!mounted || (user?.uid ?? null) !== (auth.currentUser?.uid ?? null)) return;
      stopDoc?.(); stopDoc = undefined;
      const epoch = ++authEpoch.current;
      const owner = user?.uid ?? "";
      const current = () => mounted && epoch === authEpoch.current && auth.currentUser?.uid === owner;
      lastVerified.current = null;
      setUid(owner);
      setUniversities([]); setSources([]); setPrograms([]);
      setStorageError("");
      if (!user) { setStorageStatus("signed-out"); return; }
      setStorageStatus("loading");
      stopDoc = onSnapshot(doc(db, "atlas_workspaces", owner), { includeMetadataChanges: true }, snapshot => {
        if (!current()) return;
        if (!isServerConfirmedSnapshot(snapshot.metadata)) {
          // Cached documents and pending writes must never create a trusted CAS baseline.
          if (!lastVerified.current || lastVerified.current.uid !== owner) {
            setUniversities([]); setSources([]); setPrograms([]);
          }
          setStorageStatus("syncing"); return;
        }
        const raw = snapshot.exists() ? snapshot.data() : null;
        if (raw && (!isMatchingAccountRecord(raw, owner) ||
          (raw.schemaVersion !== undefined && raw.schemaVersion !== 1) ||
          !Array.isArray(raw.universities) || !Array.isArray(raw.sources) || !Array.isArray(raw.programs))) {
          lastVerified.current = null;
          setUniversities([]); setSources([]); setPrograms([]);
          setStorageStatus("error");
          setStorageError("Kho Atlas sai chủ sở hữu hoặc cấu trúc dữ liệu; đã ngừng đồng bộ để bảo vệ hồ sơ.");
          return;
        }
        const payload = atlasWorkspacePayload(raw);
        lastVerified.current = { uid: owner, version: atlasWorkspaceVersion(raw) };
        setUniversities(payload.universities as AtlasUniversity[]);
        setSources(payload.sources as AtlasAdmissionSource[]);
        setPrograms(payload.programs as AtlasProgram[]);
        setStorageError("");
        setStorageStatus("ready");
      }, error => {
        if (!current()) return;
        lastVerified.current = null;
        setUniversities([]); setSources([]); setPrograms([]);
        setStorageStatus("error");
        setStorageError(error.code === "permission-denied"
          ? "Không có quyền đọc Atlas từ Firestore. Cần kiểm tra Security Rules."
          : "Không thể kết nối Atlas Knowledge Base đến Firestore.");
      });
    }, () => { if (mounted) { setStorageStatus("error"); setStorageError("Firebase Auth không hoạt động."); } });
    return () => { mounted = false; authEpoch.current++; lastVerified.current = null; stopDoc?.(); stopAuth(); };
  }, []);

  async function persist(data: AtlasStorageData) {
    const owner = uid;
    const verified = lastVerified.current;
    if (!owner || auth.currentUser?.uid !== owner || storageStatus !== "ready" ||
        !verified || verified.uid !== owner || savingRef.current)
      throw new Error("Atlas chưa được máy chủ xác minh hoặc đang lưu; không ghi đè dữ liệu.");
    const uiSignature = draftPayloadSignature({ universities, sources, programs });
    // An onSnapshot callback may have advanced the baseline before React commits
    // the associated render. Do not merge an older UI payload with a new version.
    if (verified.version.exists && verified.version.payloadSignature !== uiSignature)
      throw new Error("Dữ liệu Atlas vừa thay đổi. Hãy xem phiên bản mới trước khi lưu.");
    const expected = verified.version;
    const epoch = authEpoch.current;
    const current = () => epoch === authEpoch.current && auth.currentUser?.uid === owner;
    savingRef.current = true; setSaving(true); setStorageError("");
    try {
      await runTransaction(db, async transaction => {
        if (!current()) throw new Error("Phiên tài khoản đã thay đổi trước khi lưu Atlas.");
        const ref = doc(db, "atlas_workspaces", owner);
        const latest = await transaction.get(ref);
        if (!current()) throw new Error("Phiên tài khoản đã thay đổi trong lúc lưu Atlas.");
        const raw = latest.exists() ? latest.data() : null;
        if (raw && !isMatchingAccountRecord(raw, owner))
          throw new Error("Dữ liệu Atlas trên máy chủ không khớp tài khoản.");
        assertDraftUnchanged(expected, atlasWorkspaceVersion(raw));
        transaction.set(ref, {
          userId: owner, schemaVersion: 1, revision: expected.revision + 1,
          universities: data.universities, sources: data.sources, programs: data.programs,
          updatedAt: serverTimestamp(),
        });
      });
      // Realtime listener only trusts a new server-confirmed snapshot.
    } catch (error) {
      if (current()) setStorageError(error instanceof Error ? error.message : "Lưu Firestore thất bại.");
      throw error;
    } finally {
      savingRef.current = false;
      if (current()) setSaving(false);
    }
  }

  async function importLegacyAtlasData() {
    if (!legacyAvailable) return;
    if (universities.length || sources.length || programs.length) {
      throw new Error("Atlas trên Firestore đã có dữ liệu. Không thể tự động ghi đè bằng bản local cũ.");
    }
    await persist(loadAtlasStorage(uid));
  }

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

  async function addGeminiDraft(draft: GeminiAdmissionDraft) {
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

    await persist({
      universities: [university, ...universities.filter(item => item.id !== universityId)],
      sources: [source, ...sources.filter(item => item.universityId !== universityId)],
      programs: [...nextPrograms, ...programs.filter(item => item.universityId !== universityId)],
    });
  }

  async function clearAtlasData() {
    await persist(emptyAtlasData);
  }

  return {
    universities,
    sources,
    programs,
    stats,
    universityMap,
    addGeminiDraft,
    clearAtlasData,
    importLegacyAtlasData,
    legacyAvailable,
    storageStatus,
    storageError,
    saving,
  };
}