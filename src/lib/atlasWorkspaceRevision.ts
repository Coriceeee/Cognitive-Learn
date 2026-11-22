/** CP69: compare-and-swap token for the entire Atlas workspace document.
 * Reuse the draft revision implementation, but sign the three top-level
 * collections as one payload. Old revision-less documents stay readable and
 * may be migrated on their first transactional write.
 */
import { draftVersion, type DraftVersion } from './draftRevision';

export type AtlasWorkspacePayload = {
  universities: unknown[];
  sources: unknown[];
  programs: unknown[];
};

export function atlasWorkspacePayload(raw: Record<string, unknown> | null): AtlasWorkspacePayload {
  return {
    universities: Array.isArray(raw?.universities) ? raw.universities : [],
    sources: Array.isArray(raw?.sources) ? raw.sources : [],
    programs: Array.isArray(raw?.programs) ? raw.programs : [],
  };
}

export function atlasWorkspaceVersion(raw: Record<string, unknown> | null): DraftVersion {
  if (!raw) return draftVersion(null);
  return draftVersion({
    revision: raw.revision,
    updatedAt: raw.updatedAt,
    data: atlasWorkspacePayload(raw),
  });
}
