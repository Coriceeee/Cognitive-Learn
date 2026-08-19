import type {

CognitiveState,

PredictionState,

LearningGoal,

OptimizationResult

} from "./chronosTypes";


import {

interventionStrategies

} from "./interventionStrategies";


import {

calculateStrategyScore

} from "./optimizationEngine";






export function optimizeLearningStrategy(

cognitive:CognitiveState,

prediction:PredictionState,

goal:LearningGoal

):OptimizationResult {



const ranked =

interventionStrategies.map(

strategy=>({


strategy,


score:

calculateStrategyScore(

strategy,

cognitive,

prediction

)


})

)

.sort(

(a,b)=>

b.score-a.score

);





const best=

ranked[0];





const reason:string[]=[];



if(cognitive.SCI<60){

reason.push(
"SCI thấp nên ưu tiên tăng tính ổn định."
);

}



if(cognitive.FRI>=60){

reason.push(
"Có dấu hiệu quá tải nên cần giảm rủi ro."
);

}



if(cognitive.CSL<60){

reason.push(
"Cần cải thiện chiến lược học tập."
);

}



if(reason.length===0){

reason.push(
"Trạng thái hiện tại phù hợp với chiến lược tăng hiệu suất."
);

}





return {


recommendedStrategy:

best.strategy,



utilityScore:

best.score,



reason,



alternatives:

ranked.map(item=>({

strategy:item.strategy,

score:item.score

}))


};


}