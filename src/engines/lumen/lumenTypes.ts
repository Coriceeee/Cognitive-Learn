export type LumenInsightLevel =
  | "STRENGTH"
  | "BALANCED"
  | "RISK";


export interface LumenInsight {

  dimension: string;

  score: number;

  level: LumenInsightLevel;

  title: string;

  description: string;

  recommendation: string;

}



export interface LumenDecision {

  learningStrategy: string[];

  strengths: string[];

  risks: string[];

  summary: string;

}