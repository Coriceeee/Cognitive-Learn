import {
  createCognitiveVector,
  type CognitiveVector,
} from "../../lib/cognitiveAdapter";


export type CognitiveRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";


export type CognitiveTrend =
  | "IMPROVING"
  | "STABLE"
  | "DECLINING"
  | "UNKNOWN";



export type CognitiveDimension = {

  code:
    | "SCI"
    | "MAS"
    | "CSL"
    | "GVI"
    | "BDI"
    | "FRI"
    | "CRI";


  name: string;


  value: number;


  description: string;


  level?:
    | "GOOD"
    | "NORMAL"
    | "RISK";

};



export type CognitiveResult = {


  summary: string;


  trendLabel: string;



  SCI: number;

  MAS: number;

  CSL: number;



  GVI: number;

  BDI: number;

  FRI: number;

  CRI: number;



  overallScore: number;


  riskLevel: CognitiveRisk;


  trend: CognitiveTrend;


  confidenceScore: number;



  vector: CognitiveVector;



  dimensions: CognitiveDimension[];



  insights: string[];


  warnings: string[];


  nextActions: string[];

};



function clamp(value: number) {

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );

}



function getLevel(
  value: number
):
"GOOD" | "NORMAL" | "RISK" {

  if (value >= 75) {
    return "GOOD";
  }


  if (value >= 45) {
    return "NORMAL";
  }


  return "RISK";

}




export function calculateCognitive(
  profile: any
): CognitiveResult {


  const vector =
    createCognitiveVector(profile);



  const {
    SCI,
    MAS,
    CSL,
    GVI,
    BDI,
    FRI,
    CRI,
  } = vector;



  const overallScore =
    clamp(

      SCI * 0.3
      +
      MAS * 0.25
      +
      CSL * 0.2
      +
      CRI * 0.25

    );



  let riskLevel:CognitiveRisk =
    "LOW";


  if(
    FRI >= 70 ||
    BDI >= 70
  ){

    riskLevel = "HIGH";

  }
  else if(
    FRI >= 40 ||
    BDI >= 40
  ){

    riskLevel = "MEDIUM";

  }




  let trend:CognitiveTrend =
    "STABLE";


  if(
    SCI >= 75 &&
    CRI >= 75
  ){

    trend = "IMPROVING";

  }


  if(
    BDI >= 60 ||
    FRI >= 60
  ){

    trend = "DECLINING";

  }




  const confidenceScore =
    clamp(

      CRI * 0.5
      +
      SCI * 0.3
      +
      CSL * 0.2

    );





  const dimensions:CognitiveDimension[] = [

    {
      code: "SCI",
      name: "Study Consistency Index",
      value: SCI,
      description:
        "Khả năng duy trì hành động học tập.",
      level:
        getLevel(SCI),
    },


    {
      code: "MAS",
      name: "Motivation & Attitude Score",
      value: MAS,
      description:
        "Động lực và thái độ học tập.",
      level:
        getLevel(MAS),
    },


    {
      code: "CSL",
      name: "Cognitive Strategy Level",
      value: CSL,
      description:
        "Khả năng sử dụng chiến lược học tập.",
      level:
        getLevel(CSL),
    },


    {
      code: "GVI",
      name: "Goal Volatility Index",
      value: GVI,
      description:
        "Mức độ thay đổi mục tiêu.",
      level:
        GVI >= 60 ? "RISK" : "GOOD",
    },


    {
      code: "BDI",
      name: "Behavior Drift Index",
      value: BDI,
      description:
        "Độ lệch hành vi theo thời gian.",
      level:
        BDI >= 60 ? "RISK" : "GOOD",
    },


    {
      code: "FRI",
      name: "Fatigue Risk Index",
      value: FRI,
      description:
        "Nguy cơ quá tải học tập.",
      level:
        FRI >= 60 ? "RISK" : "GOOD",
    },


    {
      code: "CRI",
      name: "Cognitive Reliability Index",
      value: CRI,
      description:
        "Độ ổn định nhận thức.",
      level:
        getLevel(CRI),
    },

  ];





  const insights:string[] = [];

  const warnings:string[] = [];

  const nextActions:string[] = [];





  if(SCI >= 75){

    insights.push(
      "Học sinh có khả năng duy trì kế hoạch tốt."
    );

  }



  if(CRI >= 75){

    insights.push(
      "Trạng thái nhận thức có độ ổn định cao."
    );

  }



  if(GVI >= 60){

    warnings.push(
      "Mục tiêu học tập có sự thay đổi thường xuyên."
    );


    nextActions.push(
      "Ổn định mục tiêu trước khi tối ưu kế hoạch."
    );

  }



  if(BDI >= 60){

    warnings.push(
      "Hành vi học tập đang biến động."
    );


    nextActions.push(
      "Theo dõi lại thói quen học tập."
    );

  }



  if(FRI >= 60){

    warnings.push(
      "Có dấu hiệu quá tải học tập."
    );


    nextActions.push(
      "Điều chỉnh khối lượng học tập."
    );

  }



  if(insights.length === 0){

    insights.push(
      "Cognitive state đang được duy trì."
    );

  }





  const trendLabel =
    trend === "IMPROVING"
      ? "Đang cải thiện"
      : trend === "DECLINING"
      ? "Có dấu hiệu giảm"
      : "Ổn định";




  const summary =
    `Trạng thái nhận thức hiện tại đạt ${overallScore}/100. Mức rủi ro ${riskLevel}.`;





  return {


    summary,

    trendLabel,



    SCI,

    MAS,

    CSL,


    GVI,

    BDI,

    FRI,

    CRI,



    overallScore,


    riskLevel,


    trend,


    confidenceScore,



    vector,


    dimensions,



    insights,


    warnings,


    nextActions,

  };

}