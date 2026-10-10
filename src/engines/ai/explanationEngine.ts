import type {
  AIExplanation,
  AIReasoningResult,
  AIInsight,
} from "./aiTypes";



function buildEvidence(
  insight:AIInsight
){

  return [

    ...insight.evidence,

    `Mức tin cậy:
${Math.round(
  insight.confidence * 100
)}%`

  ];

}




export function explainAIResult(
  result:AIReasoningResult
):AIExplanation {



  const mainInsight =
    result.insights[0];



  if(!mainInsight){

    return {

      decision:
        "Chưa đủ dữ liệu để đưa ra phân tích.",


      reasoning:[

        "Hệ thống chưa nhận đủ tín hiệu."

      ],


      evidence:[]

    };

  }




  return {


    decision:
      mainInsight.title,



    reasoning:

      result.insights.map(
        item =>
          item.description
      ),



    evidence:

      result.insights.flatMap(
        item =>
          buildEvidence(item)
      )

  };

}





export function createHumanExplanation(
  result:AIReasoningResult
){

  const explanation =
    explainAIResult(
      result
    );



  return `


KẾT LUẬN:

${explanation.decision}



PHÂN TÍCH:

${explanation.reasoning
.map(
 item =>
 `- ${item}`
)
.join("\n")}



DỮ LIỆU HỖ TRỢ:

${explanation.evidence
.map(
 item =>
 `- ${item}`
)
.join("\n")}



`;

}