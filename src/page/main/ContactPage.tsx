import { auth } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import claBackground from "../../assets/nen-cla.png";
import UserMenu from "../../components/common/UserMenu";
import pulseIcon from "../../assets/modules/pulse-monitor.png";
import havenIcon from "../../assets/modules/haven-support.png";
import atlasIcon from "../../assets/modules/atlas-admission.png";
import "../../styles.css";

const contactCards = [
  {
    label: "Học sinh",
    title: "Student Support",
    desc: "Hỗ trợ nhập hồ sơ học tập, bảng điểm, môn lựa chọn, GPA và mục tiêu tuyển sinh.",
  },
  {
    label: "Giáo viên",
    title: "Teacher Support",
    desc: "Hỗ trợ theo dõi lớp học, cảnh báo học sinh nguy cơ cao và báo cáo học tập.",
  },
  {
    label: "Phụ huynh",
    title: "Parent Support",
    desc: "Hỗ trợ xem tiến trình của con, trạng thái học tập, tài chính và học bổng.",
  },
];

export default function LienHePage() {
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
          className="contact-hero-premium"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(3, 10, 31, 0.82), rgba(7, 31, 90, 0.55), rgba(3, 10, 31, 0.82)), url(${claBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div>
            <span>CONTACT CENTER</span>
            <h1>Kết nối với Cognitive Learn AI</h1>
            <p>
              Nơi tiếp nhận phản hồi, hỗ trợ người dùng và kết nối học sinh,
              giáo viên, phụ huynh với hệ thống phân tích học tập thông minh.
            </p>
          </div>

          <div className="contact-hero-card">
            <img src={havenIcon} alt="Haven Support" />
            <strong>Haven Support</strong>
            <p>Đồng hành, bảo vệ và hỗ trợ người học trong từng quyết định.</p>
          </div>
        </section>

        <section className="contact-command-center">
          <div className="contact-command-copy">
            <span>SUPPORT CHANNEL</span>
            <h2>Chọn đúng kênh hỗ trợ để xử lý nhanh hơn</h2>
            <p>
              Các kênh liên hệ được chia theo vai trò để hệ thống có thể hỗ trợ
              đúng vấn đề: hồ sơ học tập, theo dõi lớp, phụ huynh, tuyển sinh,
              tài chính và học bổng.
            </p>
          </div>

          <div className="contact-command-icons">
            <img src={pulseIcon} alt="Pulse Monitor" />
            <img src={atlasIcon} alt="Atlas Admission" />
            <img src={havenIcon} alt="Haven Support" />
          </div>
        </section>

        <section className="contact-premium-grid">
          {contactCards.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
              <button type="button">Chọn kênh</button>
            </article>
          ))}
        </section>

        <section className="contact-form-premium">
          <div className="contact-form-info">
            <span>GỬI PHẢN HỒI</span>
            <h2>Bạn cần hỗ trợ điều gì?</h2>
            <p>
              Form này là giao diện mẫu. Sau này có thể nối Firestore để lưu
              phản hồi thật, phân loại yêu cầu và hiển thị trong Admin Nexus.
            </p>

            <div className="contact-mail-card">
              <strong>Email hệ thống</strong>
              <p>cognitivelearn.ai@gmail.com</p>
            </div>
          </div>

          <form className="contact-premium-form">
            <label>
              Họ và tên
              <input placeholder="Nhập họ và tên" />
            </label>

            <label>
              Email
              <input placeholder="Nhập email liên hệ" />
            </label>

            <label>
              Vai trò
              <select>
                <option>Học sinh</option>
                <option>Giáo viên</option>
                <option>Phụ huynh</option>
                <option>Quản trị viên</option>
              </select>
            </label>

            <label>
              Nội dung
              <textarea
                placeholder="Bạn muốn Cognitive Learn hỗ trợ điều gì?"
                rows={5}
              ></textarea>
            </label>

            <button type="button">Gửi liên hệ</button>
          </form>
        </section>
      </section>
    </main>
  );
}