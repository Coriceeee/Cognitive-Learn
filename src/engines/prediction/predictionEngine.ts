import type {
  PredictionInput,
  PredictionResult
} from "./predictionTypes";



function clamp(
 value:number,
 min=0,
 max=100
){

 return Math.max(
  min,
  Math.min(max,value)
 );

}



export function predictLearningOutcome(
 input:PredictionInput
):PredictionResult {



const vector =
input.cognitiveVector;



const cognitiveScore =

(
 vector.SCI * 0.2
+
 vector.MAS * 0.15
+
 vector.CSL * 0.15
+
 vector.CRI * 0.2
+
 (100-vector.GVI) * 0.1
+
 (100-vector.BDI) * 0.1
+
 (100-vector.FRI) * 0.1

);



const cognitiveFactor =
cognitiveScore / 100;



const studyFactor =
Math.min(
1,
input.studyHoursPerWeek / 30
);



const completionFactor =
input.completionRate / 100;



const gap =
Math.max(
0,
input.targetScore-input.currentScore
);



const improvement =

(
 cognitiveFactor * 1.8
+
 studyFactor
+
 completionFactor

)
*
2;



const predictedScore =

Math.min(
10,
input.currentScore + improvement
);



const achievementProbability =

clamp(

100 -
(
Math.max(
0,
input.targetScore-predictedScore
)
*
20
)

);



let risk:
"LOW"|"MEDIUM"|"HIGH";


if(
vector.FRI >=70 ||
vector.BDI >=70
){

risk="HIGH";

}
else if(
vector.FRI>=40 ||
vector.BDI>=40
){

risk="MEDIUM";

}
else{

risk="LOW";

}



const stability =

clamp(

vector.CRI
-
(
vector.GVI*0.3
)
-
(
vector.BDI*0.3
)

);



const factors:string[]=[];



if(vector.SCI>=75)
 factors.push(
  "Tính ổn định học tập cao"
 );


if(vector.CRI>=75)
 factors.push(
  "Khả năng duy trì trạng thái tốt"
 );


if(vector.GVI>=60)
 factors.push(
  "Mục tiêu chưa ổn định"
 );


if(vector.FRI>=60)
 factors.push(
  "Có nguy cơ quá tải"
 );



return {


 currentScore:
 input.currentScore,


 targetScore:
 input.targetScore,


 predictedScore:
 Number(
 predictedScore.toFixed(2)
 ),


 improvement:
 Number(
 improvement.toFixed(2)
 ),



 probability:
 Math.round(
  cognitiveFactor*100
 ),



 achievementProbability:
 Math.round(
  achievementProbability
 ),



 risk,


 confidence:
 Math.round(
 (
 vector.CRI
 +
 input.completionRate
 )
 /2
 ),



 stability:
 Math.round(
 stability
 ),



 factors,



 explanation:[

 "Dự đoán dựa trên Cognitive Vector 7 chiều.",

 "Mô hình kết hợp năng lực nhận thức, hành vi và mức ổn định.",

 "Kết quả có thể dùng cho Simulation Engine."

 ]

};

}