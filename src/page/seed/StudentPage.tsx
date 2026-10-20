import { useEffect, useState } from "react";

import ModuleClusterGrid from "../../components/common/ModuleClusterGrid";
import "../../styles.css";

import CognitiveGrowthPanel from "./components/CognitiveGrowthPanel";
import CognitiveInsightPanel from "./components/CognitiveInsightPanel";
import CognitiveScoreGrid from "./components/CognitiveScoreGrid";
import StudentHeader from "./components/StudentHeader";
import StudentLoading from "./components/StudentLoading";
import StudentPlanPanel from "./components/StudentPlanPanel";
import StudentProfileNoticeModal from "./components/StudentProfileNoticeModal";
import StudentRecommendationGrid from "./components/StudentRecommendationGrid";
import StudentSubjectPanel from "./components/StudentSubjectPanel";
import LearningIntelligencePanel from "./components/LearningIntelligencePanel";

import { useStudentProfile } from "./hooks/useStudentProfile";
import { useLearningIntelligence } from "./hooks/useLearningIntelligence";

type ModuleLink = {
  code: string;
  title: string;
  summary: string;
  href: string;
};

const coreModules: ModuleLink[] = [
  {
    code: "01 / SEED",
    title: "Hồ sơ học tập",
    summary: "Điểm số, mục tiêu và dữ liệu cá nhân",
    href: "/student/profile",
  },
  {
    code: "02 / LUMEN",
    title: "Phân tích học tập",
    summary: "Nhận thức, xu hướng và giải thích kết quả",
    href: "/lumen",
  },
  {
    code: "03 / ATLAS",
    title: "Tuyển sinh",
    summary: "Ngành, trường và nguồn dữ liệu xét tuyển",
    href: "/atlas",
  },
  {
    code: "04 / ORION",
    title: "Chiến lược",
    summary: "Mục tiêu, kịch bản và lộ trình hành động",
    href: "/orion",
  },
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
  const {
    profile,
    cognitive,
    growthAnalytics,
    loading,
    hasProfile,
    error,
    isAdminPreview,
  } = useStudentProfile();

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
    setShowProfileNotice(!loading && !hasProfile && !error);
  }, [loading, hasProfile, error]);

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
          href: "/about",
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

        {/* 1. One clear overview instead of multiple competing hero cards. */}
        <section className="student-dash-hero" aria-labelledby="student-dash-title">
          <div className="student-dash-hero-copy">
            <span className="student-dash-eyebrow">COGNITIVE LEARN / STUDENT SPACE</span>
            <h1 id="student-dash-title">Xin chào, {displayName}</h1>
            <p>
              {hasProfile
                ? "Theo dõi mục tiêu, ưu tiên việc cần làm và xem sự thay đổi trong học tập."
                : "Bắt đầu từ hồ sơ cá nhân để có những phân tích phù hợp với dữ liệu của bạn."}
            </p>
            <div className="student-dash-hero-actions">
              <button
                type="button"
                className="student-dash-primary-button"
                onClick={() => goTo(profilePath)}
              >
                {hasProfile ? "Cập nhật hồ sơ" : "Tạo hồ sơ học tập"}
                <span aria-hidden="true">↗</span>
              </button>
              <a href="/lumen" className="student-dash-secondary-link">
                Xem phân tích Lumen <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="student-dash-hero-summary" aria-label="Tóm tắt hồ sơ">
            <div className="student-dash-hero-summary-top">
              <span>MỤC TIÊU HIỆN TẠI</span>
              <strong>{targetMajor}</strong>
              <small>
                {hasProfile && isMeaningfulText(profile.targetUniversity)
                  ? profile.targetUniversity
                  : "Chưa chọn trường mục tiêu"}
              </small>
            </div>
            <div className="student-dash-hero-divider" />
            <div className="student-dash-hero-metrics">
              <div>
                <span>CHỈ SỐ TỔNG HỢP</span>
                <strong>{hasCognitiveScore ? `${cognitive.overallScore}/100` : "—"}</strong>
              </div>
              <div>
                <span>ĐỘ BAO PHỦ DỮ LIỆU</span>
                <strong>
                  {hasProfile && typeof cognitive.dataCoverageScore === "number"
                    ? `${cognitive.dataCoverageScore}%`
                    : "—"}
                </strong>
              </div>
            </div>
            <p className="student-dash-hero-footnote">
              Chỉ số dựa trên quy tắc thử nghiệm, không phải xác suất thành công.
            </p>
          </div>
        </section>

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
                <span className="student-dash-module-code">{module.code}</span>
                <strong>{module.title}</strong>
                <p>{module.summary}</p>
                <span className="student-dash-module-arrow">Xem chi tiết ↗</span>
              </a>
            ))}
          </div>
          <div className="student-dash-extra-links">
            <a href="/pulse">Pulse · Theo dõi tiến độ <span aria-hidden="true">↗</span></a>
            <a href="/haven">Haven · Hỗ trợ học tập <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        {/* 4. Deep analysis is available, but not open by default. */}
        <section className="student-dash-details" aria-labelledby="student-dash-details-title">
          <div className="student-dash-heading">
            <div>
              <span className="student-dash-eyebrow">PHÂN TÍCH CHI TIẾT</span>
              <h2 id="student-dash-details-title">Đào sâu khi bạn cần</h2>
            </div>
            <span className="student-dash-soft-pill">Mở từng mục</span>
          </div>

          <details className="student-dash-disclosure">
            <summary>
              <span><strong>Chỉ số và nhận xét Cognitive</strong><small>SCI, MAS, CSL và diễn giải theo dữ liệu</small></span>
              <span className="student-dash-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="student-dash-disclosure-content">
              <CognitiveScoreGrid cognitive={cognitive} />
              <CognitiveInsightPanel
                cognitive={cognitive}
                hasProfile={hasProfile}
                onCreateProfile={() => goTo(profilePath)}
              />
            </div>
          </details>

          <details className="student-dash-disclosure">
            <summary>
              <span><strong>Tiến trình thay đổi</strong><small>So sánh các lần đo Cognitive hợp lệ</small></span>
              <span className="student-dash-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="student-dash-disclosure-content">
              <CognitiveGrowthPanel analytics={growthAnalytics} />
            </div>
          </details>

          <details className="student-dash-disclosure">
            <summary>
              <span><strong>Learning Intelligence nâng cao</strong><small>Prediction, Simulation, Optimization và Career</small></span>
              <span className="student-dash-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="student-dash-disclosure-content">
              {hasCognitiveScore ? (
                <>
                  <p className="student-dash-research-note">
                    Các kết quả dự đoán, mô phỏng và tương thích nghề nghiệp là đầu ra
                    quy tắc thử nghiệm; không phải xác suất đã hiệu chuẩn hay kết quả
                    thực nghiệm quan sát được.
                  </p>
                  <LearningIntelligencePanel intelligence={intelligence} />
                </>
              ) : (
                <p className="student-dash-empty-note">
                  Chưa đủ dữ liệu Cognitive hợp lệ để trình bày phân tích chuyên sâu.
                  Hãy hoàn thiện hồ sơ và các phép đo còn thiếu.
                </p>
              )}
            </div>
          </details>

          <details className="student-dash-disclosure">
            <summary>
              <span><strong>Dữ liệu minh họa giao diện</strong><small>Bảng điểm, kế hoạch và gợi ý mẫu — không phải dữ liệu học sinh</small></span>
              <span className="student-dash-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="student-dash-disclosure-content">
              <p className="student-dash-research-note">
                Nội dung bên dưới đến từ <code>studentDashboardData.ts</code>, chỉ để
                kiểm tra giao diện. Không sử dụng những giá trị này cho phân tích,
                khuyến nghị chính thức hay nghiên cứu.
              </p>
              <div className="student-main-grid">
                <StudentSubjectPanel onUpdate={() => goTo(profilePath)} />
                <StudentPlanPanel />
              </div>
              <StudentRecommendationGrid />
            </div>
          </details>

          <details className="student-dash-disclosure">
            <summary>
              <span><strong>Danh mục tất cả phân hệ</strong><small>Khám phá đầy đủ các tính năng CLA</small></span>
              <span className="student-dash-chevron" aria-hidden="true">⌄</span>
            </summary>
            <div className="student-dash-disclosure-content">
              <ModuleClusterGrid variant="student" />
            </div>
          </details>
        </section>
      </section>
    </main>
  );
}
