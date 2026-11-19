import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import { useEffect, useState } from "react";
import { pushAppNotice } from "../../lib/appNotices";
import { auth } from "../../lib/firebase";

import ExamReminderBoard from "../../components/student/ExamReminderBoard";
import "../../styles.css";

import StudentDecisionCanvas from "./components/StudentDecisionCanvas";
import StudentHeader from "./components/StudentHeader";
import StudentLoading from "./components/StudentLoading";
import StudentPlanPanel from "./components/StudentPlanPanel";
import StudentProfileNoticeModal from "./components/StudentProfileNoticeModal";
import StudentRecommendationGrid from "./components/StudentRecommendationGrid";
import seedIcon from "../../assets/modules/seed-profile.png";
import lumenIcon from "../../assets/modules/lumen-intelligence.png";
import atlasIcon from "../../assets/modules/atlas-admission.png";
import orionIcon from "../../assets/modules/orion-strategy.png";
import pulseIcon from "../../assets/modules/pulse-monitor.png";
import havenIcon from "../../assets/modules/haven-support.png";

import { useStudentProfile } from "./hooks/useStudentProfile";
import { useAcademicGpaIntegrity } from "./hooks/useAcademicGpaIntegrity";
import { useLearningIntelligence } from "./hooks/useLearningIntelligence";

type ModuleLink = {
  code: string;
  title: string;
  summary: string;
  href: string;
  icon: string;
  category: string;
};

// Six student-facing modules. Admin/Research tasks are deliberately excluded.
const coreModules: ModuleLink[] = [
  { code: "01 / SEED", title: "Hồ sơ học tập", summary: "Thông tin cá nhân, điểm số, GPA và mục tiêu học tập.", href: "/student/profile", icon: seedIcon, category: "Dữ liệu cá nhân" },
  { code: "02 / LUMEN", title: "Phân tích năng lực", summary: "SCI, MAS, CSL, lịch sử đo và giải thích kết quả.", href: "/lumen", icon: lumenIcon, category: "Phân tích học tập" },
  { code: "03 / ATLAS", title: "Tuyển sinh & du học", summary: "Tra cứu ngành, trường, phương thức và lộ trình quốc tế.", href: "/atlas", icon: atlasIcon, category: "Định hướng" },
  { code: "04 / ORION", title: "Kế hoạch & chiến lược", summary: "Mục tiêu, mô phỏng các phương án và lộ trình theo tuần.", href: "/orion", icon: orionIcon, category: "Lập kế hoạch" },
  { code: "05 / PULSE", title: "Theo dõi tiến độ", summary: "Theo dõi kết quả, báo cáo cá nhân và việc cần làm.", href: "/pulse", icon: pulseIcon, category: "Theo dõi" },
  { code: "06 / HAVEN", title: "Học bổng & tài chính", summary: "Điều kiện học bổng, chi phí và kế hoạch ngân sách.", href: "/haven", icon: havenIcon, category: "Hỗ trợ tài chính" },
];

function getRiskText(riskLevel: string): string {
  if (riskLevel === "LOW") return "Cần theo dõi theo dữ liệu";
  if (riskLevel === "MEDIUM") return "Có tín hiệu cần chú ý";
  if (riskLevel === "HIGH") return "Cần xem xét ưu tiên";
  return "Chưa đủ dữ liệu";
}

function isMeaningfulText(value: string | undefined): boolean {
  return Boolean(value && value.trim() && value !== "--" && value !== "Chưa có dữ liệu");
}

export default function StudentPage() {
  const view = currentFocusedPath();
  const {
    profile,
    cognitive,
    growthAnalytics,
    temporalReport,
    loading,
    syncing,
    historyLoading,
    hasProfile,
    error,
    isAdminPreview,
  } = useStudentProfile();
  const gpaIntegrity = useAcademicGpaIntegrity();

  // Use the same Firestore-backed Growth evidence as the Lumen page.
  const intelligence = useLearningIntelligence(profile, cognitive, growthAnalytics);
  const [showProfileNotice, setShowProfileNotice] = useState(false);

  const profilePath = isAdminPreview
    ? "/student/profile?from=admin"
    : "/student/profile";

  const hasCognitiveScore = hasProfile && cognitive.scoreAvailable === true;
  const hasComparableGrowth =
    hasProfile &&
    growthAnalytics !== null &&
    growthAnalytics.overall.previous !== null &&
    growthAnalytics.observationDays > 0 &&
    growthAnalytics.dataQuality !== "LIMITED";

  useEffect(() => {
    setShowProfileNotice(view === "/student" && !loading && !syncing && !hasProfile && !error);
  }, [view, loading, syncing, hasProfile, error]);

  useEffect(() => {
    if (loading || syncing || !error) return;
    pushAppNotice(hasProfile
      ? {kind:"info", title:"Chưa xác minh được lịch sử Cognitive", detail:"Hồ sơ đã được đồng bộ, nhưng phân tích tăng trưởng chưa có bằng chứng mới từ máy chủ."}
      : {kind:"error", title:"Không tải được hồ sơ học tập", detail:"Dữ liệu trên Dashboard chưa sẵn sàng. Kiểm tra kết nối hoặc quyền truy cập rồi tải lại."});
  }, [loading, syncing, error, hasProfile]);

  useEffect(() => {
    if (loading || syncing || !hasProfile || historyLoading) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      const key = `cla-seed-save-flash:${uid}`;
      if (window.sessionStorage.getItem(key) !== "saved") return;
      window.sessionStorage.removeItem(key);
      pushAppNotice({kind:"success", title:"Hồ sơ đã được cập nhật", detail:"Hồ sơ và bảng điểm mới đã lưu vào Firebase. Bạn có thể mở Lumen để xem phân tích dựa trên dữ liệu mới."});
    } catch { /* Private browsing may block storage, without affecting the dashboard. */ }
  }, [loading, syncing, hasProfile, historyLoading]);

  useEffect(() => {
    if (loading || window.location.hash !== "#cla-exam-reminders") return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("cla-exam-reminders")?.scrollIntoView({block: "start"});
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading]);

  function goTo(path: string) {
    window.location.href = path;
  }

  const actions: { title: string; detail: string; href: string }[] = !hasProfile
    ? [
        {
          title: "Hoàn thiện hồ sơ học tập",
          detail: "Bổ sung thông tin để hệ thống có dữ liệu phân tích.",
          href: profilePath,
        },
        {
          title: "Xem cách CLA hoạt động",
          detail: "Tìm hiểu từng phân hệ trước khi sử dụng.",
          href: "/student/guide",
        },
      ]
    : [
        ...cognitive.nextActions.slice(0, 3).map((title) => ({
          title,
          detail: "Gợi ý từ quy tắc phân tích thử nghiệm; cần đối chiếu thực tế.",
          href: "/lumen",
        })),
      ];

  if (hasProfile && actions.length < 3) {
    actions.push({
      title: "Rà soát thông tin học tập",
      detail: "Bảo đảm điểm số, mục tiêu và hành vi đã được cập nhật.",
      href: profilePath,
    });
  }
  if (hasProfile && actions.length < 3) {
    actions.push({
      title: "Khám phá lộ trình học tập",
      detail: "Mở Orion để xem các kịch bản và kế hoạch đề xuất.",
      href: "/orion",
    });
  }

  const displayName =
    hasProfile && isMeaningfulText(profile.fullName)
      ? profile.fullName
      : "Học sinh";
  const targetMajor =
    hasProfile && isMeaningfulText(profile.targetMajor)
      ? profile.targetMajor
      : "Chưa thiết lập";

  if (loading) return <StudentLoading />;
  if (syncing) return (
    <main className="student-page">
      <StudentHeader isAdminPreview={isAdminPreview} />
      <section className="student-shell student-dash" role="status" aria-live="polite">
        <div className="student-data-alert">
          Đang chờ xác minh hồ sơ từ máy chủ. Dữ liệu cache hoặc đang lưu dở không được dùng để phân tích.
          Hãy kiểm tra kết nối mạng.
        </div>
      </section>
    </main>
  );

  return (
    <main className="student-page">
      <StudentHeader isAdminPreview={isAdminPreview} />

      <StudentProfileNoticeModal
        open={showProfileNotice}
        onClose={() => setShowProfileNotice(false)}
        onCreateProfile={() => goTo(profilePath)}
      />

      <section className="student-shell student-dash">
        {error && (
          <div className="student-data-alert" role="alert">
            {error}
          </div>
        )}
        {hasProfile && gpaIntegrity.status === "MISMATCH" && (
          <div className="student-data-alert" role="alert">
            GPA trong hồ sơ chưa khớp với bảng điểm trên máy chủ. Hãy mở
            {" "}<a href="/student/transcript">trang bảng điểm</a>{" "}
            để đối soát trước khi sử dụng kết quả học lực trong phân tích hoặc tư vấn.
          </div>
        )}
        {hasProfile && (gpaIntegrity.status === "LEGACY" || gpaIntegrity.status === "INCOMPLETE") && (
          <div className="student-data-alert" role="status">
            GPA chưa được đối chiếu đầy đủ giữa hồ sơ và bảng điểm. Kết quả cũ không được coi là đã xác minh.
          </div>
        )}

        <ModuleSectionNav moduleKey="seed" />
        {view === "/student" && <>
        <section className="student-dash-hero cla-observatory-intro" aria-labelledby="student-dash-title">
          <div className="cla-intro-copy">
            <span className="cla-canvas-index">COGNITIVE LEARN AI / SPECTRAL OBSERVATORY</span>
            <h1 id="student-dash-title">Xin chào, {displayName}.</h1>
            <p>Hiểu năng lực hiện tại, lựa chọn chiến lược và theo dõi kết quả học tập.</p>
          </div>
          <div className="cla-intro-target"><span>MỤC TIÊU CỦA BẠN</span><strong>{targetMajor}</strong><small>{hasProfile && isMeaningfulText(profile.targetUniversity) ? profile.targetUniversity : "Chưa chọn trường mục tiêu"}</small><a href={profilePath}>{hasProfile ? "Cập nhật hồ sơ" : "Tạo hồ sơ"} ↗</a></div>
        </section>
        <StudentDecisionCanvas cognitive={cognitive} gpa={gpaIntegrity.status === "VERIFIED" ? gpaIntegrity.result : null} temporal={!historyLoading && !error ? temporalReport : null} hasProfile={hasProfile} demo={isAdminPreview} />

        {/* 2. A single action hub that answers: What should I do next? */}
        <section className="student-dash-focus" aria-labelledby="student-dash-focus-title">
          <div className="student-dash-card student-dash-priorities">
            <div className="student-dash-heading">
              <div>
                <span className="student-dash-eyebrow">ƯU TIÊN CỦA BẠN</span>
                <h2 id="student-dash-focus-title">Việc nên làm tiếp theo</h2>
              </div>
              <span className="student-dash-soft-pill">Tối đa 3 việc</span>
            </div>
            <div className="student-dash-action-list">
              {actions.slice(0, 3).map((action, index) => (
                <a href={action.href} className="student-dash-action" key={`${index}-${action.title}`}>
                  <span className="student-dash-action-num">{String(index + 1).padStart(2, "0")}</span>
                  <span className="student-dash-action-body">
                    <strong>{action.title}</strong>
                    <small>{action.detail}</small>
                  </span>
                  <span className="student-dash-action-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>

          <aside className="student-dash-card student-dash-status" aria-label="Tình trạng dữ liệu">
            <div className="student-dash-heading">
              <div>
                <span className="student-dash-eyebrow">TÌNH TRẠNG DỮ LIỆU</span>
                <h2>Mức độ sẵn sàng</h2>
              </div>
            </div>
            <div className="student-dash-status-list">
              <div>
                <span>Hồ sơ Seed</span>
                <strong className={hasProfile ? "is-ok" : "is-pending"}>
                  {hasProfile ? "Đã lưu" : "Chưa có"}
                </strong>
              </div>
              <div>
                <span>Đánh giá Cognitive</span>
                <strong className={hasCognitiveScore ? "is-ok" : "is-pending"}>
                  {hasCognitiveScore ? "Có chỉ số" : "Thiếu phép đo"}
                </strong>
              </div>
              <div>
                <span>Lịch sử Growth</span>
                <strong className={hasComparableGrowth ? "is-ok" : "is-pending"}>
                  {hasComparableGrowth ? "Có thể so sánh" : "Cần đo lại"}
                </strong>
              </div>
              <div>
                <span>Rủi ro nhận thức</span>
                <strong>{hasProfile ? getRiskText(cognitive.riskLevel) : "Chưa đánh giá"}</strong>
              </div>
            </div>
            <p className="student-dash-status-note">
              {hasComparableGrowth
                ? intelligence.growthEvidence.message
                : "Growth cần ít nhất hai lần đo hợp lệ cách nhau về thời gian."}
            </p>
          </aside>
        </section>

        {/* Student-chosen exam milestones sit below the hero AND the priority/status cards. */}
        {!isAdminPreview && <p className="cla-focus-notice"><a href="/student/exams#cla-exam-reminders">Lịch thi & đếm ngược của tôi →</a></p>}

        {/* 3. Four primary destinations, plus two lightweight secondary links. */}
        <section className="student-dash-modules" aria-labelledby="student-dash-modules-title">
          <div className="student-dash-heading">
            <div>
              <span className="student-dash-eyebrow">KHÔNG GIAN HỌC TẬP</span>
              <h2 id="student-dash-modules-title">Bạn muốn khám phá gì?</h2>
            </div>
          </div>
          <div className="student-dash-module-grid">
            {coreModules.map((module) => (
              <a
                className="student-dash-module"
                href={module.href === "/student/profile" ? profilePath : module.href}
                key={module.code}
              >
                <span className="student-dash-module-icon"><img src={module.icon} alt="" aria-hidden="true" /></span>
                <span className="cla-focus-module-copy"><small>{module.code} · {module.category}</small><strong>{module.title}</strong><span>{module.summary}</span></span>
                <span className="cla-focus-module-arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
          <div className="student-dash-extra-links">
            <a href="/student/transcript">Mở bảng điểm THPT <span aria-hidden="true">↗</span></a>
            <a href="/student/modules">Tìm nhanh chức năng cần dùng <span aria-hidden="true">↗</span></a>
            <a href="/student/guide">Hướng dẫn vận hành từng bước <span aria-hidden="true">↗</span></a>
          </div>
        </section>

          {isAdminPreview && (
          <details className="student-dash-disclosure">
            <summary>
              <span><strong>Dữ liệu minh họa giao diện</strong><small>Kế hoạch và gợi ý mẫu — không phải dữ liệu học sinh</small></span>
              <span className="student-dash-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="student-dash-disclosure-content">
              <p className="student-dash-research-note">
                Các kế hoạch và gợi ý dưới đây đến từ <code>studentDashboardData.ts</code>, chỉ để
                kiểm tra giao diện. Không sử dụng những giá trị này cho phân tích,
                khuyến nghị chính thức hay nghiên cứu.
              </p>
              <div className="student-main-grid">
                <StudentPlanPanel />
              </div>
              <StudentRecommendationGrid />
            </div>
          </details>
          )}


        </>}
        {view === "/student/exams" && (!isAdminPreview ? <ExamReminderBoard /> : <p role="status">Lịch thi cá nhân chỉ dành cho tài khoản học sinh.</p>)}
      </section>
    </main>
  );
}
