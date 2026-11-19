/**
 * CP25/V6: Role-specific navigation; student and admin catalogs are separate.
 * A link is provided only when the corresponding page/section exists.
 * This registry is navigation metadata, NOT evidence that a feature is validated.
 */
import type { ModuleKey } from "./moduleClusters";

export type SubmoduleStatus = "available" | "partial" | "planned";

export type ModuleSubmodule = {
  id: string;
  title: string;
  description: string;
  group: string;
  href?: string;
  status: SubmoduleStatus;
};

export type ModuleSubmoduleDirectory = {
  title: string;
  description: string;
  submodules: ModuleSubmodule[];
};

/** Admin/Research directory, never the student navigation source. */
export const moduleSubmoduleDirectory: Record<ModuleKey, ModuleSubmoduleDirectory> = {
  nexus: {
    title: "Nexus · Điều phối & quản trị",
    description: "Các khu vực điều hành và kiểm tra độc lập; quyền dữ liệu vẫn do backend/Firestore Rules quyết định.",
    submodules: [
      { id: "console", title: "Bảng điều khiển", description: "Điều hướng và tình trạng các module hệ thống.", group: "Vận hành", href: "/admin", status: "partial" },
      { id: "diagnostics", title: "Chẩn đoán hệ thống", description: "Kiểm tra dữ liệu, nguồn và trạng thái kỹ thuật theo quyền.", group: "Kiểm thử", href: "/admin/diagnostics", status: "partial" },
      { id: "role-preview", title: "Kiểm thử vai trò", description: "Mở các góc nhìn trong chế độ kiểm thử, không cấp quyền đọc hồ sơ người khác.", group: "Kiểm thử", href: "/admin#nexus-role-preview", status: "partial" },
      { id: "user-audit", title: "Quản lý tài khoản", description: "Chỉ triển khai qua backend đặc quyền có nhật ký kiểm toán.", group: "Quản trị", status: "planned" },
    ],
  },
  seed: {
    title: "Seed · Hồ sơ & dữ liệu nền",
    description: "Dữ liệu học sinh được nhập, tính toán và lưu ở đây; các module khác sử dụng kết quả đã đồng bộ.",
    submodules: [
      { id: "overview", title: "Tổng quan học sinh", description: "Hồ sơ, mức độ đầy đủ và việc cần làm tiếp theo.", group: "Hồ sơ", href: "/student", status: "available" },
      { id: "profile", title: "Hồ sơ & mục tiêu", description: "Thông tin học tập, mục tiêu, bốn môn lựa chọn và dữ liệu đầu vào.", group: "Hồ sơ", href: "/student/profile", status: "available" },
      { id: "transcript", title: "Bảng điểm & GPA", description: "Điểm theo năm/học kỳ và kết quả học bạ, không tự điền điểm thiếu.", group: "Học lực", href: "/student/transcript", status: "partial" },
      { id: "storage", title: "Kho dữ liệu & đồng bộ", description: "Kiểm tra trạng thái lưu trữ Firestore và lịch sử dữ liệu.", group: "Dữ liệu", href: "/student/storage", status: "partial" },
    ],
  },
  lumen: {
    title: "Lumen · Hiểu năng lực học tập",
    description: "Tách các chỉ số nhận thức thử nghiệm, diễn giải và lịch sử đo; không gọi là chẩn đoán tâm lý.",
    submodules: [
      { id: "indices", title: "Chỉ số SCI / MAS / CSL", description: "Xem các chỉ số thử nghiệm và giới hạn của phép tính.", group: "Đánh giá", href: "/lumen#lumen-indices", status: "partial" },
      { id: "growth", title: "Lịch sử & biến động", description: "So sánh phép đo theo thời gian khi có dữ liệu hợp lệ.", group: "Theo dõi", href: "/lumen#lumen-growth", status: "partial" },
      { id: "insight", title: "Phân tích & giải thích", description: "Yếu tố đóng góp, bằng chứng và gợi ý theo dữ liệu.", group: "Phân tích", href: "/lumen#lumen-insights", status: "partial" },
      { id: "assistant", title: "Diễn giải Gemini", description: "AI giải thích từ context có cấu trúc; không tự tính điểm hay xác suất.", group: "Phân tích", href: "/lumen#lumen-gemini", status: "partial" },
      { id: "ml-readiness", title: "Sẵn sàng dữ liệu ML (Research)", description: "Kiểm tra nhãn outcome, consent, missingness và leakage trước khi train.", group: "Nghiên cứu", href: "/admin/diagnostics?view=ml", status: "partial" },
    ],
  },
  atlas: {
    title: "Atlas · Bản đồ tuyển sinh & du học",
    description: "Tất cả nội dung trường/ngành/chứng chỉ xét tuyển thuộc Atlas; học bổng và ngân sách thuộc Haven.",
    submodules: [
      { id: "vietnam", title: "Tuyển sinh Việt Nam", description: "Ngành, trường, phương thức và điểm chuẩn 2024–2026 theo nguồn; độ phủ dữ liệu vẫn cần mở rộng.", group: "Trong nước", href: "/atlas#atlas-official-admissions", status: "partial" },
      { id: "abroad", title: "Du học toàn cầu", description: "Chọn quốc gia/vùng lãnh thổ, đối chiếu trường, ngành và điều kiện khi có nguồn.", group: "Quốc tế", href: "/atlas/study-abroad", status: "partial" },
      { id: "joint", title: "Liên kết quốc tế tại Việt Nam", description: "Chương trình do trường tại Việt Nam tiếp nhận hồ sơ, không trộn với du học trực tiếp.", group: "Trong nước", href: "/atlas#atlas-joint-programs", status: "partial" },
      { id: "fit", title: "Gợi ý ngành & trường", description: "Phân tích mức phù hợp theo hồ sơ và dữ liệu có nguồn; không bịa xác suất đậu.", group: "Cá nhân hóa", href: "/atlas#atlas-engine", status: "partial" },
      { id: "sources", title: "Kiểm toán Knowledge Base (Admin)", description: "Tra chứng cứ, năm áp dụng, ngày cập nhật và các bản nháp cần kiểm chứng.", group: "Dữ liệu", href: "/atlas#atlas-programs", status: "partial" },
      { id: "reader", title: "Nhập / kiểm tra đề án (Admin)", description: "Hỗ trợ nhập và kiểm tra thông tin từ nguồn tuyển sinh.", group: "Dữ liệu", href: "/atlas#atlas-gemini-reader", status: "partial" },
    ],
  },
  orion: {
    title: "Orion · Lập chiến lược & can thiệp",
    description: "Kịch bản học tập và kế hoạch hành động dựa trên hồ sơ; dự báo không phải tác động nhân quả.",
    submodules: [
      { id: "input", title: "Dữ liệu & mục tiêu", description: "Điểm, ngành mục tiêu, thời gian và các giả định mô phỏng.", group: "Lập kế hoạch", href: "/orion#orion-input", status: "partial" },
      { id: "scenario", title: "Mô phỏng 3 chiến lược", description: "So sánh cân bằng, tập trung và bứt phá.", group: "Mô phỏng", href: "/orion#orion-scenarios", status: "partial" },
      { id: "roadmap", title: "Lộ trình theo tuần", description: "Mốc học tập và gợi ý hành động có thời hạn.", group: "Hành động", href: "/orion#orion-roadmap", status: "partial" },
      { id: "checkin", title: "Check-in & thích ứng", description: "Theo dõi hành động, outcome và điều chỉnh kế hoạch qua lần đo mới.", group: "Hành động", status: "planned" },
    ],
  },
  pulse: {
    title: "Pulse · Theo dõi & báo cáo",
    description: "Tách tiến độ hiện tại, báo cáo và bằng chứng theo thời gian; không báo tăng trưởng từ dữ liệu thiếu.",
    submodules: [
      { id: "pipeline", title: "Audit dữ liệu liên thông (Admin)", description: "Đối chiếu dữ liệu Seed–Lumen–Orion–Pulse và Evidence Record.", group: "Nguồn dữ liệu", href: "/pulse#pulse-pipeline", status: "partial" },
      { id: "overview", title: "Chỉ số & tiến độ", description: "Tổng quan theo dữ liệu hợp lệ, có thông báo khi chưa đủ.", group: "Theo dõi", href: "/pulse#pulse-risk", status: "partial" },
      { id: "reports", title: "Kiểm thử báo cáo cá nhân", description: "Tóm tắt tiến độ và hành động tiếp theo của hồ sơ học sinh.", group: "Báo cáo", href: "/pulse#pulse-report", status: "partial" },
      { id: "next", title: "Việc cần làm tiếp theo", description: "Danh sách hành động khuyến nghị và các giới hạn.", group: "Hành động", href: "/pulse#pulse-actions", status: "partial" },
    ],
  },
  haven: {
    title: "Haven · Học bổng & tài chính",
    description: "Tách điều kiện học bổng, ngân sách và hỗ trợ. Không sao chép các trang tra trường/du học của Atlas.",
    submodules: [
      { id: "scholarships", title: "Học bổng & điều kiện", description: "Nguồn cấp, điều kiện, chứng chỉ cần bổ sung và thời hạn khi được xác minh.", group: "Học bổng", href: "/haven#haven-scholarships", status: "partial" },
      { id: "finance", title: "Ngân sách & chi phí", description: "Tính khả năng chi trả theo các khoản học phí, sinh hoạt và ngân sách nhập vào.", group: "Tài chính", href: "/haven#haven-financial", status: "partial" },
      { id: "family", title: "Kế hoạch hỗ trợ cá nhân", description: "Gợi ý học bổng, tài chính và hành động cho học sinh.", group: "Đồng hành", href: "/haven#haven-support-roles", status: "partial" },
      { id: "plan", title: "Kế hoạch hỗ trợ", description: "Tổng hợp những hành động có thể thực hiện tiếp theo.", group: "Đồng hành", href: "/haven#haven-support-plan", status: "partial" },
      { id: "opportunity", title: "Khoảng cách cơ hội", description: "Đối chiếu thiếu hụt về chi phí và điều kiện khi có nguồn dữ liệu.", group: "Tài chính", status: "planned" },
    ],
  },
};

export function getSubmodules(key: ModuleKey): ModuleSubmodule[] {
  return moduleSubmoduleDirectory[key].submodules;
}

/**
 * Student-only menu: independently curated from admin/Research tasks.
 * It does not grant permissions; AccessGate, backend endpoints and Firestore
 * must enforce actual authorization. A hidden admin task must not be
 * presented as a student workflow or reached by student-specific links.
 */
export type StudentModuleKey = Exclude<ModuleKey, "nexus">;
export const studentSubmoduleDirectory: Record<StudentModuleKey, ModuleSubmoduleDirectory> = {
  seed: {
    title: "Seed · Hồ sơ học sinh",
    description: "Nhập và xem hồ sơ của chính bạn, điểm học tập, mục tiêu và lịch sử lưu dữ liệu.",
    submodules: [
      { id: "overview", title: "Tổng quan của tôi", description: "Xem thông tin học sinh và các việc cần hoàn thiện.", group: "Hồ sơ", href: "/student", status: "available" },
      { id: "profile", title: "Hồ sơ & mục tiêu", description: "Cập nhật học tập, mục tiêu và bốn môn lựa chọn.", group: "Hồ sơ", href: "/student/profile", status: "available" },
      { id: "transcript", title: "Bảng điểm & GPA", description: "Xem và nhập điểm các năm học, không mặc định điểm thiếu là 0.", group: "Học lực", href: "/student/transcript", status: "partial" },
      { id: "exams", title: "Lịch thi", description: "Mốc thi và đếm ngược do bạn chọn.", group: "Học lực", href: "/student/exams", status: "available" },
      { id: "storage", title: "Dữ liệu của tôi", description: "Xem trạng thái lưu và đồng bộ hồ sơ của chính bạn.", group: "Cá nhân", href: "/student/storage", status: "partial" },
    ],
  },
  lumen: {
    title: "Lumen · Phân tích học tập",
    description: "Xem chỉ số học tập, lịch sử thay đổi và phần giải thích kết quả.",
    submodules: [
      { id: "indices", title: "Chỉ số SCI / MAS / CSL", description: "Xem chỉ số thử nghiệm và giới hạn diễn giải.", group: "Đánh giá", href: "/lumen/indices", status: "partial" },
      { id: "state", title: "Hồ sơ động", description: "Học lực, hành vi và mục tiêu đã lưu.", group: "Đánh giá", href: "/lumen/state", status: "partial" },
      { id: "growth", title: "Biến động của tôi", description: "Theo dõi thay đổi khi đã có nhiều lần đo hợp lệ.", group: "Tiến độ", href: "/lumen/history", status: "partial" },
      { id: "insight", title: "Điểm mạnh & cần cải thiện", description: "Xem yếu tố đóng góp và các gợi ý theo hồ sơ.", group: "Phân tích", href: "/lumen/insights", status: "partial" },
      { id: "advanced", title: "Dự báo & nâng cao", description: "Kết quả mô hình quy tắc thử nghiệm và giới hạn.", group: "Phân tích", href: "/lumen/advanced", status: "partial" },
      { id: "roadmap", title: "Lộ trình thích ứng", description: "Các mốc rà soát liên module.", group: "Hành động", href: "/lumen/roadmap", status: "partial" },
      { id: "evidence", title: "Căn cứ & đánh giá lại", description: "Theo dõi chu kỳ, phương pháp và giới hạn bằng chứng.", group: "Giải thích", href: "/lumen/evidence", status: "partial" },
      { id: "assistant", title: "Giải thích kết quả bằng AI", description: "Giải thích chỉ số từ dữ liệu có căn cứ, không tự tính xác suất.", group: "Giải thích", href: "/lumen/assistant", status: "partial" },
    ],
  },
  atlas: {
    title: "Atlas · Ngành, trường & du học",
    description: "Tra cứu tuyển sinh trong nước, quốc tế và gợi ý theo hồ sơ cá nhân.",
    submodules: [
      { id: "vietnam", title: "Tuyển sinh Việt Nam", description: "Ngành, trường, phương thức và điểm chuẩn theo năm và nguồn chính thức.", group: "Trong nước", href: "/atlas/vietnam", status: "partial" },
      { id: "abroad", title: "Du học toàn cầu", description: "Tra cứu quốc gia, chương trình và điều kiện khi có nguồn xác minh.", group: "Quốc tế", href: "/atlas/study-abroad", status: "partial" },
      { id: "joint", title: "Liên kết quốc tế tại Việt Nam", description: "Chương trình quốc tế có đơn vị tuyển sinh tại Việt Nam.", group: "Trong nước", href: "/atlas/joint", status: "partial" },
      { id: "fit", title: "Gợi ý ngành & trường", description: "Đối chiếu hồ sơ với tiêu chí; chỉ số phù hợp không phải xác suất đậu.", group: "Cá nhân hóa", href: "/atlas/recommendations", status: "partial" },
      { id: "subjects", title: "Môn thi & nguyện vọng", description: "Đối chiếu tổ hợp và lưu nguyện vọng.", group: "Cá nhân hóa", href: "/atlas/subjects", status: "partial" },
      { id: "compare", title: "So sánh điểm chuẩn", description: "So sánh các trường, ngành và phương thức theo năm.", group: "Tra cứu", href: "/atlas/compare", status: "partial" },
      { id: "sources", title: "Nguồn tuyển sinh chính thức", description: "Xem cổng tuyển sinh, đề án và mức độ chuẩn hóa nguồn theo từng năm.", group: "Tra cứu", href: "/atlas/sources", status: "partial" },
    ],
  },
  orion: {
    title: "Orion · Kế hoạch của tôi",
    description: "Lập và mô phỏng chiến lược học tập dựa trên dữ liệu cá nhân.",
    submodules: [
      { id: "input", title: "Mục tiêu học tập", description: "Xác định điểm, thời gian và mục tiêu cá nhân.", group: "Lập kế hoạch", href: "/orion/inputs", status: "partial" },
      { id: "scenario", title: "Thử 3 chiến lược", description: "So sánh cân bằng, tập trung và bứt phá theo giả định.", group: "Mô phỏng", href: "/orion/scenarios", status: "partial" },
      { id: "roadmap", title: "Lộ trình theo tuần", description: "Xem các mốc và hành động cần thực hiện.", group: "Kế hoạch", href: "/orion/roadmap", status: "partial" },
      { id: "checkin", title: "Nhật ký thực hiện (Pulse)", description: "Ghi nhận nhiệm vụ và đánh giá lại tại Pulse.", group: "Hành động", href: "/pulse/checkin", status: "partial" },
    ],
  },
  pulse: {
    title: "Pulse · Theo dõi cá nhân",
    description: "Theo dõi tiến độ và báo cáo của chính bạn; kiểm toán dữ liệu là công việc của Admin.",
    submodules: [
      { id: "overview", title: "Tiến độ học tập", description: "Theo dõi trạng thái hiện tại từ dữ liệu hợp lệ.", group: "Theo dõi", href: "/pulse/progress", status: "partial" },
      { id: "inputs", title: "Dữ liệu báo cáo", description: "Cập nhật các chỉ số báo cáo đã lưu.", group: "Theo dõi", href: "/pulse/inputs", status: "partial" },
      { id: "checkin", title: "Nhật ký & đánh giá lại", description: "Ghi hành động và kết quả theo chu kỳ.", group: "Theo dõi", href: "/pulse/checkin", status: "partial" },
      { id: "reports", title: "Báo cáo của tôi", description: "Xem bản tóm tắt dành cho học sinh.", group: "Báo cáo", href: "/pulse/reports", status: "partial" },
      { id: "next", title: "Việc cần làm tiếp theo", description: "Các hành động học tập được ưu tiên và giới hạn kết quả.", group: "Hành động", href: "/pulse/actions", status: "partial" },
    ],
  },
  haven: {
    title: "Haven · Học bổng & tài chính cá nhân",
    description: "Tìm học bổng, xem chi phí và phương án chuẩn bị của học sinh.",
    submodules: [
      { id: "scholarships", title: "Học bổng phù hợp", description: "Xem yêu cầu, chứng chỉ còn thiếu và nguồn học bổng khi được xác minh.", group: "Học bổng", href: "/haven/scholarships", status: "partial" },
      { id: "finance", title: "Chi phí & ngân sách", description: "Ước tính học phí, sinh hoạt và khả năng chi trả từ dữ liệu nhập.", group: "Tài chính", href: "/haven/finance", status: "partial" },
      { id: "plan", title: "Kế hoạch hỗ trợ của tôi", description: "Những hành động có thể thực hiện để chuẩn bị tài chính.", group: "Kế hoạch", href: "/haven/plan", status: "partial" },
      { id: "opportunity", title: "Điều kiện còn thiếu", description: "Đối chiếu điều kiện học bổng và khoảng cách tài chính có nguồn.", group: "Cơ hội", status: "planned" },
    ],
  },
};

export function getStudentSubmodules(key: StudentModuleKey): ModuleSubmodule[] {
  return studentSubmoduleDirectory[key].submodules;
}
