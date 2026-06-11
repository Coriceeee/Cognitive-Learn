import { auth } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import claBackground from "../../assets/nen-cla.png";
import UserMenu from "../../components/common/UserMenu";
import nexusIcon from "../../assets/modules/nexus-core.png";
import seedIcon from "../../assets/modules/seed-profile.png";
import lumenIcon from "../../assets/modules/lumen-intelligence.png";
import orionIcon from "../../assets/modules/orion-strategy.png";
import atlasIcon from "../../assets/modules/atlas-admission.png";
import pulseIcon from "../../assets/modules/pulse-monitor.png";
import havenIcon from "../../assets/modules/haven-support.png";
import "../../styles.css";

const identityCards = [
  {
    icon: seedIcon,
    title: "Seed Profile",
    desc: "Xây nền dữ liệu học sinh từ hồ sơ, môn học, bảng điểm 3 năm và GPA.",
  },
  {
    icon: lumenIcon,
    title: "Lumen Intelligence",
    desc: "Soi rõ trạng thái nhận thức qua SCI, MAS, CSL và xu hướng học tập.",
  },
  {
    icon: orionIcon,
    title: "Orion Strategy",
    desc: "Mô phỏng tương lai, tối ưu môn học và đề xuất chiến lược học tập.",
  },
  {
    icon: atlasIcon,
    title: "Atlas Admission",
    desc: "Gợi ý ngành, trường, tổ hợp xét tuyển và chiến lược nguyện vọng.",
  },
];

export default function GioiThieuPage() {
  const params = new URLSearchParams(window.location.search);
  const isAdminPreview =
    params.get("from") === "admin" ||
    auth.currentUser?.email === "admin@gmail.com";
  const adminSuffix = isAdminPreview ? "?from=admin" : "";

  return (
    <main className="info-page premium-info-page">
      <header className="info-floating-header">
        <a
          href={isAdminPreview ? "/admin" : `/student${adminSuffix}`}
          className="info-logo"
        >
          <img src={appLogo} alt="Cognitive Learn" />
        </a>

        <UserMenu />
      </header>

      <section className="info-shell premium-info-shell">
        <section
          className="about-hero-premium"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(3, 10, 31, 0.78), rgba(7, 31, 90, 0.5), rgba(3, 10, 31, 0.78)), url(${claBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="about-hero-copy">
            <span>COGNITIVE LEARN AI</span>
            <h1>Nền tảng định hướng học tập bằng dữ liệu nhận thức</h1>
            <p>
              Cognitive Learn AI giúp học sinh THPT hiểu năng lực thật, trạng
              thái nhận thức, xu hướng học tập, khả năng tuyển sinh, tài chính,
              học bổng và lộ trình tương lai.
            </p>

            <div className="about-hero-actions">
              <a href={`/student${adminSuffix}`}>Khám phá hệ thống</a>

              <a href={`/contact${adminSuffix}`} className="secondary">
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>

          <div className="about-logo-showcase">
            <div className="about-logo-orbit">
              <span className="orbit-dot d-a"></span>
              <span className="orbit-dot d-b"></span>
              <span className="orbit-dot d-c"></span>
              <span className="orbit-dot d-d"></span>

              <div className="about-logo-card">
                <img src={appLogo} alt="Cognitive Learn AI" />
              </div>
            </div>

            <div className="about-logo-caption">
              <strong>Learning Intelligence System</strong>
              <p>Profile · Cognition · Simulation · Admission · Report</p>
            </div>
          </div>
        </section>

        <section className="about-mission-grid">
          <article>
            <span>01</span>
            <h2>Hiểu học sinh bằng dữ liệu</h2>
            <p>
              Hệ thống không chỉ xem điểm số, mà còn xem hành vi học tập, động
              lực, mức ổn định và sự nhất quán giữa mục tiêu với hành động.
            </p>
          </article>

          <article>
            <span>02</span>
            <h2>Dự báo và mô phỏng lộ trình</h2>
            <p>
              Từ bảng điểm, GPA, số giờ học, số đề luyện và chỉ số nhận thức,
              hệ thống mô phỏng điểm tương lai và rủi ro tuyển sinh.
            </p>
          </article>

          <article>
            <span>03</span>
            <h2>Định hướng ngành, trường, học bổng</h2>
            <p>
              Cognitive Learn AI gợi ý ngành phù hợp, trường an toàn/vừa sức/bứt
              phá, chiến lược nguyện vọng, tài chính và học bổng.
            </p>
          </article>
        </section>

        <section className="about-identity-section">
          <div className="about-section-head">
            <span>MODULE IDENTITY</span>
            <h2>Không phải menu thường, mà là một hệ sinh thái học tập</h2>
            <p>
              Mỗi cụm module được thiết kế như một biểu tượng riêng trong hành
              trình phát triển của học sinh.
            </p>
          </div>

          <div className="about-identity-grid">
            <article className="featured">
              <img src={nexusIcon} alt="Nexus Core" />

              <div>
                <span>Nexus Core</span>
                <h3>Trung tâm điều phối hệ thống</h3>
                <p>
                  Admin có thể kiểm thử mọi vai trò, quan sát toàn bộ module và
                  quản lý luồng dữ liệu của Cognitive Learn AI.
                </p>
              </div>
            </article>

            {identityCards.map((item) => (
              <article key={item.title}>
                <img src={item.icon} alt={item.title} />

                <div>
                  <span>{item.title}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-system-flow">
          <div>
            <span>LEARNING FLOW</span>
            <h2>Từ dữ liệu học tập đến quyết định tương lai</h2>
            <p>
              Dữ liệu học sinh được chuyển thành phân tích nhận thức, dự báo
              điểm, mô phỏng kịch bản, gợi ý ngành/trường và báo cáo tổng hợp
              cho học sinh, giáo viên, phụ huynh.
            </p>
          </div>

          <div className="about-flow-icons">
            <img src={seedIcon} alt="Seed Profile" />
            <i></i>
            <img src={lumenIcon} alt="Lumen Intelligence" />
            <i></i>
            <img src={orionIcon} alt="Orion Strategy" />
            <i></i>
            <img src={atlasIcon} alt="Atlas Admission" />
            <i></i>
            <img src={pulseIcon} alt="Pulse Monitor" />
            <i></i>
            <img src={havenIcon} alt="Haven Support" />
          </div>
        </section>
      </section>
    </main>
  );
}