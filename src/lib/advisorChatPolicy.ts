/** Shared bounded/PII-minimising chat payload normalisation. No persistent history. */
export type AdvisorTurn = { role: "user" | "model"; text: string };
export function trimAdvisorText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
export function normaliseAdvisorHistory(value: unknown): AdvisorTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-8).flatMap((item): AdvisorTurn[] => {
    if (!item || typeof item !== "object" || !["user", "model"].includes(item.role)) return [];
    const text = trimAdvisorText(item.text, 900);
    return text ? [{ role: item.role as AdvisorTurn["role"], text }] : [];
  });
}
export function prepareAdvisorMessage(value: unknown): string {
  const message = trimAdvisorText(value, 1500);
  if (message.length < 2) throw new Error("Nhập câu hỏi từ 2 đến 1.500 ký tự.");
  return message;
}


/**
 * CLA's floating chatbot is an assistant for navigation and general website help.
 * Admission, scholarship and course-specific requirements are exclusively owned
 * by their evidence-backed modules. This deterministic gate is applied on both
 * browser and API; it does not call a language model or invent source facts.
 */
export type AdvisorRoute = { destination: "/atlas/vietnam" | "/atlas/joint" | "/atlas/study-abroad" | "/haven/scholarships"; label: string; answer: string };
export const ADVISOR_ALLOWED_DESTINATIONS = ["/atlas/vietnam", "/atlas/joint", "/atlas/study-abroad", "/haven/scholarships"] as const;

function normalisedForRouting(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function routeAdvisorQuestion(value: string): AdvisorRoute | null {
  const text = normalisedForRouting(value);
  // Scholarship questions take precedence over general study-abroad routes.
  if (/hoc bong|scholarship|tro cap|tai tro|mien hoc phi/.test(text)) return {
    destination: "/haven/scholarships", label: "Mở mục học bổng tại Haven",
    answer: "Thông tin học bổng và điều kiện từng chương trình nằm trong Haven Support. Hãy mở mục Học bổng để xem nguồn, hạn và checklist; trợ lý nổi không tự cung cấp thông tin tuyển chọn.",
  };
  if (/lien ket quoc te|chuong trinh lien ket|dao tao lien ket|hoc tai viet nam lien ket/.test(text)) return {
    destination: "/atlas/joint", label: "Mở chương trình liên kết tại Atlas",
    answer: "Các chương trình liên kết tuyển sinh tại Việt Nam nằm trong Atlas Admission. Hãy mở đúng mục chương trình để kiểm tra phương thức xét tuyển và thông báo từ trường.",
  };
  if (/du hoc|truong quoc te|nus\b|mit\b|harvard|educationusa|nhap hoc quoc te|visa du hoc|ielts|toefl|sat\b|act\b|jlpt|topik|eju|studienkolleg/.test(text)) return {
    destination: "/atlas/study-abroad", label: "Mở lộ trình du học",
    answer: "Atlas phụ trách tra cứu trường, ngành và điều kiện du học theo từng quốc gia. Học bổng và phân tích khả năng chi trả nằm ở Haven; trợ lý chỉ giúp mở đúng chức năng.",
  };
  if (/tuyen sinh|xet tuyen|ptit\b|hust\b|ftu\b|tdtu\b|hcmut\b|neu\b|ueh\b|hutech\b|bach khoa|ngoai thuong|diem chuan|diem trung tuyen|nguyen vong|to hop|ma nganh|ma truong|chi tieu|hoc ba|danh gia nang luc|hsa\b|tsa\b|chon nganh|chon truong|nganh nao|truong nao|tu van nganh|tu van truong|dai hoc nao|phuong thuc/.test(text)) return {
    destination: "/atlas/vietnam", label: "Mở Atlas tuyển sinh",
    answer: "Hãy mở Atlas Admission để tra cứu ngành, trường, phương thức, điểm chuẩn theo năm và liên kết chính thức. Trợ lý nổi không đưa số liệu tuyển sinh hay thay thế công cụ Atlas.",
  };
  return null;
}

export function safeAdvisorDestination(value: unknown): AdvisorRoute["destination"] | undefined {
  return typeof value === "string" && (ADVISOR_ALLOWED_DESTINATIONS as readonly string[]).includes(value)
    ? value as AdvisorRoute["destination"] : undefined;
}

/** Safe, non-personal page context for the assistant's thao tác-only guidance. */
export const ADVISOR_PAGE_CONTEXTS = {
  general: "Trang chung",
  "student-dashboard": "Dashboard học sinh",
  "student-profile": "Seed Profile · Hồ sơ học tập",
  "student-transcript": "Seed Profile · Bảng điểm THPT",
  "student-storage": "Seed Profile · Trạng thái dữ liệu",
  "student-modules": "Cognitive Path · Danh sách phân hệ",
  lumen: "Lumen Intelligence · Phân tích năng lực",
  atlas: "Atlas Admission · Tuyển sinh và ngành học",
  "study-abroad": "Atlas Admission · Du học toàn cầu",
  orion: "Orion Strategy · Kế hoạch học tập",
  pulse: "Pulse Monitor · Theo dõi tiến độ",
  haven: "Haven Support · Học bổng và tài chính",
  admin: "Nexus Console · Quản trị hệ thống",
  "admin-diagnostics": "Nexus Console · Chẩn đoán hệ thống",
  teacher: "Không gian giáo viên",
  parent: "Không gian phụ huynh",
} as const;

export type AdvisorPageContext = keyof typeof ADVISOR_PAGE_CONTEXTS;

export function safeAdvisorPageContext(value: unknown): AdvisorPageContext {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ADVISOR_PAGE_CONTEXTS, value)
    ? value as AdvisorPageContext
    : "general";
}

export function advisorPageContextFromPath(pathname: string): AdvisorPageContext {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/student/profile") return "student-profile";
  if (path === "/student/transcript") return "student-transcript";
  if (path === "/student/storage") return "student-storage";
  if (path === "/student/modules") return "student-modules";
  if (path === "/student") return "student-dashboard";
  if (path === "/admin/diagnostics") return "admin-diagnostics";
  if (path === "/admin") return "admin";
  if (path.startsWith("/atlas/study-abroad") || path === "/study-abroad" || path === "/haven/study-abroad") return "study-abroad";
  if (path.startsWith("/atlas")) return "atlas";
  if (path.startsWith("/lumen")) return "lumen";
  if (path.startsWith("/orion")) return "orion";
  if (path.startsWith("/pulse")) return "pulse";
  if (path.startsWith("/haven")) return "haven";
  if (path === "/teacher") return "teacher";
  if (path === "/parent") return "parent";
  return "general";
}

export function advisorSuggestionsFor(context: AdvisorPageContext): string[] {
  const suggestions: Record<AdvisorPageContext, string[]> = {
    general: ["Hướng dẫn sử dụng CLA", "Tìm một chức năng trong hệ thống", "Báo lỗi thao tác"],
    "student-dashboard": ["Tôi nên bắt đầu từ đâu?", "Làm sao hoàn thiện hồ sơ?", "Các phân hệ khác nhau thế nào?"],
    "student-profile": ["Cách cập nhật mục tiêu học tập?", "Làm sao lưu hồ sơ?", "Tại sao dữ liệu chưa đồng bộ?"],
    "student-transcript": ["Cách nhập điểm theo học kỳ?", "Sửa một điểm đã nhập thế nào?", "Vì sao điểm còn thiếu?"],
    "student-storage": ["Trạng thái đồng bộ có ý nghĩa gì?", "Khi nào cần thử đồng bộ lại?", "Báo lỗi lưu dữ liệu ở đâu?"],
    "student-modules": ["Mỗi phân hệ dùng để làm gì?", "Tìm chức năng bảng điểm ở đâu?", "Phân hệ nào chứa kế hoạch học tập?"],
    lumen: ["SCI, MAS và CSL là gì?", "Xem lịch sử đo ở đâu?", "Vì sao chưa có phân tích?"],
    atlas: ["Cách tìm ngành học trong Atlas?", "Lọc trường theo phương thức thế nào?", "Mở nguồn tuyển sinh chính thức ở đâu?"],
    "study-abroad": ["Bắt đầu tra cứu quốc gia thế nào?", "Xem checklist hồ sơ ở đâu?", "Chuyển sang mục học bổng thế nào?"],
    orion: ["Cách tạo kế hoạch học tập?", "Ba kịch bản khác nhau thế nào?", "Xem lộ trình theo tuần ở đâu?"],
    pulse: ["Đọc báo cáo tiến độ thế nào?", "Vì sao chưa có dữ liệu tăng trưởng?", "Tìm việc cần làm tiếp theo ở đâu?"],
    haven: ["Cách dùng công cụ ngân sách?", "Tìm checklist học bổng ở đâu?", "Vì sao chi phí đang để trống?"],
    admin: ["Tìm công cụ kiểm tra hệ thống ở đâu?", "Phân biệt Admin và Student thế nào?", "Xem trạng thái kiểm thử ở đâu?"],
    "admin-diagnostics": ["Ý nghĩa PASS và NOT TESTED?", "Xem lỗi chẩn đoán thế nào?", "Làm sao quay lại Nexus Console?"],
    teacher: ["Xem báo cáo được chia sẻ thế nào?", "Quản lý liên kết học sinh ở đâu?", "Báo lỗi quyền truy cập thế nào?"],
    parent: ["Xem báo cáo được chia sẻ thế nào?", "Quản lý liên kết phụ huynh ở đâu?", "Báo lỗi quyền truy cập thế nào?"],
  };
  return suggestions[context];
}
