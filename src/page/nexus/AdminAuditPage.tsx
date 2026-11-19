import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { adminConsoleDirectory } from "../../data/adminConsoleDirectory";
import { moduleClusters } from "../../data/moduleClusters";
import { buildNexusAudit, summarizeNexusAudit } from "../../lib/nexusAuditPolicy";
import "../../styles.css";

const inventory = buildNexusAudit(moduleClusters.map(cluster => ({
  key: cluster.key, title: cluster.name, tasks: adminConsoleDirectory[cluster.key].tasks,
})));
const counts = summarizeNexusAudit(inventory);

export default function AdminAuditPage() {
  const requested = new URLSearchParams(window.location.search).get("task");
  // Unknown IDs are ignored; URL parameters never change permissions or evidence.
  const selected = inventory.find(item => item.id === requested);
  // An unrecognized task ID must not silently display an unrelated full audit.
  const invalid = requested !== null && !selected;
  const visible = invalid ? [] : selected ? [selected] : inventory;
  return (
    <main className="profile-page cla-transcript-page nexus-audit-page">
      <div className="profile-floating-header">
        <a className="profile-home-logo" href="/admin"><img src={appLogo} alt="Cognitive Learn" /></a>
        <UserMenu />
      </div>
      <section className="profile-shell">
        <header className="profile-head">
          <span>NEXUS CORE · CP31 · REVIEW BOARD</span>
          <h1>Kiểm toán {counts.total} tác vụ Nexus</h1>
          <p>Danh mục nghiệm thu của Admin Console. Trạng thái chỉ phản ánh có trang chẩn đoán hay chưa, không phản ánh PASS production.</p>
        </header>
        <div className="nexus-audit-summary" role="status">
          <div><strong>{counts.total}</strong><span>Tác vụ trong checklist</span></div>
          <div><strong>{counts.diagnosticPages}</strong><span>Có trang chẩn đoán (chưa nghiệm thu)</span></div>
          <div><strong>{counts.notImplemented}</strong><span>Chưa có công cụ</span></div>
          <div><strong>{counts.accepted}</strong><span>PASS reviewer từ kiểm tra này</span></div>
        </div>
        <p className="nexus-audit-caution" role="note">Chức năng hiển thị dữ liệu chỉ đọc trong phạm vi UID được phép. Trang này không liệt kê tài khoản học sinh, không ghi audit vào Firestore, không tự phát hành chứng cứ và không mở rộng quyền qua query string.</p>
        {selected && <a href="/admin/audit">Xem đủ 22 tác vụ</a>}
        {invalid && <p role="alert">Mã tác vụ Nexus không hợp lệ. Không có bằng chứng nghiệm thu cho mã này. <a href="/admin/audit">Trở về danh mục</a></p>}
        <div className="nexus-audit-items">
          {visible.map(item => (
            <article id={`nexus-task-${item.id}`} data-nexus-audit-id={item.id} className="student-panel nexus-audit-item" key={item.id}>
              <span className="nexus-audit-category">{item.cluster} · {item.group} · {item.id}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              <p><strong>Trạng thái:</strong> {item.diagnosticPath ? "Có trang chẩn đoán, chưa có nghiệm thu production" : "Chưa triển khai công cụ, NOT TESTED"}</p>
              <p><strong>Điều kiện nghiệm thu:</strong> {item.acceptance}</p>
              <p><strong>Bằng chứng bắt buộc:</strong> {item.evidence}</p>
              {item.diagnosticPath ? (
                <a className="nexus-audit-link" href={item.diagnosticPath}>Mở trang chẩn đoán hiện có</a>
              ) : (
                <span className="nexus-submodule-pending" aria-label="Công cụ chưa triển khai">Chưa có công cụ chạy trực tiếp</span>
              )}
            </article>
          ))}
        </div>
        <p><a href="/admin">Trở về Nexus Console</a></p>
      </section>
    </main>
  );
}
