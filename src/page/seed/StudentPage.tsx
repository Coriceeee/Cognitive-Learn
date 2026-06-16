import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import ModuleClusterGrid from "../../components/common/ModuleClusterGrid";
import "../../styles.css";

type Profile = {
  fullName?: string;
  className?: string;

  targetMajor?: string;
  targetUniversity?: string;

  gpa10?: number;
  gpa11?: number;
  gpa12?: number;
  gpaOverall?: number;

  studyHoursPerWeek?: number;
  practiceTestsPerWeek?: number;
  planCompletionRate?: number;
  motivationLevel?: number;
};

const defaultProfile: Profile = {
  fullName: "Chưa có dữ liệu",
  className: "--",
  targetMajor: "--",
  targetUniversity: "--",
  gpa10: 0,
  gpa11: 0,
  gpa12: 0,
  gpaOverall: 0,
  studyHoursPerWeek: 0,
  practiceTestsPerWeek: 0,
  planCompletionRate: 0,
  motivationLevel: 0,
};

const cognitiveScores = [
  {
    label: "SCI",
    name: "Self Coherence Index",
    value: 78,
    desc: "Mức nhất quán giữa mục tiêu, kế hoạch và hành động.",
  },
  {
    label: "MAS",
    name: "Meaning Alignment Score",
    value: 64,
    desc: "Mức gắn kết giữa động lực học tập và mục tiêu cá nhân.",
  },
  {
    label: "CSL",
    name: "Cognitive Stability Level",
    value: 82,
    desc: "Độ ổn định hành vi, khả năng tập trung và giữ nhịp học.",
  },
];

const subjectScores = [
  ["Toán", "7.8", "+0.6"],
  ["Ngữ văn", "7.1", "+0.2"],
  ["Tiếng Anh", "8.4", "+0.4"],
  ["Vật lý", "7.0", "+0.5"],
  ["Hóa học", "6.8", "+0.3"],
  ["Sinh học", "7.4", "+0.1"],
];

const learningPlans = [
  "Tăng 2 buổi Toán mỗi tuần để kéo điểm tổ hợp A01.",
  "Giữ nhịp Tiếng Anh vì đây là môn lợi thế hiện tại.",
  "Giảm đổi mục tiêu trong 14 ngày để tăng độ ổn định nhận thức.",
];

const recommendationCards = [
  {
    title: "Ngành phù hợp",
    value: "CNTT",
    desc: "Phù hợp với năng lực Toán - Anh và mục tiêu nghề nghiệp hiện tại.",
  },
  {
    title: "Tổ hợp đề xuất",
    value: "A01",
    desc: "Toán - Lý - Anh đang có tổng điểm dự báo tốt nhất.",
  },
  {
    title: "Nhóm trường",
    value: "Vừa sức",
    desc: "Ưu tiên PTIT, Bách khoa, Công nghiệp Hà Nội theo mức rủi ro.",
  },
];

export default function StudentPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const isAdminPreview = params.get("from") === "admin";

  function goTo(path: string) {
    window.location.href = path;
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(defaultProfile);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "learning_profiles", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfile({ ...defaultProfile, ...snap.data() });
        } else {
          setProfile(defaultProfile);
        }
      } catch (err) {
        console.error("Firestore error:", err);
        setProfile(defaultProfile);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Đang tải dữ liệu...</div>;
  }

  return (
    <main className="student-page">
      <div className="student-floating-header">
        <div className="student-floating-left">
          <a
            className="student-home-logo"
            href={isAdminPreview ? "/student?from=admin" : "/student"}
          >
            <img src={appLogo} alt="Cognitive Learn" />
          </a>
        </div>

        <UserMenu />
      </div>

      <section className="student-shell">
        {/* HERO */}
        <section className="student-hero">
          <div className="student-hero-copy">
            <span>HỌC SINH</span>

            <h1>Hồ sơ học tập cá nhân</h1>

            <p>
              Theo dõi năng lực hiện tại, trạng thái nhận thức, điểm dự báo và
              chiến lược học tập phù hợp.
            </p>

            <div className="student-hero-actions">
              <button
                onClick={() =>
                  goTo(
                    isAdminPreview
                      ? "/student/profile?from=admin"
                      : "/student/profile"
                  )
                }
              >
                Nhập hồ sơ học tập
              </button>

              <button className="secondary">Xem báo cáo</button>
            </div>
          </div>

          {/* PROFILE CARD (REAL DATA) */}
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
              <p>
                Trường: {profile.targetUniversity}
              </p>
            </div>
          </div>
        </section>

        {/* MODULE */}
        <ModuleClusterGrid
          role="student"
          isAdminPreview={isAdminPreview}
          title="Cognitive Path cá nhân"
          subtitle="Các cụm module học sinh hỗ trợ phân tích học tập và định hướng tương lai."
        />

        {/* SCORES */}
        <section className="student-overview-grid">
          {cognitiveScores.map((item) => (
            <article key={item.label} className="student-score-card">
              <div>
                <span>{item.label}</span>
                <p>{item.name}</p>
              </div>

              <strong>{item.value}</strong>

              <div className="student-progress">
                <i style={{ width: `${item.value}%` }}></i>
              </div>

              <p>{item.desc}</p>
            </article>
          ))}
        </section>

        {/* SUBJECT + PLAN */}
        <section className="student-main-grid">
          <article className="student-panel">
            <div className="student-panel-head">
              <div>
                <span>ĐIỂM HỌC TẬP</span>
                <h2>Bảng điểm</h2>
              </div>
            </div>

            <div className="student-subject-list">
              {subjectScores.map(([subject, score, change]) => (
                <div key={subject} className="student-subject-row">
                  <span>{subject}</span>
                  <strong>{score}</strong>
                  <em>{change}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="student-panel dark">
            <div className="student-panel-head">
              <div>
                <span>CHIẾN LƯỢC</span>
                <h2>14 ngày tới</h2>
              </div>
            </div>

            <div className="student-plan-list">
              {learningPlans.map((item, index) => (
                <div key={index} className="student-plan-item">
                  <strong>{index + 1}</strong>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* RECOMMEND */}
        <section className="student-recommend-grid">
          {recommendationCards.map((item) => (
            <article key={item.title} className="student-recommend-card">
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}