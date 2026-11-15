import type {

SimulationInput,

SimulationResult,

SimulationScenario,

SimulationSummary,

CognitiveImpact

} from "../simulationTypes";


import {

predictLearningOutcome

} from "../../prediction/predictionEngine";





function clamp(

value:number,

min=0,

max=100

){

return Math.max(

min,

Math.min(

max,

value

)

);

}






function applyScenario(

input:SimulationInput,

scenario:SimulationScenario

):SimulationInput {



const cognitive={

...input.cognitiveVector

};



const changes=

scenario.changes.cognitive;



if(changes){


Object.entries(changes)

.forEach(([key,value])=>{


const k =

key as keyof typeof cognitive;



cognitive[k]=

clamp(

cognitive[k]+(value ?? 0)

);



});


}




return {


...input,


studyHoursPerWeek:

input.studyHoursPerWeek +

(
scenario.changes.studyHoursDelta ?? 0
),



completionRate:

clamp(

input.completionRate +

(
scenario.changes.completionDelta ?? 0

)

),



cognitiveVector:cognitive


};


}







function calculateUtility(

prediction:{

predictedScore:number;

cognitiveStrengthIndex:number;

stability:number;

risk:string;

},

currentScore:number

){



const gain =

(
prediction.predictedScore -

currentScore

)
*
20;




const riskPenalty =

prediction.risk==="HIGH"

?
20

:

prediction.risk==="MEDIUM"

?
10

:

0;




return Math.round(

gain

+

prediction.cognitiveStrengthIndex*0.4

+

prediction.stability*0.3

-

riskPenalty

);


}







function calculateCognitiveImpact(

before:SimulationInput["cognitiveVector"],

after:SimulationInput["cognitiveVector"]

):CognitiveImpact {



return {


SCI:
after.SCI-before.SCI,


MAS:
after.MAS-before.MAS,


CSL:
after.CSL-before.CSL,


GVI:
after.GVI-before.GVI,


BDI:
after.BDI-before.BDI,


FRI:
after.FRI-before.FRI,


CRI:
after.CRI-before.CRI


};


}







function createTradeoffs(

impact:CognitiveImpact

):string[]{


const result:string[]=[];



if(impact.SCI>0)

result.push(
"Chỉ số SCI tăng trong kịch bản giả định; chưa có kết quả quan sát."
);



if(impact.FRI>0)

result.push(
"Chỉ số FRI tăng trong kịch bản, cần xem xét giả định áp lực."
);



if(impact.BDI<0)

result.push(
"Chỉ số BDI giảm trong kịch bản giả định; chưa có kết quả quan sát."
);



if(impact.CRI>0)

result.push(
"Chỉ số CRI tăng theo giả định, không phải độ tin cậy thống kê."
);



if(result.length===0)

result.push(
"Không có thay đổi theo những chỉ báo đang được so sánh."
);



return result;


}








export function simulateScenario(

input:SimulationInput,

scenario:SimulationScenario

):SimulationResult {



const modifiedInput=

applyScenario(

input,

scenario

);




const prediction=

predictLearningOutcome(

modifiedInput

);





const utilityScore=

calculateUtility(

prediction,

input.currentScore

);





return {


scenarioId:

scenario.id,



scenarioType:

scenario.type,



scenarioName:

scenario.name,




predictedScore:

prediction.predictedScore,



improvement:

Number(

(

prediction.predictedScore -

input.currentScore

)

.toFixed(2)

),




goalGapReadinessIndex:

prediction.goalGapReadinessIndex,

resultKind:"HEURISTIC_SCENARIO",
limitations:[
  ...prediction.limitations,
  "Điểm ưu tiên kịch bản là điểm tiện ích tương đối theo trọng số thử nghiệm.",
],





stability:

prediction.stability,





risk:

prediction.risk,





utilityScore,





cognitiveImpact:

calculateCognitiveImpact(

input.cognitiveVector,

modifiedInput.cognitiveVector

),





explanation:[

...prediction.explanation,


`Kịch bản giả định: ${scenario.description}`


],




tradeoffs:

createTradeoffs(

calculateCognitiveImpact(

input.cognitiveVector,

modifiedInput.cognitiveVector

)

)


};


}








export function runSimulation(

input:SimulationInput,

scenarios:SimulationScenario[]

):SimulationSummary {



const results=

scenarios.map(

scenario=>

simulateScenario(

input,

scenario

)

);



results.sort(

(a,b)=>

b.utilityScore-a.utilityScore

);




return {


results,


bestScenario:

results[0]


};


}