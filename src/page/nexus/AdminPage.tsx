import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import { moduleClusters, type ModuleCluster } from "../../data/moduleClusters";
import "../../styles.css";

type AdminClusterKey = ModuleCluster["id"];

type AdminAction = {
  label: string;
  description: string;
  path?: string;
  status?: "ready" | "soon";
};

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
  nexus: "nexus-core",
  seed: "seed-profile",
  lumen: "lumen-intelligence",
  atlas: "atlas-admission",
  orion: "orion-strategy",
  pulse: "pulse-monitor",
  haven: "haven-support",
};

const adminClusterOrder: AdminClusterKey[] = [
  "nexus-core",
  "seed-profile",
  "lumen-intelligence",
  "atlas-admission",
  "orion-strategy",
  "pulse-monitor",
  "haven-support",
];

function getAdminClusters() {
  return [...moduleClusters].sort((a, b) => {
    const indexA = adminClusterOrder.indexOf(a.id);
    const indexB = adminClusterOrder.indexOf(b.id);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

function normalizeClusterKey(value: string | null): AdminClusterKey {
  if (!value) return "nexus-core";

  const alias = clusterAliasMap[value];

  if (alias) return alias;

  const exists = moduleClusters.some((cluster) => cluster.id === value);

  if (exists) return value as AdminClusterKey;

  return "nexus-core";
}

function getClusterCssKey(clusterId: string) {
  return clusterCssMap[clusterId] || "nexus";
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

function getClusterActions(cluster: ModuleCluster): AdminAction[] {
  if (cluster.id === "nexus-core") {
    return [
      {
        label: "Tổng quan hệ thống",
        description:
          "Theo dõi trạng thái dữ liệu, module, engine và lộ trình phát triển toàn bộ Cognitive Learn AI.",
        status: "soon",
      },
      {
        label: "Xem như học sinh",
        description:
          "Mở giao diện học sinh để kiểm thử Seed, Lumen, Atlas, Orion, Pulse và Haven theo góc nhìn học sinh.",
        path: "/student",
        status: "ready",
      },
      {
        label: "Xem như giáo viên",
        description:
          "Mở giao diện giáo viên để kiểm thử lớp học, học sinh và báo cáo học tập.",
        path: "/teacher",
        status: "ready",
      },
      {
        label: "Xem như phụ huynh",
        description:
          "Mở giao diện phụ huynh để kiểm thử báo cáo, học phí, học bổng và tiến độ học sinh.",
        path: "/parent",
        status: "ready",
      },
    ];
  }

  if (cluster.id === "seed-profile") {
    return [
      {
        label: "Mở dashboard học sinh",
        description:
          "Kiểm thử giao diện học sinh và dữ liệu hồ sơ học tập hiện tại.",
        path: "/student",
        status: "ready",
      },
      {
        label: "Nhập hồ sơ học tập",
        description:
          "Mở form Seed Profile để nhập thông tin cá nhân, điểm số, môn lựa chọn và mục tiêu.",
        path: "/student/profile",
        status: "ready",
      },
      {
        label: "Kiểm tra dữ liệu nền",
        description:
          "Đánh giá dữ liệu học sinh trước khi đưa sang Lumen, Atlas, Orion và Pulse.",
        status: "soon",
      },
    ];
  }

  if (cluster.id === "lumen-intelligence") {
    return [
      {
        label: "Xem phân tích nhận thức",
        description:
          "Kiểm thử SCI, MAS, CSL và các cảnh báo nhận thức trên trang học sinh.",
        path: "/student",
        status: "ready",
      },
      {
        label: "Kiểm tra Cognitive Engine",
        description:
          "Đánh giá kết quả rule-based cognitive engine từ dữ liệu Seed Profile.",
        status: "soon",
      },
      {
        label: "Chuẩn bị dữ liệu ML",
        description: "Đánh dấu dữ liệu cần dùng cho bước ML tự build sau này.",
        status: "soon",
      },
    ];
  }

  if (cluster.id === "atlas-admission") {
    return [
      {
        label: "Mở Atlas Admission",
        description:
          "Dùng Gemini lấy dữ liệu tuyển sinh, học phí, học bổng và link nguồn.",
        path: "/atlas",
        status: "ready",
      },
      {
        label: "Chạy Admission Engine",
        description:
          "Kiểm thử gợi ý ngành/trường theo điểm mô phỏng và dữ liệu Atlas.",
        path: "/atlas#atlas-engine",
        status: "ready",
      },
      {
        label: "Kiểm tra Knowledge Base",
        description:
          "Theo dõi ngành, mã ngành, tổ hợp, phương thức xét tuyển và nguồn dữ liệu.",
        path: "/atlas#atlas-programs",
        status: "ready",
      },
    ];
  }

  if (cluster.id === "orion-strategy") {
    return [
      {
        label: "Mở Orion Strategy",
        description:
          "Mô phỏng chiến lược tăng điểm, mức sẵn sàng và lộ trình hành động.",
        path: "/orion",
        status: "ready",
      },
      {
        label: "Kiểm tra kịch bản học tập",
        description: "So sánh chiến lược cân bằng, tập trung và bứt phá.",
        path: "/orion",
        status: "ready",
      },
      {
        label: "Theo dõi roadmap theo tuần",
        description:
          "Kiểm tra milestone học tập và hành động theo từng giai đoạn.",
        path: "/orion",
        status: "ready",
      },
    ];
  }

  if (cluster.id === "pulse-monitor") {
    return [
      {
        label: "Mở Pulse Monitor",
        description:
          "Xem báo cáo tiến độ học tập, nhận thức, tuyển sinh và hành động tiếp theo.",
        path: "/pulse",
        status: "ready",
      },
      {
        label: "Kiểm thử báo cáo học sinh",
        description: "Xem bản tóm tắt tiến độ cá nhân dành cho học sinh.",
        path: "/pulse",
        status: "ready",
      },
      {
        label: "Theo dõi chỉ số rủi ro",
        description: "Kiểm tra trend, risk level, metric score và cảnh báo.",
        path: "/pulse",
        status: "ready",
      },
    ];
  }

  if (cluster.id === "haven-support") {
    return [
      {
        label: "Mở Haven Support",
        description:
          "Kiểm thử học bổng, hỗ trợ tài chính và kế hoạch giảm áp lực cho học sinh.",
        path: "/haven",
        status: "ready",
      },
      {
        label: "Gợi ý học bổng",
        description:
          "Đánh giá học bổng đầu vào, học bổng học tập và hỗ trợ tài chính.",
        path: "/haven",
        status: "ready",
      },
      {
        label: "Hỗ trợ phụ huynh / giáo viên",
        description:
          "Kiểm tra góc nhìn phụ huynh và giáo viên về tiến độ, áp lực và hỗ trợ học sinh.",
        path: "/haven",
        status: "ready",
      },
    ];
  }

  return [
    {
      label: `Mở ${cluster.name}`,
      description: cluster.description,
      path: cluster.href,
      status: "ready",
    },
  ];
}

export default function TrangQuanTri() {
  const params = new URLSearchParams(window.location.search);
  const adminClusters = getAdminClusters();

  const activeKey = normalizeClusterKey(params.get("cluster"));
  const activeCluster =
    adminClusters.find((cluster) => cluster.id === activeKey) ||
    adminClusters.find((cluster) => cluster.id === "nexus-core") ||
    adminClusters[0];

  const activeCssKey = getClusterCssKey(activeCluster.id);
  const activeActions = getClusterActions(activeCluster);

  function goTo(path: string) {
    window.location.href = path;
  }

  function selectCluster(key: AdminClusterKey) {
    window.location.href = `/admin?cluster=${key}`;
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
          {adminClusters.map((cluster) => {
            const clusterCssKey = getClusterCssKey(cluster.id);

            return (
              <button
                key={cluster.id}
                type="button"
                className={`nexus-cluster-button ${
                  activeCluster.id === cluster.id ? "active" : ""
                } ${clusterCssKey}`}
                onClick={() => selectCluster(cluster.id)}
              >
                <div className="nexus-cluster-logo image-logo">
                  <img src={cluster.icon} alt={cluster.name} />
                </div>

                <div className="nexus-cluster-copy">
                  <strong>{cluster.name}</strong>
                  <p>{cluster.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>

        <UserMenu />
      </aside>

      <section className="nexus-workspace">
        <header className={`nexus-hero ${activeCssKey}`}>
          <div>
            <span>{activeCluster.tagline}</span>
            <h1>{activeCluster.name}</h1>
            <p>{activeCluster.description}</p>
          </div>

          <div className="nexus-hero-logo image-logo">
            <img src={activeCluster.icon} alt={activeCluster.name} />
          </div>
        </header>

        <section className="nexus-action-grid">
          {activeActions.map((action) => (
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
                <button type="button" disabled>
                  Sắp triển khai
                </button>
              )}
            </article>
          ))}
        </section>

        <section className="nexus-preview-panel">
          <div>
            <span>ROLE & MODULE FLOW</span>
            <h2>Kiểm thử vai trò và các cụm chức năng</h2>
            <p>
              Nexus Core giữ vai trò điều phối. Admin có thể kiểm thử học sinh,
              giáo viên, phụ huynh và từng module như Atlas, Orion, Pulse,
              Haven.
            </p>
          </div>

          <div className="nexus-mini-map image-map">
            {adminClusters.map((cluster) => (
              <button
                key={cluster.id}
                type="button"
                className={activeCluster.id === cluster.id ? "active" : ""}
                onClick={() => selectCluster(cluster.id)}
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