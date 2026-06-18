import ModuleClusterGrid from "../../components/common/ModuleClusterGrid";
import "../../styles.css";

import StudentHeader from "./components/StudentHeader";
import StudentHero from "./components/StudentHero";
import StudentLoading from "./components/StudentLoading";
import CognitiveScoreGrid from "./components/CognitiveScoreGrid";
import StudentSubjectPanel from "./components/StudentSubjectPanel";
import StudentPlanPanel from "./components/StudentPlanPanel";
import StudentRecommendationGrid from "./components/StudentRecommendationGrid";
import { useStudentProfile } from "./hooks/useStudentProfile";

export default function StudentPage() {
  const { profile, cognitive, loading, hasProfile, error, isAdminPreview } =
    useStudentProfile();

  function goTo(path: string) {
    window.location.href = path;
  }

  const profilePath = isAdminPreview
    ? "/student/profile?from=admin"
    : "/student/profile";

  if (loading) {
    return <StudentLoading />;
  }

  return (
    <main className="student-page">
      <StudentHeader isAdminPreview={isAdminPreview} />

      <section className="student-shell">
        {error && <div className="student-data-alert">{error}</div>}

        {!hasProfile && (
          <div className="student-data-alert">
            Chưa có hồ sơ học tập. Hãy nhập hồ sơ để hệ thống bắt đầu phân tích
            dữ liệu thật.
          </div>
        )}

        <StudentHero
          profile={profile}
          isAdminPreview={isAdminPreview}
          onNavigate={goTo}
        />

        <ModuleClusterGrid
          role="student"
          isAdminPreview={isAdminPreview}
          title="Cognitive Path cá nhân"
          subtitle="Các cụm module học sinh hỗ trợ phân tích học tập và định hướng tương lai."
        />

        <CognitiveScoreGrid cognitive={cognitive} />

        <section className="student-main-grid">
          <StudentSubjectPanel onUpdate={() => goTo(profilePath)} />
          <StudentPlanPanel />
        </section>

        <StudentRecommendationGrid />
      </section>
    </main>
  );
}