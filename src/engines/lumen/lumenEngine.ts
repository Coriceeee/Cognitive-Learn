import type {
  StudentProfile,
  CognitiveResult,
} from "../../page/seed/types";

import type { CognitiveGrowthAnalytics } from "../history/cognitiveGrowthAnalytics";

import {
  predictLearningOutcome,
} from "../prediction/predictionEngine";

import type {
  PredictionInput,
} from "../prediction/predictionTypes";

import {
  generateScenarios,
} from "../simulation/orion/scenarioGenerator";

import {
  runSimulation,
} from "../simulation/orion/simulationEngine";

import type {
  SimulationInput,
} from "../simulation/simulationTypes";

import {
  optimizeLearningStrategy,
} from "../simulation/chronos/chronosEngine";

import {
  calculateCareerIntelligence,
} from "../career/careerEngine";

/**
 * A descriptive comparison of actual saved measurements.
 * This is NOT a model prediction, intervention effect or calibrated confidence.
 * A single snapshot never qualifies as Growth evidence.
 */
export type LumenGrowthEvidence = {
  status: "NO_COMPARISON" | "LIMITED" | "OBSERVED";
  dataQuality: CognitiveGrowthAnalytics["dataQuality"];
  observationDays: number;
  overallDelta: number | null;
  growthStatus: CognitiveGrowthAnalytics["growthStatus"] | null;
  message: string;
  improvingDimensions: string[];
  decliningDimensions: string[];
};

export function getLumenGrowthEvidence(
  growth: CognitiveGrowthAnalytics | null | undefined
): LumenGrowthEvidence {
  const noComparison =
    !growth ||
    growth.overall.previous === null ||
    growth.observationDays <= 0 ||
    growth.dimensions.length === 0;

  if (noComparison) {
    return {
      status: "NO_COMPARISON",
      dataQuality: "LIMITED",
      observationDays: 0,
      overallDelta: null,
      growthStatus: null,
      message: "Chưa có hai phép đo Cognitive hợp lệ để so sánh theo thời gian.",
      improvingDimensions: [],
      decliningDimensions: [],
    };
  }

  const status = growth.dataQuality === "LIMITED" ? "LIMITED" : "OBSERVED";
  return {
    status,
    dataQuality: growth.dataQuality,
    observationDays: growth.observationDays,
    overallDelta: Number.isFinite(growth.overall.delta)
      ? growth.overall.delta
      : null,
    // Do not treat a short or incomplete observation window as a reliable trend.
    growthStatus: status === "OBSERVED" ? growth.growthStatus : null,
    message: status === "OBSERVED"
      ? `${growth.growthMessage} Đây mới là biến động quan sát, chưa chứng minh quan hệ nhân quả.`
      : "Đã có dữ liệu so sánh nhưng khoảng quan sát hoặc số chiều đo còn hạn chế; chưa kết luận xu hướng.",
    improvingDimensions: growth.improving.map((item) => item.code),
    decliningDimensions: growth.declining.map((item) => item.code),
  };
}

export function calculateLumenIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult,
  growth?: CognitiveGrowthAnalytics | null
) {
  const predictionInput: PredictionInput = {
    currentScore: profile.gpaOverall,
    targetScore: 9,
    cognitiveVector: {
      SCI: cognitive.SCI,
      MAS: cognitive.MAS,
      CSL: cognitive.CSL,
      GVI: cognitive.GVI,
      BDI: cognitive.BDI,
      FRI: cognitive.FRI,
      CRI: cognitive.CRI,
    },
    studyHoursPerWeek:
      profile.studyHoursPerWeek,
    completionRate:
      profile.planCompletionRate,
  };

  const prediction =
    predictLearningOutcome(
      predictionInput
    );

  const simulationInput: SimulationInput = {
    currentScore:
      predictionInput.currentScore,
    targetScore:
      predictionInput.targetScore,
    cognitiveVector:
      predictionInput.cognitiveVector,
    studyHoursPerWeek:
      predictionInput.studyHoursPerWeek,
    completionRate:
      predictionInput.completionRate,
  };

  const scenarios =
    generateScenarios();

  const simulation =
    runSimulation(
      simulationInput,
      scenarios
    );

  const optimization =
    optimizeLearningStrategy(
      cognitive.vector,
      prediction,
      {
        targetScore:
          predictionInput.targetScore,
        targetSubject:
          profile.targetMajor,
      }
    );

  const career =
    calculateCareerIntelligence(
      profile,
      cognitive
    );

  return {
    cognitive,
    prediction,
    simulation,
    optimization,
    career,
    // Observed Growth does not alter prediction/simulation coefficients.
    growthEvidence: getLumenGrowthEvidence(growth),
  };
}
