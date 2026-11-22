import { useState, type FormEvent } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { buildSupportMailto, SUPPORT_EMAIL } from "../../lib/supportMailto";
import "../../styles.css";

// Existing public contact address in the project. This page does not pretend
// to have a submission backend: it opens the student's own email app.
const topics = [
  { id: "profile", label: "Hồ sơ & bảng điểm", detail: "Lỗi nhập dữ liệu, bảng điểm, GPA hoặc lưu hồ sơ." },
  { id: "learning", label: "Phân tích & kế hoạch", detail: "Cần hiểu trạng thái dữ liệu, chỉ báo hoặc tiến trình học tập." },
  { id: "admissions", label: "Tuyển sinh & học bổng", detail: "Cần kiểm tra nguồn trường, chương trình hoặc yêu cầu hồ sơ." },
  { id: "technical", label: "Lỗi kỹ thuật khác", detail: "Giao diện, đăng nhập, điều hướng hoặc chức năng không hoạt động." },
] as const;

type TopicId = (typeof topics)[number]["id"];


export default function LienHePage() {
  const [topic, setTopic] = useState<TopicId>("technical");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [validationError, setValidationError] = useState("");
  const selectedTopic = topics.find((item) => item.id === topic) ?? topics[3];

  function openEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (details.trim().length < 10) {
      setValidationError("Vui lòng mô tả vấn đề bằng ít nhất 10 ký tự có nội dung.");
      return;
    }
    // This triggers a user-configured mail app, NOT a backend request.
    window.location.href = buildSupportMailto(selectedTopic.label, details, name);
  }

  return (
    <main className="cla-public-page cla-contact-page">
      <header className="cla-public-header">
        <a className="cla-public-logo" href="/student" aria-label="Cognitive Learn AI – trở về trang học sinh">
          <img src={appLogo} alt="Cognitive Learn AI" />
        </a>
        <UserMenu />
      </header>

      <div className="cla-public-shell">
        <section className="cla-contact-intro" aria-labelledby="cla-contact-title">
          <div>
            <span className="cla-public-eyebrow">HỖ TRỢ NGƯỜI HỌC</span>
            <h1 id="cla-contact-title">Gặp vướng mắc? Mình bắt đầu từ vấn đề cụ thể.</h1>
            <p>Chọn một chủ đề, mô tả ngắn gọn điều bạn gặp phải. Hệ thống sẽ giúp chuẩn bị email để bạn gửi bằng ứng dụng thư của mình.</p>
          </div>
          <div className="cla-contact-address">
            <span className="cla-public-panel-label">KÊNH LIÊN HỆ HIỆN CÓ</span>
            <strong>Gửi qua email</strong>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <small>Đây là địa chỉ liên hệ đã được cấu hình trong dự án. Phản hồi phụ thuộc người tiếp nhận email.</small>
          </div>
        </section>

        <section className="cla-public-section" aria-labelledby="cla-topic-title">
          <div className="cla-public-section-heading">
            <div><span className="cla-public-eyebrow">CHỦ ĐỀ HỖ TRỢ</span><h2 id="cla-topic-title">Bạn đang cần hỗ trợ phần nào?</h2></div>
            <p>Chọn một chủ đề để phân loại yêu cầu. Các mục bên dưới là thao tác thực, không phải nút trang trí.</p>
          </div>
          <div className="cla-contact-topic-grid" role="group" aria-label="Chọn chủ đề hỗ trợ">
            {topics.map((item, index) => <a
              href="#cla-contact-compose" key={item.id}
              className={item.id === topic ? "is-selected" : ""}
              aria-current={item.id === topic ? "true" : undefined}
              onClick={() => setTopic(item.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
              <small>{item.id === topic ? "Đang chọn" : "Chọn chủ đề"} <span aria-hidden="true">↗</span></small>
            </a>)}
          </div>
        </section>

        <section className="cla-contact-compose" id="cla-contact-compose" aria-labelledby="cla-compose-title">
          <div className="cla-contact-compose-aside">
            <span className="cla-public-eyebrow">SOẠN YÊU CẦU</span>
            <h2 id="cla-compose-title">Mô tả vấn đề để nhận hỗ trợ phù hợp.</h2>
            <p>Biểu mẫu sẽ <strong>mở ứng dụng email</strong> với nội dung được điền sẵn. CLA chưa lưu và chưa tự gửi yêu cầu từ website.</p>
            <div className="cla-contact-tip">
              <strong>Trước khi gửi</strong>
              <p>Không đính kèm mật khẩu, mã OTP, học bạ đầy đủ hoặc dữ liệu cá nhân nhạy cảm. Nếu báo lỗi, hãy cho biết tên phân hệ và thao tác dẫn tới lỗi.</p>
            </div>
          </div>
          <form className="cla-contact-form" onSubmit={openEmail}>
            <label htmlFor="cla-support-topic">Chủ đề</label>
            <select id="cla-support-topic" value={topic} onChange={(e) => setTopic(e.target.value as TopicId)}>
              {topics.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <label htmlFor="cla-support-name">Tên gọi <span>(không bắt buộc)</span></label>
            <input id="cla-support-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Bạn muốn được xưng hô như thế nào?" />
            <label htmlFor="cla-support-details">Mô tả vấn đề <span>(bắt buộc)</span></label>
            <textarea id="cla-support-details" value={details} onChange={(e) => { setDetails(e.target.value); setValidationError(""); }} aria-invalid={Boolean(validationError)} required minLength={10} maxLength={2500} rows={6} placeholder="Ví dụ: Tôi đang ở Seed → Hồ sơ & mục tiêu. Khi nhấn Lưu, màn hình hiển thị..." />
            {validationError && <p className="cla-contact-validation" role="alert">{validationError}</p>}
            <div className="cla-contact-form-actions">
              <button className="cla-action-button cla-action-button--primary" type="submit">Mở email để gửi <span aria-hidden="true">↗</span></button>
              <a className="cla-action-button cla-action-button--quiet" href="/student">Quay về trang học sinh</a>
            </div>
            <p className="cla-contact-delivery-note" role="note">Nếu thiết bị không có ứng dụng email, hãy sao chép địa chỉ ở đầu trang và gửi thủ công. Nhấn nút không đồng nghĩa email đã được gửi.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
