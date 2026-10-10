import type {
  StudentProfile,
  CognitiveResult,
} from "../../page/seed/types";

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

export function calculateLumenIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult
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
  };
}
