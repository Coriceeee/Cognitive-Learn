import type {
 SimulationScenario
}
from "./simulationTypes";


export function generateScenarios()
:SimulationScenario[] {


return [


{
id:"baseline",

name:"Giữ nguyên hiện tại",

type:"BASELINE",

changes:{}

},


{
id:"study-up",

name:"Tăng thời gian học",

type:"INCREASE_STUDY",

changes:{
studyHoursDelta:5
}

},



{
id:"consistency",

name:"Tăng tính ổn định",

type:"IMPROVE_CONSISTENCY",

changes:{
completionDelta:20
}

},



{
id:"fatigue",

name:"Giảm quá tải",

type:"REDUCE_FATIGUE",

changes:{
fatigueDelta:-20
}

}


];

}