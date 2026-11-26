/**
 * CP58 — Guard a one-time, optional UI prefill from the verified Seed transcript.
 * The draft and the transcript subscribe to Firebase independently: either
 * can report data for an older account while Auth is switching. Never join
 * their contents unless both explicitly identify the same active UID.
 *
 * Empty transcripts and unsupported subjects must not consume the one-time
 * prefill; the next server-confirmed transcript update can still be used.
 * Prefilling is a convenience only: it does not persist data or attest to a
 * new observation. Student edits always take priority.
 */
export interface TranscriptPrefillState {
  draftOwnerUid: string;
  transcriptOwnerUid: string | null;
  draftStatus: string;
  transcriptStatus: string;
  seededOwnerUid: string | null;
  hasSupportedGrades: boolean;
  hasLocalEdits?: boolean;
}

export function canPrefillFromVerifiedTranscript(state: TranscriptPrefillState): boolean {
  return Boolean(
    state.draftOwnerUid &&
    state.transcriptOwnerUid === state.draftOwnerUid &&
    state.draftStatus === 'empty' &&
    state.transcriptStatus === 'ready' &&
    state.seededOwnerUid !== state.draftOwnerUid &&
    state.hasSupportedGrades &&
    !state.hasLocalEdits
  );
}

/**
 * ORION takes a one-time snapshot of the verified Seed curriculum and grades.
 * Existing drafts may be upgraded once: keep their values and fill only
 * missing subject scores. The persisted marker prevents later Seed changes
 * from silently overwriting the student's ORION copy.
 */
export interface SeedSnapshotImportState extends TranscriptPrefillState {
  hasSnapshotMarker: boolean;
}

export function canImportSeedSnapshotOnce(state: SeedSnapshotImportState): boolean {
  return Boolean(
    state.draftOwnerUid &&
    state.transcriptOwnerUid === state.draftOwnerUid &&
    (state.draftStatus === 'empty' || state.draftStatus === 'ready') &&
    state.transcriptStatus === 'ready' &&
    state.seededOwnerUid !== state.draftOwnerUid &&
    state.hasSupportedGrades &&
    !state.hasLocalEdits &&
    !state.hasSnapshotMarker
  );
}
