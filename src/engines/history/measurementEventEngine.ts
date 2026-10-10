import type {
  MeasurementDecision,
  MeasurementEvent,
  MeasurementEventType,
} from "./measurementEventTypes";

const SUPPORTED_EVENTS: MeasurementEventType[] = [
  "COGNITIVE_ASSESSMENT",
  "PERIODIC_REVIEW",
  "INTERVENTION_OUTCOME",
  "CAREER_REASSESSMENT",
];

export function validateMeasurementEvent(
  event: MeasurementEvent
): MeasurementDecision {
  if (!event.studentId.trim()) {
    return {
      accepted: false,
      reason: "INVALID_STUDENT",
    };
  }

  if (!event.id.trim()) {
    return {
      accepted: false,
      reason: "INVALID_EVENT",
    };
  }

  if (!SUPPORTED_EVENTS.includes(event.type)) {
    return {
      accepted: false,
      reason: "UNSUPPORTED_EVENT",
    };
  }

  const occurredAt = new Date(event.occurredAt);

  if (Number.isNaN(occurredAt.getTime())) {
    return {
      accepted: false,
      reason: "INVALID_TIMESTAMP",
    };
  }

  return {
    accepted: true,
    reason: "VALID_EVENT",
  };
}

export function createMeasurementEvent(
  studentId: string,
  type: MeasurementEventType,
  source: MeasurementEvent["source"],
  reason?: string,
  assessmentVersion?: string
): MeasurementEvent {
  const occurredAt = new Date().toISOString();

  return {
    id: `${studentId}_${type}_${occurredAt.replace(/[^0-9]/g, "")}`,
    studentId,
    type,
    occurredAt,
    source,
    reason,
    assessmentVersion,
  };
}
