import atlasIcon from "../assets/modules/atlas-admission.png";
import havenIcon from "../assets/modules/haven-support.png";
import lumenIcon from "../assets/modules/lumen-intelligence.png";
import nexusIcon from "../assets/modules/nexus-core.png";
import orionIcon from "../assets/modules/orion-strategy.png";
import pulseIcon from "../assets/modules/pulse-monitor.png";
import seedIcon from "../assets/modules/seed-profile.png";

export type ModuleKey =
  | "nexus"
  | "seed"
  | "lumen"
  | "atlas"
  | "orion"
  | "pulse"
  | "haven";

export type UserRoleScope = "student" | "parent" | "teacher" | "admin";

export type ModuleAction = {
  label: string;
  description: string;
  path?: string;
};

export type ModuleCluster = {
  /**
   * Cấu trúc ban đầu dùng cho AdminPage.
   */
  key: ModuleKey;
  subtitle: string;
  meaning: string;
  actions: ModuleAction[];

  /**
   * Cấu trúc mới dùng cho ModuleClusterGrid / route module.
   */
  id: string;
  name: string;
  code: string;
  tagline: string;
  description: string;
  icon: string;
  href: string;
  status: "ready" | "building" | "core";
  visibleFor: UserRoleScope[];
};

export const moduleClusters: ModuleCluster[] = [
  {
    key: "nexus",
    id: "nexus-core",
    name: "Nexus Core",
    code: "NEXUS",
    subtitle: "Trung tâm điều phối",
    tagline: "Trung tâm điều phối",
    meaning:
      "Nơi admin quan sát toàn bộ hệ thống, kiểm thử vai trò và điều phối các cụm chức năng.",
    description:
      "Quản lý người dùng, dữ liệu tuyển sinh, ngành học, trường đại học và kiểm thử toàn bộ vai trò trong hệ thống.",
    icon: nexusIcon,
    href: "/admin",
    status: "core",
    visibleFor: ["admin"],
    actions: [
      {
        label: "Tổng quan hệ thống",
        description:
          "Xem số lượng người dùng, trạng thái dữ liệu và các module chính.",
      },
      {
        label: "Xem như học sinh",
        description: "Mở giao diện học sinh để kiểm thử trải nghiệm.",
        path: "/student",
      },
      {
        label: "Xem như giáo viên",
        description: "Mở giao diện giáo viên để kiểm thử góc nhìn lớp học.",
        path: "/teacher",
      },
      {
        label: "Xem như phụ huynh",
        description:
          "Mở giao diện phụ huynh để kiểm thử phần theo dõi học sinh.",
        path: "/parent",
      },
    ],
  },
  {
    key: "seed",
    id: "seed-profile",
    name: "Seed Profile",
    code: "SEED",
    subtitle: "Dữ liệu nền học sinh",
    tagline: "Hồ sơ học sinh",
    meaning:
      "Nơi hình thành hồ sơ học tập của học sinh: thông tin cá nhân, điểm số, GPA, môn lựa chọn và mục tiêu.",
    description:
      "Lưu hồ sơ học tập, điểm số, hành vi học tập và dữ liệu nền để các engine khác phân tích.",
    icon: seedIcon,
    href: "/student",
    status: "core",
    visibleFor: ["student", "teacher", "admin"],
    actions: [
      {
        label: "Mở dashboard học sinh",
        description:
          "Kiểm thử giao diện học sinh và dữ liệu hồ sơ học tập hiện tại.",
        path: "/student",
      },
      {
        label: "Nhập hồ sơ học tập",
        description:
          "Mở form Seed Profile để nhập thông tin cá nhân, môn lựa chọn, điểm số và mục tiêu.",
        path: "/student/profile",
      },
      {
        label: "Kiểm tra dữ liệu nền",
        description:
          "Đánh giá dữ liệu học sinh trước khi đưa sang Lumen, Atlas, Orion và Pulse.",
      },
    ],
  },
  {
    key: "lumen",
    id: "lumen-intelligence",
    name: "Lumen Intelligence",
    code: "LUMEN",
    subtitle: "Ánh sáng nhận thức",
    tagline: "Phân tích nhận thức",
    meaning:
      "Phân tích chỉ số nhận thức học tập, mức độ ổn định, khả năng thích ứng và cảnh báo rủi ro học tập.",
    description:
      "Đánh giá SCI, MAS, CSL và mức độ sẵn sàng học tập dựa trên hồ sơ học sinh.",
    icon: lumenIcon,
    href: "/student",
    status: "core",
    visibleFor: ["student", "teacher", "admin"],
    actions: [
      {
        label: "Xem phân tích nhận thức",
        description:
          "Kiểm thử SCI, MAS, CSL và các cảnh báo nhận thức trên trang học sinh.",
        path: "/student",
      },
      {
        label: "Kiểm tra Cognitive Engine",
        description:
          "Đánh giá kết quả rule-based cognitive engine từ dữ liệu Seed Profile.",
      },
      {
        label: "Chuẩn bị dữ liệu ML",
        description: "Đánh dấu dữ liệu cần dùng cho bước ML tự build sau này.",
      },
    ],
  },
  {
    key: "atlas",
    id: "atlas-admission",
    name: "Atlas Admission",
    code: "ATLAS",
    subtitle: "Bản đồ tuyển sinh",
    tagline: "AI tuyển sinh",
    meaning:
      "Tìm dữ liệu tuyển sinh, ngành học, mã ngành, tổ hợp, phương thức xét tuyển, học phí, học bổng và link nguồn.",
    description:
      "Dùng Gemini lấy dữ liệu tuyển sinh, lưu vào Atlas Knowledge Base và chạy Admission Engine.",
    icon: atlasIcon,
    href: "/atlas",
    status: "ready",
    visibleFor: ["student", "parent", "teacher", "admin"],
    actions: [
      {
        label: "Mở Atlas Admission",
        description:
          "Dùng Gemini lấy dữ liệu tuyển sinh, học phí, học bổng và link nguồn.",
        path: "/atlas",
      },
      {
        label: "Chạy Admission Engine",
        description:
          "Kiểm thử gợi ý ngành/trường theo điểm mô phỏng và dữ liệu Atlas.",
        path: "/atlas#atlas-engine",
      },
      {
        label: "Kiểm tra Knowledge Base",
        description:
          "Theo dõi ngành, mã ngành, tổ hợp, phương thức xét tuyển và nguồn dữ liệu.",
        path: "/atlas#atlas-programs",
      },
    ],
  },
  {
    key: "orion",
    id: "orion-strategy",
    name: "Orion Strategy",
    code: "ORION",
    subtitle: "Định hướng tương lai",
    tagline: "Chiến lược học tập",
    meaning:
      "Mô phỏng chiến lược tăng điểm, rủi ro xét tuyển, số tuần còn lại và lộ trình hành động theo từng giai đoạn.",
    description:
      "Mô phỏng chiến lược tăng điểm, rủi ro xét tuyển và lộ trình hành động theo tuần.",
    icon: orionIcon,
    href: "/orion",
    status: "ready",
    visibleFor: ["student", "teacher", "admin"],
    actions: [
      {
        label: "Mở Orion Strategy",
        description:
          "Mô phỏng chiến lược tăng điểm, mức sẵn sàng và lộ trình hành động.",
        path: "/orion",
      },
      {
        label: "Kiểm tra kịch bản học tập",
        description: "So sánh chiến lược cân bằng, tập trung và bứt phá.",
        path: "/orion",
      },
      {
        label: "Theo dõi roadmap theo tuần",
        description:
          "Kiểm tra milestone học tập và hành động theo từng giai đoạn.",
        path: "/orion",
      },
    ],
  },
  {
    key: "pulse",
    id: "pulse-monitor",
    name: "Pulse Monitor",
    code: "PULSE",
    subtitle: "Nhịp theo dõi tiến trình",
    tagline: "Báo cáo cá nhân",
    meaning:
      "Theo dõi tiến độ học tập, nhận thức, tuyển sinh, chiến lược và các việc nên làm tiếp theo.",
    description:
      "Tổng hợp dữ liệu từ Seed, Lumen, Atlas và Orion để tạo báo cáo tiến độ cho học sinh, phụ huynh, giáo viên.",
    icon: pulseIcon,
    href: "/pulse",
    status: "ready",
    visibleFor: ["student", "parent", "teacher", "admin"],
    actions: [
      {
        label: "Mở Pulse Monitor",
        description:
          "Xem báo cáo tiến độ học tập, nhận thức, tuyển sinh và hành động tiếp theo.",
        path: "/pulse",
      },
      {
        label: "Kiểm thử báo cáo học sinh",
        description: "Xem bản tóm tắt tiến độ cá nhân dành cho học sinh.",
        path: "/pulse",
      },
      {
        label: "Theo dõi chỉ số rủi ro",
        description: "Kiểm tra trend, risk level, metric score và cảnh báo.",
        path: "/pulse",
      },
    ],
  },
  {
    key: "haven",
    id: "haven-support",
    name: "Haven Support",
    code: "HAVEN",
    subtitle: "Hỗ trợ và đồng hành",
    tagline: "Học bổng / hỗ trợ tài chính",
    meaning:
      "Gợi ý học bổng, hỗ trợ tài chính, chi phí học đại học và kế hoạch giảm áp lực khi chọn trường/ngành.",
    description:
      "Gợi ý học bổng, hỗ trợ tài chính, chi phí học đại học và kế hoạch giảm áp lực cho học sinh.",
    icon: havenIcon,
    href: "/haven",
    status: "ready",
    visibleFor: ["student", "parent", "teacher", "admin"],
    actions: [
      {
        label: "Mở Haven Support",
        description:
          "Kiểm thử học bổng, hỗ trợ tài chính và kế hoạch giảm áp lực cho học sinh.",
        path: "/haven",
      },
      {
        label: "Gợi ý học bổng",
        description:
          "Đánh giá học bổng đầu vào, học bổng học tập và hỗ trợ tài chính.",
        path: "/haven",
      },
      {
        label: "Chi phí học đại học",
        description:
          "Xem áp lực học phí, nhu cầu tài chính và hướng chọn trường phù hợp hơn.",
        path: "/haven",
      },
    ],
  },
];

export const studentModuleClusters = moduleClusters.filter((module) =>
  module.visibleFor.includes("student")
);

export const parentModuleClusters = moduleClusters.filter((module) =>
  module.visibleFor.includes("parent")
);

export const teacherModuleClusters = moduleClusters.filter((module) =>
  module.visibleFor.includes("teacher")
);

export const adminModuleClusters = moduleClusters;

export function getModulesByRole(role: UserRoleScope | "all") {
  if (role === "all") return moduleClusters;

  return moduleClusters.filter((module) => module.visibleFor.includes(role));
}

export function getModuleStatusLabel(status: ModuleCluster["status"]) {
  if (status === "ready") return "Đã kết nối";
  if (status === "core") return "Lõi hệ thống";
  return "Đang phát triển";
}