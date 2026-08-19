import {
  PredictionInput,
  PredictionFeatures
} from "./predictionTypes";



export function extractPredictionFeatures(
 input:PredictionInput
):PredictionFeatures {


 const vector =
 input.cognitiveVector;



 const cognitiveStrength =

 (
   vector.SCI * 0.25
   +
   vector.MAS * 0.2
   +
   vector.CSL * 0.25
   +
   vector.CRI * 0.3
 );



 const learningStability =

 Math.max(
   0,
   Math.min(
     100,

     vector.CRI
     -
     vector.BDI * 0.3
     -
     vector.FRI * 0.2

   )
 );



 const learningMomentum =

 (
   vector.SCI
   +
   vector.MAS
   +
   vector.CSL
 )
 / 3;



 const riskScore =

 Math.min(
   100,

   (
    vector.GVI * 0.3
    +
    vector.BDI * 0.35
    +
    vector.FRI * 0.35
   )

 );



 const growthPotential =

 Math.max(
 0,

 (
   vector.CRI * 0.4
   +
   vector.CSL * 0.3
   +
   vector.MAS * 0.3
 )
 );



 return {


  currentScore:
    input.currentScore,


  cognitiveStrength:
    Math.round(cognitiveStrength),



  learningStability:
    Math.round(learningStability),



  learningMomentum:
    Math.round(learningMomentum),



  riskScore:
    Math.round(riskScore),



  growthPotential:
    Math.round(growthPotential),




  SCI:
    vector.SCI,


  MAS:
    vector.MAS,


  CSL:
    vector.CSL,


  GVI:
    vector.GVI,


  BDI:
    vector.BDI,


  FRI:
    vector.FRI,


  CRI:
    vector.CRI,



  studyHoursPerWeek:
    input.studyHoursPerWeek,



  completionRate:
    input.completionRate,

 };

}