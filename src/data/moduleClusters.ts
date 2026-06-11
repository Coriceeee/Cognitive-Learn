import nexusIcon from "../assets/modules/nexus-core.png";
import seedIcon from "../assets/modules/seed-profile.png";
import lumenIcon from "../assets/modules/lumen-intelligence.png";
import orionIcon from "../assets/modules/orion-strategy.png";
import atlasIcon from "../assets/modules/atlas-admission.png";
import pulseIcon from "../assets/modules/pulse-monitor.png";
import havenIcon from "../assets/modules/haven-support.png";

export type UserRole = "student" | "teacher" | "parent" | "admin";

export type ModuleKey =
  | "nexus"
  | "seed"
  | "lumen"
  | "orion"
  | "atlas"
  | "pulse"
  | "haven";

export type ModuleAction = {
  label: string;
  description: string;
  path?: string;
};

export type ModuleCluster = {
  key: ModuleKey;
  name: string;
  subtitle: string;
  meaning: string;
  icon: string;
  roles: UserRole[];
  actions: ModuleAction[];
};

export const moduleClusters: ModuleCluster[] = [
  {
    key: "nexus",
    name: "Nexus Core",
    subtitle: "Trung tâm điều phối",
    meaning:
      "Nơi admin quan sát toàn bộ hệ thống, kiểm thử vai trò và điều phối các cụm chức năng.",
    icon: nexusIcon,
    roles: ["admin"],
    actions: [
      {
        label: "Tổng quan hệ thống",
        description:
          "Xem số lượng người dùng, trạng thái dữ liệu và các module chính.",
      },
      {
        label: "Xem như học sinh",
        description: "Mở giao diện học sinh để kiểm thử trải nghiệm.",
        path: "/student?from=admin",
      },
      {
        label: "Xem như giáo viên",
        description: "Mở giao diện giáo viên để kiểm thử góc nhìn lớp học.",
        path: "/teacher?from=admin",
      },
      {
        label: "Xem như phụ huynh",
        description: "Mở giao diện phụ huynh để kiểm thử phần theo dõi học sinh.",
        path: "/parent?from=admin",
      },
    ],
  },
  {
    key: "seed",
    name: "Seed Profile",
    subtitle: "Dữ liệu nền học sinh",
    meaning:
      "Nơi hình thành hồ sơ học tập: chương trình GDPT 2018, môn lựa chọn, bảng điểm 3 năm và GPA.",
    icon: seedIcon,
    roles: ["admin", "student"],
    actions: [
      {
        label: "Mở hồ sơ học tập",
        description:
          "Nhập thông tin học sinh, môn học lựa chọn và mục tiêu cá nhân.",
        path: "/student/profile",
      },
      {
        label: "Bảng điểm THPT",
        description: "Quản lý điểm lớp 10, 11, 12 theo học kì và hệ số.",
      },
      {
        label: "GPA học bạ",
        description: "Tính GPA từng học kì, từng năm và toàn bộ THPT.",
      },
    ],
  },
  {
    key: "lumen",
    name: "Lumen Intelligence",
    subtitle: "Ánh sáng nhận thức",
    meaning:
      "Phân tích trạng thái nhận thức, động lực, độ ổn định và khả năng tự định hướng của học sinh.",
    icon: lumenIcon,
    roles: ["admin", "student", "teacher", "parent"],
    actions: [
      {
        label: "Đánh giá nhận thức",
        description: "Tính SCI, MAS, CSL và Cognitive State Vector.",
      },
      {
        label: "Phân tích học tập",
        description:
          "Nhận diện điểm mạnh, điểm yếu, xu hướng tăng giảm của từng môn.",
      },
      {
        label: "Cảnh báo sớm",
        description:
          "Phát hiện học sinh có dấu hiệu mất động lực hoặc mất ổn định.",
      },
    ],
  },
  {
    key: "orion",
    name: "Orion Strategy",
    subtitle: "Định hướng tương lai",
    meaning:
      "Mô phỏng tương lai và đề xuất chiến lược học tập để học sinh đi đúng hướng.",
    icon: orionIcon,
    roles: ["admin", "student"],
    actions: [
      {
        label: "Mô phỏng tương lai",
        description:
          "Dự báo điểm nếu thay đổi giờ học, số đề luyện hoặc chiến lược.",
      },
      {
        label: "Tối ưu môn thi",
        description: "Tìm môn cần ưu tiên để tăng xác suất đạt mục tiêu.",
      },
      {
        label: "Chiến lược học",
        description: "Đề xuất kế hoạch học tập 7 ngày, 14 ngày hoặc 30 ngày.",
      },
    ],
  },
  {
    key: "atlas",
    name: "Atlas Admission",
    subtitle: "Bản đồ tuyển sinh",
    meaning:
      "Gợi ý ngành, trường, tổ hợp xét tuyển và chiến lược nguyện vọng dựa trên dữ liệu học sinh.",
    icon: atlasIcon,
    roles: ["admin", "student", "teacher", "parent"],
    actions: [
      {
        label: "Định hướng nghề",
        description:
          "Gợi ý ngành phù hợp với năng lực, động lực và mục tiêu cá nhân.",
      },
      {
        label: "Gợi ý trường",
        description: "Chia trường theo nhóm an toàn, vừa sức và bứt phá.",
      },
      {
        label: "Chiến lược nguyện vọng",
        description:
          "Sắp xếp nguyện vọng theo mức rủi ro và khả năng trúng tuyển.",
      },
    ],
  },
  {
    key: "pulse",
    name: "Pulse Monitor",
    subtitle: "Nhịp theo dõi tiến trình",
    meaning:
      "Theo dõi tiến độ học tập, báo cáo cá nhân, cảnh báo thay đổi và trợ lý AI đồng hành.",
    icon: pulseIcon,
    roles: ["admin", "student", "teacher", "parent"],
    actions: [
      {
        label: "Tiến trình học tập",
        description:
          "Theo dõi mức hoàn thành kế hoạch và tiến bộ theo thời gian.",
      },
      {
        label: "Trợ lý AI",
        description:
          "Hỗ trợ hỏi đáp, giải thích báo cáo và gợi ý bước tiếp theo.",
      },
      {
        label: "Báo cáo",
        description: "Tạo báo cáo cho học sinh, giáo viên và phụ huynh.",
      },
    ],
  },
  {
    key: "haven",
    name: "Haven Support",
    subtitle: "Hệ hỗ trợ và đồng hành",
    meaning:
      "Không gian dành cho giáo viên, phụ huynh, học bổng, tài chính và quản lý người dùng.",
    icon: havenIcon,
    roles: ["admin", "teacher", "parent"],
    actions: [
      {
        label: "Góc nhìn giáo viên",
        description:
          "Theo dõi lớp học, học sinh nguy cơ cao và báo cáo từng học sinh.",
        path: "/teacher",
      },
      {
        label: "Góc nhìn phụ huynh",
        description:
          "Theo dõi tiến độ của con và nhận khuyến nghị hỗ trợ tại nhà.",
        path: "/parent",
      },
      {
        label: "Học bổng và tài chính",
        description:
          "Gợi ý học bổng, chi phí học tập và mức phù hợp tài chính.",
      },
    ],
  },
];

export function getModulesByRole(role: UserRole) {
  return moduleClusters.filter((cluster) => cluster.roles.includes(role));
}