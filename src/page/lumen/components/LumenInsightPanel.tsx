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
          COGNITIVE INSIGHT
        </span>


        <h2>
          Phân tích năng lực nhận thức
        </h2>


        <p>
          Tổng hợp từ Cognitive Engine
          và dữ liệu học tập của học sinh.
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
                            Score
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

                AI REASONING

              </span>


              <h2>

                Insight từ AI Intelligence Core

              </h2>


              <p>

                AI phân tích dựa trên
                cognitive profile,
                growth trend và hành vi học tập.

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

                          Confidence

                        </span>


                        <strong>

                          {
                            getConfidence(
                              item.confidence
                            )
                          }

                          %

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