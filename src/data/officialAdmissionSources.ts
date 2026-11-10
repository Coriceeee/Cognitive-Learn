/**
 * Hand-reviewed official entry points, checked 2026-11-08.
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
