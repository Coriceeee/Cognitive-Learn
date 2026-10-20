import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";

import "../../styles/12-lumen.css";
import "../../styles/11-cognitive-growth.css";

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
import CognitiveGrowthPanel from "../seed/components/CognitiveGrowthPanel";


export default function LumenPage() {

  const {
    profile,
    cognitive,
    growthAnalytics,
    loading,
    hasProfile,
    error,
  } = useStudentProfile();



  const intelligence =
    useLumenIntelligence(
      profile,
      cognitive,
      growthAnalytics
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
          error && !hasProfile ? (

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

              {error && (
                <div className="lumen-data-warning" role="status">
                  <strong>Đang sử dụng dữ liệu hồ sơ đã tải</strong>
                  <p>{error} Phân tích Growth có thể chưa đầy đủ; các kết quả khác vẫn được hiển thị.</p>
                </div>
              )}

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
                overallScore={cognitive.overallScore}
                scoreAvailable={cognitive.scoreAvailable === true}
              />


              <div className="lumen-growth-section">
                <CognitiveGrowthPanel analytics={growthAnalytics} />
              </div>

              {cognitive.scoreAvailable === true ? (
                <LumenInsightPanel
                  insights={intelligence.insights}
                  aiInsights={intelligence.ai.reasoning.insights}
                />
              ) : (
                <section className="lumen-empty-card">
                  <h2>Đánh giá Cognitive chưa đủ dữ liệu</h2>
                  <p>
                    Vui lòng hoàn thiện các phép đo còn thiếu trong Seed Profile.
                    Lumen không đưa ra kết luận năng lực từ điểm 0 kỹ thuật.
                  </p>
                  <a href="/student/profile" className="lumen-primary-action">
                    Bổ sung dữ liệu
                  </a>
                </section>
              )}


              <LumenEvidencePanel
                hasHistory={intelligence.growthEvidence.status === "OBSERVED"}
                growthEvidence={intelligence.growthEvidence}
                aiExplanation={cognitive.scoreAvailable === true
                  ? intelligence.ai.explanation
                  : undefined}
              />


              {cognitive.scoreAvailable === true && (
                <section className="lumen-gemini-panel" aria-labelledby="lumen-gemini-title">
                  <div className="lumen-gemini-heading">
                    <div>
                      <span className="lumen-eyebrow">GEMINI · DIỄN GIẢI BỔ SUNG</span>
                      <h2 id="lumen-gemini-title">Hiểu rõ hơn kết quả học tập</h2>
                      <p>
                        Nhấn nút bên dưới để yêu cầu Gemini giải thích các chỉ số
                        Cognitive, Growth hợp lệ và khuyến nghị nội bộ CLA.
                        Không gửi họ tên, lớp hoặc mã tài khoản trong nội dung học tập.
                        Lời giải thích chỉ mang tính tham khảo; Gemini không tự
                        tính lại điểm hoặc xác suất tuyển sinh.
                      </p>
                    </div>
                    <span className="lumen-gemini-label">
                      {intelligence.gemini.status === "SUCCESS"
                        ? "Đã có giải thích"
                        : intelligence.gemini.status === "LOADING"
                          ? "Đang xử lý"
                          : "Theo yêu cầu"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="lumen-primary-action lumen-gemini-button"
                    onClick={() => { void intelligence.gemini.generate(); }}
                    disabled={intelligence.gemini.status === "LOADING"}
                    aria-busy={intelligence.gemini.status === "LOADING"}
                  >
                    {intelligence.gemini.status === "LOADING"
                      ? "Đang chờ Gemini trả lời..."
                      : intelligence.gemini.status === "SUCCESS"
                        ? "Tạo lại giải thích"
                        : "Tạo giải thích bằng Gemini"}
                  </button>
                  <div className="lumen-gemini-result" aria-live="polite" aria-atomic="false">
                    {intelligence.gemini.status === "LOADING" && (
                      <p className="lumen-gemini-info">Đang gửi yêu cầu bảo mật đến Gemini. Vui lòng chờ trong giây lát.</p>
                    )}
                    {intelligence.gemini.status === "FALLBACK" && (
                      <div className="lumen-gemini-message" role="status">
                        <strong>Chưa nhận được giải thích từ Gemini</strong>
                        <p>{intelligence.gemini.error}</p>
                        <p>Phân tích nội bộ trong Lumen vẫn sử dụng được bình thường.</p>
                      </div>
                    )}
                    {intelligence.gemini.status === "SUCCESS" && intelligence.gemini.explanation && (
                      <div className="lumen-gemini-answer">
                        <div className="lumen-gemini-answer-header">
                          <strong>Giải thích hỗ trợ từ Gemini</strong>
                          <span>Không thay thế đánh giá của giáo viên</span>
                        </div>
                        <p>{intelligence.gemini.explanation.summary}</p>
                        <h3>Căn cứ giải thích</h3>
                        <ul>
                          {intelligence.gemini.explanation.reasons.map((item, index) => (
                            <li key={`reason-${index}`}>{item}</li>
                          ))}
                        </ul>
                        {intelligence.gemini.explanation.nextActions.length > 0 && (
                          <>
                            <h3>Việc có thể thử</h3>
                            <ul>
                              {intelligence.gemini.explanation.nextActions.map((item, index) => (
                                <li key={`action-${index}`}>{item}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {intelligence.gemini.explanation.limitations.length > 0 && (
                          <>
                            <h3>Giới hạn</h3>
                            <ul>
                              {intelligence.gemini.explanation.limitations.map((item, index) => (
                                <li key={`limit-${index}`}>{item}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        <p className="lumen-gemini-note">
                          Đối chiếu phần Evidence trước khi sử dụng khuyến nghị.
                          Kết quả này chưa được lưu thành quyết định học tập.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {cognitive.scoreAvailable === true && (
                <>
                  <LumenDecisionPanel intelligence={intelligence} />
                  <LumenStrategyPanel strategy={intelligence.strategy} />
                </>
              )}

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