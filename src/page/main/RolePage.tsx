import { auth } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import StudentLinkManager from "../../components/common/StudentLinkManager";
import "../../styles.css";
type UserRole = "student" | "teacher" | "parent" | "admin";

type RolePageProps = {
  role: UserRole;
};

const roleContent = {
  student: {
    label: "Học sinh",
    title: "Hồ sơ học tập cá nhân",
    description:
      "Theo dõi năng lực hiện tại, trạng thái nhận thức, điểm dự báo và chiến lược học tập phù hợp.",
    mainAction: "Bắt đầu đánh giá",
    cards: [
      ["Hồ sơ", "Theo tài khoản", "Chỉ hiển thị thông tin đã lưu và được phép truy cập."],
      ["Cognitive", "Cần phép đo", "Chỉ số được tính khi có dữ liệu hợp lệ."],
      ["Growth", "Cần lịch sử", "Cần đủ các lần đo để so sánh."],
    ],
  },
  teacher: {
    label: "Giáo viên",
    title: "Theo dõi lớp học",
    description:
      "Quan sát tiến trình học sinh, phát hiện sớm học sinh mất định hướng và xem xu hướng lớp học.",
    mainAction: "Xem học sinh liên kết",
    cards: [
      ["Học sinh", "Từ Firestore", "Chỉ hiển thị khi học sinh chủ động cấp liên kết."],
      ["Đánh giá", "Chưa chia sẻ", "Chưa truy cập Cognitive hoặc điểm số riêng tư."],
      ["Phản hồi", "Chuẩn bị", "Chức năng nhận xét sẽ được kết nối sau khi hoàn thiện quyền dữ liệu."],
    ],
  },
  parent: {
    label: "Phụ huynh",
    title: "Đồng hành cùng học sinh",
    description:
      "Theo dõi tiến độ, nhận cảnh báo sớm và xem gợi ý hỗ trợ học sinh tại nhà.",
    mainAction: "Xem liên kết của con",
    cards: [
      ["Học sinh", "Từ Firestore", "Chỉ xuất hiện khi học sinh chủ động cấp liên kết."],
      ["Tiến độ", "Chưa chia sẻ", "Chưa được phép xem lịch sử hoặc điểm cá nhân."],
      ["Phản hồi", "Chuẩn bị", "Khu vực phối hợp kế hoạch sẽ được triển khai sau."],
    ],
  },
  admin: {
    label: "Quản trị viên",
    title: "Trung tâm quản trị Cognitive Learn",
    description:
      "Quản lý người dùng, dữ liệu tuyển sinh, ngành học, trường đại học và test toàn bộ vai trò trong hệ thống.",
    mainAction: "Quản lý hệ thống",
    cards: [
      ["Tài khoản", "Xem trong Nexus", "Không hiển thị số lượng giả."],
      ["Phân quyền", "Cần kiểm chứng", "Quyền dữ liệu phải được kiểm tra từ Firestore Rules."],
      ["Dữ liệu", "Cần kiểm thử", "Kiểm tra trạng thái lưu trữ và tính toàn vẹn."],
    ],
  },
} satisfies Record<
  UserRole,
  {
    label: string;
    title: string;
    description: string;
    mainAction: string;
    cards: string[][];
  }
>;

export default function TrangVaiTro({ role }: RolePageProps) {
  const content = roleContent[role];
  const params = new URLSearchParams(window.location.search);
  const isAdminPreview = params.get("from") === "admin";
  const roleTasks: Record<UserRole, string[]> = {
    student: ["Hoàn thiện hồ sơ Seed", "Xem Cognitive có căn cứ", "Theo dõi kế hoạch học tập"],
    teacher: ["Gửi UID tài khoản cho học sinh", "Chờ học sinh tự cấp liên kết", "Xem báo cáo khi CLA triển khai quyền chia sẻ riêng"],
    parent: ["Gửi UID cho con", "Chờ học sinh tự cấp liên kết", "Đồng hành khi có dữ liệu được chia sẻ"],
    admin: ["Kiểm tra quyền người dùng", "Rà soát dữ liệu", "Kiểm thử giao diện từng vai trò"],
  };
  function handleMainAction() {
    if (role === "student") goTo("/student/profile");
    else if (role === "admin") goTo("/admin");
    else document.getElementById("cla-student-links")?.scrollIntoView({ behavior: "smooth" });
  }

  function goTo(path: string) {
    window.location.href = path;
  }

  function getHomePath() {
    if (isAdminPreview && role !== "admin") {
      return `/${role}?from=admin`;
    }

    return `/${role}`;
  }

  return (
    <main className="role-page">
      <div className="role-floating-header">
        <div className="role-floating-left">
          <a
            className="role-home-logo"
            href={getHomePath()}
            aria-label="Về trang chính"
          >
            <img src={appLogo} alt="Cognitive Learn" />
          </a>

        </div>

       <UserMenu />
      </div>

      <section className="role-shell">
        <header className="role-topbar">
          <div>
            <h1>{content.title}</h1>
            <span>{content.label}</span>
          </div>
        </header>

        {role === "admin" && (
          <section className="admin-switcher">
            <div>
              <p>CHẾ ĐỘ KIỂM THỬ TOÀN HỆ THỐNG</p>
              <h2>Admin có thể xem nhanh tất cả giao diện người dùng</h2>
            </div>

            <div className="admin-actions">
              <button type="button" onClick={() => goTo("/student?from=admin")}>
                Xem như học sinh
              </button>

              <button type="button" onClick={() => goTo("/teacher?from=admin")}>
                Xem như giáo viên
              </button>

              <button type="button" onClick={() => goTo("/parent?from=admin")}>
                Xem như phụ huynh
              </button>
            </div>
          </section>
        )}

        <section className="role-landing">
          <div className="role-landing-copy">
            <span>{content.label}</span>

            <h2>{content.description}</h2>

            <button type="button" onClick={handleMainAction}>{content.mainAction}</button>
          </div>

          <div className="role-preview-card">
            <div className="role-preview-head">
              <span>TÀI KHOẢN ĐÃ ĐĂNG NHẬP</span>
              <strong>{role.toUpperCase()}</strong>
            </div>

            <div className="role-profile">
              <div className="role-avatar">
                {role === "admin"
                  ? "A"
                  : role === "student"
                    ? "H"
                    : role === "teacher"
                      ? "G"
                      : "P"}
              </div>

              <div>
                <h3>
                  {auth.currentUser?.displayName || auth.currentUser?.email || content.label}
                </h3>
                <p>{content.label}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="role-task-section" aria-labelledby="cla-role-task-heading">
          <h2 id="cla-role-task-heading">Các bước theo vai trò</h2>
          <ol>{roleTasks[role].map(task => <li key={task}>{task}</li>)}</ol>
        </section>

        {(role === "teacher" || role === "parent") && (
          <div id="cla-student-links">
            <StudentLinkManager mode={role} preview={isAdminPreview} />
          </div>
        )}

        <section className="role-card-grid">
          {content.cards.map(([label, value, desc]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{desc}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}