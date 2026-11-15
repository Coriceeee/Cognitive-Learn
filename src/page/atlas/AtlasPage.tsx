import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import { useIsAdmin } from "../../lib/useIsAdmin";
import { domesticInternationalPrograms } from "../../data/domesticInternationalPrograms";
import OfficialAdmissionsExplorer from "./components/OfficialAdmissionsExplorer";
import AtlasOfficialSourceRegistry from "./components/AtlasOfficialSourceRegistry";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

import AtlasAdmissionEnginePanel from "./components/AtlasAdmissionEnginePanel";
import AtlasGeminiReaderPanel from "./components/AtlasGeminiReaderPanel";
import AtlasKnowledgeStats from "./components/AtlasKnowledgeStats";
import AtlasProgramCard from "./components/AtlasProgramCard";
import AtlasCutoffField from "./components/AtlasCutoffField";
import { useAtlasKnowledge } from "./hooks/useAtlasKnowledge";

export default function AtlasPage() {
  const isAdmin = useIsAdmin();
  const {
    programs,
    sources,
    stats,
    universityMap,
    addGeminiDraft,
    clearAtlasData,
    importLegacyAtlasData,
    legacyAvailable,
    storageStatus,
    storageError,
    saving,
  } = useAtlasKnowledge();

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
            <h1>Tuyển sinh Việt Nam & du học quốc tế</h1>
            <p>
              Atlas phụ trách tuyển sinh Việt Nam, du học tại mọi quốc gia, chương trình liên kết quốc tế và định hướng ngành, trường, nguyện vọng.
              Haven phụ trách học bổng, khả năng chi trả và hỗ trợ tài chính. Mọi thông tin tuyển sinh cần nguồn và năm áp dụng.
            </p>

            <div className="atlas-hero-actions">
              <a className="cla-study-jump" href="#atlas-engine">Khám phá môn thi → chương trình có nguồn</a>
              <a className="cla-study-jump" href="/student#cla-exam-reminders">Lịch thi của tôi · Đếm ngược HSA / V-ACT / V-SAT</a>
              {isAdmin ? <a className="cla-study-jump" href="/admin/diagnostics?view=atlas">Nhập và kiểm tra đề án · Admin</a>
                : <a className="cla-study-jump" href="/atlas/vietnam">Tra cứu tuyển sinh Việt Nam</a>}

              <a className="cla-study-jump" href="/atlas/study-abroad">Du học quốc tế · Atlas ↗</a>

              <a className="cla-study-jump" href="/atlas/recommendations">
                Gợi ý ngành & trường
              </a>

              {isAdmin && programs.length > 0 && (
                <button type="button" className="danger" onClick={() => { if (window.confirm("Xóa toàn bộ bản nháp Atlas của tài khoản này?")) void clearAtlasData().catch(() => {}); }} disabled={storageStatus !== "ready" || saving}>
                  Xóa dữ liệu hiện tại
                </button>
              )}
            </div>
          </div>

          <div className="atlas-hero-card">
            <span>{isAdmin ? "Quy trình dữ liệu" : "Quy trình tra cứu"}</span>

            <div className="atlas-flow">
              <strong>{isAdmin ? "Admin nhập đề án" : "Tra cứu trường / ngành"}</strong>
              <i></i>
              <strong>{isAdmin ? "Gemini Admission Reader" : "Nguồn tuyển sinh chính thức"}</strong>
              <i></i>
              <strong>{isAdmin ? "Atlas Knowledge Base" : "Thông tin theo năm và phương thức"}</strong>
              <i></i>
              <strong>{isAdmin ? "Admission Engine" : "Gợi ý phù hợp với hồ sơ"}</strong>
            </div>
          </div>
        </section>

        <div className="atlas-warning">
          Tra cứu từ trang tuyển sinh chính thức; kiểm tra năm, ngành và phương thức của từng trường.
          Thông tin chưa đủ nguồn không được coi là đã xác minh.
        </div>

        {isAdmin && <div role="status" className="atlas-warning">
          {storageError || (storageStatus === "ready" ? "Atlas đang kết nối kho dữ liệu của tài khoản hiện tại." : "Đang xác minh và đồng bộ dữ liệu Atlas…" )}
          {legacyAvailable && storageStatus === "ready" && <button type="button" disabled={saving} onClick={() => void importLegacyAtlasData().catch(error => window.alert(error instanceof Error ? error.message : "Nhập dữ liệu cũ thất bại."))}>
            Chuyển dữ liệu Atlas cũ trên trình duyệt vào kho Atlas (chỉ khi kho hiện tại trống)
          </button>}
        </div>}

        <ModuleSectionNav moduleKey="atlas" />

        <OfficialAdmissionsExplorer />
        <AtlasOfficialSourceRegistry />
        <details className="cla-evidence-sample">
          <summary>Xem ví dụ dữ liệu lịch sử đã đối chiếu · PTIT BVH</summary>
          <AtlasCutoffField />
        </details>

        <section id="atlas-joint-programs" className="cla-source-explorer" aria-label="Chương trình liên kết quốc tế tại Việt Nam">
          <span className="cla-eyebrow">ATLAS · TUYỂN SINH TẠI VIỆT NAM</span>
          <h2>Chương trình liên kết quốc tế tuyển sinh tại Việt Nam</h2>
          <p>Các chương trình do trường tại Việt Nam tiếp nhận hồ sơ thuộc Atlas, kể cả chương trình có đối tác hoặc chuyển tiếp nước ngoài. Hình thức học, văn bằng, chứng chỉ, phương thức và thời hạn phải kiểm tra theo từng chương trình và năm.</p>
          <div className="cla-study-checkpoints">
            {domesticInternationalPrograms.map(program => (
              <article key={program.institution}>
                <strong>{program.institution}</strong>
                <p>Nguồn tham khảo tuyển sinh {program.intakeYear}. {program.note}</p>
                <a href={program.admissionsUrl} target="_blank" rel="noopener noreferrer">Mở thông báo của trường ↗</a>
              </article>
            ))}
          </div>
          <p>Du học quốc tế: <a href="/atlas/study-abroad">mở Atlas Du học</a>. Học bổng và khả năng chi trả: <a href="/haven/scholarships">mở Haven Support</a>.</p>
        </section>

        {isAdmin && <>
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
                ngành, phương thức, học phí và link tuyển sinh. Học bổng tra tại Haven.
              </p>
            </div>
          )}
        </section>

        </>}

        <div id="atlas-engine">
          <AtlasAdmissionEnginePanel
            programs={programs}
            sources={sources}
            universityMap={universityMap}
          />
        </div>
      </section>
    </main>
  );
}