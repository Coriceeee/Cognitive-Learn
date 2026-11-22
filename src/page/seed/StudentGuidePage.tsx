import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { useIsAdmin } from "../../lib/useIsAdmin";
import "../../styles.css";

type GuideStep = {
  number: string;
  name: string;
  role: string;
  input: string;
  output: string;
  status: "ready" | "partial" | "manual";
  href: string;
};

const steps: GuideStep[] = [
  {
    number: "01",
    name: "Seed · Bản sắc học tập",
    role: "Bắt buộc bắt đầu tại đây",
    input: "Thông tin học sinh, mục tiêu ngành/trường, 4 môn lựa chọn, bảng điểm 6 học kỳ lớp 10–12 và các chỉ báo hành vi tự báo cáo.",
    output: "Hồ sơ, GPA theo dữ liệu đã nhập và một Cognitive snapshot khi người dùng chủ động lưu.",
    status: "ready",
    href: "/student/profile",
  },
  {
    number: "02",
    name: "Lumen · Dấu vân tay trí tuệ",
    role: "Đọc dữ liệu Seed",
    input: "Hồ sơ và chỉ báo hành vi đã lưu; lịch sử Cognitive nếu đã có nhiều lần đo.",
    output: "SCI/MAS/CSL và các proxy GVI/BDI/FRI/CRI theo quy tắc thử nghiệm; Gemini chỉ giải thích bổ sung khi được gọi.",
    status: "partial",
    href: "/lumen",
  },
  {
    number: "03",
    name: "Orion · Kiến trúc tương lai",
    role: "Dùng điểm hiện tại từ Seed, cần mục tiêu do học sinh nhập",
    input: "Điểm hiện tại được điền từ bảng điểm khi có; học sinh nhập điểm mục tiêu từng môn, ngành mục tiêu và số tuần còn lại.",
    output: "Danh sách môn ưu tiên, ba kịch bản và mốc hành động theo tuần bằng công thức quy tắc; không phải dự báo ML đã kiểm định.",
    status: "partial",
    href: "/orion",
  },
  {
    number: "04",
    name: "Atlas · Bản đồ tương lai",
    role: "Tra cứu nguồn trước, chạy engine sau",
    input: "Nguồn chính thức theo trường/năm; Admission Engine hiện yêu cầu nhập điểm môn và cần dữ liệu chương trình đã được Admin đưa vào Knowledge Base.",
    output: "Thông tin nguồn, phương thức và đối chiếu chương trình khi dữ liệu chương trình có đủ trường bắt buộc. Danh mục nguồn không đồng nghĩa đã có toàn bộ ngành.",
    status: "partial",
    href: "/atlas",
  },
  {
    number: "05",
    name: "Haven · Hành trang thế giới",
    role: "Tra cứu học bổng và tự kiểm hồ sơ",
    input: "Thư viện 7 hồ sơ học bổng có nguồn; GPA/tiếng Anh có thể lấy từ bảng điểm, các chỉ báo áp lực tài chính cần người dùng nhập.",
    output: "Điều kiện, chứng từ cần kiểm tra, đường dẫn chính thức và công cụ mô phỏng hỗ trợ. Checklist hiện chỉ giữ trong phiên trang.",
    status: "partial",
    href: "/haven/scholarships",
  },
  {
    number: "06",
    name: "Pulse · Đường cong tiến hóa",
    role: "Hiện là báo cáo mô phỏng, chưa phải closed-loop tự động",
    input: "Tám chỉ số hiện được nhập thủ công; Admin có thêm công cụ chỉ đọc để kiểm tra sự tồn tại của một số nguồn dữ liệu.",
    output: "Báo cáo và việc cần làm theo công thức. Pulse chưa tự tổng hợp toàn bộ kết quả từ Lumen, Atlas và Orion.",
    status: "manual",
    href: "/pulse",
  },
];

function StatusLabel({ status }: { status: GuideStep["status"] }) {
  if (status === "ready") return <span className="cla-guide-status is-ready">Đã có luồng chính</span>;
  if (status === "manual") return <span className="cla-guide-status is-manual">Còn nhập thủ công</span>;
  return <span className="cla-guide-status is-partial">Một phần đã hoạt động</span>;
}

export default function StudentGuidePage() {
  const isAdmin = useIsAdmin();

  return (
    <main className="cla-ops-guide-page">
      <header className="cla-ops-guide-header">
        <a href="/student" aria-label="Về tổng quan học sinh"><img src={appLogo} alt="Cognitive Learn AI" /></a>
        <div><span>CLA · HƯỚNG DẪN SỬ DỤNG</span><strong>Hướng dẫn vận hành</strong></div>
        <UserMenu />
      </header>

      <section className="cla-ops-guide-shell">
        <a className="cla-ops-back" href="/student">← Quay lại tổng quan</a>
        <section className="cla-ops-hero">
          <span>BẮT ĐẦU · DÀNH CHO HỌC SINH</span>
          <h1>Bắt đầu từ hồ sơ học tập của bạn.</h1>
          <p>Hãy nhập thông tin và bảng điểm bạn đang có, sau đó nhấn lưu. Những phân hệ khác sẽ dùng dữ liệu phù hợp để hiển thị phân tích và gợi ý. Nếu chưa đủ dữ liệu, CLA sẽ báo rõ thay vì tự tạo kết quả.</p>
          <div className="cla-ops-hero-actions">
            <a href="/student/profile" className="is-primary">Tạo hồ sơ của tôi ↗</a>
            <a href="/student/transcript">Mở bảng điểm ↗</a>
          </div>
        </section>

        <section className="cla-ops-mode-grid" aria-label="Chọn cách sử dụng">
          <article>
            <span className="cla-ops-kicker">CÁCH 1 · BẮT ĐẦU HỌC</span>
            <h2>Dùng dữ liệu của chính bạn</h2>
            <ol>
              <li>Đăng nhập bằng tài khoản học sinh của bạn.</li>
              <li>Mở “Tôi muốn trở thành” để nhập thông tin và mục tiêu; nhập điểm đã có, ô chưa có điểm cứ để trống.</li>
              <li>Chọn 4 môn tự chọn và kiểm tra điểm trung bình (GPA).</li>
              <li>Nhấn lưu. Khi đã cập nhật hồ sơ, mở LUMEN — Dấu vân tay trí tuệ để tìm hiểu các chỉ số.</li>
            </ol>
            <a href="/student/profile">Mở hồ sơ ↗</a>
          </article>
          <article className={isAdmin ? "is-admin" : ""}>
            <span className="cla-ops-kicker">CÁCH 2 · CẦN HƯỚNG DẪN THÊM</span>
            <h2>{isAdmin ? "Dùng hồ sơ minh họa" : "Khi chưa có đủ dữ liệu"}</h2>
            {isAdmin ? (
              <>
                <ol>
                  <li>Mở Seed Profile trong phiên Admin.</li>
                  <li>Chọn “Nạp hồ sơ demo 3 năm”. Dữ liệu chỉ điền vào biểu mẫu, chưa tự lưu.</li>
                  <li>Kiểm tra nội dung rồi nhấn “Lưu hồ sơ học tập”.</li>
                  <li>Dữ liệu demo được lưu dưới chính tài khoản Admin, không giả làm học sinh thật.</li>
                </ol>
                <a href="/student/profile?from=admin">Mở Seed Demo Admin ↗</a>
              </>
            ) : (
              <>
                <p>Chưa có đủ điểm hoặc chưa rõ bắt đầu từ đâu? Bạn có thể tạo hồ sơ với thông tin hiện có rồi bổ sung dần. Không cần nhập dữ liệu giả để mở các phân hệ.</p>
                <p>Trước khi xem phân tích, hãy kiểm tra các môn và kỳ học trên trang bảng điểm. CLA sẽ ghi rõ những phần chưa đủ dữ liệu.</p>
                <a href="/student/transcript">Mở bảng điểm của tôi ↗</a>
              </>
            )}
          </article>
        </section>

        <section className="cla-ops-section">
          <div className="cla-ops-section-heading"><span>TỪNG BƯỚC</span><h2>Luồng sử dụng từng bước</h2><p>Đi theo thứ tự dưới đây. Không cần mở tất cả module cùng lúc.</p></div>
          <div className="cla-ops-step-list">
            {steps.map(step => (
              <article className="cla-ops-step" key={step.number}>
                <div className="cla-ops-step-number">{step.number}</div>
                <div className="cla-ops-step-body">
                  <div className="cla-ops-step-title"><div><h3>{step.name}</h3><small>{step.role}</small></div><StatusLabel status={step.status} /></div>
                  <div className="cla-ops-io-grid"><div><strong>Đầu vào</strong><p>{step.input}</p></div><div><strong>Đầu ra</strong><p>{step.output}</p></div></div>
                  <a href={step.href}>Mở chức năng ↗</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cla-ops-section cla-ops-dataflow">
          <div className="cla-ops-section-heading"><span>DỮ LIỆU ĐƯỢC SỬ DỤNG THẾ NÀO</span><h2>Dữ liệu đang đi như thế nào?</h2></div>
          <div className="cla-ops-flow-grid">
            <article><strong>Seed</strong><p>Lưu hồ sơ, bảng điểm và snapshot Cognitive trong tài khoản hiện tại.</p></article>
            <i>→</i>
            <article><strong>Lumen</strong><p>Đọc hồ sơ và lịch sử; tính proxy bằng engine quy tắc, Gemini là tùy chọn.</p></article>
            <i>→</i>
            <article><strong>Orion</strong><p>Đọc điểm hiện tại từ bảng điểm; mục tiêu và số tuần vẫn cần nhập.</p></article>
          </div>
          <div className="cla-ops-flow-grid is-second-row">
            <article><strong>Atlas</strong><p>Kho chương trình tuyển sinh tách riêng với danh mục nguồn; Admin cần nạp và xác minh dữ liệu ngành.</p></article>
            <article><strong>Haven</strong><p>Đọc GPA/tiếng Anh ở một số trường; thư viện học bổng là danh mục nguồn, chưa phải kết quả đủ điều kiện cá nhân.</p></article>
            <article><strong>Pulse</strong><p>Hiện dùng bản nháp chỉ số nhập tay; chưa tự nối toàn bộ kết quả module thành vòng lặp.</p></article>
          </div>
        </section>

        <section className="cla-ops-warning-grid">
          <article>
            <span>VÌ SAO BẠN THẤY TRỐNG?</span>
            <h2>Không có dữ liệu tự sinh cho tài khoản mới</h2>
            <p>Dashboard học sinh đọc hồ sơ đã lưu theo tài khoản đang đăng nhập. Nếu chưa tạo hồ sơ/bảng điểm, hệ thống hiển thị trạng thái chưa có dữ liệu thay vì lấy điểm mẫu. Đây là cơ chế tránh nhầm dữ liệu demo thành dữ liệu thật.</p>
          </article>
          <article>
            <span>GIỚI HẠN AI/ML</span>
            <h2>Chưa có ML dự báo production</h2>
            <p>Lumen/Orion hiện dùng engine quy tắc và công thức thử nghiệm. Gemini chỉ diễn giải bổ sung khi cấu hình API hoạt động. Bộ dữ liệu và baseline trong thư mục research phục vụ nghiên cứu, chưa phải model dự báo cá nhân đã train, hiệu chuẩn và tích hợp vào website.</p>
          </article>
          <article>
            <span>GIỚI HẠN CLOSED-LOOP</span>
            <h2>Chưa phải vòng lặp tự động hoàn chỉnh</h2>
            <p>Pulse chưa tự đọc và hợp nhất toàn bộ kết quả Seed, Lumen, Atlas, Orion. Công cụ Data Lineage của Admin chỉ kiểm tra sự tồn tại/trạng thái nguồn dữ liệu; nó không chứng minh khuyến nghị đã tạo ra outcome học tập.</p>
          </article>
        </section>

        <section className="cla-ops-next-actions">
          <div><span>NEXT ACTION</span><h2>Muốn demo có kết quả ngay?</h2><p>Dùng tài khoản Admin, nạp preset demo 3 năm trong Seed, lưu vào UID Admin, rồi đi theo thứ tự Seed → Lumen → Orion → Atlas → Haven → Pulse. Ghi rõ đây là demo synthetic.</p></div>
          <a href={isAdmin ? "/student/profile?from=admin" : "/student/profile"}>{isAdmin ? "Mở preset demo" : "Tạo hồ sơ của tôi"} ↗</a>
        </section>
      </section>
    </main>
  );
}
