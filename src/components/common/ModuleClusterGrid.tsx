import { useEffect, useMemo, useState } from "react";
import {
  getModulesByRole,
  type ModuleCluster,
  type UserRoleScope,
} from "../../data/moduleClusters";
import {
  moduleSubmoduleDirectory,
  studentSubmoduleDirectory,
  type StudentModuleKey,
  type SubmoduleStatus,
} from "../../data/moduleSubmodules";

type ModuleClusterGridProps = {
  variant?: UserRoleScope | "all";
  /** Props cũ được giữ để tránh vỡ các page đã dùng component. */
  role?: UserRoleScope | "all";
  isAdminPreview?: boolean;
  title?: string;
  subtitle?: string;
};

type ModuleDisplay = { name: string; tagline: string };
type ModuleAction = {
  title: string;
  description: string;
  href?: string;
  disabled?: boolean;
  group?: string;
  status?: SubmoduleStatus;
};
type ModuleDetail = {
  eyebrow: string;
  title: string;
  description: string;
  actions: ModuleAction[];
};

const moduleOrder = [
  "seed-profile",
  "lumen-intelligence",
  "atlas-admission",
  "orion-strategy",
  "pulse-monitor",
  "haven-support",
  "nexus-core",
];

const roleDisplayMap: Partial<Record<UserRoleScope | "all", Partial<Record<string, ModuleDisplay>>>> = {
  student: {
    "seed-profile": { name: "Hồ sơ học tập", tagline: "Seed Profile" },
    "lumen-intelligence": { name: "Phân tích năng lực", tagline: "Lumen Intelligence" },
    "atlas-admission": { name: "Tuyển sinh & du học", tagline: "Atlas Admission" },
    "orion-strategy": { name: "Kế hoạch & chiến lược", tagline: "Orion Strategy" },
    "pulse-monitor": { name: "Theo dõi tiến độ", tagline: "Pulse Monitor" },
    "haven-support": { name: "Học bổng & tài chính", tagline: "Haven Support" },
  },
  parent: {
    "atlas-admission": { name: "Tuyển sinh", tagline: "Trường / ngành / học phí" },
    "pulse-monitor": { name: "Báo cáo con em", tagline: "Theo dõi tiến độ" },
    "haven-support": { name: "Haven Support", tagline: "Hỗ trợ phụ huynh" },
  },
  teacher: {
    "seed-profile": { name: "Hồ sơ học sinh", tagline: "Dữ liệu lớp học" },
    "lumen-intelligence": { name: "Lumen Intelligence", tagline: "Theo dõi nhận thức" },
    "orion-strategy": { name: "Orion Strategy", tagline: "Chiến lược học tập" },
    "pulse-monitor": { name: "Pulse Monitor", tagline: "Báo cáo lớp học" },
    "haven-support": { name: "Haven Support", tagline: "Hỗ trợ học sinh" },
  },
};

function getResolvedRole({ variant, role }: { variant?: UserRoleScope | "all"; role?: UserRoleScope | "all" }) {
  return variant || role || "student";
}

function getSortedModules(role: UserRoleScope | "all") {
  return [...getModulesByRole(role)].sort((a, b) => {
    const indexA = moduleOrder.indexOf(a.id);
    const indexB = moduleOrder.indexOf(b.id);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

function getModuleDisplay(module: ModuleCluster, role: UserRoleScope | "all"): ModuleDisplay {
  const roleDisplay = roleDisplayMap[role]?.[module.id] || roleDisplayMap.student?.[module.id];
  return {
    name: roleDisplay?.name || module.name,
    tagline: roleDisplay?.tagline || module.tagline || module.subtitle,
  };
}

function getModuleDetail(module: ModuleCluster, role: UserRoleScope | "all"): ModuleDetail {
  const directory = role === "student" && module.key !== "nexus"
    ? studentSubmoduleDirectory[module.key as StudentModuleKey]
    : moduleSubmoduleDirectory[module.key];

  if (role === "teacher" || role === "parent") {
    const roleLabel = role === "teacher" ? "giáo viên" : "phụ huynh";
    return {
      eyebrow: directory.title,
      title: getModuleDisplay(module, role).name,
      description: `${directory.description} Tài khoản ${roleLabel} chỉ xem được phần học sinh đã cho phép chia sẻ.`,
      actions: [{
        title: `Mở khu vực ${roleLabel}`,
        description: "Xem liên kết và báo cáo đã được chia sẻ; không tự mở hồ sơ học sinh.",
        href: role === "teacher" ? "/teacher" : "/parent",
        group: "Không gian vai trò",
        status: "available",
      }],
    };
  }

  return {
    eyebrow: directory.title,
    title: getModuleDisplay(module, role).name,
    description: directory.description,
    actions: directory.submodules.map((item) => ({
      title: item.title,
      description: item.description,
      href: item.href,
      disabled: !item.href || item.status === "planned",
      group: item.group,
      status: item.status,
    })),
  };
}

function getDefaultSubtitle(role: UserRoleScope | "all") {
  if (role === "parent") return "Không gian phụ huynh: tuyển sinh, báo cáo tiến độ, học phí, học bổng và hỗ trợ học sinh.";
  if (role === "teacher") return "Không gian giáo viên: hồ sơ được chia sẻ, nhận thức, chiến lược học tập và báo cáo.";
  if (role === "admin" || role === "all") return "Các cụm module quản trị để kiểm thử hệ thống, dữ liệu, vai trò và engine.";
  return "Sáu phân hệ dành cho học sinh. Chọn một phân hệ để xem các chức năng nhỏ và mở đúng tác vụ cần dùng.";
}

function statusLabel(status?: SubmoduleStatus) {
  if (status === "available") return "Sẵn sàng";
  if (status === "partial") return "Có thể sử dụng · đang hoàn thiện";
  if (status === "planned") return "Sắp triển khai";
  return "";
}

export default function ModuleClusterGrid({ variant, role, title, subtitle }: ModuleClusterGridProps) {
  const resolvedRole = getResolvedRole({ variant, role });
  const modules = useMemo(() => getSortedModules(resolvedRole), [resolvedRole]);
  const [activeId, setActiveId] = useState(modules[0]?.id || "");
  const [showAllSubmodules, setShowAllSubmodules] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!modules.some((module) => module.id === activeId)) setActiveId(modules[0]?.id || "");
  }, [modules, activeId]);

  useEffect(() => {
    setSearchTerm("");
    setShowAllSubmodules(false);
  }, [activeId]);

  const activeModule = modules.find((module) => module.id === activeId) || modules[0];
  if (!activeModule) return null;

  const activeDisplay = getModuleDisplay(activeModule, resolvedRole);
  const activeDetail = getModuleDetail(activeModule, resolvedRole);
  const query = searchTerm.trim().toLocaleLowerCase("vi-VN");
  const filteredActions = activeDetail.actions.filter((action) =>
    !query || [action.title, action.description, action.group || ""].join(" ").toLocaleLowerCase("vi-VN").includes(query),
  );
  const visibleActions = showAllSubmodules ? filteredActions : filteredActions.slice(0, 3);
  const totalStudentFunctions = modules.reduce((total, item) => {
    if (item.key === "nexus") return total;
    return total + studentSubmoduleDirectory[item.key as StudentModuleKey].submodules.length;
  }, 0);

  return (
    <section className="module-path-section module-path-v7">
      <div className="module-path-head">
        <div>
          <span>COGNITIVE PATH · STUDENT WORKSPACE</span>
          <h2>{title || "Các phân hệ của bạn"}</h2>
          <p>{subtitle || getDefaultSubtitle(resolvedRole)}</p>
        </div>
        <strong>{resolvedRole === "student" ? `${modules.length} phân hệ · ${totalStudentFunctions} chức năng` : `${modules.length} phân hệ`}</strong>
      </div>

      <div className="module-path-layout">
        <nav className="module-path-list" aria-label="Chọn phân hệ">
          {modules.map((module) => {
            const isActive = module.id === activeModule.id;
            const display = getModuleDisplay(module, resolvedRole);
            const directory = resolvedRole === "student" && module.key !== "nexus"
              ? studentSubmoduleDirectory[module.key as StudentModuleKey]
              : moduleSubmoduleDirectory[module.key];
            return (
              <button
                key={module.id}
                type="button"
                className={`module-path-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveId(module.id)}
                aria-pressed={isActive}
              >
                <span className="module-path-tab-icon"><img src={module.icon} alt="" aria-hidden="true" /></span>
                <span className="module-path-tab-copy">
                  <strong>{display.name}</strong>
                  <em>{display.tagline}</em>
                </span>
                <span className="module-path-tab-count">{directory.submodules.length}</span>
              </button>
            );
          })}
        </nav>

        <article className="module-path-detail">
          <div className="module-path-detail-hero">
            <div className="module-path-detail-icon"><img src={activeModule.icon} alt="" aria-hidden="true" /></div>
            <div>
              <span>{activeDetail.eyebrow}</span>
              <h3>{activeDetail.title}</h3>
              <p>{activeDetail.description}</p>
            </div>
          </div>

          <div className="module-path-action-tools">
            <label htmlFor="module-action-search">Tìm chức năng trong phân hệ</label>
            <input
              id="module-action-search"
              type="search"
              value={searchTerm}
              onChange={(event) => { setSearchTerm(event.target.value); setShowAllSubmodules(true); }}
              placeholder="Ví dụ: bảng điểm, học bổng, lộ trình..."
            />
            <span aria-live="polite">{filteredActions.length} chức năng phù hợp</span>
          </div>

          <div className="module-path-actions">
            {visibleActions.length > 0 ? visibleActions.map((action) => (
              <article className="module-path-action" key={action.title}>
                <div className="module-path-action-copy">
                  <div className="module-path-action-meta">
                    {action.group && <span>{action.group}</span>}
                    {action.status && <span className={`module-path-status is-${action.status}`}>{statusLabel(action.status)}</span>}
                  </div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>
                {action.href && !action.disabled ? (
                  <a className="module-path-action-open" href={action.href}>Mở chức năng <span aria-hidden="true">↗</span></a>
                ) : (
                  <span className="module-path-action-disabled" aria-label={`${action.title}: chưa triển khai`}>Chưa khả dụng</span>
                )}
              </article>
            )) : (
              <div className="module-path-empty" role="status">
                <strong>Chưa tìm thấy chức năng phù hợp</strong>
                <p>Thử từ khóa ngắn hơn hoặc xóa nội dung tìm kiếm.</p>
                <button type="button" onClick={() => setSearchTerm("")}>Xóa tìm kiếm</button>
              </div>
            )}
            {filteredActions.length > 3 && !query && (
              <button className="module-path-more" type="button" aria-expanded={showAllSubmodules} onClick={() => setShowAllSubmodules((value) => !value)}>
                {showAllSubmodules ? "Thu gọn danh sách" : `Xem thêm ${filteredActions.length - 3} chức năng`}
              </button>
            )}
          </div>
        </article>
      </div>
      <p className="module-path-footnote">Các chức năng được mở theo quyền tài khoản. Nhãn trạng thái mô tả mức triển khai giao diện, không thay thế kiểm thử hoặc xác minh dữ liệu.</p>
    </section>
  );
}
