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
          03 · KIỂM TRA CĂN CỨ
        </span>


        <h2>
          Dữ liệu nào đã được kiểm chứng?
        </h2>


        <p>
          LUMEN phân biệt dữ liệu bạn đã cung cấp, kết quả do công thức tính và bằng chứng nghiên cứu. Các mức hỗ trợ hiện nay là quy tắc thử nghiệm, không phải xác suất chính xác.
        </p>

      </div>




      {growthEvidence && (
        <p className="lumen-growth-evidence-note">
          <strong>So sánh theo thời gian · {({ SUFFICIENT: "Đủ dữ liệu mô tả", EMERGING: "Dữ liệu đang hình thành", LIMITED: "Chưa đủ dữ liệu", UNKNOWN: "Chưa rõ" } as Record<string, string>)[growthEvidence.dataQuality] ?? "Cần xem thêm"}:</strong>{" "}
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
            Lịch sử ghi nhận để so sánh
          </span>


          <strong>
            {
              hasHistory
                ? "Đã có"
                : "Đang bổ sung"
            }
          </strong>


        </div>




        <div>

          <i className="is-on" />


          <span>
            Bộ tính chỉ số theo công thức
          </span>


          <strong>
            Đã có
          </strong>


        </div>




        <div>

          <i />


          <span>
            Bằng chứng CLA gây ra cải thiện học tập
          </span>


          <strong>
            Chưa chứng minh
          </strong>


        </div>


      </div>





      {
        aiExplanation && (

          <div className="lumen-ai-explanation">


            <span className="lumen-eyebrow">
              GIẢI THÍCH CĂN CỨ ĐỀ XUẤT
            </span>



            <h2>
              Vì sao hệ thống đưa ra gợi ý này?
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