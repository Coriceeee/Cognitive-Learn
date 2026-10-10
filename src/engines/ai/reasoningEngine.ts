import type {
  AIInsight,
  AIReasoningResult,
  AIRecommendation,
  AIStudentContext,
} from "./aiTypes";



function calculateConfidence(
  evidenceCount:number
){

  return Math.min(
    0.95,
    0.5 + evidenceCount * 0.1
  );

}




function buildInsight(
  title:string,
  description:string,
  evidence:string[],
  type:AIInsight["type"]
):AIInsight {


  return {

    type,

    title,

    description,

    evidence,

    confidence:
      calculateConfidence(
        evidence.length
      ),

    confidenceLevel:
      evidence.length >= 3
      ? "HIGH"
      :
      evidence.length >= 2
      ? "MEDIUM"
      :
      "LOW",

  };

}





export function analyzeStudentContext(
  context:AIStudentContext
):AIReasoningResult {


  const insights:AIInsight[] = [];

  const recommendations:AIRecommendation[] = [];



  const cognitive =
    context.cognitive;



  if(
    cognitive.SCI >= 80
  ){

    insights.push(

      buildInsight(

        "Khả năng tự học nổi bật",

        "Học sinh có xu hướng chủ động tiếp nhận và duy trì quá trình học tập.",

        [
          `SCI đạt ${cognitive.SCI}`,
          "Năng lực tự quản lý học tập tốt",
        ],

        "STRENGTH"

      )

    );


    recommendations.push({

      action:
        "Ưu tiên phương pháp học chủ động và dự án cá nhân.",

      reason:
        "Phù hợp với năng lực tự học cao.",

      priority:
        "HIGH",

    });

  }




  if(
    cognitive.CRI >= 80
  ){

    insights.push(

      buildInsight(

        "Năng lực tư duy cao",

        "Học sinh có khả năng xử lý vấn đề và thích nghi với nhiệm vụ phức tạp.",

        [
          `CRI đạt ${cognitive.CRI}`,
        ],

        "STRENGTH"

      )

    );

  }





  if(
    context.history?.growthStatus === "WARNING"
  ){

    insights.push(

      buildInsight(

        "Xu hướng cần theo dõi",

        "Một số chỉ số nhận thức có dấu hiệu suy giảm.",

        [
          context.history.growthMessage ??
          "Growth warning"
        ],

        "WARNING"

      )

    );


    recommendations.push({

      action:
        "Điều chỉnh kế hoạch học tập và theo dõi tiến độ thường xuyên.",

      reason:
        "Xu hướng phát triển hiện tại cần được cải thiện.",

      priority:
        "HIGH",

    });

  }





  if(
    insights.length === 0
  ){

    insights.push(

      buildInsight(

        "Hồ sơ đang được phân tích",

        "Cần thêm dữ liệu để tạo kết luận chính xác hơn.",

        [
          "Chưa đủ tín hiệu mạnh"
        ],

        "OPPORTUNITY"

      )

    );

  }




  return {


    summary:

      `CLA đã phân tích ${insights.length} tín hiệu nhận thức của học sinh.`,



    insights,



    recommendations,



    confidence:

      insights.reduce(
        (sum,item)=>
          sum + item.confidence,
        0
      )
      /
      insights.length,

  };


}