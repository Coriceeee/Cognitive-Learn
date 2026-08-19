import {
  interventionRules
} from "./interventionRules";


import type {
 SimulationScenario
} from "../simulationTypes";



export function generateScenarios()
:SimulationScenario[] {



return [


{

id:"baseline",

type:"BASELINE",

name:"Giữ nguyên hiện trạng",

description:
"Không thay đổi chiến lược học tập.",

changes:
interventionRules.BASELINE

},



{

id:"study-increase",

type:"STUDY_INCREASE",

name:"Tăng thời gian học",

description:
"Tăng thêm thời gian học mỗi tuần.",

changes:
interventionRules.STUDY_INCREASE

},



{

id:"consistency",

type:"CONSISTENCY_BOOST",

name:"Tăng tính ổn định",

description:
"Cải thiện khả năng duy trì kế hoạch học tập.",

changes:
interventionRules.CONSISTENCY_BOOST

},



{

id:"motivation",

type:"MOTIVATION_BOOST",

name:"Tăng động lực",

description:
"Cải thiện trạng thái động lực và mục tiêu.",

changes:
interventionRules.MOTIVATION_BOOST

},



{

id:"fatigue",

type:"FATIGUE_REDUCTION",

name:"Giảm quá tải",

description:
"Giảm áp lực học tập và phục hồi nhận thức.",

changes:
interventionRules.FATIGUE_REDUCTION

},



{

id:"strategy",

type:"STRATEGY_IMPROVEMENT",

name:"Cải thiện chiến lược học",

description:
"Nâng cấp phương pháp học tập.",

changes:
interventionRules.STRATEGY_IMPROVEMENT

}



];


}