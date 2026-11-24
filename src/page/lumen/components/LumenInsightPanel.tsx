import type {
  AIInsight,
} from "../../../engines/ai/aiTypes";


type LumenInsight = {

  title:string;

  description:string;

  dimension?:string;

  score?:number;

  recommendation?:string;

};



type LumenInsightPanelProps = {

  insights:LumenInsight[];

  aiInsights?:AIInsight[];

};



function getConfidence(
  value:number
){

  return Math.round(
    value * 100
  );

}




export default function LumenInsightPanel({

  insights,

  aiInsights = [],

}:LumenInsightPanelProps) {


  return (

    <section className="lumen-insight-panel">


      <div className="lumen-panel-header">

        <span className="lumen-eyebrow">
          DIỄN GIẢI KẾT QUẢ HỌC TẬP
        </span>


        <h2>
          Gợi ý dựa trên các chỉ báo học tập
        </h2>


        <p>
          Tổng hợp từ dữ liệu học tập và các quy tắc tính thử nghiệm của CLA; không phải kết luận về trí thông minh.
        </p>

      </div>




      {
        insights.length > 0 && (

          <div className="lumen-insight-grid">

            {
              insights.map(
                (item,index)=>(

                  <article

                    key={`${item.title}-${index}`}

                    className="lumen-insight-card"

                  >


                    {
                      item.dimension && (

                        <span className="lumen-card-tag">

                          {item.dimension}

                        </span>

                      )

                    }



                    <h3>
                      {item.title}
                    </h3>



                    <p>
                      {item.description}
                    </p>




                    {
                      typeof item.score === "number" && (

                        <div className="lumen-score">

                          <span>
                            Điểm quy tắc
                          </span>


                          <strong>
                            {item.score}
                          </strong>

                        </div>

                      )

                    }




                    {
                      item.recommendation && (

                        <div className="lumen-recommendation">

                          <strong>
                            Gợi ý:
                          </strong>


                          <p>
                            {item.recommendation}
                          </p>

                        </div>

                      )

                    }



                  </article>

                )
              )
            }


          </div>

        )

      }






      {
        aiInsights.length > 0 && (

          <div className="lumen-ai-insight-section">


            <div className="lumen-panel-header">

              <span className="lumen-eyebrow">

                PHÂN TÍCH TỰ ĐỘNG CỦA CLA

              </span>


              <h2>

                Giải thích bổ sung từ hệ thống

              </h2>


              <p>

                Hệ thống sử dụng các chỉ báo học tập và dữ liệu theo dõi hiện có; chưa chứng minh quan hệ nhân quả.

              </p>


            </div>





            <div className="lumen-ai-insight-grid">


              {
                aiInsights.map(
                  (item,index)=>(

                    <article

                      key={`${item.title}-${index}`}

                      className="lumen-ai-card"

                    >


                      <span className="lumen-card-tag">

                        {item.type}

                      </span>




                      <h3>

                        {item.title}

                      </h3>




                      <p>

                        {item.description}

                      </p>





                      {
                        item.evidence.length > 0 && (

                          <div className="lumen-ai-evidence">


                            <strong>

                              Bằng chứng:

                            </strong>



                            <ul>

                              {
                                item.evidence.map(
                                  evidence=>(

                                    <li key={evidence}>

                                      {evidence}

                                    </li>

                                  )
                                )
                              }

                            </ul>


                          </div>

                        )

                      }





                      <div className="lumen-ai-confidence">


                        <span>

                          Mức hỗ trợ theo quy tắc

                        </span>


                        <strong>

                          {
                            getConfidence(
                              item.confidence
                            )
                          }

                          /100 · Quy tắc nội bộ

                        </strong>


                      </div>




                    </article>

                  )
                )

              }


            </div>



          </div>

        )

      }



    </section>

  );

}