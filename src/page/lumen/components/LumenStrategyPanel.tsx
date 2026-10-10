import type {
  LumenStrategyView,
} from "../../../engines/lumen/lumenStrategyAdapter";


type Props = {

  strategy?:LumenStrategyView;

};



function getRiskLabel(
  riskLevel:string
){

  if(riskLevel === "LOW"){
    return "Ổn định";
  }

  if(riskLevel === "MEDIUM"){
    return "Cần tăng tốc";
  }

  return "Rủi ro cao";

}



export default function LumenStrategyPanel({

  strategy,

}:Props) {


  if(!strategy){

    return (

      <section className="lumen-panel">

        <div className="lumen-panel-heading">

          <span className="lumen-eyebrow">
            ORION STRATEGY
          </span>

          <h2>
            Chiến lược phát triển
          </h2>

          <p>
            Orion sẽ xây dựng chiến lược sau khi
            hệ thống nhận đủ dữ liệu mục tiêu và
            điểm học tập cần thiết.
          </p>

        </div>

      </section>

    );

  }



  return (

    <section className="lumen-panel">


      <div className="lumen-panel-heading">

        <span className="lumen-eyebrow">
          ORION STRATEGY
        </span>

        <h2>
          Chiến lược phát triển cá nhân
        </h2>

        <p>
          Orion mô phỏng khoảng cách hiện tại,
          mức sẵn sàng và các chiến lược có thể
          thực hiện để tiến tới mục tiêu.
        </p>

      </div>




      <div className="lumen-decision-grid">


        <article className="lumen-decision-card">

          <span>
            Mức sẵn sàng
          </span>

          <strong>
            {strategy.readinessScore}/100
          </strong>

        </article>




        <article className="lumen-decision-card">

          <span>
            Mức rủi ro
          </span>

          <strong>
            {getRiskLabel(strategy.riskLevel)}
          </strong>

        </article>




        <article className="lumen-decision-card">

          <span>
            Chiến lược được chọn
          </span>

          <strong>
            {strategy.scenario}
          </strong>

        </article>




        <article className="lumen-decision-card">

          <span>
            Môn trọng tâm
          </span>


          {
            strategy.focusSubjects.length === 0 ? (

              <p>
                Chưa xác định môn trọng tâm.
              </p>

            ) : (

              <ul>

                {
                  strategy.focusSubjects.map(
                    subject => (

                      <li key={subject}>
                        {subject}
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
            Tóm tắt chiến lược
          </span>

          <p>
            {strategy.title}
          </p>

        </article>


      </div>




      <div className="lumen-panel-heading">

        <span className="lumen-eyebrow">
          MILESTONES
        </span>

        <h2>
          Lộ trình theo giai đoạn
        </h2>

      </div>




      <div className="lumen-insight-grid">

        {
          strategy.milestones.map(
            milestone => (

              <article
                className="lumen-insight-card"
                key={`${milestone.week}-${milestone.title}`}
              >

                <span className="lumen-card-tag">
                  TUẦN {milestone.week}
                </span>

                <h3>
                  {milestone.title}
                </h3>

                <ul>

                  {
                    milestone.actions.map(
                      action => (

                        <li key={action}>
                          {action}
                        </li>

                      )
                    )
                  }

                </ul>

              </article>

            )
          )
        }

      </div>




      {
        strategy.warnings.length > 0 && (

          <div className="lumen-ai-explanation">

            <span className="lumen-eyebrow">
              ORION WARNINGS
            </span>

            <h2>
              Điều cần lưu ý
            </h2>

            <div className="lumen-ai-explanation-card">

              <ul>

                {
                  strategy.warnings.map(
                    warning => (

                      <li key={warning}>
                        {warning}
                      </li>

                    )
                  )
                }

              </ul>

            </div>

          </div>

        )

      }


    </section>

  );

}