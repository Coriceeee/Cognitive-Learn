import type { CognitiveResult } from "../cognitive/cognitiveEngine";
import type { StudentProfile } from "../../page/seed/types";

export type CognitiveSnapshot = {
  id: string;
  studentId: string;
  createdAt: string;
  overallScore: number;
  confidenceScore: number;
  riskLevel: CognitiveResult["riskLevel"];
  trend: CognitiveResult["trend"];
  SCI: number;
  MAS: number;
  CSL: number;
  GVI: number;
  BDI: number;
  FRI: number;
  CRI: number;
  gpaOverall: number;
  studyHoursPerWeek: number;
  practiceTestsPerWeek: number;
  planCompletionRate: number;
  motivationLevel: number;
  scoreAvailable?: boolean;
  dataCoverageScore?: number;
  missingDimensions?: string[];
  mappingVersion?: string;
};

export type CognitiveDimensionCode =
  | "SCI"
  | "MAS"
  | "CSL"
  | "GVI"
  | "BDI"
  | "FRI"
  | "CRI";

export type CognitiveChange = {
  code: CognitiveDimensionCode;
  previous: number;
  current: number;
  delta: number;
  direction: "UP" | "DOWN" | "STABLE";
  magnitude: "SMALL" | "MODERATE" | "LARGE";
};

export type CognitiveTrendSummary = {
  overallDelta: number;
  overallDirection: "UP" | "DOWN" | "STABLE";
  changes: CognitiveChange[];
  improving: CognitiveChange[];
  declining: CognitiveChange[];
  stable: CognitiveChange[];
};

export type CognitiveGrowth = {
  current: CognitiveSnapshot;
  previous: CognitiveSnapshot | null;
  trend: CognitiveTrendSummary;
};

export type CognitiveHistoryInput = {
  studentId: string;
  profile: StudentProfile;
  cognitive: CognitiveResult;
  id?: string;
  createdAt?: string;
};
