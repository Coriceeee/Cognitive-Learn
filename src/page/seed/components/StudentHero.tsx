import type { StudentProfile } from "../types";

type StudentHeroProps = {
  profile: StudentProfile;
  isAdminPreview: boolean;
  onNavigate: (path: string) => void;
};

export default function StudentHero({
  profile,
  isAdminPreview,
  onNavigate,
}: StudentHeroProps) {
  const profilePath = isAdminPreview
    ? "/student/profile?from=admin"
    : "/student/profile";

  return (
    <section className="student-hero">
      <div className="student-hero-copy">
        <span>HỌC SINH</span>

        <h1>Hồ sơ học tập cá nhân</h1>

        <p>
          Theo dõi năng lực hiện tại, trạng thái nhận thức, điểm dự báo và chiến
          lược học tập phù hợp.
        </p>

        <div className="student-hero-actions">
          <button type="button" onClick={() => onNavigate(profilePath)}>
            Nhập hồ sơ học tập
          </button>

          <button type="button" className="secondary">
            Xem báo cáo
          </button>
        </div>
      </div>

      <div className="student-profile-card">
        <div className="student-avatar">
          {profile.fullName?.charAt(0) || "A"}
        </div>

        <div>
          <h2>{profile.fullName}</h2>
          <p>
            {profile.className} · Mục tiêu {profile.targetMajor}
          </p>
        </div>

        <div className="student-target-box">
          <span>GPA</span>
          <strong>{profile.gpaOverall}</strong>
          <p>Trường: {profile.targetUniversity}</p>
        </div>
      </div>
    </section>
  );
}