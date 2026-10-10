import {
  analyzeCognitiveProfile,
  buildLumenDecision,
} from "../../../engines/lumen/lumenIntelligenceEngine";

import {
  runAIOrchestrator,
} from "../../../engines/ai/aiOrchestrator";

import {
  runOrionStrategy,
} from "../../../lib/orionStrategyEngine";

import {
  adaptOrionStrategyToLumen,
  type LumenStrategyView,
} from "../../../engines/lumen/lumenStrategyAdapter";



function buildAIContext(
  profile:any,
  cognitive:any
){
  return {
    profile:{
      fullName:
        profile.fullName ?? "Học sinh",

      className:
        profile.className ?? "",

      targetMajor:
        profile.targetMajor ?? "",

      targetUniversity:
        profile.targetUniversity ?? "",
    },

    cognitive,

    history:
      cognitive.history ?? undefined,

    behavior:{
      studyHoursPerWeek:
        profile.studyHoursPerWeek,

      practiceTestsPerWeek:
        profile.practiceTestsPerWeek,

      motivationLevel:
        profile.motivationLevel,

      planCompletionRate:
        profile.planCompletionRate,
    },
  };
}



function buildOrionStrategy(
  profile:any
):LumenStrategyView | undefined {

  if(
    !Array.isArray(
      profile.orionSubjects
    )
    ||
    profile.orionSubjects.length === 0
    ||
    !profile.orionWeeksLeft
  ){
    return undefined;
  }

  const result =
    runOrionStrategy({
      subjects:
        profile.orionSubjects,

      weeksLeft:
        profile.orionWeeksLeft,

      targetMajor:
        profile.targetMajor,
    });

  return adaptOrionStrategyToLumen(
    result
  );
}



export function useLumenIntelligence(
  profile:any,
  cognitive:any
){

  const insights =
    analyzeCognitiveProfile(
      cognitive
    );



  const decision =
    buildLumenDecision(
      insights
    );



  const aiContext =
    buildAIContext(
      profile,
      cognitive
    );



  const ai =
    runAIOrchestrator(
      aiContext,
      "Phân tích tổng quan năng lực, xu hướng phát triển và chiến lược học tập phù hợp cho học sinh."
    );



  const strategy =
    buildOrionStrategy(
      profile
    );



  return {

    profile,

    cognitive,

    insights,

    decision,

    strategy,

    ai:{
      reasoning:
        ai.reasoning,

      explanation:
        ai.explanation,

      prompt:
        ai.prompt,
    },

  };
}