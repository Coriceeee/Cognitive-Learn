import type {
  PredictionInput,
  PredictionResult,
} from "./predictionTypes";

import {
  extractPredictionFeatures,
} from "./predictionFeatures";



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



  const features =
    extractPredictionFeatures(input);



  const gap =
    Math.max(
      0,
      input.targetScore -
      input.currentScore
    );



  /**
   * MVP prediction model
   *
   * Sau này thay bằng:
   * XGBoost / ML API
   */
  const improvement =

    (
      features.cognitiveStrength * 0.35
      +
      features.learningMomentum * 0.25
      +
      features.growthPotential * 0.25
      +
      features.completionRate * 0.15

    )
    /
    100
    *
    2;



  const predictedScore =

    Math.min(
      10,
      input.currentScore +
      improvement
    );




  const goalGapReadinessIndex =

    clamp(

      100 -

      (
        Math.max(
          0,
          input.targetScore -
          predictedScore
        )
        *
        20
      )

    );




  let risk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";



  if(
    features.riskScore >=70
  ){

    risk="HIGH";

  }

  else if(
    features.riskScore >=40
  ){

    risk="MEDIUM";

  }

  else{

    risk="LOW";

  }





  const stability =

    clamp(
      features.learningStability
    );





  const factors:string[]=[];

  const keyDrivers:string[]=[];

  const riskFactors:string[]=[];




  if(
    features.SCI >=75
  ){

    factors.push(
      "SCI ở ngưỡng cao theo quy tắc thử nghiệm"
    );


    keyDrivers.push(
      "SCI là yếu tố đóng góp trong công thức thử nghiệm"
    );

  }




  if(
    features.CRI >=75
  ){

    factors.push(
      "CRI ở ngưỡng cao theo quy tắc thử nghiệm"
    );


    keyDrivers.push(
      "CRI là yếu tố đóng góp trong công thức thử nghiệm"
    );

  }




  if(
    features.GVI >=60
  ){

    riskFactors.push(
      "Mục tiêu học tập chưa ổn định"
    );

  }




  if(
    features.BDI >=60
  ){

    riskFactors.push(
      "Hành vi học tập có xu hướng lệch"
    );

  }




  if(
    features.FRI >=60
  ){

    riskFactors.push(
      "Có nguy cơ quá tải"
    );

  }





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




    cognitiveStrengthIndex:

      Math.round(
        features.cognitiveStrength
      ),




    goalGapReadinessIndex:

      Math.round(
        goalGapReadinessIndex
      ),




    risk,




    stabilityCompletionIndex:

      Math.round(

        (
          features.learningStability
          +
          input.completionRate

        )
        /
        2

      ),





    stability:

      Math.round(
        stability
      ),




    growthPotential:

      Math.round(
        features.growthPotential
      ),




    factors,



    keyDrivers,



    riskFactors,




    explanation:[

      "Ước tính kịch bản dựa trên Cognitive Vector 7 chiều và các trọng số thử nghiệm.",

      "Chỉ số khoảng cách mục tiêu được tính từ chênh lệch điểm, KHÔNG phải xác suất đạt mục tiêu.",

      "Orion chỉ so sánh các kịch bản theo cùng giả định; không chứng minh hiệu quả can thiệp.",

    ],

    resultKind:"RULE_BASED_SCENARIO",
    calibrationStatus:"NOT_CALIBRATED",
    limitations:[
      "Không có mô hình xác suất được hiệu chuẩn bằng outcome thực tế.",
      "Điểm dự kiến là kết quả công thức giả lập, không phải dự báo ML đã qua validation.",
      "Các trọng số và mức độ rủi ro là giả định của prototype, không phải ngưỡng lâm sàng.",
    ],

    modelVersion:

      "Prediction Rule Engine v2.1.0-heuristic"

  };

}