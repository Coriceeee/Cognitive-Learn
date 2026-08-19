import type {

LearningStrategy,

CognitiveState,

PredictionState

} from "./chronosTypes";





export function calculateStrategyScore(

strategy:LearningStrategy,

cognitive:CognitiveState,

prediction:PredictionState

){



let score=0;



score +=
strategy.expectedGain * 40;



score +=
prediction.stability * 0.3;



if(strategy.risk==="LOW"){

score+=20;

}

else if(strategy.risk==="MEDIUM"){

score+=10;

}





if(
cognitive.FRI>=60 &&
strategy.type==="FATIGUE_RECOVERY"
){

score+=25;

}




if(
cognitive.BDI>=60 &&
strategy.type==="CONSISTENCY_FIRST"
){

score+=25;

}





if(
cognitive.CSL<60 &&
strategy.type==="STRATEGY_IMPROVEMENT"
){

score+=25;

}





return Math.round(score);



}