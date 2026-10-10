import type {
  LumenDecision,
} from "../../../engines/lumen/lumenTypes";

import type {
  AIRecommendation,
} from "../../../engines/ai/aiTypes";



type Props = {

  intelligence: {

    decision:LumenDecision;

    ai?: {

      reasoning?: {

        recommendations?:AIRecommendation[];

      };

    };

  };

};




export default function LumenDecisionPanel({

  intelligence,

}:Props) {



  const decision =
    intelligence.decision;


  const recommendations =
    intelligence.ai
      ?.reasoning
      ?.recommendations
      ??
      [];



  return (

    <section className="lumen-panel">



      <div className="lumen-panel-heading">


        <span className="lumen-eyebrow">

          LUMEN DECISION

        </span>


        <h2>

          Chiến lược phát triển cá nhân

        </h2>


        <p>

          Lumen chuyển đổi dữ liệu nhận thức
          thành định hướng hành động kết hợp
          giữa engine phân tích và AI reasoning.

        </p>


      </div>





      <div className="lumen-decision-grid">





        <article className="lumen-decision-card">


          <span>

            Tổng quan

          </span>


          <strong>

            {decision.summary}

          </strong>


        </article>







        <article className="lumen-decision-card">


          <span>

            Điểm mạnh

          </span>



          {

            decision.strengths.length === 0 ? (

              <p>

                Chưa phát hiện điểm mạnh nổi bật.

              </p>

            ) : (

              <ul>

                {
                  decision.strengths.map(
                    item => (

                      <li key={item}>

                        {item}

                      </li>

                    )
                  )
                }

              </ul>

            )

          }


        </article>







        <article className="lumen-decision-card">


          <span>

            Vùng cần cải thiện

          </span>



          {

            decision.risks.length === 0 ? (

              <p>

                Chưa phát hiện rủi ro lớn.

              </p>

            ) : (

              <ul>

                {
                  decision.risks.map(
                    item => (

                      <li key={item}>

                        {item}

                      </li>

                    )
                  )
                }

              </ul>

            )

          }


        </article>







        <article className="lumen-decision-card is-wide">


          <span>

            Chiến lược học tập đề xuất

          </span>




          <div>

            {
              decision.learningStrategy.map(
                item => (

                  <p key={item}>

                    • {item}

                  </p>

                )
              )
            }


          </div>



        </article>







        {
          recommendations.length > 0 && (


            <article className="lumen-decision-card is-wide lumen-ai-recommendation">


              <span>

                AI RECOMMENDATION

              </span>




              <h3>

                Hành động ưu tiên từ AI

              </h3>





              {

                recommendations.map(
                  (item,index)=>(


                    <div
                      key={`${item.action}-${index}`}
                    >


                      <strong>

                        {item.action}

                      </strong>



                      <p>

                        {item.reason}

                      </p>




                      <small>

                        Priority:
                        {" "}
                        {item.priority}

                      </small>



                    </div>


                  )

                )

              }



            </article>


          )

        }





      </div>



    </section>

  );

}