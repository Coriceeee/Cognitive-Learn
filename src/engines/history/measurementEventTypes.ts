import type {
  CognitiveHistoryInput,
  CognitiveSnapshot,
} from "./cognitiveHistoryTypes";

export type MeasurementEventType =
  | "COGNITIVE_ASSESSMENT"
  | "PERIODIC_REVIEW"
  | "INTERVENTION_OUTCOME"
  | "CAREER_REASSESSMENT";

export type MeasurementEvent = {
  id: string;
  studentId: string;
  type: MeasurementEventType;
  occurredAt: string;
  source: "STUDENT" | "SYSTEM" | "RESEARCH";
  reason?: string;
  assessmentVersion?: string;
};

export type MeasurementRecordInput = CognitiveHistoryInput & {
  event: MeasurementEvent;
};

export type MeasurementRecord = {
  event: MeasurementEvent;
  snapshot: CognitiveSnapshot;
};

export type MeasurementDecision = {
  accepted: boolean;
  reason:
    | "VALID_EVENT"
    | "INVALID_STUDENT"
    | "INVALID_EVENT"
    | "UNSUPPORTED_EVENT"
    | "INVALID_TIMESTAMP";
};
