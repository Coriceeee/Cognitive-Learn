import type { CognitiveResult } from "../cognitive/cognitiveEngine";
import type { StudentProfile } from "../../page/seed/types";
import type {
  CognitiveHistoryInput,
  CognitiveSnapshot,
} from "./cognitiveHistoryTypes";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createSnapshotId(studentId: string, createdAt: string) {
  return `${studentId}_${createdAt.replace(/[^0-9]/g, "")}`;
}

export function createCognitiveSnapshot(
  input: CognitiveHistoryInput
): CognitiveSnapshot {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: input.id ?? createSnapshotId(input.studentId, createdAt),
    studentId: input.studentId,
    createdAt,
    overallScore: clamp(input.cognitive.overallScore),
    confidenceScore: clamp(input.cognitive.confidenceScore),
    riskLevel: input.cognitive.riskLevel,
    trend: input.cognitive.trend,
    SCI: clamp(input.cognitive.SCI),
    MAS: clamp(input.cognitive.MAS),
    CSL: clamp(input.cognitive.CSL),
    GVI: clamp(input.cognitive.GVI),
    BDI: clamp(input.cognitive.BDI),
    FRI: clamp(input.cognitive.FRI),
    CRI: clamp(input.cognitive.CRI),
    gpaOverall: input.profile.gpaOverall,
    studyHoursPerWeek: input.profile.studyHoursPerWeek,
    practiceTestsPerWeek: input.profile.practiceTestsPerWeek,
    planCompletionRate: input.profile.planCompletionRate,
    motivationLevel: input.profile.motivationLevel,
    scoreAvailable: input.cognitive.scoreAvailable ?? true,
    ...(input.cognitive.dataCoverageScore !== undefined
      ? { dataCoverageScore: input.cognitive.dataCoverageScore } : {}),
    ...(input.cognitive.missingDimensions !== undefined
      ? { missingDimensions: input.cognitive.missingDimensions } : {}),
    ...(input.cognitive.mappingVersion !== undefined
      ? { mappingVersion: input.cognitive.mappingVersion } : {}),
  };
}

export function createSnapshotFromResult(
  studentId: string,
  profile: StudentProfile,
  cognitive: CognitiveResult
) {
  return createCognitiveSnapshot({
    studentId,
    profile,
    cognitive,
  });
}
