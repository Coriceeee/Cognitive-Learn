/**
 * CP24: privacy-minimized, append-only technical provenance record.
 * This records source presence and metadata, NOT assessment scores or outcomes.
 * Firestore path encodes owner UID; document body intentionally omits it.
 */
import type { PipelineEvidence, PipelineStage, StageStatus } from "./pipelineEvidence";

export type PersistedPipelineEvidence = {
  schemaVersion: 1;
  evidenceVersion: "cla-pipeline-evidence-v1";
  recordType: "technical-lineage";
  dataScope: "student" | "demo";
  checkedAt: string;
  complete: false;
  stages: Record<PipelineStage, StageStatus>;
  historyStatus: PipelineEvidence["history"]["status"];
  historyCount: number;
};

const expected = ["seed", "lumen", "orion", "pulse"] as const;
const allowedStatuses: ReadonlySet<string> = new Set(["MISSING", "LIMITED", "PRESENT", "INVALID"]);
const allowedHistory: ReadonlySet<string> = new Set(["NONE", "SINGLE", "MULTIPLE", "INCONSISTENT"]);

export function buildPersistedPipelineEvidence(result: PipelineEvidence): PersistedPipelineEvidence {
  if (result.version !== "cla-pipeline-evidence-v1" || result.complete !== false) {
    throw new Error("Không cho lưu hồ sơ tuyên bố hoàn tất luồng chưa được xác minh.");
  }
  if (result.scope !== "student" && result.scope !== "demo") {
    throw new Error("Không thể lưu hồ sơ có dataScope chưa xác định.");
  }
  if (typeof result.checkedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result.checkedAt)
    || !Number.isFinite(Date.parse(result.checkedAt))) {
    throw new Error("Timestamp kiểm tra nguồn không hợp lệ.");
  }
  if (!Array.isArray(result.stages) || result.stages.length !== 4) {
    throw new Error("Thiếu bốn nguồn dữ liệu yêu cầu.");
  }
  const stages = {} as Record<PipelineStage, StageStatus>;
  for (const name of expected) {
    const matches = result.stages.filter(item => item.stage === name);
    if (matches.length !== 1 || !allowedStatuses.has(matches[0].status)) {
      throw new Error(`Nguồn ${name} bị trùng hoặc có trạng thái không hợp lệ.`);
    }
    stages[name] = matches[0].status;
  }
  const history = result.history;
  if (!allowedHistory.has(history.status) || !Number.isInteger(history.count) || history.count < 0 || history.count > 10
    || (history.status === "NONE" && history.count !== 0)
    || (history.status === "SINGLE" && history.count !== 1)
    || (["MULTIPLE", "INCONSISTENT"].includes(history.status) && history.count < 2)) {
    throw new Error("Metadata lịch sử Cognitive không nhất quán.");
  }
  // Whitelist: all freeform reason/source/notes plus any scores/names/UIDs are discarded.
  return {
    schemaVersion: 1,
    evidenceVersion: "cla-pipeline-evidence-v1",
    recordType: "technical-lineage",
    dataScope: result.scope,
    checkedAt: result.checkedAt,
    complete: false,
    stages,
    historyStatus: history.status,
    historyCount: history.count,
  };
}
