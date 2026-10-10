import type {
  CognitiveChange,
  CognitiveDimensionCode,
  CognitiveSnapshot,
  CognitiveTrendSummary,
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



function getMagnitude(
  delta: number
): CognitiveChange["magnitude"] {

  const value = Math.abs(delta);


  if (value >= 10) {
    return "LARGE";
  }


  if (value >= 5) {
    return "MODERATE";
  }


  return "SMALL";

}



function getDirection(
  delta: number
): CognitiveChange["direction"] {

  if (delta > 2) {
    return "UP";
  }


  if (delta < -2) {
    return "DOWN";
  }


  return "STABLE";

}



function calculateConfidence(
  changes: CognitiveChange[]
) {

  const active =
    changes.filter(
      item =>
        item.direction !== "STABLE"
    ).length;


  if (active === 0) {
    return 0.4;
  }


  return Math.min(
    0.95,
    0.4 + active * 0.08
  );

}



function getTrendStatus(
  improving: number,
  declining: number
) {

  if (
    improving >= 4 &&
    improving > declining
  ) {

    return "ACCELERATING";

  }


  if (
    improving > declining
  ) {

    return "IMPROVING";

  }


  if (
    declining > improving
  ) {

    return "DECLINING";

  }


  return "STABLE";

}



function buildSummary(
  status: string,
  improving: number,
  declining: number
) {

  switch (status) {

    case "ACCELERATING":

      return "Năng lực nhận thức đang tăng trưởng mạnh với nhiều chiều cải thiện.";


    case "IMPROVING":

      return `Xu hướng phát triển tích cực với ${improving} chiều nhận thức đang tăng.`;


    case "DECLINING":

      return `Một số chiều nhận thức có dấu hiệu giảm với ${declining} vùng cần theo dõi.`;


    default:

      return "Hồ sơ nhận thức đang duy trì trạng thái ổn định.";

  }

}



export interface CognitiveTrendAnalysis
  extends CognitiveTrendSummary {

  strongestImprovement:
    CognitiveChange | null;


  strongestDecline:
    CognitiveChange | null;


  status:
    | "ACCELERATING"
    | "IMPROVING"
    | "DECLINING"
    | "STABLE";


  confidence: number;


  summary: string;

}





export function compareCognitiveSnapshots(
  current: CognitiveSnapshot,
  previous: CognitiveSnapshot
): CognitiveTrendAnalysis {


  const changes: CognitiveChange[] =
    DIMENSIONS.map(
      (code) => {


        const currentValue =
          current[code];


        const previousValue =
          previous[code];


        const delta =
          Math.round(
            (
              currentValue -
              previousValue
            ) * 10
          ) / 10;



        return {

          code,

          previous:
            previousValue,

          current:
            currentValue,

          delta,

          direction:
            getDirection(delta),

          magnitude:
            getMagnitude(delta),

        };

      }
    );



  const improving =
    changes.filter(
      item =>
        item.direction === "UP"
    );



  const declining =
    changes.filter(
      item =>
        item.direction === "DOWN"
    );



  const stable =
    changes.filter(
      item =>
        item.direction === "STABLE"
    );



  const overallDelta =
    Math.round(
      (
        current.overallScore -
        previous.overallScore
      ) * 10
    ) / 10;



  const overallDirection =
    getDirection(
      overallDelta
    );



  const strongestImprovement =
    improving.length > 0
      ? [...improving].sort(
          (a, b) =>
            b.delta - a.delta
        )[0]
      : null;



  const strongestDecline =
    declining.length > 0
      ? [...declining].sort(
          (a, b) =>
            a.delta - b.delta
        )[0]
      : null;



  const status =
    getTrendStatus(
      improving.length,
      declining.length
    );



  return {

    changes,

    improving,

    declining,

    stable,


    overallDelta,


    overallDirection,


    strongestImprovement,


    strongestDecline,


    status,


    confidence:
      calculateConfidence(
        changes
      ),


    summary:
      buildSummary(
        status,
        improving.length,
        declining.length
      ),

  };

}