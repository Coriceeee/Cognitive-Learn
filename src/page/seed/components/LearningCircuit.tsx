/** Student-first four-step journey. Existing module routes and underlying engines remain unchanged. */
type Step = {
  number: string;
  title: string;
  description: string;
  href: string;
  action: string;
  code: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Hồ sơ học tập",
    description: "Nhập học bạ, điểm số, môn học và mục tiêu đại học.",
    href: "/student/profile",
    action: "Hoàn thiện hồ sơ",
    code: "SEED",
  },
  {
    number: "02",
    title: "Phân tích năng lực",
    description: "Xem kết quả phân tích và các ước lượng có đủ dữ liệu hỗ trợ.",
    href: "/lumen",
    action: "Xem phân tích",
    code: "LUMEN",
  },
  {
    number: "03",
    title: "Ngành và trường",
    description: "Đối chiếu tổ hợp, ngành đào tạo, phương thức và nguồn tuyển sinh.",
    href: "/atlas",
    action: "Khám phá ngành, trường",
    code: "ATLAS",
  },
  {
    number: "04",
    title: "Lộ trình nguyện vọng",
    description: "Xem khoảng cách tới mục tiêu và các bước cần thực hiện.",
    href: "/orion",
    action: "Xây dựng lộ trình",
    code: "ORION",
  },
];

export default function LearningCircuit({ profilePath }: { profilePath: string }) {
  return (
    <section className="cla-primary-journey" aria-labelledby="cla-primary-journey-title">
      <header className="cla-primary-journey__header">
        <div>
          <span className="cla-primary-journey__eyebrow">COGNITIVE LEARN AI · HÀNH TRÌNH TƯ VẤN</span>
          <h2 id="cla-primary-journey-title">Từ hồ sơ học tập đến nguyện vọng đại học</h2>
          <p>Thực hiện lần lượt bốn bước. Dữ liệu đã nhập được sử dụng xuyên suốt, không cần nhập lại ở từng phân hệ.</p>
        </div>
        <span className="cla-primary-journey__count">04 <small>BƯỚC CHÍNH</small></span>
      </header>

      <ol className="cla-primary-journey__steps">
        {steps.map((step) => {
          const href = step.code === "SEED" ? profilePath : step.href;
          return (
            <li key={step.code}>
              <a href={href} className={`cla-primary-journey__step cla-primary-journey__step--${step.code.toLowerCase()}`}>
                <span className="cla-primary-journey__number">{step.number}</span>
                <span className="cla-primary-journey__code">{step.code}</span>
                <strong>{step.title}</strong>
                <span className="cla-primary-journey__description">{step.description}</span>
                <span className="cla-primary-journey__action">{step.action} <span aria-hidden="true">↗</span></span>
              </a>
            </li>
          );
        })}
      </ol>

      <footer className="cla-primary-journey__footer">
        <span>CÔNG CỤ HỖ TRỢ</span>
        <a href="/pulse">Theo dõi tiến độ</a>
        <a href="/haven">Học bổng và tài chính</a>
        <a href="/student/guide">Hướng dẫn sử dụng</a>
      </footer>
    </section>
  );
}
