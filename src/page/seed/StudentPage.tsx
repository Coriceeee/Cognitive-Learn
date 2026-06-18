import { useEffect, useState } from "react";

import ModuleClusterGrid from "../../components/common/ModuleClusterGrid";
import "../../styles.css";

import CognitiveInsightPanel from "./components/CognitiveInsightPanel";
import CognitiveScoreGrid from "./components/CognitiveScoreGrid";
import StudentHeader from "./components/StudentHeader";
import StudentHero from "./components/StudentHero";
import StudentLoading from "./components/StudentLoading";
import StudentPlanPanel from "./components/StudentPlanPanel";
import StudentProfileNoticeModal from "./components/StudentProfileNoticeModal";
import StudentRecommendationGrid from "./components/StudentRecommendationGrid";
import StudentSubjectPanel from "./components/StudentSubjectPanel";
import { useStudentProfile } from "./hooks/useStudentProfile";

export default function StudentPage() {
  const { profile, cognitive, loading, hasProfile, error, isAdminPreview } =
    useStudentProfile();

  const [showProfileNotice, setShowProfileNotice] = useState(false);

  const profilePath = isAdminPreview
    ? "/student/profile?from=admin"
    : "/student/profile";

  useEffect(() => {
    if (!loading && !hasProfile && !error) {
      setShowProfileNotice(true);
      return;
    }

    setShowProfileNotice(false);
  }, [loading, hasProfile, error]);

  function goTo(path: string) {
    window.location.href = path;
  }

  if (loading) {
    return <StudentLoading />;
  }

  return (
    <main className="student-page">
      <StudentHeader isAdminPreview={isAdminPreview} />

      <StudentProfileNoticeModal
        open={showProfileNotice}
        onClose={() => setShowProfileNotice(false)}
        onCreateProfile={() => goTo(profilePath)}
      />

      <section className="student-shell">
        {error && <div className="student-data-alert">{error}</div>}

        <StudentHero
          profile={profile}
          isAdminPreview={isAdminPreview}
          onNavigate={goTo}
        />

        <ModuleClusterGrid variant="student" />

        <CognitiveScoreGrid cognitive={cognitive} />

        <CognitiveInsightPanel
          cognitive={cognitive}
          hasProfile={hasProfile}
          onCreateProfile={() => goTo(profilePath)}
        />

        <section className="student-main-grid">
          <StudentSubjectPanel onUpdate={() => goTo(profilePath)} />
          <StudentPlanPanel />
        </section>

        <StudentRecommendationGrid />
      </section>
    </main>
  );
}