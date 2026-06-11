import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import ModuleClusterGrid from "../../components/common/ModuleClusterGrid";
import "../../styles.css";

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

export default function TrangHocSinh() {
  const params = new URLSearchParams(window.location.search);
  const isAdminPreview = params.get("from") === "admin";

  function goTo(path: string) {
    window.location.href = path;
  }

  return (
    <main className="student-page">
      <div className="student-floating-header">
        <div className="student-floating-left">
          <a
            className="student-home-logo"
            href={isAdminPreview ? "/student?from=admin" : "/student"}
            aria-label="Về trang học sinh"
          >
            <img src={appLogo} alt="Cognitive Learn" />
          </a>
        </div>

        <UserMenu />
      </div>

      <section className="student-shell">
        <section className="student-hero">
          <div className="student-hero-copy">
            <span>HỌC SINH</span>

            <h1>Hồ sơ học tập cá nhân</h1>

            <p>
              Theo dõi năng lực hiện tại, trạng thái nhận thức, điểm dự báo và
              chiến lược học tập phù hợp cho mục tiêu tuyển sinh.
            </p>

            <div className="student-hero-actions">
              <button
                type="button"
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

              <button type="button" className="secondary">
                Xem báo cáo
              </button>
            </div>
          </div>

          <div className="student-profile-card">
            <div className="student-avatar">A</div>

            <div>
              <h2>Nguyễn Minh Anh</h2>
              <p>Lớp 12A1 · Mục tiêu CNTT</p>
            </div>

            <div className="student-target-box">
              <span>Điểm dự báo</span>
              <strong>25.6</strong>
              <p>Xác suất đạt mục tiêu: 72%</p>
            </div>
          </div>
        </section>

        <ModuleClusterGrid
          role="student"
          isAdminPreview={isAdminPreview}
          title="Cognitive Path cá nhân"
          subtitle="Các cụm module học sinh được sử dụng để nhập hồ sơ, đánh giá nhận thức, mô phỏng tương lai, định hướng tuyển sinh và theo dõi tiến trình học tập."
        />

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

        <section className="student-main-grid">
          <article className="student-panel">
            <div className="student-panel-head">
              <div>
                <span>ĐIỂM HỌC TẬP</span>
                <h2>Bảng điểm hiện tại</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  goTo(
                    isAdminPreview
                      ? "/student/profile?from=admin"
                      : "/student/profile"
                  )
                }
              >
                Cập nhật
              </button>
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
                <span>CHIẾN LƯỢC HỌC</span>
                <h2>Kế hoạch 14 ngày tới</h2>
              </div>
            </div>

            <div className="student-plan-list">
              {learningPlans.map((item, index) => (
                <div key={item} className="student-plan-item">
                  <strong>{index + 1}</strong>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="student-recommend-grid">
          {recommendationCards.map((item) => (
            <article key={item.title} className="student-recommend-card">
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <p>{item.desc}</p>
            </article>
          ))}
        </section>

        <section className="student-roadmap-panel">
          <div>
            <span>LỘ TRÌNH TIẾP THEO</span>
            <h2>Sau dashboard này sẽ làm form nhập hồ sơ học tập</h2>
            <p>
              Form sẽ thu thập điểm môn học, hành vi học tập, dữ liệu nhận thức,
              mục tiêu tuyển sinh, tài chính, du học và học bổng để bắt đầu tính
              SCI/MAS/CSL thật.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              goTo(
                isAdminPreview
                  ? "/student/profile?from=admin"
                  : "/student/profile"
              )
            }
          >
            Tiếp tục bước nhập hồ sơ
          </button>
        </section>
      </section>
    </main>
  );
}