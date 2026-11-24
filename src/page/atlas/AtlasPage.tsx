import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import PublicSourceSearchPanel from "../../components/common/PublicSourceSearchPanel";
import NationalSourceDiscoveryPanel from "../../components/common/NationalSourceDiscoveryPanel";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import ModuleStateNotice from "../../components/common/ModuleStateNotice";
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
import AtlasProgramDiscoveryPanel from "./components/AtlasProgramDiscoveryPanel";
import AtlasDecisionComparisonPanel from "./components/AtlasDecisionComparisonPanel";
import AtlasCutoffField from "./components/AtlasCutoffField";
import AtlasEvidenceJourney from "./components/AtlasEvidenceJourney";
import { useAtlasKnowledge } from "./hooks/useAtlasKnowledge";

export default function AtlasPage() {
  const view = currentFocusedPath();
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
        <ModuleSectionNav moduleKey="atlas" />
        {view === "/atlas" && <>
          <section className="atlas-hero">
          <div className="atlas-hero-copy">
            <span>ATLAS · BẢN ĐỒ TƯƠNG LAI</span>
            <h1>Chọn ngành, trường và nguyện vọng</h1>
            <p>
              Bắt đầu từ điểm học tập hoặc kịch bản thi thử, đối chiếu tổ hợp, tìm ngành và trường phù hợp. Kiểm tra phương thức, năm và nguồn chính thức trước khi lập nguyện vọng.
            </p>

            <div className="atlas-hero-actions">
              {isAdmin ? <a className="cla-study-jump" href="/atlas/library">Kho nhập nguồn · Admin</a> : <a className="cla-study-jump" href="/student/exams#cla-exam-reminders">Lịch thi &amp; đếm ngược</a>}
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
        </section><AtlasEvidenceJourney /></>}

        <ModuleStateNotice tone="warning" label="Đối chiếu nguồn tuyển sinh"
          message="Tra cứu từ trang tuyển sinh chính thức; kiểm tra năm, ngành và phương thức của từng trường. Thông tin chưa đủ nguồn không được coi là đã xác minh." compact />

        {view === "/atlas/library" && isAdmin && <ModuleStateNotice
          tone={storageError ? "error" : storageStatus === "ready" ? "success" : "loading"}
          label={storageError ? "Không thể truy cập kho Atlas" : storageStatus === "ready" ? "Kho Atlas đã xác minh" : "Đang xác minh kho Atlas"}
          message={storageError || (storageStatus === "ready" ? "Atlas đang kết nối kho dữ liệu của tài khoản hiện tại." : "Đang xác minh và đồng bộ dữ liệu Atlas…" )}>
          {legacyAvailable && storageStatus === "ready" && <button type="button" disabled={saving} onClick={() => void importLegacyAtlasData().catch(error => window.alert(error instanceof Error ? error.message : "Nhập dữ liệu cũ thất bại."))}>
            Chuyển dữ liệu Atlas cũ trên trình duyệt vào kho Atlas (chỉ khi kho hiện tại trống)
          </button>}
        </ModuleStateNotice>}

        {view === "/atlas/library" && !isAdmin && <p role="status">Đang xác minh quyền quản trị…</p>}
        {view === "/atlas/library" && isAdmin && <p><a href="/admin/diagnostics?view=atlas">Chẩn đoán kho Atlas (Admin)</a></p>}

        {view === "/atlas/recommendations" && <AtlasProgramDiscoveryPanel />}
        {view === "/atlas/recommendations" && <p className="cla-focus-notice"><a href="/atlas/subjects#atlas-nguyen-vong-nhap">Lập nguyện vọng →</a> · <a href="/orion/scenarios">Lập chiến lược đạt mục tiêu →</a></p>}
        {view === "/atlas/compare" && <AtlasDecisionComparisonPanel />}
        {view === "/atlas/vietnam" && <OfficialAdmissionsExplorer />}
        {view === "/atlas/sources" && <><div id="atlas-public-source-search"><NationalSourceDiscoveryPanel /><details className="cla-evidence-sample"><summary>Tra cứu nguồn một năm (nâng cao)</summary><PublicSourceSearchPanel topic="admission" /></details></div><AtlasOfficialSourceRegistry /></>}
        {["/atlas/vietnam", "/atlas/recommendations"].includes(view) && <p className="cla-focus-notice"><a href="/atlas/sources#atlas-public-source-search">Tìm nguồn của mọi trường trên toàn quốc, kể cả trường ngoài kho →</a></p>}
        {view === "/atlas/compare" && <AtlasCutoffField />}

        {view === "/atlas/joint" && <>
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
        </section></>}

        {view === "/atlas/library" && isAdmin && <>
        {isAdmin && programs.length > 0 && <button type="button" className="danger" onClick={() => { if (window.confirm("Xóa toàn bộ bản nháp Atlas của tài khoản này?")) void clearAtlasData().catch(() => {}); }} disabled={storageStatus !== "ready" || saving}>Xóa dữ liệu hiện tại</button>}
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
            <ModuleStateNotice tone="neutral" label="Chưa có dữ liệu tuyển sinh"
              message="Kho Atlas của tài khoản hiện chưa có bản ghi. Có thể nhập nguồn bằng Gemini Admission Reader và kiểm tra từng đường dẫn chính thức trước khi sử dụng." />
          )}
        </section>

        </>}

        {view === "/atlas/subjects" && <>
          <div id="atlas-engine">
          <AtlasAdmissionEnginePanel
            programs={programs}
            sources={sources}
            universityMap={universityMap}
          />
        </div></>}
      </section>
    </main>
  );
}