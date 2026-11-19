/**
 * Nexus Console navigation (Admin only). Unlike moduleSubmoduleDirectory, this
 * catalog never links to student business screens.
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
      { id: "accounts", title: "Quản trị người dùng", description: "Backend tùy chọn có operator, MFA và audit; mặc định tắt, chưa triển khai production.", group: "Phân quyền", href: "/admin/diagnostics?view=accounts", status: "limited" },
      { id: "release", title: "Giám sát phát hành", description: "Nhập báo cáo JSON, đối chiếu fingerprint và metadata CI/deploy/backup/rollback; nguồn tự khai chưa đủ nghiệm thu production.", group: "Vận hành", href: "/admin/diagnostics?view=release", status: "limited" },
    ],
  },
  seed: {
    title: "Seed · Kiểm toán dữ liệu nền",
    description: "Quản trị cấu trúc hồ sơ, dữ liệu demo, tính hợp lệ và quyền sở hữu; không chỉnh hồ sơ học sinh từ Console.",
    tasks: [
      { id: "seed-audit", title: "Kiểm toán hồ sơ Admin Demo", description: "Kiểm tra dữ liệu của UID Admin, schema, 9 môn, khóa 4 môn và dữ liệu thiếu.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=seed", status: "limited" },
      { id: "seed-rules", title: "Kiểm định quyền dữ liệu", description: "Đối chiếu gate JSON và checksum Rules candidate; ma trận allow/deny cần log Emulator và reviewer độc lập.", group: "Bảo mật", href: "/admin/diagnostics?view=seed-rules", status: "limited" },
      { id: "seed-migration", title: "Kiểm soát phiên bản dữ liệu", description: "Chạy đối chiếu schema/UID/legacy trên dữ liệu Admin Demo đang lưu; không tự migration hoặc ghi đè.", group: "Quản trị", href: "/admin/diagnostics?view=seed-migration", status: "limited" },
    ],
  },
  lumen: {
    title: "Lumen · Kiểm thử các engine",
    description: "Kiểm tra kỹ thuật công thức và độ sẵn sàng của pipeline; SCI/MAS/CSL hiện là chỉ số thử nghiệm.",
    tasks: [
      { id: "cognitive", title: "Kiểm tra Cognitive Engine", description: "Golden case và snapshot của hồ sơ demo; không phải kiểm định tâm trắc.", group: "Động cơ", href: "/admin/diagnostics?view=cognitive", status: "limited" },
      { id: "ml", title: "Kiểm toán dữ liệu ML", description: "Missingness, outcome, consent và điều kiện chia tập; không xuất thông tin cá nhân.", group: "Nghiên cứu", href: "/admin/diagnostics?view=ml", status: "limited" },
      { id: "model-eval", title: "Đánh giá mô hình dự báo", description: "Kiểm tra báo cáo aggregate OULAD, split, ROC-AUC/Brier, bootstrap CI; không chứng minh hiệu quả tại THPT Việt Nam.", group: "Nghiên cứu", href: "/admin/diagnostics?view=model-eval", status: "limited" },
    ],
  },
  atlas: {
    title: "Atlas · Quản trị dữ liệu tuyển sinh",
    description: "Kiểm toán nguồn, năm áp dụng, hiệu lực và độ phủ của dữ liệu Việt Nam/du học.",
    tasks: [
      { id: "atlas-data", title: "Kiểm tra kho dữ liệu Atlas", description: "Đọc tình trạng workspace của UID Admin và cảnh báo chưa xác minh nguồn.", group: "Nguồn dữ liệu", href: "/admin/diagnostics?view=atlas", status: "limited" },
      { id: "atlas-approve", title: "Duyệt đề án và nguồn chính thức", description: "Đối chiếu JSON quyết định theo năm, URL, fingerprint và phân tách người rà soát/duyệt; không phê duyệt nguồn production.", group: "Biên tập dữ liệu", href: "/admin/diagnostics?view=atlas-approve", status: "limited" },
      { id: "atlas-fresh", title: "Giám sát dữ liệu hết hiệu lực", description: "Kiểm tra coverage 2024–2026, URL HTTPS và các năm archive-only trong registry đóng gói; không xác minh URL live.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=atlas-fresh", status: "limited" },
    ],
  },
  orion: {
    title: "Orion · Kiểm toán chiến lược",
    description: "Kiểm tra phiên bản chính sách và việc ghi nhận can thiệp, không lập kế hoạch học thay học sinh.",
    tasks: [
      { id: "orion-audit", title: "Kiểm tra dữ liệu Orion", description: "Đọc trạng thái bản nháp của UID Admin và các giới hạn đánh giá.", group: "Kiểm thử", href: "/admin/diagnostics?view=orion", status: "limited" },
      { id: "orion-policy", title: "Kiểm định adaptation policy", description: "Kiểm tra policy shadow: trigger, dose, stop rule, human review và phiên bản; không bật can thiệp.", group: "Nghiên cứu", href: "/admin/diagnostics?view=orion-policy", status: "limited" },
      { id: "orion-scenarios", title: "Kiểm thử kịch bản", description: "Kiểm toán replay mô phỏng có version, baseline, horizon và điều kiện so sánh; không tạo kết luận nhân quả.", group: "Nghiên cứu", href: "/admin/diagnostics?view=orion-scenarios", status: "limited" },
    ],
  },
  pulse: {
    title: "Pulse · Kiểm toán kết quả",
    description: "Giám sát dữ liệu theo thời gian, bằng chứng outcome và báo cáo theo quyền.",
    tasks: [
      { id: "pulse-audit", title: "Kiểm tra dữ liệu Pulse", description: "Đọc trạng thái bản nháp demo và cảnh báo khi chưa có lần đo lặp.", group: "Kiểm thử", href: "/admin/diagnostics?view=pulse", status: "limited" },
      { id: "pulse-evidence", title: "Đối chiếu Evidence Record", description: "Đối chiếu JSON Evidence Record: snapshot, engine/model version, nguồn và giới hạn; chưa chứng minh bất biến.", group: "Nghiên cứu", href: "/admin/diagnostics?view=pulse-evidence", status: "limited" },
      { id: "pulse-trends", title: "Kiểm tra sai số và xu hướng", description: "Kiểm tra T0/T1/T2 cùng thang đo và mốc thời gian; không khẳng định tiến bộ nhân quả.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=pulse-trends", status: "limited" },
    ],
  },
  haven: {
    title: "Haven · Quản trị nguồn học bổng",
    description: "Quản lý chất lượng thông tin học bổng, chi phí và cảnh báo hết hạn; du học nằm ở Atlas.",
    tasks: [
      { id: "haven-audit", title: "Kiểm tra dữ liệu Haven", description: "Đọc trạng thái dữ liệu demo, phân biệt ngân sách thiếu và số 0.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=haven", status: "limited" },
      { id: "haven-sources", title: "Duyệt nguồn học bổng", description: "Kiểm tra metadata nguồn, điều kiện và ngày review học bổng; chưa xác minh deadline hoặc phê duyệt nguồn live.", group: "Biên tập dữ liệu", href: "/admin/diagnostics?view=haven-sources", status: "limited" },
      { id: "haven-finance", title: "Kiểm toán giả định tài chính", description: "Kiểm tra nguồn học phí, tỷ giá, đơn vị tiền và giả định chi phí; không xác minh giá hiện hành.", group: "Chất lượng dữ liệu", href: "/admin/diagnostics?view=haven-finance", status: "limited" },
    ],
  },
};
