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



  /** Chỉ số tổng hợp nhận thức theo công thức thử nghiệm; KHÔNG là probability. */
  cognitiveStrengthIndex:number;


  /** 0–100: quy đổi khoảng cách còn lại đến mục tiêu theo giả định, không phải cơ hội đạt. */
  goalGapReadinessIndex:number;



  risk:
    | "LOW"
    | "MEDIUM"
    | "HIGH";



  /** Trung bình stability và completion; không đo độ tin cậy thống kê. */
  stabilityCompletionIndex:number;

  resultKind:"RULE_BASED_SCENARIO";
  calibrationStatus:"NOT_CALIBRATED";
  limitations:string[];



  stability:number;



  growthPotential:number;



  keyDrivers:string[];



  riskFactors:string[];



  factors:string[];



  explanation:string[];



  modelVersion:string;

}