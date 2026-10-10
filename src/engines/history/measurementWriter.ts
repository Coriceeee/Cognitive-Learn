import {
  saveCognitiveSnapshot,
} from "./cognitiveHistoryRepository";

import {
  validateMeasurementEvent,
} from "./measurementEventEngine";

import type {
  MeasurementRecordInput,
} from "./measurementEventTypes";

export async function writeMeasurementSnapshot(
  input: MeasurementRecordInput
) {
  const decision =
    validateMeasurementEvent(input.event);

  if (!decision.accepted) {
    return {
      saved: false,
      decision,
    };
  }

  const saved =
    await saveCognitiveSnapshot({
      ...input,
      id: input.event.id,
      createdAt: input.event.occurredAt,
    });

  return {
    saved: true,
    decision,
    event: input.event,
    snapshot: saved,
  };
}
