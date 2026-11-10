/**
 * Nexus Console navigation (Admin only). Unlike moduleSubmoduleDirectory, this
 * catalog never links to student/teacher/parent business screens.
 * An available link only means a read-only diagnostic page exists; it is not
 * evidence of a PASS on production or a validated scientific result.
 */
import type { ModuleKey } from "./moduleClusters";

export type AdminTask = {
  id: string;
  title: string;
  description: string;
  group: string;
  href?: `/admin/diagnostics?view=${string}`;
  status: "limited" | "planned";
};

export type AdminTaskGroup = {
  title: string;
  description: string;
  tasks: AdminTask[];
};

export const adminConsoleDirectory: Record<ModuleKey, AdminTaskGroup> = {
  nexus: {
    title: "Nexus · Quản trị hệ thống",
    description: "Giám sát, phân quyền và kiểm tra hạ tầng. Không hiển thị chức năng học sinh tại đây.",
    tasks: [
      { id: "health", title: "Tình trạng API & Firestore", description: "Chạy kiểm tra kết nối trực tiếp; dịch vụ chưa kiểm tra vẫn hiện NOT TESTED.", group: "Vận hành", href: "/admin/diagnostics?view=health", status: "limited" },
      { id: "roles", title: "Kiểm tra quyền vai trò", description: "Kiểm tra role Admin của tài khoản hiện tại; không impersonate hoặc truy cập dữ liệu người khác.", group: "Bảo mật", href: "/admin/diagnostics?view=roles", status: "limited" },
      { id: "accounts", title: "Quản trị người dùng", description: "Yêu cầu API đặc quyền, MFA và nhật ký thay đổi role/active; chưa triển khai.", group: "Phân quyền", status: "planned" },
      { id: "release", title: "Giám sát phát hành", description: "Tổng hợp CI, deploy, backup và rollback khi có log sản xuất.", group: "Vận hành", status: "planned" },
    ],
  },
  seed: {
    title: "Seed · Kiểm toán dữ liệu nền",
    description: "Quản trị cấu trúc hồ sơ, dữ liệu demo, tính hợp lệ và quyền sở hữu; không chỉnh hồ sơ học sinh từ Console.",
    tasks: [
      { id: "seed-audit", title: "Kiểm toán hồ sơ Admin Demo", description: "Kiểm tra dữ liệu của UID Admin, schema, 9 môn, khóa 4 môn và dữ liệu thiếu.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=seed", status: "limited" },
      { id: "seed-rules", title: "Kiểm định quyền dữ liệu", description: "Ma trận allow/deny phải chạy bằng Firebase Emulator và được lưu bằng chứng.", group: "Bảo mật", status: "planned" },
      { id: "seed-migration", title: "Kiểm soát phiên bản dữ liệu", description: "Theo dõi migration và bản ghi lỗi, không sửa dữ liệu thô tự động.", group: "Quản trị", status: "planned" },
    ],
  },
  lumen: {
    title: "Lumen · Kiểm thử các engine",
    description: "Kiểm tra kỹ thuật công thức và độ sẵn sàng của pipeline; SCI/MAS/CSL hiện là chỉ số thử nghiệm.",
    tasks: [
      { id: "cognitive", title: "Kiểm tra Cognitive Engine", description: "Golden case và snapshot của hồ sơ demo; không phải kiểm định tâm trắc.", group: "Động cơ", href: "/admin/diagnostics?view=cognitive", status: "limited" },
      { id: "ml", title: "Kiểm toán dữ liệu ML", description: "Missingness, outcome, consent và điều kiện chia tập; không xuất thông tin cá nhân.", group: "Nghiên cứu", href: "/admin/diagnostics?view=ml", status: "limited" },
      { id: "model-eval", title: "Đánh giá mô hình dự báo", description: "Baseline, holdout, calibration, bias và sai số theo phiên bản.", group: "Nghiên cứu", status: "planned" },
    ],
  },
  atlas: {
    title: "Atlas · Quản trị dữ liệu tuyển sinh",
    description: "Kiểm toán nguồn, năm áp dụng, hiệu lực và độ phủ của dữ liệu Việt Nam/du học.",
    tasks: [
      { id: "atlas-data", title: "Kiểm tra kho dữ liệu Atlas", description: "Đọc tình trạng workspace của UID Admin và cảnh báo chưa xác minh nguồn.", group: "Nguồn dữ liệu", href: "/admin/diagnostics?view=atlas", status: "limited" },
      { id: "atlas-approve", title: "Duyệt đề án và nguồn chính thức", description: "Quy trình nhập, phê duyệt và version hóa từng nguồn theo năm.", group: "Biên tập dữ liệu", status: "planned" },
      { id: "atlas-fresh", title: "Giám sát dữ liệu hết hiệu lực", description: "Kiểm tra độ phủ tuyển sinh ba năm và chính sách thay đổi theo mùa.", group: "Chất lượng dữ liệu", status: "planned" },
    ],
  },
  orion: {
    title: "Orion · Kiểm toán chiến lược",
    description: "Kiểm tra phiên bản chính sách và việc ghi nhận can thiệp, không lập kế hoạch học thay học sinh.",
    tasks: [
      { id: "orion-audit", title: "Kiểm tra dữ liệu Orion", description: "Đọc trạng thái bản nháp của UID Admin và các giới hạn đánh giá.", group: "Kiểm thử", href: "/admin/diagnostics?view=orion", status: "limited" },
      { id: "orion-policy", title: "Kiểm định adaptation policy", description: "Trigger, dose, stop rule, nhận xét người giám sát và version.", group: "Nghiên cứu", status: "planned" },
      { id: "orion-scenarios", title: "Kiểm thử kịch bản", description: "Golden cases và so sánh dự báo-với-kết quả quan sát khi dữ liệu đủ.", group: "Nghiên cứu", status: "planned" },
    ],
  },
  pulse: {
    title: "Pulse · Kiểm toán kết quả",
    description: "Giám sát dữ liệu theo thời gian, bằng chứng outcome và báo cáo theo quyền.",
    tasks: [
      { id: "pulse-audit", title: "Kiểm tra dữ liệu Pulse", description: "Đọc trạng thái bản nháp demo và cảnh báo khi chưa có lần đo lặp.", group: "Kiểm thử", href: "/admin/diagnostics?view=pulse", status: "limited" },
      { id: "pulse-evidence", title: "Đối chiếu Evidence Record", description: "Snapshot, version, confidence, giới hạn và provenance.", group: "Nghiên cứu", status: "planned" },
      { id: "pulse-trends", title: "Kiểm tra sai số và xu hướng", description: "Không gắn nhãn cải thiện nếu thiếu outcome T0/T1/T2.", group: "Chất lượng dữ liệu", status: "planned" },
    ],
  },
  haven: {
    title: "Haven · Quản trị nguồn học bổng",
    description: "Quản lý chất lượng thông tin học bổng, chi phí và cảnh báo hết hạn; du học nằm ở Atlas.",
    tasks: [
      { id: "haven-audit", title: "Kiểm tra dữ liệu Haven", description: "Đọc trạng thái dữ liệu demo, phân biệt ngân sách thiếu và số 0.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=haven", status: "limited" },
      { id: "haven-sources", title: "Duyệt nguồn học bổng", description: "Duyệt officialUrl, deadline, chứng chỉ và tiêu chí đủ điều kiện.", group: "Biên tập dữ liệu", status: "planned" },
      { id: "haven-finance", title: "Kiểm toán giả định tài chính", description: "Ghi nguồn học phí, tỷ giá và ngày hiệu lực thay vì giả định không nguồn.", group: "Chất lượng dữ liệu", status: "planned" },
    ],
  },
};
