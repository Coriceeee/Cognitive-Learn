import type { LumenGrowthEvidence } from "../../../engines/lumen/lumenEngine";

import type {
  AIExplanation,
} from "../../../engines/ai/aiTypes";


type Props = {

  hasHistory:boolean;
  growthEvidence?: LumenGrowthEvidence;

  aiExplanation?:AIExplanation;

};



export default function LumenEvidencePanel({

  hasHistory,
  growthEvidence,
  aiExplanation,

}:Props) {


  return (

    <section className="lumen-evidence-card">


      <div>

        <span className="lumen-eyebrow">
          03 · WHY?
        </span>


        <h2>
          Evidence status
        </h2>


        <p>
          Lumen phân biệt giữa dữ liệu
          quan sát, engine output và
          bằng chứng nghiên cứu. Chỉ số tin cậy nội bộ hiện là quy tắc
          thử nghiệm, không phải xác suất đã hiệu chuẩn.
        </p>

      </div>




      {growthEvidence && (
        <p className="lumen-growth-evidence-note">
          <strong>Growth · {growthEvidence.dataQuality}:</strong>{" "}
          {growthEvidence.message}
          {growthEvidence.status !== "NO_COMPARISON" && (
            <> · Khoảng quan sát: {growthEvidence.observationDays} ngày.</>
          )}
        </p>
      )}

      <div className="lumen-evidence-list">


        <div>

          <i
            className={
              hasHistory
                ? "is-on"
                : ""
            }
          />


          <span>
            Longitudinal cognitive history
          </span>


          <strong>
            {
              hasHistory
                ? "Available"
                : "Building"
            }
          </strong>


        </div>




        <div>

          <i className="is-on" />


          <span>
            Deterministic intelligence engines
          </span>


          <strong>
            Available
          </strong>


        </div>




        <div>

          <i />


          <span>
            Research-grade causal evidence
          </span>


          <strong>
            Not claimed
          </strong>


        </div>


      </div>





      {
        aiExplanation && (

          <div className="lumen-ai-explanation">


            <span className="lumen-eyebrow">
              EXPLAINABLE AI
            </span>



            <h2>
              Vì sao AI đưa ra kết luận?
            </h2>



            <div className="lumen-ai-explanation-card">


              <h3>
                {aiExplanation.decision}
              </h3>





              {
                aiExplanation.reasoning.length > 0 && (

                  <div>

                    <strong>
                      Lý do phân tích
                    </strong>


                    <ul>

                      {
                        aiExplanation.reasoning.map(
                          (item)=>(
                            <li key={item}>
                              {item}
                            </li>
                          )
                        )
                      }

                    </ul>


                  </div>

                )

              }






              {
                aiExplanation.evidence.length > 0 && (

                  <div>

                    <strong>
                      Bằng chứng dữ liệu
                    </strong>


                    <ul>

                      {
                        aiExplanation.evidence.map(
                          (item)=>(
                            <li key={item}>
                              {item}
                            </li>
                          )
                        )
                      }

                    </ul>


                  </div>

                )

              }



            </div>


          </div>

        )

      }



    </section>

  );

}