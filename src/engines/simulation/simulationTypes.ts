export type ScenarioType =
  | "BASELINE"
  | "STUDY_INCREASE"
  | "CONSISTENCY_BOOST"
  | "MOTIVATION_BOOST"
  | "FATIGUE_REDUCTION"
  | "STRATEGY_IMPROVEMENT";



export interface CognitiveChange {

  SCI?: number;

  MAS?: number;

  CSL?: number;

  GVI?: number;

  BDI?: number;

  FRI?: number;

  CRI?: number;

}



export interface ScenarioChanges {

  studyHoursDelta?: number;

  completionDelta?: number;


  cognitive?: CognitiveChange;

}



export interface SimulationScenario {

  id:string;

  type:ScenarioType;

  name:string;

  description:string;

  changes:ScenarioChanges;

}





export interface SimulationInput {

  currentScore:number;

  targetScore:number;


  cognitiveVector:{

    SCI:number;

    MAS:number;

    CSL:number;

    GVI:number;

    BDI:number;

    FRI:number;

    CRI:number;

  };


  studyHoursPerWeek:number;

  completionRate:number;

}






export interface CognitiveImpact {


  SCI:number;

  MAS:number;

  CSL:number;

  GVI:number;

  BDI:number;

  FRI:number;

  CRI:number;


}







export interface SimulationResult {


  scenarioId:string;


  scenarioType:ScenarioType;


  scenarioName:string;



  predictedScore:number;


  improvement:number;


  probability:number;


  stability:number;



  risk:
  | "LOW"
  | "MEDIUM"
  | "HIGH";



  utilityScore:number;



  cognitiveImpact:CognitiveImpact;



  explanation:string[];



  tradeoffs:string[];



}







export interface SimulationSummary {


  results:SimulationResult[];


  bestScenario:SimulationResult;


}