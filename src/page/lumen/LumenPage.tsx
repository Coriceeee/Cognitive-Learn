import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";

import "../../styles/12-lumen.css";

import {
  useStudentProfile,
} from "../seed/hooks/useStudentProfile";

import {
  useLumenIntelligence,
} from "./hooks/useLumenIntelligence";

import LumenOverview from "./components/LumenOverview";
import LumenInsightPanel from "./components/LumenInsightPanel";
import LumenDecisionPanel from "./components/LumenDecisionPanel";
import LumenEvidencePanel from "./components/LumenEvidencePanel";
import LumenStrategyPanel from "./components/LumenStrategyPanel";


export default function LumenPage() {

  const {
    profile,
    cognitive,
    loading,
    hasProfile,
    error,
  } = useStudentProfile();



  const intelligence =
    useLumenIntelligence(
      profile,
      cognitive
    );



  if (loading) {

    return (

      <main className="lumen-page">

        <header className="lumen-floating-header">

          <a
            className="lumen-home-logo"
            href="/student"
            aria-label="Về trang học sinh"
          >

            <img
              src={appLogo}
              alt="Cognitive Learn"
            />

          </a>

          <UserMenu />

        </header>


        <section className="lumen-page-loading">

          <div className="lumen-loading-orb" />

          <strong>
            Đang tải Lumen Intelligence...
          </strong>

        </section>

      </main>

    );

  }



  return (

    <main className="lumen-page">

      <header className="lumen-floating-header">

        <a
          className="lumen-home-logo"
          href="/student"
          aria-label="Về trang học sinh"
        >

          <img
            src={appLogo}
            alt="Cognitive Learn"
          />

        </a>

        <UserMenu />

      </header>



      <section className="lumen-shell">

        {
          error ? (

            <section className="lumen-error-card">

              <span className="lumen-eyebrow">
                LUMEN INTELLIGENCE
              </span>

              <h1>
                Không thể tải dữ liệu
              </h1>

              <p>
                {error}
              </p>

            </section>

          ) : !hasProfile ? (

            <section className="lumen-empty-card">

              <div className="lumen-empty-icon">
                ✦
              </div>

              <span className="lumen-eyebrow">
                LUMEN INTELLIGENCE
              </span>

              <h1>
                Chưa có hồ sơ học sinh
              </h1>

              <p>
                Hoàn thiện Seed Profile để kích hoạt hệ thống phân tích nhận thức.
              </p>

              <a
                href="/student/profile"
                className="lumen-primary-action"
              >
                Hoàn thiện hồ sơ
              </a>

            </section>

          ) : (

            <>

              <LumenOverview
                fullName={
                  profile.fullName
                }
                targetMajor={
                  profile.targetMajor
                }
                targetUniversity={
                  profile.targetUniversity
                }
                overallScore={
                  cognitive.overallScore
                }
              />


              <LumenInsightPanel
                insights={
                  intelligence.insights
                }
                aiInsights={
                  intelligence.ai?.reasoning?.insights ?? []
                }
              />


              <LumenEvidencePanel
                hasHistory={
                  hasProfile
                }
                aiExplanation={
                  intelligence.ai?.explanation
                }
              />


              <LumenDecisionPanel
                intelligence={
                  intelligence
                }
              />


              <LumenStrategyPanel
                strategy={
                  intelligence.strategy
                }
              />

            </>

          )
        }


        <footer className="lumen-footer">

          <div>

            <strong>
              COGNITIVE LEARN AI
            </strong>

            <span>
              LUMEN INTELLIGENCE
            </span>

          </div>

          <small>
            Understand → Predict → Simulate → Decide
          </small>

        </footer>

      </section>

    </main>

  );

}