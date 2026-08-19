import type {
 LearningStrategy
} from "./chronosTypes";



export const interventionStrategies:
LearningStrategy[] = [



{

id:"consistency_first",

type:"CONSISTENCY_FIRST",

name:"Tăng tính ổn định học tập",

description:
"Cải thiện khả năng duy trì kế hoạch và giảm biến động hành vi.",


cognitiveChanges:{

SCI:15,

BDI:-15,

CRI:10

},


expectedGain:0.8,


risk:"LOW"


},





{

id:"fatigue_recovery",

type:"FATIGUE_RECOVERY",

name:"Phục hồi nhận thức",

description:
"Giảm quá tải và tăng khả năng duy trì dài hạn.",


cognitiveChanges:{

FRI:-20,

CRI:15

},


expectedGain:0.6,


risk:"LOW"


},





{

id:"performance_acceleration",

type:"PERFORMANCE_ACCELERATION",

name:"Tăng tốc hiệu suất",

description:
"Đẩy mạnh khi học sinh có nền tảng ổn định.",


cognitiveChanges:{

CSL:10,

MAS:10

},


expectedGain:1.0,


risk:"MEDIUM"


},





{

id:"strategy_improvement",

type:"STRATEGY_IMPROVEMENT",

name:"Cải thiện chiến lược học tập",

description:
"Nâng cao phương pháp học và khả năng tự điều chỉnh.",


cognitiveChanges:{

CSL:15,

CRI:10

},


expectedGain:0.9,


risk:"LOW"


}


];