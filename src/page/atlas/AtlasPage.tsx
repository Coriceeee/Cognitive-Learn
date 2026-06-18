import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

import AtlasAdmissionEnginePanel from "./components/AtlasAdmissionEnginePanel";
import AtlasGeminiReaderPanel from "./components/AtlasGeminiReaderPanel";
import AtlasKnowledgeStats from "./components/AtlasKnowledgeStats";
import AtlasProgramCard from "./components/AtlasProgramCard";
import { useAtlasKnowledge } from "./hooks/useAtlasKnowledge";

export default function AtlasPage() {
  const {
    programs,
    sources,
    stats,
    universityMap,
    addGeminiDraft,
    clearAtlasData,
  } = useAtlasKnowledge();

  function scrollToGemini() {
    document.getElementById("atlas-gemini-reader")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToEngine() {
    document.getElementById("atlas-engine")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="atlas-page">
      <header className="atlas-floating-header">
        <a
          className="atlas-home-logo"
          href="/student"
          aria-label="Về trang học sinh"
        >
          <img src={appLogo} alt="Cognitive Learn" />
        </a>

        <UserMenu />
      </header>

      <section className="atlas-shell">
        <section className="atlas-hero">
          <div className="atlas-hero-copy">
            <span>ATLAS ADMISSION AI</span>
            <h1>Tìm dữ liệu tuyển sinh bằng Gemini</h1>
            <p>
              Atlas cho phép nhập tên trường đơn giản, sau đó Gemini trả về dữ
              liệu tuyển sinh gồm ngành học, mã ngành, tổ hợp, phương thức xét
              tuyển, học phí, học bổng và link nguồn. Dữ liệu này được lưu vào
              Atlas Knowledge Base để chạy Admission Engine.
            </p>

            <div className="atlas-hero-actions">
              <button type="button" onClick={scrollToGemini}>
                Tìm dữ liệu tuyển sinh
              </button>

              <button type="button" className="secondary" onClick={scrollToEngine}>
                Chạy Admission Engine
              </button>

              {programs.length > 0 && (
                <button type="button" className="danger" onClick={clearAtlasData}>
                  Xóa dữ liệu hiện tại
                </button>
              )}
            </div>
          </div>

          <div className="atlas-hero-card">
            <span>Pipeline</span>

            <div className="atlas-flow">
              <strong>Student Query</strong>
              <i></i>
              <strong>Gemini Admission Reader</strong>
              <i></i>
              <strong>Atlas Knowledge Base</strong>
              <i></i>
              <strong>Admission Engine</strong>
            </div>
          </div>
        </section>

        <div className="atlas-warning">
          Atlas ưu tiên dữ liệu có link nguồn tuyển sinh. Nếu Gemini không trả
          được nguồn, hệ thống vẫn lưu bản nháp nhưng giảm độ tin cậy để tránh
          dùng dữ liệu thiếu căn cứ.
        </div>

        <div id="atlas-gemini-reader">
          <AtlasGeminiReaderPanel onAddGeminiDraft={addGeminiDraft} />
        </div>

        <AtlasKnowledgeStats stats={stats} />

        <section className="atlas-section" id="atlas-programs">
          <div className="atlas-section-head">
            <div>
              <span>ATLAS KNOWLEDGE BASE</span>
              <h2>Ngành tuyển sinh đã lấy được</h2>
            </div>

            <p>{programs.length} ngành trong Atlas</p>
          </div>

          {programs.length > 0 ? (
            <div className="atlas-program-grid">
              {programs.map((program) => (
                <AtlasProgramCard
                  key={program.id}
                  program={program}
                  university={universityMap[program.universityId]}
                  sources={sources}
                />
              ))}
            </div>
          ) : (
            <div className="atlas-empty-state">
              <strong>Chưa có dữ liệu tuyển sinh</strong>
              <p>
                Nhập tên trường ở ô Gemini Admission Reader để Atlas tạo dữ liệu
                ngành, học phí, học bổng và link nguồn.
              </p>
            </div>
          )}
        </section>

        <div id="atlas-engine">
          <AtlasAdmissionEnginePanel
            programs={programs}
            universityMap={universityMap}
          />
        </div>
      </section>
    </main>
  );
}