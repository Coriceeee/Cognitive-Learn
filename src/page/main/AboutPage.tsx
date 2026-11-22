import appLogo from "../../assets/logo cla.png";
import seedIcon from "../../assets/modules/seed-profile.png";
import lumenIcon from "../../assets/modules/lumen-intelligence.png";
import atlasIcon from "../../assets/modules/atlas-admission.png";
import orionIcon from "../../assets/modules/orion-strategy.png";
import pulseIcon from "../../assets/modules/pulse-monitor.png";
import havenIcon from "../../assets/modules/haven-support.png";
import UserMenu from "../../components/common/UserMenu";
import "../../styles.css";

const modules = [
  { name: "Seed", title: "Bản sắc học tập", icon: seedIcon, description: "Lưu mục tiêu, bảng điểm THPT và những thông tin bạn chủ động cung cấp.", path: "/student" },
  { name: "Lumen", title: "Dấu vân tay trí tuệ", icon: lumenIcon, description: "Khám phá các chỉ báo có bằng chứng và nhận hướng dẫn phù hợp với dữ liệu hiện có.", path: "/lumen" },
  { name: "Atlas", title: "Bản đồ tương lai", icon: atlasIcon, description: "Đối chiếu phương thức xét tuyển, lịch sử tuyển sinh và nguồn công bố.", path: "/atlas" },
  { name: "Orion", title: "Kiến trúc tương lai", icon: orionIcon, description: "Xây dựng kế hoạch học tập và xem xét những kịch bản có điều kiện.", path: "/orion" },
  { name: "Pulse", title: "Đường cong tiến hóa", icon: pulseIcon, description: "Ghi nhận việc thực hiện kế hoạch, nhìn lại tiến độ qua các chu kỳ.", path: "/pulse" },
  { name: "Haven", title: "Hành trang thế giới", icon: havenIcon, description: "Tìm hiểu học bổng, du học, chi phí và điều kiện hồ sơ.", path: "/haven" },
];

const principles = [
  { index: "01", title: "Dữ liệu trước kết luận", description: "Phân biệt dữ liệu đã xác minh, dữ liệu còn thiếu và thông tin minh họa; không tự tạo điểm số cho học sinh." },
  { index: "02", title: "Giải thích được", description: "Gợi ý cần có căn cứ, nguồn tham khảo và giới hạn sử dụng rõ ràng để người học tự cân nhắc." },
  { index: "03", title: "Học rồi đo lại", description: "Kế hoạch không dừng ở đề xuất: học sinh có thể ghi nhận hành động, theo dõi và điều chỉnh ở chu kỳ tiếp theo." },
];

/** Public description of product design; it must not claim ML validation or
 * nationwide data completeness that the current MVP has not yet demonstrated. */
export default function GioiThieuPage() {
  return (
    <main className="cla-public-page cla-about-page">
      <header className="cla-public-header">
        <a className="cla-public-logo" href="/student" aria-label="Cognitive Learn AI – trở về trang học sinh">
          <img src={appLogo} alt="Cognitive Learn AI" />
        </a>
        <UserMenu />
      </header>

      <div className="cla-public-shell">
        <section className="cla-public-hero" aria-labelledby="cla-about-title">
          <div className="cla-public-hero-copy">
            <span className="cla-public-eyebrow">COGNITIVE LEARN AI <span aria-hidden="true">/</span> DÀNH CHO HỌC SINH</span>
            <h1 id="cla-about-title">Một hành trình học tập có dữ liệu, có định hướng.</h1>
            <p>Hiểu xuất phát điểm, lựa chọn bước tiếp theo và theo dõi sự thay đổi. Cognitive Learn AI kết nối hồ sơ học tập, phân tích, kế hoạch và cơ hội giáo dục trong một không gian dành riêng cho học sinh.</p>
            <div className="cla-public-hero-actions">
              <a className="cla-action-button cla-action-button--primary" href="/student">Vào không gian học tập <span aria-hidden="true">↗</span></a>
              <a className="cla-action-button cla-action-button--outline" href="#cla-about-modules">Khám phá sáu phân hệ</a>
            </div>
          </div>
          <aside className="cla-public-journey" aria-label="Vòng lặp trải nghiệm học sinh">
            <span className="cla-public-panel-label">HÀNH TRÌNH HỌC TẬP</span>
            <ol>
              <li><span>01</span><div><strong>Hiểu điểm xuất phát</strong><small>Seed · Lumen</small></div></li>
              <li><span>02</span><div><strong>Khám phá lựa chọn</strong><small>Atlas · Haven</small></div></li>
              <li><span>03</span><div><strong>Lập kế hoạch hành động</strong><small>Orion</small></div></li>
              <li><span>04</span><div><strong>Theo dõi và điều chỉnh</strong><small>Pulse → chu kỳ mới</small></div></li>
            </ol>
            <p>Mỗi bước phụ thuộc dữ liệu hiện có. Không có dữ liệu thì hệ thống sẽ nêu rõ phần còn thiếu.</p>
          </aside>
        </section>

        <section className="cla-public-section" id="cla-about-modules" aria-labelledby="cla-modules-title">
          <div className="cla-public-section-heading">
            <div><span className="cla-public-eyebrow">SÁU PHÂN HỆ, MỘT TRẢI NGHIỆM</span><h2 id="cla-modules-title">Bạn muốn bắt đầu từ đâu?</h2></div>
            <p>Mỗi phân hệ giải quyết một nhiệm vụ riêng. Bạn có thể đi từng bước hoặc mở trực tiếp phần đang cần.</p>
          </div>
          <div className="cla-public-module-grid">
            {modules.map((module) => (
              <article className="cla-public-module" data-module={module.name.toLowerCase()} key={module.name}>
                <img src={module.icon} alt="" aria-hidden="true" />
                <span>{module.name}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <a href={module.path} aria-label={`Mở phân hệ ${module.name}`}>Mở phân hệ <span aria-hidden="true">↗</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="cla-public-section cla-public-principles" aria-labelledby="cla-principles-title">
          <div className="cla-public-section-heading">
            <div><span className="cla-public-eyebrow">NGUYÊN TẮC THIẾT KẾ</span><h2 id="cla-principles-title">Hữu ích, nhưng không hứa hẹn thay bạn quyết định.</h2></div>
            <p>CLA là công cụ hỗ trợ học sinh tự tìm hiểu. Kết quả phân tích, gợi ý và dữ liệu tuyển sinh phải được đối chiếu với nguồn đáng tin cậy.</p>
          </div>
          <div className="cla-public-principle-list">
            {principles.map((principle) => <article key={principle.index}><span>{principle.index}</span><div><h3>{principle.title}</h3><p>{principle.description}</p></div></article>)}
          </div>
          <p className="cla-public-evidence-note">Lưu ý: một số tính năng và nguồn dữ liệu vẫn trong giai đoạn hoàn thiện/kiểm định. Không xem mô phỏng hoặc gợi ý là kết quả tuyển sinh chắc chắn hay bằng chứng khoa học đã được xác nhận.</p>
        </section>

        <section className="cla-public-footer-callout">
          <div><span className="cla-public-eyebrow">CẦN TRỢ GIÚP?</span><h2>Gặp vấn đề khi sử dụng?</h2><p>Chọn đúng chủ đề để mô tả vấn đề, không cần gửi bảng điểm hoặc thông tin nhạy cảm.</p></div>
          <a className="cla-action-button cla-action-button--primary" href="/contact">Đến trang liên hệ <span aria-hidden="true">↗</span></a>
        </section>
      </div>
    </main>
  );
}
