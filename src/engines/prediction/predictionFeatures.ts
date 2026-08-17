import { PredictionInput } from "./predictionTypes";

export function extractPredictionFeatures(
 input:PredictionInput
){

return {

currentScore:
input.currentScore,


SCI:
input.cognitiveVector.SCI,

MAS:
input.cognitiveVector.MAS,

CSL:
input.cognitiveVector.CSL,

GVI:
input.cognitiveVector.GVI,

BDI:
input.cognitiveVector.BDI,

FRI:
input.cognitiveVector.FRI,

CRI:
input.cognitiveVector.CRI,


studyHoursPerWeek:
input.studyHoursPerWeek,


completionRate:
input.completionRate

};

}