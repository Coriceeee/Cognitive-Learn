export interface CognitiveMetrics {
  actionConsistency: number;
  goalSwitchFrequency: number;
  taskAbandonmentRate: number;

  contextSwitchRate: number;
  decisionLatency: number;

  studyHoursPerWeek?: number;
}


export interface CognitiveHistoryPoint {
  actionConsistency: number;

  taskAbandonmentRate?: number;

  contextSwitchRate?: number;

  timestamp?: string;
}


export interface CognitiveState {

  // Core cognitive indexes
  sci: number;
  mas: number;
  csl: number;


  // Dynamic indexes
  gvi: number;
  bdi: number;
  fri: number;
  cri: number;


  // Explainability
  riskLevel: "LOW" | "MEDIUM" | "HIGH";

  insights: string[];


  timestamp: string;
}



function clamp(
  value:number,
  min:number = 0,
  max:number = 100
){

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );

}


/**
 * SCI
 * Study Consistency Index
 */
function calculateSCI(
  metrics:CognitiveMetrics
){

  return clamp(

    metrics.actionConsistency
    -
    metrics.taskAbandonmentRate * 0.35

  );

}


/**
 * MAS
 * Motivation & Attitude Score
 */
function calculateMAS(
  metrics:CognitiveMetrics
){

  return clamp(

    metrics.actionConsistency * 0.5
    +
    (100 - metrics.taskAbandonmentRate) * 0.5

  );

}


/**
 * CSL
 * Cognitive Strategy Level
 */
function calculateCSL(
  metrics:CognitiveMetrics
){

  return clamp(

    100
    -
    metrics.contextSwitchRate * 0.5
    -
    metrics.decisionLatency * 0.5

  );

}



/**
 * GVI
 * Goal Volatility Index
 *
 * Mục tiêu thay đổi càng nhiều
 * GVI càng cao
 */
function calculateGVI(
  metrics:CognitiveMetrics
){

  return clamp(

    metrics.goalSwitchFrequency * 20

  );

}



/**
 * BDI
 * Behavior Drift Index
 *
 * Đo sự thay đổi hành vi theo thời gian
 */
function calculateBDI(
  metrics:CognitiveMetrics,
  history?: CognitiveHistoryPoint[]
){

  if(
    !history ||
    history.length === 0
  ){

    return 0;

  }


  const previous =
    history[0].actionConsistency;


  return clamp(

    Math.abs(
      previous -
      metrics.actionConsistency
    )

  );

}



/**
 * FRI
 * Fatigue Risk Index
 */
function calculateFRI(
  metrics:CognitiveMetrics
){

  return clamp(

    metrics.taskAbandonmentRate * 0.6
    +
    metrics.contextSwitchRate * 0.4

  );

}



/**
 * CRI
 * Consistency Reliability Index
 */
function calculateCRI(
  metrics:CognitiveMetrics
){

  return clamp(

    metrics.actionConsistency
    -
    metrics.contextSwitchRate * 0.3

  );

}



function calculateRiskLevel(
  fri:number,
  bdi:number
){

  const risk =
    fri * 0.6 +
    bdi * 0.4;


  if(risk >= 70)
    return "HIGH";


  if(risk >= 40)
    return "MEDIUM";


  return "LOW";

}



function generateInsights(
  state:{
    sci:number;
    mas:number;
    csl:number;
    gvi:number;
    bdi:number;
    fri:number;
    cri:number;
  }
){

  const insights:string[] = [];


  if(state.sci >= 75){

    insights.push(
      "Khả năng duy trì hành động học tập đang tốt."
    );

  }


  if(state.gvi >= 60){

    insights.push(
      "Mục tiêu học tập có xu hướng thay đổi nhiều."
    );

  }


  if(state.bdi >= 50){

    insights.push(
      "Hành vi học tập đang biến động."
    );

  }


  if(state.fri >= 60){

    insights.push(
      "Có dấu hiệu nguy cơ quá tải."
    );

  }


  if(state.cri >= 75){

    insights.push(
      "Tính ổn định trong quá trình học tập cao."
    );

  }


  if(insights.length === 0){

    insights.push(
      "Trạng thái nhận thức đang ổn định."
    );

  }


  return insights;

}



/**
 * Dynamic Cognitive Engine v3.0
 */
export function calculateCognitiveState(

  metrics:CognitiveMetrics,

  history?:CognitiveHistoryPoint[]

):CognitiveState {



  const sci =
    calculateSCI(metrics);


  const mas =
    calculateMAS(metrics);


  const csl =
    calculateCSL(metrics);



  const gvi =
    calculateGVI(metrics);


  const bdi =
    calculateBDI(
      metrics,
      history
    );


  const fri =
    calculateFRI(metrics);


  const cri =
    calculateCRI(metrics);



  return {


    sci:Math.round(sci),

    mas:Math.round(mas),

    csl:Math.round(csl),


    gvi:Math.round(gvi),

    bdi:Math.round(bdi),

    fri:Math.round(fri),

    cri:Math.round(cri),



    riskLevel:
      calculateRiskLevel(
        fri,
        bdi
      ),



    insights:
      generateInsights({
        sci,
        mas,
        csl,
        gvi,
        bdi,
        fri,
        cri
      }),



    timestamp:
      new Date().toISOString()

  };

}