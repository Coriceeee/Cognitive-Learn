import type {
  AIStudentContext,
  AIReasoningResult,
  AIExplanation,
} from "./aiTypes";

import {
  buildAIPrompt,
} from "./promptEngine";

import {
  analyzeStudentContext,
} from "./reasoningEngine";

import {
  explainAIResult,
} from "./explanationEngine";



export interface AIOrchestratorResult {

  prompt: {

    system:string;

    user:string;

    contextSummary:string;

  };


  reasoning:
    AIReasoningResult;


  explanation:
    AIExplanation;


  generatedAt:string;

}




export function runAIOrchestrator(
  context:AIStudentContext,
  question:string
):AIOrchestratorResult {



  const prompt =
    buildAIPrompt(
      context,
      question
    );



  const reasoning =
    analyzeStudentContext(
      context
    );



  const explanation =
    explainAIResult(
      reasoning
    );



  return {


    prompt,


    reasoning,


    explanation,


    generatedAt:
      new Date()
        .toISOString(),

  };

}





export function createAIStudentReport(
  context:AIStudentContext
){


  const result =
    runAIOrchestrator(
      context,
      "Hãy phân tích tổng quan năng lực và chiến lược phát triển của học sinh."
    );



  return {

    summary:
      result.reasoning.summary,


    insights:
      result.reasoning.insights,


    recommendations:
      result.reasoning.recommendations,


    explanation:
      result.explanation,

  };

}