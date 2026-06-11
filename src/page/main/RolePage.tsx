import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
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
      ["SCI", "78", "Mức nhất quán giữa mục tiêu, kế hoạch và hành động."],
      ["MAS", "64", "Mức độ gắn kết động lực với mục tiêu học tập."],
      ["CSL", "82", "Độ ổn định trong hành vi và quyết định học tập."],
    ],
  },
  teacher: {
    label: "Giáo viên",
    title: "Theo dõi lớp học",
    description:
      "Quan sát tiến trình học sinh, phát hiện sớm học sinh mất định hướng và xem xu hướng lớp học.",
    mainAction: "Xem danh sách lớp",
    cards: [
      ["Lớp", "12A1", "Theo dõi trạng thái học tập theo từng học sinh."],
      ["Nguy cơ", "06", "Số học sinh cần được giáo viên quan tâm thêm."],
      ["Báo cáo", "24", "Báo cáo học tập được cập nhật trong tháng."],
    ],
  },
  parent: {
    label: "Phụ huynh",
    title: "Đồng hành cùng học sinh",
    description:
      "Theo dõi tiến độ, nhận cảnh báo sớm và xem gợi ý hỗ trợ học sinh tại nhà.",
    mainAction: "Xem tiến độ của con",
    cards: [
      ["Tiến độ", "72%", "Mức hoàn thành kế hoạch học tập gần đây."],
      ["Ổn định", "Tốt", "Tình trạng duy trì thói quen học tập."],
      ["Cảnh báo", "02", "Vấn đề cần phụ huynh chú ý trong tuần này."],
    ],
  },
  admin: {
    label: "Quản trị viên",
    title: "Trung tâm quản trị Cognitive Learn",
    description:
      "Quản lý người dùng, dữ liệu tuyển sinh, ngành học, trường đại học và test toàn bộ vai trò trong hệ thống.",
    mainAction: "Quản lý hệ thống",
    cards: [
      ["Users", "128", "Tổng số tài khoản trong hệ thống demo."],
      ["Roles", "04", "Học sinh, giáo viên, phụ huynh và quản trị viên."],
      ["Data", "Ready", "Dữ liệu tuyển sinh và hồ sơ học tập mẫu."],
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

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
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

          {isAdminPreview && role !== "admin" && (
            <button
              type="button"
              className="back-admin-button"
              onClick={() => goTo("/admin")}
            >
              Quay lại Admin
            </button>
          )}
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

            <button type="button">{content.mainAction}</button>
          </div>

          <div className="role-preview-card">
            <div className="role-preview-head">
              <span>LIVE PROFILE</span>
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
                  {role === "admin"
                    ? "Administrator"
                    : role === "student"
                      ? "Nguyễn Minh Anh"
                      : role === "teacher"
                        ? "Giáo viên chủ nhiệm"
                        : "Phụ huynh học sinh"}
                </h3>
                <p>{content.label}</p>
              </div>
            </div>
          </div>
        </section>

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