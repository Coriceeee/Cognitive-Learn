/**
 * CP70 — a shared, fail-closed boundary for Firestore closed-loop snapshots.
 * A server-acknowledged document is NOT proof that a student's self-report is true.
 */
import { isJourneyCycle, type JourneyCycle } from "./closedLoopJourney.ts";

export type JourneySnapshotMetadata = { fromCache: boolean; hasPendingWrites: boolean };
export type JourneySnapshotDocument = { id: string; data: unknown };
export type JourneySnapshotDecision =
  | { state: "WAITING_FOR_SERVER"; cycles: [] }
  | { state: "INVALID"; cycles: [] }
  | { state: "VERIFIED_EMPTY"; cycles: [] }
  | { state: "VERIFIED"; cycles: JourneyCycle[] };

/** No cached/pending value may reach cycle state or a student's next-action panel. */
export function assessJourneySnapshot(
  uid: string,
  records: readonly JourneySnapshotDocument[],
  metadata: JourneySnapshotMetadata,
): JourneySnapshotDecision {
  if (!uid || metadata.fromCache || metadata.hasPendingWrites) {
    return { state: "WAITING_FOR_SERVER", cycles: [] };
  }
  const validated: JourneyCycle[] = [];
  for (const record of records) {
    const value = record.data;
    if (!isJourneyCycle(value) || value.userId !== uid || record.id !== value.id) {
      return { state: "INVALID", cycles: [] };
    }
    validated.push(value);
  }
  return validated.length
    ? { state: "VERIFIED", cycles: validated }
    : { state: "VERIFIED_EMPTY", cycles: [] };
}
