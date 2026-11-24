import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import { navigateTo } from "../../lib/clientNavigation";
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
import ExamHorizon from "../../components/student/ExamHorizon";
import LearningCircuit from "./components/LearningCircuit";

import { useVerifiedStudentProfile } from "./hooks/StudentProfileProvider";
import { useAcademicGpaIntegrity } from "./hooks/useAcademicGpaIntegrity";

function isMeaningfulText(value: string | undefined): boolean {
  return Boolean(value && value.trim() && value !== "--" && value !== "Chưa có dữ liệu");
}

export default function StudentPage() {
  const view = currentFocusedPath();
  const {
    profile,
    cognitive,
    temporalReport,
    loading,
    syncing,
    historyLoading,
    hasProfile,
    error,
    isAdminPreview,
  } = useVerifiedStudentProfile();
  const gpaIntegrity = useAcademicGpaIntegrity();

  const [showProfileNotice, setShowProfileNotice] = useState(false);

  const profilePath = isAdminPreview
    ? "/student/profile?from=admin"
    : "/student/profile";

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
    navigateTo(path);
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

        {view === "/student" && <>
        <section className="student-dash-hero cla-observatory-intro" aria-labelledby="student-dash-title">
          <div className="cla-intro-copy">
            <span className="cla-canvas-index">SEED / BẢN SẮC HỌC TẬP</span>
            <h1 id="student-dash-title">Xin chào, {displayName}.</h1>
            <p>Từ hồ sơ học tập đến nguyện vọng đại học: hiểu năng lực, dự báo, chọn ngành và xây dựng chiến lược.</p>
          </div>
          <div className="cla-intro-target"><span>MỤC TIÊU CỦA BẠN</span><strong>{targetMajor}</strong><small>{hasProfile && isMeaningfulText(profile.targetUniversity) ? profile.targetUniversity : "Chưa chọn trường mục tiêu"}</small><a href={profilePath}>{hasProfile ? "Cập nhật hồ sơ" : "Tạo hồ sơ"} ↗</a></div>
        </section>

        {/* CP87: keep the original six-node circuit as the PRIMARY navigation,
            now immediately below the greeting and before analytical widgets. */}
        <LearningCircuit profilePath={profilePath} />
        </>}
        {view !== "/student" && <ModuleSectionNav moduleKey="seed" />}
        {view === "/student" && <>
        {!isAdminPreview && <ExamHorizon />}
        <details className="cla-student-analysis-details">
          <summary>Xem phân tích dữ liệu học tập chi tiết</summary>
          <StudentDecisionCanvas cognitive={cognitive} gpa={gpaIntegrity.status === "VERIFIED" ? gpaIntegrity.result : null} temporal={!historyLoading && !error ? temporalReport : null} hasProfile={hasProfile} demo={isAdminPreview} />
        </details>

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
