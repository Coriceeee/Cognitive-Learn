import { navigateTo } from "../../lib/clientNavigation";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { adminConsoleDirectory } from "../../data/adminConsoleDirectory";
import { moduleClusters, type ModuleCluster } from "../../data/moduleClusters";
import "../../styles.css";

type AdminClusterKey = ModuleCluster["id"];

const clusterCssMap: Record<string, string> = {
  "nexus-core": "nexus",
  "seed-profile": "seed",
  "lumen-intelligence": "lumen",
  "atlas-admission": "atlas",
  "orion-strategy": "orion",
  "pulse-monitor": "pulse",
  "haven-support": "haven",
};
const clusterAliasMap: Record<string, AdminClusterKey> = {
  nexus: "nexus-core", seed: "seed-profile", lumen: "lumen-intelligence",
  atlas: "atlas-admission", orion: "orion-strategy",
  pulse: "pulse-monitor", haven: "haven-support",
};
const adminClusterOrder = [
  "nexus-core", "seed-profile", "lumen-intelligence", "atlas-admission",
  "orion-strategy", "pulse-monitor", "haven-support",
];

function getAdminClusters() {
  return [...moduleClusters].sort((a, b) =>
    adminClusterOrder.indexOf(a.id) - adminClusterOrder.indexOf(b.id));
}
function normalizeClusterKey(value: string | null): AdminClusterKey {
  if (value && clusterAliasMap[value]) return clusterAliasMap[value];
  return moduleClusters.find(cluster => cluster.id === value)?.id ?? "nexus-core";
}

export default function TrangQuanTri() {
  const params = new URLSearchParams(window.location.search);
  const adminClusters = getAdminClusters();
  const activeKey = normalizeClusterKey(params.get("cluster"));
  const activeCluster = adminClusters.find(cluster => cluster.id === activeKey) || adminClusters[0];
  const activeCssKey = clusterCssMap[activeCluster.id] || "nexus";
  const activeDirectory = adminConsoleDirectory[activeCluster.key];
  const primaryTasks = activeDirectory.tasks.slice(0, 3);
  const secondaryTasks = activeDirectory.tasks.slice(3);

  function selectCluster(key: AdminClusterKey) {
    navigateTo(`/admin?cluster=${key}`);
  }
  function renderTask(task: (typeof primaryTasks)[number]) {
    return (
      <article key={task.id} data-nexus-task={task.id} className="nexus-action-card">
        <div>
          <span>{task.group} · Admin</span>
          <h2>{task.title}</h2>
          <p>{task.description}</p>
        </div>
        {task.href ? (
          <a className="nexus-submodule-open" href={task.href}>Mở công cụ kiểm tra</a>
        ) : (
          <span className="nexus-submodule-pending" aria-label="Chức năng chưa triển khai">Chưa triển khai</span>
        )}
        <a className="nexus-audit-link" href={`/admin/audit?task=${encodeURIComponent(task.id)}`}>
          Xem tiêu chí nghiệm thu
        </a>
      </article>
    );
  }

  return (
    <main className="nexus-page" data-nexus-cluster={activeCluster.key}>
      <aside className="nexus-rail">
        <div className="nexus-brand">
          <img src={appLogo} alt="Cognitive Learn" />
          <div><span>NEXUS CONSOLE</span><strong>Quản trị hệ thống</strong></div>
        </div>
        <div className="nexus-cluster-list" aria-label="Các cụm quản trị">
          {adminClusters.map(cluster => (
            <button key={cluster.id} type="button"
              className={`nexus-cluster-button ${activeCluster.id === cluster.id ? "active" : ""} ${clusterCssMap[cluster.id] || "nexus"}`}
              onClick={() => selectCluster(cluster.id)} aria-pressed={activeCluster.id === cluster.id}>
              <div className="nexus-cluster-logo image-logo"><img src={cluster.icon} alt="" /></div>
              <div className="nexus-cluster-copy"><strong>{cluster.name}</strong><p>{cluster.tagline}</p></div>
            </button>
          ))}
        </div>
        <UserMenu />
      </aside>

      <section className="nexus-workspace">
        <header className={`nexus-hero ${activeCssKey}`}>
          <div>
            <span>ADMIN CONTROL CENTER · {activeCluster.tagline}</span>
            <h1>{activeCluster.name}</h1>
            <p>{activeDirectory.description}</p>
          </div>
          <div className="nexus-hero-logo image-logo"><img src={activeCluster.icon} alt="" /></div>
        </header>

        <details className="cla-focus-disclosure"><summary>Chế độ xem thử học sinh</summary><section className="nexus-role-switcher" aria-labelledby="nexus-role-switcher-title">
          <header className="nexus-role-switcher-head">
            <div>
              <span>ROLE WORKSPACES · ADMIN PREVIEW</span>
              <h2 id="nexus-role-switcher-title">Không gian học sinh và quản trị</h2>
              <p>Kiểm tra trải nghiệm học sinh bằng hồ sơ demo riêng của Admin. Đây là chế độ xem thử, không đổi vai trò tài khoản, không giả lập danh tính và không mở rộng quyền dữ liệu.</p>
            </div>
            <span className="nexus-role-preview-note">Quyền gốc: Admin</span>
          </header>
          <div className="nexus-role-grid">
            <a className="nexus-role-card" href="/student?from=admin">
              <span className="nexus-role-avatar">HS</span>
              <span className="nexus-role-card-copy"><strong>Học sinh</strong><small>Kiểm tra dashboard, hồ sơ và 6 module học sinh</small></span>
              <span className="nexus-role-card-action">Xem giao diện ↗</span>
            </a>
            <a className="nexus-role-card is-current" href="/admin?cluster=nexus-core" aria-current="page">
              <span className="nexus-role-avatar">AD</span>
              <span className="nexus-role-card-copy"><strong>Quản trị viên</strong><small>Trung tâm điều phối, bảo mật và kiểm thử hệ thống</small></span>
              <span className="nexus-role-card-action">Đang sử dụng</span>
            </a>
          </div>
        </section></details>

        <section className="nexus-submodule-workspace" aria-labelledby="nexus-submodule-heading">
          <header className="nexus-submodule-heading">
            <span>CHỨC NĂNG QUẢN TRỊ · KHÔNG PHẢI MENU HỌC SINH</span>
            <h2 id="nexus-submodule-heading">{activeDirectory.title}</h2>
            <p>{activeDirectory.description} Các công cụ hiện có chỉ kiểm tra dữ liệu có quyền; không chứng minh đã nghiệm thu production.</p>
          </header>
          <p><a className="nexus-audit-link" href="/admin/audit">Kiểm toán toàn bộ 22 tác vụ · Có trang chẩn đoán ≠ PASS</a></p>
          <div className="nexus-action-grid">{primaryTasks.map(renderTask)}</div>
          {activeCluster.key === "atlas" && <p><a href="/atlas/library">Mở kho nhập nguồn Atlas →</a></p>}
          {activeCluster.key === "pulse" && <p><a href="/pulse/audit">Mở kiểm tra liên thông Pulse →</a></p>}
          {secondaryTasks.length > 0 && (
            <details className="nexus-submodule-more">
              <summary>Xem thêm {secondaryTasks.length} tác vụ quản trị</summary>
              <div className="nexus-action-grid">{secondaryTasks.map(renderTask)}</div>
            </details>
          )}
        </section>

        <details className="cla-focus-disclosure"><summary>Sơ đồ bảy cụm quản trị</summary><section id="nexus-role-preview" className="nexus-preview-panel">
          <div>
            <span>ADMIN MODULE AUDIT</span>
            <h2>Kiểm tra bảy cụm hệ thống</h2>
            <p>
              Tại đây chỉ chọn cụm quản trị và công cụ chẩn đoán theo quyền Admin.
              Trải nghiệm học sinh nằm riêng ở Cognitive Path của tài khoản Student.
              Không dùng tham số URL để cấp thêm quyền xem dữ liệu.
            </p>
          </div>
          <div className="nexus-mini-map image-map">
            {adminClusters.map(cluster => (
              <button key={cluster.id} type="button"
                className={activeCluster.id === cluster.id ? "active" : ""}
                onClick={() => selectCluster(cluster.id)} aria-label={`Quản trị ${cluster.name}`}>
                <img src={cluster.icon} alt="" />
              </button>
            ))}
          </div>
        </section></details>


      </section>
    </main>
  );
}
