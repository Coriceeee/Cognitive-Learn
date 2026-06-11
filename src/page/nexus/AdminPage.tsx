import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import {
  moduleClusters,
  type ModuleKey,
} from "../../data/moduleClusters";
import "../../styles.css";

export default function TrangQuanTri() {
  const params = new URLSearchParams(window.location.search);
  const activeKey = (params.get("cluster") as ModuleKey) || "nexus";
  const activeCluster =
    moduleClusters.find((cluster) => cluster.key === activeKey) ||
    moduleClusters[0];

  function goTo(path: string) {
    window.location.href = path;
  }

  function selectCluster(key: ModuleKey) {
    window.location.href = `/admin?cluster=${key}`;
  }

  function getAdminPath(path: string) {
    if (path === "/student/profile") {
      return "/student/profile?from=admin";
    }

    if (path === "/student") {
      return "/student?from=admin";
    }

    if (path === "/teacher") {
      return "/teacher?from=admin";
    }

    if (path === "/parent") {
      return "/parent?from=admin";
    }

    return path;
  }

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/";
  }

  return (
    <main className="nexus-page">
      <aside className="nexus-rail">
        <div className="nexus-brand">
          <img src={appLogo} alt="Cognitive Learn" />

          <div>
            <span>NEXUS CONSOLE</span>
            <strong>Cognitive Path</strong>
          </div>
        </div>

        <div className="nexus-cluster-list">
          {moduleClusters.map((cluster) => (
            <button
              key={cluster.key}
              type="button"
              className={`nexus-cluster-button ${
                activeCluster.key === cluster.key ? "active" : ""
              } ${cluster.key}`}
              onClick={() => selectCluster(cluster.key)}
            >
              <div className="nexus-cluster-logo image-logo">
                <img src={cluster.icon} alt={cluster.name} />
              </div>

              <div className="nexus-cluster-copy">
                <strong>{cluster.name}</strong>
                <p>{cluster.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <UserMenu />
      </aside>

      <section className="nexus-workspace">
        <header className={`nexus-hero ${activeCluster.key}`}>
          <div>
            <span>{activeCluster.subtitle}</span>
            <h1>{activeCluster.name}</h1>
            <p>{activeCluster.meaning}</p>
          </div>

          <div className="nexus-hero-logo image-logo">
            <img src={activeCluster.icon} alt={activeCluster.name} />
          </div>
        </header>

        <section className="nexus-action-grid">
          {activeCluster.actions.map((action) => (
            <article key={action.label} className="nexus-action-card">
              <div>
                <span>{activeCluster.name}</span>
                <h2>{action.label}</h2>
                <p>{action.description}</p>
              </div>

              {action.path ? (
                <button
                  type="button"
                  onClick={() => goTo(getAdminPath(action.path!))}
                >
                  Mở chức năng
                </button>
              ) : (
                <button type="button">Sắp triển khai</button>
              )}
            </article>
          ))}
        </section>

        <section className="nexus-preview-panel">
          <div>
            <span>MODULE FLOW</span>
            <h2>Click từng logo bên trái để mở cụm chức năng</h2>
            <p>
              Admin có thể kiểm thử từng vai trò, mở form học sinh, xem góc nhìn
              giáo viên/phụ huynh và theo dõi toàn bộ lộ trình phát triển của hệ
              thống.
            </p>
          </div>

          <div className="nexus-mini-map image-map">
            {moduleClusters.map((cluster) => (
              <button
                key={cluster.key}
                type="button"
                className={activeCluster.key === cluster.key ? "active" : ""}
                onClick={() => selectCluster(cluster.key)}
                aria-label={cluster.name}
              >
                <img src={cluster.icon} alt={cluster.name} />
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}