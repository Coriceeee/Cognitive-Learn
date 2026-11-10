/**
 * CP23: read-only provenance checks for the current authenticated UID.
 * This is a data-lineage diagnostic, NOT a model evaluation or impact claim.
 * No Firestore document content, student names, or raw scores enter the result.
 */
export type PipelineStage = "seed" | "lumen" | "orion" | "pulse";
export type StageStatus = "MISSING" | "LIMITED" | "PRESENT" | "INVALID";

export type StageEvidence = {
  stage: PipelineStage;
  status: StageStatus;
  source: string;
  reason: string;
};

export type PipelineEvidence = {
  version: "cla-pipeline-evidence-v1";
  checkedAt: string;
  scope: "student" | "demo" | "unknown";
  complete: false; // This audit cannot prove an end-to-end workflow ran.
  history: { status: "NONE" | "SINGLE" | "MULTIPLE" | "INCONSISTENT"; count: number; source: string; reason: string };
  stages: StageEvidence[];
  notes: string[];
};

type DocumentName = "learning_profiles" | "student_transcripts" | "orion_drafts" | "pulse_drafts";
export type OwnDocuments = Partial<Record<DocumentName, unknown>> & { cognitive_history?: unknown };

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function validOwnership(data: Record<string, unknown>, uid: string): boolean {
  return data.userId === uid && data.schemaVersion === 1;
}
function isRealNumber(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value);
}
function stage(stage: PipelineStage, status: StageStatus, source: string, reason: string): StageEvidence {
  return { stage, status, source, reason };
}

/** Intentionally accepts only documents retrieved from the current user's UID. */
export function buildPipelineEvidence(uid: string, documents: OwnDocuments, checkedAt: string): PipelineEvidence {
  if (!uid.trim()) throw new Error("Current authenticated UID required");
  if (!Number.isFinite(Date.parse(checkedAt))) throw new Error("Invalid audit timestamp");
  const profile = object(documents.learning_profiles);
  const transcript = object(documents.student_transcripts);
  const orion = object(documents.orion_drafts);
  const pulse = object(documents.pulse_drafts);

  const scope: PipelineEvidence["scope"] = profile?.dataScope === "demo"
    ? "demo" : profile?.dataScope === "student" ? "student" : "unknown";

  let seed: StageEvidence;
  if (!profile || !transcript) {
    seed = stage("seed", "MISSING", "learning_profiles + student_transcripts",
      "Thiếu hồ sơ hoặc bảng điểm; chưa thể xác nhận dữ liệu Seed đồng bộ.");
  } else if (!validOwnership(profile, uid) || !validOwnership(transcript, uid)
    || profile.dataScope !== transcript.dataScope || !["student", "demo"].includes(String(profile.dataScope))) {
    seed = stage("seed", "INVALID", "learning_profiles + student_transcripts",
      "UID, schemaVersion hoặc dataScope không nhất quán; cần kiểm tra và sửa dữ liệu.");
  } else {
    seed = stage("seed", "PRESENT", "learning_profiles + student_transcripts",
      "Cả hai tài liệu cùng UID/schema/scope; chưa khẳng định bảng điểm đã đủ học kỳ.");
  }

  let lumen: StageEvidence;
  const cognitive = object(profile?.cognitiveMeasurement);
  if (!profile) {
    lumen = stage("lumen", "MISSING", "learning_profiles.cognitiveMeasurement", "Chưa có Seed Profile.");
  } else if (!validOwnership(profile, uid)) {
    lumen = stage("lumen", "INVALID", "learning_profiles.cognitiveMeasurement", "Hồ sơ sai UID hoặc schemaVersion.");
  } else if (!cognitive) {
    lumen = stage("lumen", "MISSING", "learning_profiles.cognitiveMeasurement", "Chưa có phép đo Cognitive được lưu.");
  } else if (cognitive.scoreAvailable === true && isRealNumber(cognitive.overallScore)
    && typeof cognitive.mappingVersion === "string" && cognitive.mappingVersion.length > 0) {
    lumen = stage("lumen", "PRESENT", "learning_profiles.cognitiveMeasurement",
      "Có proxy Cognitive và mappingVersion; chưa phải thang đo đã kiểm định tâm trắc.");
  } else {
    lumen = stage("lumen", "LIMITED", "learning_profiles.cognitiveMeasurement",
      "Có snapshot nhưng thiếu phép đo hợp lệ hoặc phiên bản mapping; không diễn giải số 0 kỹ thuật.");
  }

  function draftEvidence(name: "orion" | "pulse", data: Record<string, unknown> | null): StageEvidence {
    const source = `${name}_drafts`;
    if (!data) return stage(name, "MISSING", source, "Chưa có bản nháp được lưu.");
    if (!validOwnership(data, uid)) return stage(name, "INVALID", source, "Bản nháp sai UID hoặc schemaVersion.");
    return object(data.data)
      ? stage(name, "LIMITED", source, "Có bản nháp của UID hiện tại; chưa kiểm chứng đủ đầu vào và outcome.")
      : stage(name, "INVALID", source, "Bản nháp thiếu object data hợp lệ.");
  }
  const source = "learning_profiles/{ownUid}/cognitive_history";
  const allHistory = Array.isArray(documents.cognitive_history) ? documents.cognitive_history : [];
  const validHistory = allHistory.map(object).filter((record): record is Record<string, unknown> =>
    !!record && record.studentId === uid && record.scoreAvailable === true
      && typeof record.mappingVersion === "string" && record.mappingVersion.length > 0
      && typeof record.createdAt === "string" && Number.isFinite(Date.parse(record.createdAt)));
  const dates = new Set(validHistory.map(record => record.createdAt as string));
  const mappings = new Set(validHistory.map(record => record.mappingVersion as string));
  const history: PipelineEvidence["history"] = validHistory.length === 0
    ? { status: "NONE", count: 0, source, reason: "Chưa có snapshot Cognitive hợp lệ; không kết luận xu hướng." }
    : validHistory.length === 1
      ? { status: "SINGLE", count: 1, source, reason: "Một phép đo không đủ xác định xu hướng." }
      : dates.size < 2 || mappings.size > 1
        ? { status: "INCONSISTENT", count: validHistory.length, source, reason: "Thiếu thời điểm đo phân biệt hoặc khác mappingVersion; chưa được so sánh." }
        : { status: "MULTIPLE", count: validHistory.length, source, reason: "Có từ hai snapshot có thể đối chiếu về kỹ thuật; chưa xác nhận chất lượng đo hoặc tác động của CLA." };
  const stages = [seed, lumen, draftEvidence("orion", orion), draftEvidence("pulse", pulse)];
  const notes = [
    "Chỉ kiểm tra sự tồn tại và metadata từ Firestore theo UID; không tải hồ sơ người khác.",
    "Bản nháp Orion/Pulse không phải kết quả đo thực, bằng chứng cải thiện hay chứng cứ nhân quả.",
    "Cổng này không có quyền xác minh consent, kiểm định ML hoặc hiệu quả học tập.",
  ];
  if (scope === "demo") notes.unshift("DEMO: không sử dụng để tuyên bố kết quả nghiên cứu trên học sinh thực.");
  if (scope === "unknown") notes.unshift("Chưa xác nhận dataScope hợp lệ của hồ sơ.");
  return { version: "cla-pipeline-evidence-v1", checkedAt, scope, complete: false, history, stages, notes };
}
