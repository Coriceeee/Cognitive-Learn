import {
  LumenInsight,
  LumenDecision
} from "./lumenTypes";


export function analyzeCognitiveProfile(
 cognitive:any
){


 const insights:LumenInsight[]=[];


 Object.entries(cognitive)
 .forEach(([key,value])=>{


   if(
     typeof value !== "number"
   ) return;



   if(value>=80){

     insights.push({

       dimension:key,

       score:value,

       level:"STRENGTH",

       title:
        `${key} là điểm mạnh`,

       description:
        "Năng lực này đang ở mức nổi bật.",

       recommendation:
        "Nên khai thác để xây dựng chiến lược học tập."

     });

   }


   else if(value<60){

     insights.push({

       dimension:key,

       score:value,

       level:"RISK",

       title:
        `${key} cần cải thiện`,

       description:
        "Đây là vùng có thể ảnh hưởng đến hiệu quả học tập.",

       recommendation:
        "Cần xây dựng kế hoạch cải thiện."

     });

   }


 });


 return insights;

}



export function buildLumenDecision(
 insights:LumenInsight[]
):LumenDecision{


 const strengths =
 insights
 .filter(
  x=>x.level==="STRENGTH"
 )
 .map(
  x=>x.title
 );



 const risks =
 insights
 .filter(
  x=>x.level==="RISK"
 )
 .map(
  x=>x.title
 );



 return {


  strengths,


  risks,


  learningStrategy:[

   "Ưu tiên phát huy điểm mạnh nhận thức",

   "Xây dựng kế hoạch học cá nhân hóa",

   "Theo dõi sự thay đổi theo thời gian"

  ],



  summary:
   strengths.length>0
   ?
   "Hồ sơ nhận thức có nhiều tiềm năng phát triển."
   :
   "Cần tiếp tục thu thập dữ liệu."

 };

}