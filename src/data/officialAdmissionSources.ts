/**
 * Hand-reviewed official entry points; expanded with official sources checked 2026-11-11.
 * A programme/major tag is for discovery, NOT proof that a specific major
 * was offered in each year, and NO admission cutoff is imputed.
 */
export type AdmissionYear = 2024 | 2025 | 2026;
export type AdmissionMethodTag = "THPT" | "TAI_NANG" | "TSA" | "DGNL" | "SAT_ACT" | "NGOAI_NGU_KET_HOP" | "KHAC";
export const methodLabels: Record<AdmissionMethodTag, string> = {
  THPT: "Điểm thi THPT", TAI_NANG: "Tuyển thẳng / tài năng / hồ sơ năng lực",
  TSA: "Đánh giá tư duy (TSA)", DGNL: "Đánh giá năng lực (HSA/APT/SPT)",
  SAT_ACT: "SAT / ACT / chứng chỉ quốc tế", NGOAI_NGU_KET_HOP: "Ngoại ngữ quốc tế kết hợp",
  KHAC: "Phương thức khác theo đề án",
};
export type YearAdmissionSource = {
  year: AdmissionYear;
  schemeUrl: string;
  schemeLabel: string;
  methods: AdmissionMethodTag[];
  methodNotes: string;
  cutoffUrl?: string;
  detailsStatus: "institution_method_verified" | "official_archive_only";
};
export type OfficialUniversity = {
  id: string;
  name: string;
  region: "Bắc" | "Nam";
  fieldTags: string[];
  portalUrl: string;
  applicationUrl?: string;
  years: YearAdmissionSource[];
};
export const admissionYears: AdmissionYear[] = [2026, 2025, 2024];
export const officialUniversities: OfficialUniversity[] = [
  {
    id: "tdtu", name: "Trường Đại học Tôn Đức Thắng (TDTU)", region: "Nam",
    fieldTags: ["Công nghệ thông tin", "Kỹ thuật", "Kinh doanh", "Thiết kế", "Ngôn ngữ", "Liên kết quốc tế"],
    portalUrl: "https://admission.tdtu.edu.vn/", applicationUrl: "https://xettuyen.tdtu.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://admission.tdtu.edu.vn/dai-hoc/thong-bao-phuong-thuc-tuyen-sinh-dai-hoc-nam-2026", schemeLabel: "Thông báo phương thức tuyển sinh chính thức 2026", methods: ["THPT", "DGNL", "TAI_NANG"], methodNotes: "2026: xét tuyển tổng hợp từ điểm THPT + học bạ + tiêu chí năng lực (thang 100); ĐGNL ĐHQG TP.HCM (thang 1.200); xét tuyển thẳng. SAT/ACT có thể là điều kiện/thành phần riêng cho nhóm đối tượng theo thông báo, không phải điểm THPT thang 30.", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://admission.tdtu.edu.vn/dai-hoc/tuyen-sinh/phuong-thuc-2025", schemeLabel: "Phương thức tuyển sinh 2025", methods: ["THPT", "DGNL", "TAI_NANG"], methodNotes: "2025: học bạ 6 học kỳ và thành tích, điểm thi THPT, ĐGNL ĐHQG TP.HCM, ưu tiên và tuyển thẳng. Cần xem cách tính điểm theo từng chương trình.", detailsStatus: "institution_method_verified" },
      { year: 2024, schemeUrl: "https://admission.tdtu.edu.vn/dai-hoc/tuyen-sinh/phuong-thuc-2024", schemeLabel: "Phương thức tuyển sinh 2024", methods: ["THPT", "DGNL", "TAI_NANG"], methodNotes: "2024: học bạ, thi THPT, ưu tiên/tuyển thẳng, ĐGNL; nhiều chương trình dùng điểm xét tuyển thang 40. Không so trực tiếp điểm 2024 với thang 2026.", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "hust", name: "Đại học Bách khoa Hà Nội (HUST)", region: "Bắc",
    fieldTags: ["Công nghệ thông tin", "Kỹ thuật", "Điện - điện tử", "Cơ khí", "Vật liệu"],
    portalUrl: "https://ts-hn.hust.edu.vn/", applicationUrl: "https://ts-hn.hust.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://ts.hust.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026", schemeLabel: "Thông tin tuyển sinh chính thức 2026", methods: ["TAI_NANG", "TSA", "THPT"], methodNotes: "Ba nhóm chính: xét tuyển tài năng, TSA và điểm thi THPT; điều kiện chi tiết theo đề án năm 2026.", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://ts.hust.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-nam-2025", schemeLabel: "Thông tin tuyển sinh chính thức 2025", methods: ["TAI_NANG", "TSA", "THPT", "KHAC"], methodNotes: "Xét tuyển tài năng, TSA, THPT; một số diện tuyển sinh đặc biệt có phương thức khác.", detailsStatus: "institution_method_verified" },
      { year: 2024, schemeUrl: "https://ts.hust.edu.vn/index.php/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2024", schemeLabel: "Thông tin tuyển sinh chính thức 2024", methods: ["TAI_NANG", "TSA", "THPT"], methodNotes: "Ba nhóm chính: xét tuyển tài năng, TSA và THPT. Chỉ tiêu/phân bổ xem nguồn gốc.", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "ftu", name: "Trường Đại học Ngoại thương (FTU)", region: "Bắc",
    fieldTags: ["Kinh tế", "Kinh doanh", "Tài chính", "Thương mại quốc tế", "Ngôn ngữ"],
    portalUrl: "https://qldt.ftu.edu.vn/category/tuyen-sinh/tuyen-sinh-dai-hoc-chinh-quy-2025/",
    applicationUrl: "https://tuyensinh.ftu.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://qldt.ftu.edu.vn/category/tuyen-sinh/tuyen-sinh-dai-hoc-chinh-quy-2025/thong-tin-tuyen-sinh-chung-2026/", schemeLabel: "Tất cả thông báo tuyển sinh FTU 2026", methods: ["THPT", "NGOAI_NGU_KET_HOP", "TAI_NANG", "KHAC"], methodNotes: "Có thông báo xét tuyển điểm THPT kết hợp chứng chỉ ngoại ngữ, tuyển thẳng/ưu tiên; cần mở từng thông báo xác định điều kiện theo ngành.", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://qldt.ftu.edu.vn/category/tuyen-sinh/tuyen-sinh-dai-hoc-chinh-quy-2025/thong-tin-tuyen-sinh-chung-2025/", schemeLabel: "Tất cả thông báo tuyển sinh FTU 2025", methods: [], methodNotes: "Kho lưu trữ chính thức gồm phương thức, ngưỡng điểm và quy đổi; chưa chuẩn hóa từng phương thức vào dữ liệu CLA.", detailsStatus: "official_archive_only" },
      { year: 2024, schemeUrl: "https://qldt.ftu.edu.vn/category/tuyen-sinh/luu-tru-tuyen-sinh/tuyen-sinh-dai-hoc-chinh-quy-2024/", schemeLabel: "Tất cả thông báo tuyển sinh FTU 2024", methods: [], methodNotes: "Kho lưu trữ chính thức 2024: đề án, phương thức và điểm trúng tuyển; chưa chuẩn hóa từng ngành.", detailsStatus: "official_archive_only" },
    ],
  },
  {
    id: "ptit", name: "Học viện Công nghệ Bưu chính Viễn thông (PTIT)", region: "Bắc",
    fieldTags: ["Công nghệ thông tin", "Kỹ thuật", "Điện - điện tử", "Truyền thông", "Kinh doanh"],
    portalUrl: "https://tuyensinh.ptit.edu.vn/", applicationUrl: "https://xettuyen.ptit.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/", schemeLabel: "Thông tin tuyển sinh PTIT 2026", cutoffUrl: "https://tuyensinh.ptit.edu.vn/thong-bao-diem-chuan-trung-tuyen-vao-dai-hoc-he-chinh-quy-nam-2026/", methods: ["TAI_NANG", "SAT_ACT", "DGNL", "TSA", "NGOAI_NGU_KET_HOP", "THPT"], methodNotes: "Thông báo PTIT 2026: tài năng; SAT/ACT; HSA/APT/SPT/TSA; chứng chỉ tiếng Anh kết hợp kết quả THPT; điểm thi THPT. Ngưỡng và điều kiện theo thông báo gốc.", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2025/", schemeLabel: "Thông tin tuyển sinh PTIT 2025", methods: ["TAI_NANG", "SAT_ACT", "DGNL", "TSA", "NGOAI_NGU_KET_HOP", "THPT"], methodNotes: "Hồ sơ năng lực/tài năng; SAT/ACT; đánh giá năng lực, tư duy; ngoại ngữ quốc tế kết hợp và điểm thi THPT.", cutoffUrl: "https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-nam-2025/", detailsStatus: "institution_method_verified" },
      { year: 2024, schemeUrl: "https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/de-an-2024/", schemeLabel: "Đề án tuyển sinh PTIT 2024", methods: ["TAI_NANG", "SAT_ACT", "NGOAI_NGU_KET_HOP", "DGNL", "TSA", "THPT"], methodNotes: "Bốn nhóm: tài năng; THPT; chứng chỉ SAT/ACT hoặc IELTS/TOEFL kết hợp học tập; đánh giá năng lực/tư duy.", cutoffUrl: "https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-2024/", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "hcmus", name: "Trường Đại học Khoa học tự nhiên – ĐHQG-HCM (HCMUS)", region: "Nam",
    fieldTags: ["Khoa học dữ liệu", "Trí tuệ nhân tạo", "Công nghệ thông tin", "Khoa học máy tính", "Toán học", "Khoa học tự nhiên"],
    portalUrl: "https://tuyensinh.hcmus.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/", schemeLabel: "Thông tin tuyển sinh HCMUS 2026", methods: ["TAI_NANG", "THPT", "DGNL", "KHAC"], methodNotes: "Trang chính thức công bố 39 ngành/nhóm ngành, 4.926 chỉ tiêu; phương thức 1a xét tuyển thẳng/ưu tiên, 1b diện thí sinh nước ngoài, phương thức 2 kết hợp kết quả THPT hoặc ĐGNL ĐHQG-HCM với học bạ. Chi tiết điều kiện theo từng ngành phải xem văn bản gốc.", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://tuyensinh.hcmus.edu.vn/2025-thong-tin-tuyen-sinh/", schemeLabel: "Thông tin tuyển sinh HCMUS 2025", methods: ["TAI_NANG", "THPT", "DGNL", "NGOAI_NGU_KET_HOP"], methodNotes: "Nguồn chính thức ghi phương thức 1 gồm tuyển thẳng/ưu tiên và ưu tiên kết hợp chứng chỉ ngoại ngữ với kết quả học tập; phương thức 2 dùng điểm thi THPT; phương thức 3 dùng ĐGNL ĐHQG-HCM.", detailsStatus: "institution_method_verified" },
      { year: 2024, schemeUrl: "https://tuyensinh.hcmus.edu.vn/th%C3%B4ng-tin-tuy%E1%BB%83n-sinh/phuongthuctuyensinh", schemeLabel: "Phương thức tuyển sinh HCMUS 2024", methods: ["TAI_NANG", "DGNL", "THPT", "NGOAI_NGU_KET_HOP", "KHAC"], methodNotes: "Nguồn chính thức ghi 6 phương thức: tuyển thẳng/ưu tiên theo Bộ; ưu tiên theo ĐHQG-HCM; ĐGNL ĐHQG-HCM; điểm thi tốt nghiệp THPT; hồ sơ học tập của thí sinh học chương trình nước ngoài/kết hợp ngoại ngữ; chứng chỉ ngoại ngữ quốc tế kết hợp học bạ. Tỷ lệ chỉ tiêu thay đổi theo ngành/nhóm ngành.", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "uit", name: "Trường Đại học Công nghệ Thông tin – ĐHQG-HCM (UIT)", region: "Nam",
    fieldTags: ["Khoa học dữ liệu", "Trí tuệ nhân tạo", "Công nghệ thông tin", "Khoa học máy tính", "Kỹ thuật phần mềm", "An toàn thông tin"],
    portalUrl: "https://tuyensinh.uit.edu.vn/",
    applicationUrl: "https://tuyensinh.uit.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://tuyensinh.uit.edu.vn/2026-du-kien-phuong-huong-tuyen-sinh-dai-hoc-chinh-quy-nam-2026", schemeLabel: "Phương hướng tuyển sinh UIT 2026", methods: [], methodNotes: "Cổng chính thức có phương hướng tuyển sinh, đề án và thông báo 2026; nội dung chi tiết phương thức chưa được trích xuất và chuẩn hóa đầy đủ trong CLA.", detailsStatus: "official_archive_only" },
      { year: 2025, schemeUrl: "https://tuyensinh.uit.edu.vn/2025-phuong-thuc-tuyen-sinh-nam-2025", schemeLabel: "Phương thức tuyển sinh UIT 2025", methods: ["TAI_NANG", "SAT_ACT", "DGNL", "THPT", "NGOAI_NGU_KET_HOP"], methodNotes: "Nguồn chính thức ghi tuyển thẳng/ưu tiên, giải thưởng và chứng chỉ SAT/ACT/A-Level/IB, ĐGNL ĐHQG-HCM, điểm thi THPT; chứng chỉ ngoại ngữ có thể được dùng theo điều kiện từng phương thức.", detailsStatus: "institution_method_verified" },
      { year: 2024, schemeUrl: "https://tuyensinh.uit.edu.vn/node/2663", schemeLabel: "Phương thức tuyển sinh UIT 2024", methods: ["TAI_NANG", "DGNL", "THPT", "SAT_ACT", "NGOAI_NGU_KET_HOP", "KHAC"], methodNotes: "Nguồn chính thức ghi tuyển thẳng/ưu tiên; ĐGNL ĐHQG-HCM; điểm thi tốt nghiệp THPT; chứng chỉ quốc tế SAT/ACT/AS-A Level/IB; chứng chỉ ngoại ngữ kết hợp học bạ; và tiêu chí riêng cho chương trình liên kết BCU. Điều kiện chi tiết cần đối chiếu theo nhóm ngành/chương trình.", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "hcmut", name: "Trường Đại học Bách khoa – ĐHQG-HCM (HCMUT)", region: "Nam",
    fieldTags: ["Khoa học dữ liệu", "Trí tuệ nhân tạo", "Công nghệ thông tin", "Kỹ thuật", "Điện - điện tử", "Cơ khí"],
    portalUrl: "https://hcmut.edu.vn/",
    applicationUrl: "https://hcmut.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://hcmut.edu.vn/tintuc/cong-bo-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026", schemeLabel: "Thông tin tuyển sinh HCMUT 2026", methods: ["TAI_NANG", "KHAC"], methodNotes: "Nguồn trường công bố 2 nhóm: tuyển thẳng/ưu tiên theo quy chế Bộ GD&ĐT (khoảng 1–5% chỉ tiêu) và xét tuyển tổng hợp (khoảng 95–99%) áp dụng cho 8 đối tượng. Cần đọc quy định từng đối tượng và chương trình.", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://geopet.hcmut.edu.vn/tin-tuc/bai-viet-302", schemeLabel: "Thông tin tuyển sinh HCMUT 2025", methods: ["TAI_NANG", "KHAC"], methodNotes: "Nguồn trên tên miền đơn vị thuộc HCMUT xác nhận trường công bố 2 phương thức tuyển sinh chính quy năm 2025; phương thức xét tuyển tổng hợp chiếm tỷ trọng lớn. Bản ghi này mới xác nhận nhóm phương thức, chưa chuẩn hóa đầy đủ đối tượng, công thức và chỉ tiêu theo từng chương trình.", detailsStatus: "official_archive_only" },
      { year: 2024, schemeUrl: "https://oisp.hcmut.edu.vn/wp-content/uploads/2024/05/0.-DHBK-Thong-tin-tuyen-sinh-2024.pdf", schemeLabel: "Thông tin tuyển sinh HCMUT 2024 (PDF)", methods: ["TAI_NANG", "DGNL", "THPT", "SAT_ACT", "KHAC"], methodNotes: "Tài liệu tuyển sinh đại học chính quy 2024 trên tên miền chính thức của HCMUT/OISP ghi 5 nhóm: tuyển thẳng/ưu tiên theo Bộ; ưu tiên theo ĐHQG-HCM; chứng chỉ tuyển sinh quốc tế/thí sinh nước ngoài; chương trình chuyển tiếp quốc tế; xét tuyển kết hợp ĐGNL, THPT, học bạ và năng lực khác. Tỷ lệ chỉ tiêu theo nhóm phương thức cần đọc trực tiếp trong PDF.", detailsStatus: "institution_method_verified" },
    ],
  },

  {
    id: "uet", name: "Trường Đại học Công nghệ – ĐHQG Hà Nội (UET)", region: "Bắc",
    fieldTags: ["Công nghệ thông tin", "Khoa học máy tính", "Trí tuệ nhân tạo", "Kỹ thuật", "Điện - điện tử"],
    portalUrl: "https://tuyensinh.uet.vnu.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://tuyensinh.uet.vnu.edu.vn/ban-nen-biet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/", schemeLabel: "Thông tin tuyển sinh đại học chính quy UET 2026", methods: [], methodNotes: "Trường công bố thông tin tuyển sinh 2026 và tài liệu điều chỉnh; phương thức, điều kiện theo từng ngành chưa được CLA chuẩn hóa từ văn bản gốc.", detailsStatus: "official_archive_only" },
    ],
  },
  {
    id: "uel", name: "Trường Đại học Kinh tế – Luật – ĐHQG-HCM (UEL)", region: "Nam",
    fieldTags: ["Kinh tế", "Kinh doanh", "Luật", "Kinh tế số", "Kế toán và phân tích dữ liệu"],
    portalUrl: "https://tuyensinh.uel.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/", schemeLabel: "Thông tin tuyển sinh chính quy UEL 2026", methods: ["TAI_NANG", "DGNL", "THPT", "KHAC"], methodNotes: "Nguồn trường công bố xét tuyển thẳng/ưu tiên và xét tuyển tổng hợp sử dụng ĐGNL, thi THPT, học bạ và các thành phần theo từng đối tượng; năm 2026 xét tuyển tổng hợp theo thang 100. Điểm và công thức cụ thể phải đối chiếu văn bản gốc.", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "ueh", name: "Đại học Kinh tế Thành phố Hồ Chí Minh (UEH)", region: "Nam",
    fieldTags: ["Kinh tế", "Kinh doanh", "Tài chính", "Luật", "Công nghệ", "Máy tính ứng dụng", "AI for Business"],
    portalUrl: "https://tuyensinh.ueh.edu.vn/cu-nhan-chinh-quy/dai-hoc-chinh-quy/",
    years: [
      { year: 2026, schemeUrl: "https://www.ueh.edu.vn/tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026-76935", schemeLabel: "Thông tin tuyển sinh cử nhân Khóa 52 năm 2026", methods: ["TAI_NANG", "KHAC"], methodNotes: "Nguồn UEH công bố 2 nhóm phương thức: tuyển thẳng theo quy định và xét tuyển tổng hợp theo quy chế của trường. Mã trường KSA (TP.HCM) và KSV (UEH Mekong) có chương trình/chỉ tiêu khác nhau; CLA chưa có bảng điểm chuẩn theo từng chương trình.", detailsStatus: "institution_method_verified" },
    ],
  },
]; 
export function normalizeForAdmissionSearch(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}
export function findOfficialUniversities(query: string, year: AdmissionYear, method: AdmissionMethodTag | "ALL" = "ALL") {
  const normalized = normalizeForAdmissionSearch(query);
  const synonyms: Record<string, string> = { cntt: "cong nghe thong tin", it: "cong nghe thong tin", ai: "tri tue nhan tao", qtkd: "quan tri kinh doanh", kt: "kinh te" };
  const needle = synonyms[normalized] || normalized;
  return officialUniversities.filter(university => {
    const record = university.years.find(y => y.year === year);
    if (!record || (method !== "ALL" && !record.methods.includes(method))) return false;
    if (!needle) return true;
    return normalizeForAdmissionSearch(`${university.name} ${university.fieldTags.join(" ")}`).includes(needle);
  });
}
