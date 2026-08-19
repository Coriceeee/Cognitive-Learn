export interface PredictionInput {

  currentScore:number;

  targetScore:number;


  cognitiveVector:{

    SCI:number;

    MAS:number;

    CSL:number;

    GVI:number;

    BDI:number;

    FRI:number;

    CRI:number;

  };


  studyHoursPerWeek:number;


  completionRate:number;

}



export interface PredictionFeatures {


  currentScore:number;


  cognitiveStrength:number;


  learningStability:number;


  learningMomentum:number;


  riskScore:number;


  growthPotential:number;



  SCI:number;

  MAS:number;

  CSL:number;

  GVI:number;

  BDI:number;

  FRI:number;

  CRI:number;



  studyHoursPerWeek:number;


  completionRate:number;

}



export interface PredictionResult {


  currentScore:number;


  targetScore:number;


  predictedScore:number;


  improvement:number;



  probability:number;


  achievementProbability:number;



  risk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";



  confidence:number;



  stability:number;



  growthPotential:number;



  keyDrivers:string[];



  riskFactors:string[];



  factors:string[];



  explanation:string[];



  modelVersion:string;

}