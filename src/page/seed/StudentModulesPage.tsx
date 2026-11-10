import ModuleClusterGrid from "../../components/common/ModuleClusterGrid";
import StudentHeader from "./components/StudentHeader";
import "../../styles.css";

export default function StudentModulesPage() {
  return (
    <main className="student-page">
      <StudentHeader isAdminPreview={false} />
      <section className="student-shell">
        <nav aria-label="Điều hướng phân hệ" style={{ marginBottom: "1rem" }}>
          <a href="/student">← Trở về Dashboard học sinh</a>
        </nav>
        <ModuleClusterGrid
          variant="student"
          title="Cognitive Path cá nhân"
          subtitle="Chọn một module chính để mở các chức năng học tập, định hướng và hỗ trợ. Mỗi nhóm hiển thị 3 mục trước, phần còn lại ở Xem thêm."
        />
      </section>
    </main>
  );
}
