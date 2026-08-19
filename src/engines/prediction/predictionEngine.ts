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




  const achievementProbability =

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
      "Tính ổn định học tập cao"
    );


    keyDrivers.push(
      "SCI tốt giúp duy trì tiến bộ"
    );

  }




  if(
    features.CRI >=75
  ){

    factors.push(
      "Khả năng duy trì trạng thái tốt"
    );


    keyDrivers.push(
      "CRI cao giúp giảm biến động"
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




    probability:

      Math.round(
        features.cognitiveStrength
      ),




    achievementProbability:

      Math.round(
        achievementProbability
      ),




    risk,




    confidence:

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

      "Dự đoán dựa trên Cognitive Vector 7 chiều.",

      "Feature Engineering kết hợp nhận thức, hành vi và tính ổn định.",

      "Output có thể sử dụng cho Orion Simulation.",

    ],




    modelVersion:

      "Prediction Engine v2.0-MVP"

  };

}