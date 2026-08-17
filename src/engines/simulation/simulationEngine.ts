import type {
 PredictionInput
}
from "../prediction/predictionTypes";


import {
 predictLearningOutcome
}
from "../prediction/predictionEngine";


import type {
 SimulationScenario,
 SimulationResult
}
from "./simulationTypes";

export function compareScenarios(
results:SimulationResult[]
){

return results.sort(
(a,b)=>
b.probability -
a.probability
);

}

export function runSimulation(

input:PredictionInput,

scenario:SimulationScenario

):SimulationResult {



const modifiedInput={
...input
};



if(
scenario.changes.studyHoursDelta
){

modifiedInput.studyHoursPerWeek +=
scenario.changes.studyHoursDelta;

}



if(
scenario.changes.completionDelta
){

modifiedInput.completionRate +=
scenario.changes.completionDelta;

}



if(
scenario.changes.fatigueDelta
){

modifiedInput.cognitiveVector.FRI +=
scenario.changes.fatigueDelta;

}



const prediction =
predictLearningOutcome(
modifiedInput
);



return {


scenario:
scenario.name,


predictedScore:
prediction.predictedScore,


probability:
prediction.probability,


risk:
prediction.risk,


gain:
prediction.improvement,


explanation:
prediction.explanation

};


}