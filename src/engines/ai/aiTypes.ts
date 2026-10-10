import type {
  CognitiveResult,
} from "../../page/seed/types";


export type AIContextSource =
  | "COGNITIVE"
  | "HISTORY"
  | "ADMISSION"
  | "PROFILE"
  | "BEHAVIOR";


export type AIConfidenceLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";


export type AIInsightType =
  | "STRENGTH"
  | "RISK"
  | "OPPORTUNITY"
  | "WARNING"
  | "RECOMMENDATION";



export interface AIStudentContext {

  profile: {

    fullName:string;

    className:string;

    targetMajor:string;

    targetUniversity:string;

  };


  cognitive:

    CognitiveResult;


  history?: {

    growthStatus?:string;

    growthMessage?:string;

    trajectory?: {

      direction:string;

      confidence:number;

    };

  };


  admission?: {

    targetMajor?:string;

    bestMethod?:string;

    riskLevel?:string;

  };


  behavior?: {

    studyHoursPerWeek?:number;

    practiceTestsPerWeek?:number;

    motivationLevel?:number;

    planCompletionRate?:number;

  };

}



export interface AIReasoningInput {

  context:

    AIStudentContext;


  question:

    string;


  sources:

    AIContextSource[];

}



export interface AIInsight {

  type:

    AIInsightType;


  title:

    string;


  description:

    string;


  evidence:

    string[];


  confidence:

    number;


  confidenceLevel:

    AIConfidenceLevel;

}



export interface AIRecommendation {

  action:

    string;


  reason:

    string;


  priority:

    "HIGH"
    | "MEDIUM"
    | "LOW";


}



export interface AIReasoningResult {

  summary:

    string;


  insights:

    AIInsight[];


  recommendations:

    AIRecommendation[];


  confidence:

    number;

}



export interface AIExplanation {

  decision:

    string;


  reasoning:

    string[];


  evidence:

    string[];

}