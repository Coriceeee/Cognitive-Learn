import type {
  OrionStrategyResult,
} from "../../lib/orionStrategyEngine";

export type LumenStrategyMilestone = {

  week:number;

  title:string;

  actions:string[];

};



export type LumenStrategyView = {

  title:string;

  readinessScore:number;

  riskLevel:string;

  scenario:string;

  focusSubjects:string[];

  milestones:LumenStrategyMilestone[];

  warnings:string[];

};




export function adaptOrionStrategyToLumen(

  result:OrionStrategyResult

):LumenStrategyView {


  return {


    title:
      result.summary,



    readinessScore:
      result.readinessScore,



    riskLevel:
      result.riskLevel,



    scenario:
      result.bestScenario.title,



    focusSubjects:
      result.focusSubjects.map(
          (        item: { label: any; }) =>
          item.label
      ),



    milestones:
      result.milestones.map(
          (        item: { week: any; title: any; actions: any; }) => ({

          week:
            item.week,


          title:
            item.title,


          actions:
            item.actions,

        })
      ),



    warnings:
      result.warnings,


  };

}