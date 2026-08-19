export type StrategyRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH";



export type StrategyType =
  | "CONSISTENCY_FIRST"
  | "FATIGUE_RECOVERY"
  | "PERFORMANCE_ACCELERATION"
  | "STRATEGY_IMPROVEMENT";




export interface CognitiveState {

  SCI:number;

  MAS:number;

  CSL:number;

  GVI:number;

  BDI:number;

  FRI:number;

  CRI:number;

}




export interface LearningGoal {

  targetScore:number;

  targetSubject?:string;

  deadlineWeeks?:number;

}




export interface PredictionState {


  predictedScore:number;

  achievementProbability:number;

  stability:number;

  risk:
  | "LOW"
  | "MEDIUM"
  | "HIGH";


}




export interface LearningStrategy {


  id:string;


  type:StrategyType;


  name:string;


  description:string;



  cognitiveChanges:Partial<CognitiveState>;



  expectedGain:number;


  risk:StrategyRisk;


}




export interface OptimizationResult {


  recommendedStrategy:LearningStrategy;


  utilityScore:number;


  reason:string[];


  alternatives:{

    strategy:LearningStrategy;

    score:number;

  }[];


}