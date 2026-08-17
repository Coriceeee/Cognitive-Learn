export type ScenarioType =
  | "BASELINE"
  | "INCREASE_STUDY"
  | "IMPROVE_CONSISTENCY"
  | "CHANGE_GOAL"
  | "REDUCE_FATIGUE";


export interface SimulationScenario {

  id:string;

  name:string;

  type:ScenarioType;


  changes:{
    studyHoursDelta?:number;

    completionDelta?:number;

    motivationDelta?:number;

    fatigueDelta?:number;

  };

}


export interface SimulationResult {

  scenario:string;


  predictedScore:number;


  probability:number;


  risk:string;


  gain:number;


  explanation:string[];

}