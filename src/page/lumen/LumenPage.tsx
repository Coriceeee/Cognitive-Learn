import { navigateTo } from "../../lib/clientNavigation";
import LearningIntelligencePanel from "../seed/components/LearningIntelligencePanel";
import CognitiveScoreGrid from "../seed/components/CognitiveScoreGrid";
import CognitiveInsightPanel from "../seed/components/CognitiveInsightPanel";
import { useLearningIntelligence } from "../seed/hooks/useLearningIntelligence";
import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import ModuleStateNotice from "../../components/common/ModuleStateNotice";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";


import {
  useVerifiedStudentProfile,
} from "../seed/hooks/StudentProfileProvider";

import {
  useLumenIntelligence,
} from "./hooks/useLumenIntelligence";

import LumenOverview from "./components/LumenOverview";
import LumenInsightPanel from "./components/LumenInsightPanel";
import LumenDecisionPanel from "./components/LumenDecisionPanel";
import LumenEvidencePanel from "./components/LumenEvidencePanel";
import LumenResearchEvidence from "./components/LumenResearchEvidence";
import LumenExternalMlEvidence from "./components/LumenExternalMlEvidence";
import LumenCognitiveResearchReadiness from "./components/LumenCognitiveResearchReadiness";
import LumenStrategyPanel from "./components/LumenStrategyPanel";
import CognitiveGrowthPanel from "../seed/components/CognitiveGrowthPanel";
import LumenSignalAtlas from "./components/LumenSignalAtlas";
import LumenObservationJourney from "./components/LumenObservationJourney";
import LumenAdaptiveRoadmap from "./components/LumenAdaptiveRoadmap";
import LumenDynamicState from "./components/LumenDynamicState";
import ClosedLoopPanel from "../../components/journey/ClosedLoopPanel";


export default function LumenPage() {
  const view = currentFocusedPath();

  const {
    profile,
    cognitive,
    growthAnalytics,
    dynamicState,
    temporalReport,
    loading,
    syncing,
    historyLoading,
    hasProfile,
    error,
  } = useVerifiedStudentProfile();



  const intelligence =
    useLumenIntelligence(
      profile,
      cognitive,
      growthAnalytics
    );



  const advanced = useLearningIntelligence(profile, cognitive, growthAnalytics);

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

          <ModuleStateNotice tone="loading" label="Đang tải Lumen Intelligence" message="Đang nhận hồ sơ và dữ liệu nhận thức để kiểm tra trạng thái." />

        </section>

      </main>

    );

  }



  if (syncing) return (
    <main className="lumen-page">
      <section className="lumen-page-loading">
        <ModuleStateNotice tone="loading" label="Chờ Firestore xác minh"
          message="Đang chờ Firestore xác minh hồ sơ và dữ liệu nhận thức. Kết quả lưu trong cache không được dùng để phân tích." />
      </section>
    </main>
  );

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
        <ModuleSectionNav moduleKey="lumen" />
        {view === "/lumen/evidence" && <ClosedLoopPanel mode="lumen" />}
        {hasProfile && ["/lumen/state", "/lumen/history"].includes(view) && <LumenDynamicState state={dynamicState} temporal={temporalReport} historyLoading={historyLoading} mode={view === "/lumen/state" ? "state" : "history"} />}
        {view === "/lumen/roadmap" && hasProfile && <LumenAdaptiveRoadmap state={dynamicState} temporal={historyLoading?null:temporalReport} />}
        {view === "/lumen/evidence" && <details className="cla-focus-disclosure"><summary>Phương pháp đo và bằng chứng nghiên cứu tổng hợp</summary><LumenResearchEvidence /><LumenExternalMlEvidence />{hasProfile && !error && <LumenCognitiveResearchReadiness cognitive={cognitive} />}</details>}

        {
          error && !hasProfile ? (

            <section className="lumen-error-card">

              <span className="lumen-eyebrow">
                LUMEN · DẤU VÂN TAY TRÍ TUỆ
              </span>

              <h1>Không thể tải dữ liệu</h1>
              <ModuleStateNotice tone="error" label="Cần kiểm tra kết nối"
                message={error}>
                <a href="/student/profile">Kiểm tra hồ sơ Seed</a>
              </ModuleStateNotice>

            </section>

          ) : !hasProfile ? (

            <section className="lumen-empty-card">

              <div className="lumen-empty-icon">
                ✦
              </div>

              <span className="lumen-eyebrow">
                LUMEN · DẤU VÂN TAY TRÍ TUỆ
              </span>

              <h1>Chưa có hồ sơ học sinh</h1>
              <ModuleStateNotice tone="neutral" label="Bắt đầu từ Seed"
                message="Hoàn thiện Seed Profile để bắt đầu quan sát các chỉ số nhận thức. Không suy đoán điểm số khi thiếu dữ liệu.">
                <a href="/student/profile" className="lumen-primary-action">Hoàn thiện hồ sơ</a>
              </ModuleStateNotice>

            </section>

          ) : (

            <>

              {error && (
                <div className="lumen-data-warning" role="status">
                  <strong>Đang sử dụng dữ liệu hồ sơ đã tải</strong>
                  <p>{error} Phân tích Growth có thể chưa đầy đủ; các kết quả khác vẫn được hiển thị.</p>
                </div>
              )}

        {view === "/lumen" && <>
          <div><LumenOverview
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
              /></div>
          <LumenObservationJourney cognitive={cognitive} growth={growthAnalytics} historyLoading={historyLoading} />
          <LumenSignalAtlas cognitive={cognitive} growth={growthAnalytics} mode="indices" />
        </>}


              {view === "/lumen/history" && historyLoading && (
                <p className="lumen-data-warning" role="status">
                  Đang đối chiếu lịch sử Cognitive từ Firestore. Chưa kết luận xu hướng cho đến khi nhận được dữ liệu máy chủ.
                </p>
              )}
        {view === "/lumen/history" && <>
          <div id="lumen-growth" className="lumen-growth-section">
                <CognitiveGrowthPanel analytics={growthAnalytics} />
              </div></>}

              {view === "/lumen/indices" && <div id="lumen-indices"><LumenSignalAtlas cognitive={cognitive} growth={growthAnalytics} mode="indices" /><details className="cla-focus-disclosure"><summary>Chi tiết các chỉ số</summary><CognitiveScoreGrid cognitive={cognitive} /></details></div>}
              {view === "/lumen/history" && <LumenSignalAtlas cognitive={cognitive} growth={growthAnalytics} mode="history" />}

        {view === "/lumen/insights" && <>
          <div id="lumen-insights">{cognitive.scoreAvailable === true ? (
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


              </div></>}

              {view === "/lumen/insights" && <details className="cla-focus-disclosure"><summary>Nhận xét chi tiết theo từng chỉ số</summary><CognitiveInsightPanel cognitive={cognitive} hasProfile={hasProfile} onCreateProfile={() => {navigateTo("/student/profile");}} /></details>}
              {view === "/lumen/evidence" && <LumenEvidencePanel
                hasHistory={intelligence.growthEvidence.status === "OBSERVED"}
                growthEvidence={intelligence.growthEvidence}
                aiExplanation={cognitive.scoreAvailable === true
                  ? intelligence.ai.explanation
                  : undefined}
              />}


              {view === "/lumen/assistant" && cognitive.scoreAvailable !== true && <p className="cla-transcript-hint">Chưa đủ dữ liệu để giải thích bằng AI. <a href="/student/profile">Bổ sung hồ sơ</a>.</p>}
              {view === "/lumen/assistant" && cognitive.scoreAvailable === true && (
                <section id="lumen-gemini" className="lumen-gemini-panel" aria-labelledby="lumen-gemini-title">
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

                  <section className="lumen-gemini-answer" aria-labelledby="lumen-local-guide-title">
                    <div className="lumen-gemini-answer-header">
                      <strong id="lumen-local-guide-title">Hướng dẫn CLA nội bộ · không cần Gemini</strong>
                      <span>Quy tắc thử nghiệm, không phải dự báo ML</span>
                    </div>
                    <p>{intelligence.localGuide.summary}</p>
                    {intelligence.localGuide.observations.length > 0 && <>
                      <h3>Chỉ báo được sử dụng</h3>
                      <ul>{intelligence.localGuide.observations.map(value => <li key={value}>{value}</li>)}</ul>
                    </>}
                    <h3>Bước có thể thử</h3>
                    <ul>{intelligence.localGuide.nextActions.map(value => <li key={value}>{value}</li>)}</ul>
                    <p className="lumen-gemini-note">{intelligence.localGuide.limitations.join(" ")}</p>
                  </section>

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
                          <span>Không thay thế đánh giá chuyên môn</span>
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

              {view === "/lumen/advanced" && (cognitive.scoreAvailable === true ? <LearningIntelligencePanel intelligence={advanced} /> : <p className="cla-transcript-hint">Chưa đủ dữ liệu Cognitive hợp lệ. <a href="/student/profile">Bổ sung hồ sơ</a>.</p>)}
              {view === "/lumen/insights" && cognitive.scoreAvailable === true && (
                <>
                  <LumenDecisionPanel intelligence={intelligence} />
                  <details className="cla-focus-disclosure"><summary>Chiến lược học tập tham khảo</summary><LumenStrategyPanel strategy={intelligence.strategy} /></details>
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
              LUMEN · DẤU VÂN TAY TRÍ TUỆ
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