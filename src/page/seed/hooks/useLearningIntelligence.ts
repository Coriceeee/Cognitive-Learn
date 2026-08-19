import { useMemo } from "react";


import type {
  StudentProfile,
  CognitiveResult,
} from "../types";


import {
  predictLearningOutcome,
} from "../../../engines/prediction/predictionEngine";


import type {
  PredictionInput,
} from "../../../engines/prediction/predictionTypes";


import {
  generateScenarios,
} from "../../../engines/simulation/orion/scenarioGenerator";


import {
  runSimulation,
} from "../../../engines/simulation/orion/simulationEngine";


import type {
  SimulationInput,
} from "../../../engines/simulation/simulationTypes";


import {
  optimizeLearningStrategy,
} from "../../../engines/simulation/chronos/chronosEngine";





export function useLearningIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult
) {



  return useMemo(() => {




    const predictionInput: PredictionInput = {

      currentScore:
        profile.gpaOverall,


      targetScore:
        9,


      cognitiveVector: {

        SCI:
          cognitive.SCI,


        MAS:
          cognitive.MAS,


        CSL:
          cognitive.CSL,


        GVI:
          cognitive.GVI,


        BDI:
          cognitive.BDI,


        FRI:
          cognitive.FRI,


        CRI:
          cognitive.CRI,

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





    const simulationInput:
      SimulationInput = {


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






    return {


      prediction,


      simulation,


      optimization,


    };



  }, [
    profile,
    cognitive
  ]);

}