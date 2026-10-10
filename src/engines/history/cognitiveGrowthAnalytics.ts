import type {
  CognitiveChange,
  CognitiveDimensionCode,
  CognitiveSnapshot,
} from "./cognitiveHistoryTypes";

const DIMENSIONS: CognitiveDimensionCode[] = [
  "SCI",
  "MAS",
  "CSL",
  "GVI",
  "BDI",
  "FRI",
  "CRI",
];


function clamp(value:number){

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );

}


function average(values:number[]){

  if(!values.length){
    return 0;
  }


  return (
    values.reduce(
      (sum,value)=>sum+value,
      0
    )
    /
    values.length
  );

}



function getVelocity(
  delta:number,
  days:number
){

  if(days<=0){
    return 0;
  }


  return Math.round(
    (delta / days) * 100
  ) / 100;

}




function getDaysBetween(
  current:string,
  previous:string
){

  const currentTime =
    new Date(current).getTime();


  const previousTime =
    new Date(previous).getTime();



  if(
    Number.isNaN(currentTime) ||
    Number.isNaN(previousTime)
  ){

    return 0;

  }



  return Math.max(
    0,
    (
      currentTime -
      previousTime
    )
    /
    (1000 * 60 * 60 * 24)
  );

}



export type GrowthStatus =
  | "ACCELERATING"
  | "IMPROVING"
  | "MAINTAINING"
  | "WARNING";



export type CognitiveGrowthAnalytics = {

  overall:{

    current:number;

    previous:number | null;

    delta:number;

    velocityPerDay:number;

    direction:
      | "UP"
      | "DOWN"
      | "STABLE";

  };


  dimensions:CognitiveChange[];


  improving:CognitiveChange[];


  declining:CognitiveChange[];


  stable:CognitiveChange[];


  strongestImprovement:
    CognitiveChange | null;


  strongestDecline:
    CognitiveChange | null;


  observationDays:number;


  dataQuality:
    | "LIMITED"
    | "EMERGING"
    | "SUFFICIENT";


  growthStatus:GrowthStatus;


  growthMessage:string;


  trajectory:{
    direction:
      | "UPWARD"
      | "DOWNWARD"
      | "STABLE";

    confidence:number;

  };

};




function getGrowthStatus(
  direction:
    | "UP"
    | "DOWN"
    | "STABLE",
  improving:number,
  declining:number
):GrowthStatus{


  if(
    direction==="UP" &&
    improving>=3
  ){

    return "ACCELERATING";

  }



  if(
    direction==="UP"
  ){

    return "IMPROVING";

  }



  if(
    direction==="DOWN"
  ){

    return "WARNING";

  }



  return "MAINTAINING";

}





function getGrowthMessage(
  status:GrowthStatus
){

  switch(status){

    case "ACCELERATING":

      return "Năng lực nhận thức đang tăng trưởng mạnh và có nhiều chiều cải thiện.";

    case "IMPROVING":

      return "Học sinh đang có xu hướng phát triển tích cực.";

    case "WARNING":

      return "Một số năng lực có dấu hiệu suy giảm cần được theo dõi.";

    default:

      return "Trạng thái nhận thức đang duy trì tương đối ổn định.";

  }

}




export function analyzeCognitiveGrowth(
  current:CognitiveSnapshot,
  previous:CognitiveSnapshot | null
):CognitiveGrowthAnalytics{


  if(!previous){

    return {

      overall:{
        current:current.overallScore,
        previous:null,
        delta:0,
        velocityPerDay:0,
        direction:"STABLE",
      },


      dimensions:[],
      improving:[],
      declining:[],
      stable:[],


      strongestImprovement:null,
      strongestDecline:null,


      observationDays:0,

      dataQuality:"LIMITED",


      growthStatus:"MAINTAINING",


      growthMessage:
        "Chưa đủ dữ liệu lịch sử để phân tích tăng trưởng.",


      trajectory:{
        direction:"STABLE",
        confidence:0,
      }

    };

  }



  const days =
    getDaysBetween(
      current.createdAt,
      previous.createdAt
    );



  const changes:CognitiveChange[] =
    DIMENSIONS.map(
      (code)=>{

        const currentValue =
          current[code];


        const previousValue =
          previous[code];



        const delta =
          Math.round(
            (
              currentValue -
              previousValue
            )
            *
            10
          )
          /
          10;



        const direction =
          delta > 2
          ? "UP"
          :
          delta < -2
          ? "DOWN"
          :
          "STABLE";



        const magnitude =
          Math.abs(delta)>=10
          ? "LARGE"
          :
          Math.abs(delta)>=5
          ? "MODERATE"
          :
          "SMALL";



        return {

          code,

          previous:previousValue,

          current:currentValue,

          delta,

          direction,

          magnitude,

        };

      }
    );



  const improving =
    changes.filter(
      item=>item.direction==="UP"
    );


  const declining =
    changes.filter(
      item=>item.direction==="DOWN"
    );


  const stable =
    changes.filter(
      item=>item.direction==="STABLE"
    );



  const overallDelta =
    Math.round(
      (
        current.overallScore -
        previous.overallScore
      )
      *
      10
    )
    /
    10;



  const overallDirection =
    overallDelta>2
    ? "UP"
    :
    overallDelta<-2
    ? "DOWN"
    :
    "STABLE";



  const strongestImprovement =
    improving.length
    ?
    [...improving]
      .sort(
        (a,b)=>b.delta-a.delta
      )[0]
    :
    null;



  const strongestDecline =
    declining.length
    ?
    [...declining]
      .sort(
        (a,b)=>a.delta-b.delta
      )[0]
    :
    null;



  const dataQuality =
    days>=28
    ?
    "SUFFICIENT"
    :
    days>=7
    ?
    "EMERGING"
    :
    "LIMITED";



  const growthStatus =
    getGrowthStatus(
      overallDirection,
      improving.length,
      declining.length
    );



  return {


    overall:{

      current:clamp(
        current.overallScore
      ),

      previous:clamp(
        previous.overallScore
      ),

      delta:overallDelta,

      velocityPerDay:
        getVelocity(
          overallDelta,
          days
        ),

      direction:overallDirection,

    },


    dimensions:changes,

    improving,

    declining,

    stable,


    strongestImprovement,

    strongestDecline,


    observationDays:
      Math.round(days),


    dataQuality,


    growthStatus,


    growthMessage:
      getGrowthMessage(
        growthStatus
      ),



    trajectory:{

      direction:
        overallDirection==="UP"
        ?
        "UPWARD"
        :
        overallDirection==="DOWN"
        ?
        "DOWNWARD"
        :
        "STABLE",


      confidence:
        clamp(
          current.confidenceScore
        )
        /
        100,

    }

  };

}





export function summarizeGrowth(
  analytics:CognitiveGrowthAnalytics
){

  const positiveAverage =
    average(
      analytics.improving.map(
        item=>item.delta
      )
    );


  const negativeAverage =
    average(
      analytics.declining.map(
        item=>Math.abs(item.delta)
      )
    );



  return {

    observationDays:
      analytics.observationDays,


    dataQuality:
      analytics.dataQuality,


    growthStatus:
      analytics.growthStatus,


    growthMessage:
      analytics.growthMessage,


    overallDirection:
      analytics.overall.direction,


    overallDelta:
      analytics.overall.delta,


    improvingDimensions:
      analytics.improving.length,


    decliningDimensions:
      analytics.declining.length,


    stableDimensions:
      analytics.stable.length,


    averageImprovement:
      Math.round(
        positiveAverage*10
      )
      /
      10,


    averageDecline:
      Math.round(
        negativeAverage*10
      )
      /
      10,


    strongestImprovement:
      analytics.strongestImprovement?.code ?? null,


    strongestDecline:
      analytics.strongestDecline?.code ?? null,

  };

}