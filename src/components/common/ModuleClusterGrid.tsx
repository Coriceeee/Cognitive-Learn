import { useEffect, useMemo, useState } from "react";
import {
  getModulesByRole,
  type ModuleCluster,
  type UserRoleScope,
} from "../../data/moduleClusters";

type ModuleClusterGridProps = {
  variant?: UserRoleScope | "all";

  /**
   * Props cũ để tránh vỡ các page đã viết trước đó.
   */
  role?: UserRoleScope | "all";
  isAdminPreview?: boolean;
  title?: string;
  subtitle?: string;
};

type ModuleDisplay = {
  name: string;
  tagline: string;
};

type ModuleDetail = {
  eyebrow: string;
  title: string;
  description: string;
  actions: {
    title: string;
    description: string;
    href?: string;
    disabled?: boolean;
  }[];
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

const roleDisplayMap: Partial<
  Record<UserRoleScope | "all", Partial<Record<string, ModuleDisplay>>>
> = {
  student: {
    "seed-profile": {
      name: "Seed Profile",
      tagline: "Hồ sơ học sinh",
    },
    "lumen-intelligence": {
      name: "Lumen Intelligence",
      tagline: "Phân tích nhận thức",
    },
    "atlas-admission": {
      name: "Atlas Admission",
      tagline: "AI tuyển sinh",
    },
    "orion-strategy": {
      name: "Orion Strategy",
      tagline: "Chiến lược học tập",
    },
    "pulse-monitor": {
      name: "Pulse Monitor",
      tagline: "Báo cáo cá nhân",
    },
    "haven-support": {
      name: "Học bổng & tài chính",
      tagline: "Học phí / học bổng",
    },
  },

  parent: {
    "atlas-admission": {
      name: "Tuyển sinh",
      tagline: "Trường / ngành / học phí",
    },
    "pulse-monitor": {
      name: "Báo cáo con em",
      tagline: "Theo dõi tiến độ",
    },
    "haven-support": {
      name: "Haven Support",
      tagline: "Hỗ trợ phụ huynh",
    },
  },

  teacher: {
    "seed-profile": {
      name: "Hồ sơ học sinh",
      tagline: "Dữ liệu lớp học",
    },
    "lumen-intelligence": {
      name: "Lumen Intelligence",
      tagline: "Theo dõi nhận thức",
    },
    "orion-strategy": {
      name: "Orion Strategy",
      tagline: "Chiến lược học tập",
    },
    "pulse-monitor": {
      name: "Pulse Monitor",
      tagline: "Báo cáo lớp học",
    },
    "haven-support": {
      name: "Haven Support",
      tagline: "Hỗ trợ học sinh",
    },
  },
};

const moduleDetails: Record<string, ModuleDetail> = {
  "student:seed-profile": {
    eyebrow: "Dữ liệu nền học sinh",
    title: "Seed Profile",
    description:
      "Nơi hình thành hồ sơ học tập: thông tin cá nhân, chương trình học, môn lựa chọn, điểm số, GPA và mục tiêu cá nhân.",
    actions: [
      {
        title: "Mở hồ sơ học tập",
        description:
          "Nhập thông tin học sinh, môn học lựa chọn, điểm số và mục tiêu cá nhân.",
        href: "/student/profile",
      },
      {
        title: "Bảng điểm THPT",
        description: "Quản lý điểm lớp 10, 11, 12 theo học kì và hệ số.",
        disabled: true,
      },
      {
        title: "GPA học bạ",
        description: "Tính GPA từng học kì, từng năm và toàn bộ THPT.",
        disabled: true,
      },
    ],
  },

  "student:lumen-intelligence": {
    eyebrow: "Phân tích nhận thức học tập",
    title: "Lumen Intelligence",
    description:
      "Phân tích SCI, MAS, CSL, xu hướng học tập, điểm mạnh, rủi ro và việc nên làm tiếp theo cho học sinh.",
    actions: [
      {
        title: "Xem chỉ số nhận thức",
        description: "Xem SCI, MAS, CSL và insight học tập hiện tại.",
        href: "/student",
      },
      {
        title: "Điểm mạnh học tập",
        description: "Nhận diện môn học và hành vi học tập đang hỗ trợ tốt.",
        disabled: true,
      },
      {
        title: "Cảnh báo rủi ro",
        description: "Theo dõi chỉ số có xu hướng giảm hoặc thiếu dữ liệu.",
        disabled: true,
      },
    ],
  },

  "student:atlas-admission": {
    eyebrow: "AI tuyển sinh",
    title: "Atlas Admission",
    description:
      "Tìm dữ liệu tuyển sinh, ngành học, mã ngành, tổ hợp, phương thức xét tuyển, học phí, học bổng và link nguồn.",
    actions: [
      {
        title: "Mở Atlas AI",
        description:
          "Tìm dữ liệu tuyển sinh bằng Gemini và lưu vào Atlas Knowledge Base.",
        href: "/atlas",
      },
      {
        title: "Gợi ý ngành / trường",
        description: "Chạy Admission Engine để phân nhóm an toàn, vừa sức, bứt phá.",
        href: "/atlas#atlas-engine",
      },
      {
        title: "Nguồn tuyển sinh",
        description: "Xem link nguồn, năm dữ liệu, học phí và học bổng.",
        href: "/atlas#atlas-programs",
      },
    ],
  },

  "student:orion-strategy": {
    eyebrow: "Chiến lược học tập cá nhân",
    title: "Orion Strategy",
    description:
      "Mô phỏng chiến lược tăng điểm, số tuần còn lại, rủi ro xét tuyển và lộ trình hành động theo từng giai đoạn.",
    actions: [
      {
        title: "Mở Orion",
        description: "Tạo chiến lược học tập theo điểm hiện tại và điểm mục tiêu.",
        href: "/orion",
      },
      {
        title: "Kịch bản tăng điểm",
        description: "So sánh chiến lược cân bằng, tập trung và bứt phá.",
        href: "/orion",
      },
      {
        title: "Lộ trình theo tuần",
        description: "Xem các mốc hành động để cải thiện điểm và nguyện vọng.",
        href: "/orion",
      },
    ],
  },

  "student:pulse-monitor": {
    eyebrow: "Báo cáo cá nhân",
    title: "Pulse Monitor",
    description:
      "Theo dõi tiến độ học tập, chỉ số nhận thức, mức sẵn sàng tuyển sinh và các việc nên làm tiếp theo của học sinh.",
    actions: [
      {
        title: "Mở Pulse",
        description: "Xem báo cáo tổng quan học tập và tuyển sinh cá nhân.",
        href: "/pulse",
      },
      {
        title: "Chỉ số tiến độ",
        description: "Theo dõi nhận thức, tuyển sinh, chiến lược và giờ học.",
        href: "/pulse",
      },
      {
        title: "Việc nên làm",
        description: "Xem kế hoạch hành động theo mức ưu tiên.",
        href: "/pulse",
      },
    ],
  },

  "student:haven-support": {
    eyebrow: "Học bổng và hỗ trợ tài chính",
    title: "Học bổng & tài chính",
    description:
      "Dành cho học sinh xem học phí, học bổng, hỗ trợ tài chính, chi phí học đại học và kế hoạch giảm áp lực khi chọn trường/ngành.",
    actions: [
      {
        title: "Xem học bổng",
        description:
          "Đánh giá mức phù hợp với học bổng đầu vào, học bổng học tập và hỗ trợ tài chính.",
        href: "/haven",
      },
      {
        title: "Chi phí học đại học",
        description:
          "Xem áp lực học phí, nhu cầu tài chính và hướng chọn trường phù hợp hơn.",
        href: "/haven",
      },
      {
        title: "Kế hoạch giảm áp lực",
        description:
          "Gợi ý việc nên làm để giảm áp lực tài chính và tuyển sinh.",
        href: "/haven",
      },
    ],
  },

  "parent:atlas-admission": {
    eyebrow: "Thông tin tuyển sinh",
    title: "Tuyển sinh & chi phí",
    description:
      "Phụ huynh xem trường/ngành, học phí, học bổng, nguồn tuyển sinh và mức phù hợp của từng lựa chọn.",
    actions: [
      {
        title: "Xem tuyển sinh",
        description: "Mở Atlas để kiểm tra ngành, trường, học phí và học bổng.",
        href: "/atlas",
      },
      {
        title: "Nguồn dữ liệu",
        description: "Xem link nguồn tuyển sinh và năm dữ liệu.",
        href: "/atlas#atlas-programs",
      },
      {
        title: "Gợi ý phương án",
        description: "Xem Admission Engine phân nhóm an toàn, vừa sức, bứt phá.",
        href: "/atlas#atlas-engine",
      },
    ],
  },

  "parent:pulse-monitor": {
    eyebrow: "Theo dõi con em",
    title: "Báo cáo tiến độ",
    description:
      "Phụ huynh theo dõi tiến độ học tập, nhận thức, tuyển sinh và cảnh báo cần hỗ trợ.",
    actions: [
      {
        title: "Mở báo cáo",
        description: "Xem báo cáo tổng quan dành cho phụ huynh.",
        href: "/pulse",
      },
      {
        title: "Cảnh báo",
        description: "Theo dõi các chỉ số đang cần chú ý.",
        href: "/pulse",
      },
      {
        title: "Hành động tiếp theo",
        description: "Xem việc phụ huynh nên hỗ trợ.",
        href: "/pulse",
      },
    ],
  },

  "parent:haven-support": {
    eyebrow: "Hỗ trợ phụ huynh",
    title: "Haven Support",
    description:
      "Phụ huynh xem áp lực tài chính, học phí, học bổng và hướng hỗ trợ học sinh trong quá trình chọn trường/ngành.",
    actions: [
      {
        title: "Mở Haven",
        description: "Xem hỗ trợ tài chính, học phí và học bổng.",
        href: "/haven",
      },
      {
        title: "Kế hoạch hỗ trợ",
        description: "Xem các việc phụ huynh nên chuẩn bị.",
        href: "/haven",
      },
      {
        title: "Giảm áp lực",
        description: "Theo dõi áp lực học tập và tuyển sinh.",
        href: "/haven",
      },
    ],
  },
};

function getResolvedRole({
  variant,
  role,
}: {
  variant?: UserRoleScope | "all";
  role?: UserRoleScope | "all";
}) {
  return variant || role || "student";
}

function getSortedModules(role: UserRoleScope | "all") {
  const modules = getModulesByRole(role);

  return [...modules].sort((a, b) => {
    const indexA = moduleOrder.indexOf(a.id);
    const indexB = moduleOrder.indexOf(b.id);

    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

function getModuleDisplay(
  module: ModuleCluster,
  role: UserRoleScope | "all"
): ModuleDisplay {
  const roleDisplay =
    roleDisplayMap[role]?.[module.id] ||
    roleDisplayMap.student?.[module.id];

  return {
    name: roleDisplay?.name || module.name,
    tagline: roleDisplay?.tagline || module.tagline || module.subtitle,
  };
}

function getFallbackDetail(
  module: ModuleCluster,
  role: UserRoleScope | "all"
): ModuleDetail {
  const display = getModuleDisplay(module, role);

  return {
    eyebrow: display.tagline,
    title: display.name,
    description: module.description || module.meaning,
    actions: [
      {
        title: `Mở ${display.name}`,
        description: module.description || module.meaning,
        href: module.href,
      },
    ],
  };
}

function getModuleDetail(
  module: ModuleCluster,
  role: UserRoleScope | "all"
): ModuleDetail {
  const roleKey = `${role}:${module.id}`;
  const studentKey = `student:${module.id}`;

  return (
    moduleDetails[roleKey] ||
    moduleDetails[studentKey] ||
    getFallbackDetail(module, role)
  );
}

function getDefaultSubtitle(role: UserRoleScope | "all") {
  if (role === "parent") {
    return "Các cụm module dành cho phụ huynh: tuyển sinh, báo cáo tiến độ, học phí, học bổng và hỗ trợ học sinh.";
  }

  if (role === "teacher") {
    return "Các cụm module dành cho giáo viên: hồ sơ học sinh, nhận thức, chiến lược học tập, báo cáo và hỗ trợ.";
  }

  if (role === "admin" || role === "all") {
    return "Các cụm module quản trị để kiểm thử toàn bộ hệ thống, dữ liệu, vai trò và engine.";
  }

  return "Các cụm module dành cho học sinh: hồ sơ học tập, nhận thức, tuyển sinh, chiến lược, báo cáo cá nhân và học bổng / tài chính.";
}

function openHref(href?: string) {
  if (!href) return;
  window.location.href = href;
}

export default function ModuleClusterGrid({
  variant,
  role,
  title,
  subtitle,
}: ModuleClusterGridProps) {
  const resolvedRole = getResolvedRole({ variant, role });

  const modules = useMemo(() => {
    return getSortedModules(resolvedRole);
  }, [resolvedRole]);

  const [activeId, setActiveId] = useState(modules[0]?.id || "");

  useEffect(() => {
    if (!modules.some((module) => module.id === activeId)) {
      setActiveId(modules[0]?.id || "");
    }
  }, [modules, activeId]);

  const activeModule =
    modules.find((module) => module.id === activeId) || modules[0];

  if (!activeModule) return null;

  const activeDisplay = getModuleDisplay(activeModule, resolvedRole);
  const activeDetail = getModuleDetail(activeModule, resolvedRole);

  return (
    <section className="module-path-section">
      <div className="module-path-head">
        <div>
          <span>COGNITIVE PATH</span>
          <h2>{title || "Cognitive Path cá nhân"}</h2>
          <p>{subtitle || getDefaultSubtitle(resolvedRole)}</p>
        </div>

        <strong>{modules.length} cụm</strong>
      </div>

      <div className="module-path-layout">
        <div className="module-path-list">
          {modules.map((module) => {
            const isActive = module.id === activeModule.id;
            const display = getModuleDisplay(module, resolvedRole);

            return (
              <button
                key={module.id}
                type="button"
                className={`module-path-tab ${isActive ? "active" : ""}`}
                onClick={() => setActiveId(module.id)}
              >
                <span>
                  <img src={module.icon} alt={display.name} />
                </span>

                <div>
                  <strong>{display.name}</strong>
                  <em>{display.tagline}</em>
                </div>
              </button>
            );
          })}
        </div>

        <article className="module-path-detail">
          <div className="module-path-detail-hero">
            <div className="module-path-detail-icon">
              <img src={activeModule.icon} alt={activeDisplay.name} />
            </div>

            <div>
              <span>{activeDetail.eyebrow}</span>
              <h3>{activeDetail.title}</h3>
              <p>{activeDetail.description}</p>
            </div>
          </div>

          <div className="module-path-actions">
            {activeDetail.actions.map((action, index) => (
              <div className="module-path-action" key={action.title}>
                <div>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                </div>

                <button
                  type="button"
                  disabled={action.disabled}
                  onClick={() => openHref(action.href)}
                >
                  {index === 0 ? "Mở" : "Sau"}
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}