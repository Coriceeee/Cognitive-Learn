/** Curated government/university portals, not a verified programme-level eligibility decision. */
export type Destination = "Nhật Bản" | "Hàn Quốc" | "Singapore" | "Đức" | "Anh" | "Úc" | "Hoa Kỳ";
export type InternationalRoute = {
  isoCode: string;
  country: Destination;
  studyFields: string[];
  targetInstitutions: { name: string; admissionsUrl: string; scholarshipUrl?: string }[];
  academic: string[];
  certificates: string[];
  scholarshipDocuments: string[];
  governmentSource: string;
  sourceLabel: string;
  note: string;
};
export const internationalRoutes: InternationalRoute[] = [
  {
    isoCode: "JP", country: "Nhật Bản", studyFields: ["Kỹ thuật", "Công nghệ thông tin", "Kinh tế", "Ngôn ngữ"],
    targetInstitutions: [
      { name: "Đại học Tokyo — tra tuyển sinh đại học (chú ý điều kiện chương trình)", admissionsUrl: "https://www.u-tokyo.ac.jp/en/prospective-students/undergraduate_admissions.html" },
      { name: "Đại học Kyoto — chương trình cử nhân và tuyển sinh quốc tế", admissionsUrl: "https://www.kyoto-u.ac.jp/en/education-campus/education-and-admissions/undergraduate-degree-programs" },
    ],
    academic: ["Tốt nghiệp THPT và xác minh văn bằng tương đương theo trường", "EJU tùy chương trình và tuyến nhập học"],
    certificates: ["JLPT (thường tham khảo N2 cho chương trình tiếng Nhật, không áp dụng đồng loạt)", "EJU (Nhật ngữ, Toán, Khoa học tùy ngành)", "IELTS/TOEFL nếu chương trình tiếng Anh yêu cầu"],
    scholarshipDocuments: ["Bảng điểm và bằng tốt nghiệp", "Hồ sơ học lực, thư giới thiệu nếu được yêu cầu", "Kiểm tra tuyến MEXT qua Đại sứ quán hoặc trường", "Kiểm tra điều kiện JASSO và tư cách lưu trú"],
    governmentSource: "https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/", sourceLabel: "Study in Japan — học bổng chính phủ MEXT",
    note: "MEXT và JASSO là hai cơ chế khác nhau. Không tự động đủ điều kiện chỉ vì có JLPT.",
  },
  {
    isoCode: "KR", country: "Hàn Quốc", studyFields: ["Công nghệ thông tin", "Kỹ thuật", "Kinh doanh", "Thiết kế"],
    targetInstitutions: [
      { name: "Đại học Quốc gia Seoul (SNU) — tuyển sinh quốc tế bậc đại học", admissionsUrl: "https://en.snu.ac.kr/admission/undergraduate/application" },
    ],
    academic: ["Tốt nghiệp THPT", "Đối chiếu yêu cầu theo khoa và hệ chương trình"],
    certificates: ["TOPIK với chương trình tiếng Hàn (mức yêu cầu tùy trường)", "IELTS/TOEFL với chương trình tiếng Anh nếu được chấp nhận"],
    scholarshipDocuments: ["Bảng điểm, tốt nghiệp", "Chứng nhận ngôn ngữ phù hợp", "Kế hoạch học tập / personal statement theo học bổng", "Giấy tờ tài chính và giấy tờ chứng minh nhân thân theo danh mục chính thức"],
    governmentSource: "https://www.studyinkorea.go.kr/en/plan/examAndKoreanStudy.do", sourceLabel: "Study in Korea — TOPIK và điều kiện ngôn ngữ",
    note: "Có thể tra thêm Global Korea Scholarship (GKS) tại cổng chính phủ; lịch và tiêu chí thay đổi theo đợt.",
  },
  {
    isoCode: "SG", country: "Singapore", studyFields: ["Công nghệ thông tin", "Kỹ thuật", "Kinh doanh", "Khoa học", "Kinh tế"],
    targetInstitutions: [
      { name: "National University of Singapore (NUS)", admissionsUrl: "https://www.nus.edu.sg/oam/admissions/international-qualifications-for-foreigners", scholarshipUrl: "https://nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students" },
      { name: "Nanyang Technological University (NTU)", admissionsUrl: "https://www.ntu.edu.sg/admissions/undergraduate/admissions/general-admission-requirements" },
    ],
    academic: ["NUS: hoàn thành/chờ hoàn thành ít nhất 12 năm học phổ thông", "Kiểm tra môn tiên quyết theo ngành; không suy ra đủ điều kiện chỉ từ GPA"],
    certificates: ["Bằng tốt nghiệp và bảng điểm THPT Việt Nam", "Chứng chỉ tiếng Anh hoặc chuẩn học vấn được chấp nhận theo nhóm thí sinh và ngành", "SAT/ACT/AP/IB chỉ khi nhóm xét tuyển cụ thể yêu cầu hoặc chấp nhận"],
    scholarshipDocuments: ["Hồ sơ xét tuyển NUS và thành tích học tập", "Xác minh học bổng ASEAN / Science & Technology / NUS International", "Điều kiện chứng chỉ và deadline tại năm nhập học"],
    governmentSource: "https://www.nus.edu.sg/oam/admissions/international-qualifications-for-foreigners", sourceLabel: "NUS — điều kiện tuyển sinh sinh viên quốc tế",
    note: "NUS cho biết một số học bổng được xét đồng thời qua đơn tuyển sinh; không bảo đảm được nhận.",
  },
  {
    isoCode: "DE", country: "Đức", studyFields: ["Kỹ thuật", "Công nghệ thông tin", "Kinh tế", "Y sinh"],
    targetInstitutions: [
      { name: "Technical University of Munich (TUM) — tuyển sinh cử nhân quốc tế", admissionsUrl: "https://www.tum.de/en/studies/application/application-info-portal/application-international/" },
    ],
    academic: ["Kiểm tra tính tương đương bằng tốt nghiệp với DAAD/anabin", "Có thể cần Studienkolleg hoặc học đại học trước tùy chứng chỉ"],
    certificates: ["TestDaF / DSH hoặc chứng chỉ tiếng Đức được trường chấp nhận", "IELTS/TOEFL nếu ngành dạy bằng tiếng Anh", "Trình độ B1/B2 có thể liên quan bước vào Studienkolleg, không phải chuẩn của mọi ngành"],
    scholarshipDocuments: ["Văn bằng/bảng điểm hợp lệ, có thể cần dịch thuật", "Motivation letter / CV / thư giới thiệu tùy nguồn học bổng", "Kiểm tra chứng minh tài chính và visa"],
    governmentSource: "https://www.daad.de/en/studying-in-germany/requirements/overview/", sourceLabel: "DAAD — yêu cầu du học Đức",
    note: "DAAD là cổng hướng dẫn học thuật, không phải cổng nộp hồ sơ của mọi đại học.",
  },
  {
    isoCode: "GB", country: "Anh", studyFields: ["Kinh doanh", "Kỹ thuật", "Ngôn ngữ", "Luật", "Công nghệ thông tin"],
    targetInstitutions: [
      { name: "University College London (UCL) — yêu cầu nhập học", admissionsUrl: "https://www.ucl.ac.uk/study/prospective-students/undergraduate/how-apply/entry-requirements" },
    ],
    academic: ["A-level/IB hoặc văn bằng quốc tế được trường chấp nhận, có thể cần foundation", "Kiểm tra điều kiện môn tiên quyết theo từng course"],
    certificates: ["IELTS Academic / chứng chỉ tiếng Anh được trường chấp nhận", "Portfolio/phỏng vấn/thi tuyển nếu ngành yêu cầu"],
    scholarshipDocuments: ["Personal statement theo hướng dẫn UCAS", "Reference và bảng điểm", "Hồ sơ học bổng trường/nhà tài trợ riêng"],
    governmentSource: "https://www.ucas.com/international/international-students/applying-to-university-as-an-international-student", sourceLabel: "UCAS — hướng dẫn xét tuyển quốc tế",
    note: "UCAS nêu rõ yêu cầu tiếng Anh và học thuật khác nhau theo course và trường; không có IELTS tối thiểu chung.",
  },
  {
    isoCode: "AU", country: "Úc", studyFields: ["Kinh doanh", "Kỹ thuật", "Khoa học", "Công nghệ thông tin", "Y sinh"],
    targetInstitutions: [{ name: "University of Melbourne", admissionsUrl: "https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications/applications", scholarshipUrl: "https://study.unimelb.edu.au/accommodation/international-house/international-house-scholarships" }],
    academic: ["Tốt nghiệp THPT hoặc chứng chỉ tương đương được trường công nhận", "Kiểm tra môn tiên quyết như Toán/Khoa học theo ngành"],
    certificates: ["IELTS Academic / TOEFL hoặc chứng chỉ thay thế được trường công nhận", "Bảng điểm và chứng minh điều kiện học thuật"],
    scholarshipDocuments: ["Học bạ, học lực và năng lực ngoại ngữ", "Bản mô tả thành tích cá nhân khi học bổng yêu cầu", "Xác minh điều kiện tài chính, CoE và visa"],
    governmentSource: "https://www.studyaustralia.gov.au/en/plan-your-studies/how-to-apply-to-study.html", sourceLabel: "Study Australia — điều kiện nộp hồ sơ",
    note: "Chi phí học tập và sinh hoạt phụ thuộc chương trình, thành phố và năm; cần tra báo giá chính thức.",
  },
  {
    isoCode: "US", country: "Hoa Kỳ", studyFields: ["Công nghệ thông tin", "Kỹ thuật", "Khoa học", "Kinh tế", "Nhân văn"],
    targetInstitutions: [
      { name: "Massachusetts Institute of Technology (MIT) — sinh viên quốc tế", admissionsUrl: "https://mitadmissions.org/apply/firstyear/international/", scholarshipUrl: "https://sfs.mit.edu/undergraduate-students/the-cost-of-attendance/making-mit-affordable/" },
      { name: "Harvard College — hồ sơ quốc tế", admissionsUrl: "https://college.harvard.edu/admissions/apply/international-applicants" },
    ],
    academic: ["Tốt nghiệp THPT hoặc đang học năm cuối; kiểm tra chính sách từng trường", "Bảng điểm, nội dung môn học, essay và recommendations tùy trường"],
    certificates: ["SAT/ACT: cần xem trường và chu kỳ tuyển sinh cụ thể, không mặc định mọi trường đều yêu cầu", "TOEFL/IELTS/Duolingo: chính sách chứng minh tiếng Anh khác nhau theo trường và đối tượng", "AP/IB hoặc các bài thi bổ sung: chỉ khi trường/chương trình yêu cầu"],
    scholarshipDocuments: ["Hồ sơ tài chính nếu xin need-based financial aid", "Bài luận, thành tích học tập và thư giới thiệu theo quy định từng trường", "Kiểm tra deadline tuyển sinh và financial aid riêng của từng năm"],
    governmentSource: "https://educationusa.state.gov/your-5-steps-us-study", sourceLabel: "EducationUSA — 5 bước du học Hoa Kỳ (Bộ Ngoại giao Hoa Kỳ)",
    note: "Financial aid (dựa trên nhu cầu) khác merit scholarship (dựa trên thành tích). Chính sách chứng chỉ, hỗ trợ tài chính và visa phải xác minh riêng ở từng trường/năm; CLA chưa ước tính khả năng đậu.",
  },

];
export function findInternationalRoute(country: string): InternationalRoute | undefined {
  return internationalRoutes.find(route => route.country === country);
}
