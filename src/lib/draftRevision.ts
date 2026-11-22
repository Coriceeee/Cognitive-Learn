/**
 * Draft concurrency token for user-owned Firestore documents.
 * Revision is monotonic for CP52+ clients. A versioned draft uses its
 * revision + canonical payload as the concurrency token: Firestore may
 * deliver a locally estimated/null serverTimestamp and later the resolved
 * server timestamp without any actual document edit. Treating this metadata
 * transition as a content conflict would prevent legitimate subsequent saves.
 * Legacy revision-less drafts still include updatedAt to catch ABA edits.
 */
export interface DraftVersion {
  exists: boolean;
  revision: number;
  signature: string;
  // An acknowledged write knows its payload before the server timestamp resolves.
  // Keep checking the payload even when timestamp-based signature is unknown.
  payloadSignature?: string;
}

function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(String(value));
}

export function draftPayloadSignature(value: unknown): string {
  return canonical(value ?? null);
}

function timestampToken(value: unknown): string {
  if (value && typeof value === "object") {
    const stamp = value as { seconds?: unknown; nanoseconds?: unknown };
    if (typeof stamp.seconds === "number" && typeof stamp.nanoseconds === "number") {
      return `${stamp.seconds}:${stamp.nanoseconds}`;
    }
  }
  return canonical(value ?? null);
}

export function draftVersion(data: Record<string, unknown> | null): DraftVersion {
  if (!data) return { exists: false, revision: 0, signature: "" };
  const revision = typeof data.revision === "number" && Number.isSafeInteger(data.revision) && data.revision >= 0
    ? data.revision : 0;
  return {
    exists: true,
    revision,
    // Server timestamps may transition from null/local estimate to resolved.
    // Only legacy records need timestamp-based ABA detection; revisioned
    // records rely on revision + payload, both stable across that transition.
    signature: revision === 0
      ? `${timestampToken(data.updatedAt)}|${canonical(data.data ?? null)}`
      : draftPayloadSignature(data.data),
    payloadSignature: draftPayloadSignature(data.data),
  };
}

export class DraftConflictError extends Error {
  constructor() {
    super("Bản nháp đã được thay đổi trên thiết bị khác. Nội dung đang sửa vẫn được giữ; chọn ‘Tải bản mới nhất’ nếu muốn bỏ thay đổi cục bộ.");
    this.name = "DraftConflictError";
  }
}

export function assertDraftUnchanged(expected: DraftVersion, actual: DraftVersion): void {
  if (expected.exists !== actual.exists || expected.revision !== actual.revision ||
      (expected.signature !== "" && expected.signature !== actual.signature) ||
      (expected.payloadSignature !== undefined && expected.payloadSignature !== actual.payloadSignature)) {
    throw new DraftConflictError();
  }
}
