/**
 * P1 source register of named, undergraduate-oriented scholarship opportunities.
 * Each record is a sourced entry point, NOT an eligibility finding, open-call
 * confirmation or award probability. Deadline dates are deliberately omitted
 * unless an official country-/intake-specific notice has been verified.
 */
export type ScholarshipRecord = {
  id: string;
  name: string;
  provider: string;
  countryCode: "SG" | "JP" | "KR" | "AU";
  country: string;
  level: "Cử nhân";
  sourceUrl: string;
  sourceLabel: string;
  reviewedDate: "2026-11-11";
  intakeNote: string;
  applicationPath: string;
  focus: string;
  conditions: string[];
  documentChecks: string[];
  credentialNote: string;
  benefitNote: string;
  availability: "check-cycle" | "archive-cycle";
};

export const officialScholarships: ScholarshipRecord[] = [
  {
    id: "nus-asean", name: "ASEAN Undergraduate Scholarship", provider: "National University of Singapore (NUS)",
    countryCode: "SG", country: "Singapore", level: "Cử nhân",
    sourceUrl: "https://www.nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students/asean-undergraduate-scholarship",
    sourceLabel: "NUS · Scholarships for Freshmen",
    reviewedDate: "2026-11-11", intakeNote: "Theo kỳ nộp hồ sơ tuyển sinh NUS; phải kiểm tra lịch dành cho bằng THPT Việt Nam.",
    applicationPath: "Ứng viên phù hợp được NUS xem xét thông qua hồ sơ tuyển sinh đại học; không tự tạo biểu mẫu xin học bổng.",
    focus: "Học bổng đại học cho ứng viên ASEAN (trừ Singapore), có thể bao gồm học sinh Việt Nam.",
    conditions: ["Quốc tịch thuộc ASEAN, trừ Singapore", "Kết quả THPT nổi bật", "Hoạt động ngoại khóa và tiềm năng lãnh đạo", "Đăng ký chương trình cử nhân toàn thời gian NUS"],
    documentChecks: ["Hồ sơ tuyển sinh NUS đúng diện bằng cấp", "Bảng điểm/bằng tốt nghiệp THPT theo yêu cầu", "Bằng chứng hoạt động, thành tích và lãnh đạo khi được yêu cầu"],
    credentialNote: "Không có mức IELTS/SAT chung cho mọi ngành trong thông tin học bổng; kiểm tra yêu cầu tiếng Anh và chứng chỉ ngay tại chương trình tuyển sinh.",
    benefitNote: "Theo trang NUS: học phí được trợ cấp sau MOE Tuition Grant, trợ cấp sinh hoạt, nhà ở và máy tính; kiểm tra nghĩa vụ Tuition Grant và điều kiện duy trì.",
    availability: "check-cycle",
  },
  {
    id: "nus-international", name: "NUS International Undergraduate Scholarship", provider: "National University of Singapore (NUS)",
    countryCode: "SG", country: "Singapore", level: "Cử nhân",
    sourceUrl: "https://www.nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students/nus-international-undergraduate-scholarship",
    sourceLabel: "NUS · International Undergraduate Scholarship",
    reviewedDate: "2026-11-11", intakeNote: "Theo kỳ nộp đơn NUS; cần xem lịch từng nhóm văn bằng.",
    applicationPath: "NUS xét chọn ứng viên từ hồ sơ đăng ký chương trình đại học.",
    focus: "Ứng viên quốc tế (trừ Singapore), thành tích học thuật và hoạt động nổi bật.",
    conditions: ["Không mang quốc tịch Singapore", "Thành tích THPT nổi bật", "Hoạt động ngoại khóa và tiềm năng lãnh đạo", "Nộp hồ sơ cử nhân toàn thời gian NUS"],
    documentChecks: ["Hồ sơ tuyển sinh NUS", "Thành tích và hoạt động đã có bằng chứng", "Bảng điểm và giấy tờ theo nhóm văn bằng"],
    credentialNote: "Ngưỡng ngoại ngữ và bài thi tùy chương trình/trình độ; không có đủ căn cứ để tự gắn điểm IELTS hoặc SAT cho học bổng này.",
    benefitNote: "NUS mô tả hỗ trợ học phí được trợ cấp và các khoản phụ cấp; Tuition Grant có nghĩa vụ riêng cần đọc kỹ.",
    availability: "check-cycle",
  },
  {
    id: "nus-st", name: "Science & Technology Undergraduate Scholarship", provider: "National University of Singapore (NUS)",
    countryCode: "SG", country: "Singapore", level: "Cử nhân",
    sourceUrl: "https://nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students/science-technology-undergraduate-scholarship",
    sourceLabel: "NUS · Science & Technology Scholarship",
    reviewedDate: "2026-11-11", intakeNote: "Theo kỳ tuyển sinh NUS; điều kiện theo ngành phải đối chiếu nguồn gốc.",
    applicationPath: "NUS xem xét ứng viên thông qua hồ sơ tuyển sinh đại học.",
    focus: "Ứng viên châu Á (trừ Singapore) chọn nhóm ngành Computing, Engineering hoặc Science thuộc phạm vi học bổng.",
    conditions: ["Quốc tịch thuộc quốc gia/vùng lãnh thổ châu Á, trừ Singapore", "Thành tích THPT và hoạt động nổi bật", "Chương trình cử nhân nằm trong phạm vi ngành học được học bổng chấp nhận"],
    documentChecks: ["Xác định đúng mã chương trình/ngành tại NUS", "Bảng điểm và hồ sơ tuyển sinh", "Minh chứng hoạt động và thành tích"],
    credentialNote: "Chứng chỉ và điều kiện tiên quyết áp dụng theo đúng ngành, không suy ra mọi ngành Science/Engineering đều hợp lệ.",
    benefitNote: "Mức hỗ trợ và mọi nghĩa vụ ràng buộc phải tra trực tiếp nguồn NUS cho kỳ nhập học cụ thể.",
    availability: "check-cycle",
  },
  {
    id: "ntu-nanyang", name: "Nanyang Global Scholarship", provider: "Nanyang Technological University (NTU)",
    countryCode: "SG", country: "Singapore", level: "Cử nhân",
    sourceUrl: "https://www.ntu.edu.sg/admissions/undergraduate/scholarships/scholarship-opportunities/detail/nanyang-scholarship",
    sourceLabel: "NTU · Nanyang Global Scholarship",
    reviewedDate: "2026-11-11", intakeNote: "Hạn nộp theo kỳ tuyển sinh và loại bằng cấp của ứng viên; phải kiểm tra sau khi mở kỳ.",
    applicationPath: "NTU yêu cầu nộp đơn học bổng sau hồ sơ tuyển sinh; xem quy trình chính thức tại trang NTU.",
    focus: "Ứng viên cử nhân mới nhập học, tất cả quốc tịch; ưu tiên thành tích và khả năng lãnh đạo.",
    conditions: ["Hồ sơ học thuật tương đương Year 12 hoặc văn bằng được NTU chấp nhận", "Hoạt động ngoại khóa nổi bật", "Khả năng lãnh đạo", "Chương trình cử nhân toàn thời gian NTU"],
    documentChecks: ["Hồ sơ tuyển sinh NTU", "Đơn học bổng NTU", "Thành tích tiêu biểu, bài luận và thư đánh giá theo hướng dẫn chính thức"],
    credentialNote: "Điều kiện tiếng Anh/phương thức xét tuyển theo loại bằng THPT và chương trình NTU, không có IELTS/SAT cố định chung.",
    benefitNote: "Theo NTU: hỗ trợ học phí đã trợ cấp, sinh hoạt, ký túc xá và các khoản tài trợ theo điều khoản; cần chú ý nghĩa vụ MOE Tuition Grant.",
    availability: "check-cycle",
  },
  {
    id: "mext-ug-2027", name: "MEXT 2027 – Embassy Recommendation (Undergraduate)", provider: "Bộ Giáo dục, Văn hóa, Thể thao, Khoa học và Công nghệ Nhật Bản",
    countryCode: "JP", country: "Nhật Bản", level: "Cử nhân",
    sourceUrl: "https://www.studyinjapan.go.jp/en/smap-stopj-applications-undergraduate.html",
    sourceLabel: "Study in Japan · MEXT 2027 Undergraduate",
    reviewedDate: "2026-11-11", intakeNote: "Nguồn mô tả đợt đại sứ quán cho nhập học 2027; lịch nộp khác nhau theo quốc tịch và cơ quan đại diện. Không coi là đang mở nhận đơn.",
    applicationPath: "Theo hướng dẫn đại sứ quán/lãnh sự quán Nhật Bản tại quốc gia quốc tịch, không gửi trực tiếp hồ sơ tới MEXT.",
    focus: "Học bổng Chính phủ Nhật Bản diện cử nhân do đại sứ quán tiến cử.",
    conditions: ["Đáp ứng quốc tịch và độ tuổi theo hướng dẫn chính thức năm 2027", "Đủ điều kiện học thuật và ngành dự tuyển", "Tham gia xét tuyển/thi/phỏng vấn theo cơ quan đại diện"],
    documentChecks: ["Application Guidelines 2027", "Đơn ứng tuyển và giấy tờ theo hướng dẫn", "Giấy khám sức khỏe theo mẫu", "Thư giới thiệu và bảng điểm"],
    credentialNote: "Kiểm tra bài thi/ngôn ngữ theo nhóm ngành và hướng dẫn MEXT 2027. Không mặc định JLPT N2 hay IELTS là điều kiện chung.",
    benefitNote: "MEXT là chương trình hỗ trợ của Chính phủ Nhật; điều khoản, khoản trợ cấp và kỳ áp dụng phải xem hướng dẫn gốc.",
    availability: "archive-cycle",
  },
  {
    id: "gks-ug-2026", name: "GKS-U 2026 – Global Korea Scholarship (Undergraduate)", provider: "Chính phủ Hàn Quốc / Study in Korea",
    countryCode: "KR", country: "Hàn Quốc", level: "Cử nhân",
    sourceUrl: "https://www.studyinkorea.go.kr/ko/notice/scholarshipsRead.do?bbsId=BBSMSTR_000000000461&nttId=4385",
    sourceLabel: "Study in Korea · GKS-U 2026 Application Guidelines",
    reviewedDate: "2026-11-11", intakeNote: "Thông báo 2026 là hồ sơ lịch sử, không xác nhận đợt nộp đơn 2027 đang mở.",
    applicationPath: "Kiểm tra hướng dẫn GKS-U kỳ mới nhất trên Study in Korea và danh sách trường/ngành cho từng diện.",
    focus: "Chương trình học bổng Chính phủ Hàn Quốc bậc đại học, phạm vi quốc tịch/ngành theo từng kỳ.",
    conditions: ["Đối chiếu điều kiện quốc tịch và học lực theo hướng dẫn GKS-U", "Chọn trường/ngành trong danh sách được phép", "Tuân thủ lịch, loại hồ sơ và quy trình theo thông báo kỳ mới"],
    documentChecks: ["Application Guidelines bản kỳ áp dụng", "Biểu mẫu chính thức", "Bằng cấp/bảng điểm", "Giấy tờ xác minh danh tính và năng lực ngôn ngữ nếu được yêu cầu"],
    credentialNote: "TOPIK/IELTS/TOEFL phải đối chiếu phụ lục điều kiện từng đợt/trường, không tự điền ngưỡng.",
    benefitNote: "Thông tin học bổng chỉ áp dụng theo hướng dẫn kỳ tuyển; không suy ra mức hỗ trợ nếu chưa đối chiếu văn bản.",
    availability: "archive-cycle",
  },
  {
    id: "melbourne-undergraduate", name: "Melbourne International Undergraduate Scholarship", provider: "The University of Melbourne",
    countryCode: "AU", country: "Úc", level: "Cử nhân",
    sourceUrl: "https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications/applications",
    sourceLabel: "University of Melbourne · International undergraduate applications",
    reviewedDate: "2026-11-11", intakeNote: "Kỳ mở và hạn nộp theo chương trình; chính sách học bổng cần kiểm tra tại thời điểm đăng ký.",
    applicationPath: "Trang University of Melbourne cho biết có một số học bổng, gồm Melbourne International Undergraduate Scholarship, được xem xét tự động cùng hồ sơ tuyển sinh nếu đủ điều kiện.",
    focus: "Học bổng cử nhân quốc tế do University of Melbourne công bố trong quy trình xét tuyển.",
    conditions: ["Ứng viên quốc tế vào chương trình cử nhân", "Đáp ứng yêu cầu tuyển sinh trường và tiêu chí học bổng của kỳ áp dụng"],
    documentChecks: ["Hồ sơ học thuật và điều kiện văn bằng", "Điều kiện tiếng Anh và môn tiên quyết theo ngành", "Kiểm tra thời hạn xét tuyển của năm nhập học"],
    credentialNote: "Không xác định ngưỡng IELTS/TOEFL cố định cho toàn trường; mở trang chương trình để kiểm tra.",
    benefitNote: "Trang tuyển sinh xác nhận tên học bổng và hình thức xem xét; mức hỗ trợ chính thức phải tra nguồn chi tiết theo intake.",
    availability: "check-cycle",
  },
];

export const scholarshipCountryOptions = [...new Set(officialScholarships.map(item => item.countryCode))] as ScholarshipRecord["countryCode"][];

export function searchScholarships(query: string, countryCode = "ALL"): ScholarshipRecord[] {
  const normalized = query.trim().toLocaleLowerCase("vi-VN");
  return officialScholarships.filter(item =>
    (countryCode === "ALL" || item.countryCode === countryCode) &&
    (!normalized || [item.name, item.provider, item.country, item.focus, ...item.conditions]
      .join(" ").toLocaleLowerCase("vi-VN").includes(normalized)),
  );
}
