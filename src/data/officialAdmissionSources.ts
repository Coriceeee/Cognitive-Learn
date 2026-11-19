import {DTHU_CUTOFF_SOURCE} from './dthuHistoricalCutoffs.ts';
import {DTHU_SCHEME_2026} from './dthuScheme2026.ts';
import {HTU_SCHEME,QNU_SCHEME} from "./officialSchemePrograms2026.ts";
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
  admissionCode?: string; // exact published code, not inferred from acronym
  name: string;
  region: "Bắc" | "Trung" | "Nam";
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
      { year: 2026, schemeUrl: "https://admission.tdtu.edu.vn/dai-hoc/thong-bao-phuong-thuc-tuyen-sinh-dai-hoc-nam-2026", schemeLabel: "Thông báo phương thức tuyển sinh chính thức 2026", methods: ["THPT", "DGNL", "TAI_NANG"], methodNotes: "2026: xét tuyển tổng hợp từ điểm THPT + học bạ + tiêu chí năng lực (thang 100); ĐGNL ĐHQG TP.HCM (thang 1.200); xét tuyển thẳng. SAT/ACT có thể là điều kiện/thành phần riêng cho nhóm đối tượng theo thông báo, không phải điểm THPT thang 30.", cutoffUrl: "https://admission.tdtu.edu.vn/dai-hoc/diem-trung-tuyen-va-thu-tuc-nhap-hoc-trinh-do-dai-hoc-nam-2026", detailsStatus: "institution_method_verified" },
      { year: 2025, schemeUrl: "https://admission.tdtu.edu.vn/dai-hoc/tuyen-sinh/phuong-thuc-2025", schemeLabel: "Phương thức tuyển sinh 2025", methods: ["THPT", "DGNL", "TAI_NANG"], methodNotes: "2025: học bạ 6 học kỳ và thành tích, điểm thi THPT, ĐGNL ĐHQG TP.HCM, ưu tiên và tuyển thẳng. Cần xem cách tính điểm theo từng chương trình.", detailsStatus: "institution_method_verified" },
      { year: 2024, schemeUrl: "https://admission.tdtu.edu.vn/dai-hoc/tuyen-sinh/phuong-thuc-2024", schemeLabel: "Phương thức tuyển sinh 2024", methods: ["THPT", "DGNL", "TAI_NANG"], methodNotes: "2024: học bạ, thi THPT, ưu tiên/tuyển thẳng, ĐGNL; nhiều chương trình dùng điểm xét tuyển thang 40. Không so trực tiếp điểm 2024 với thang 2026.", detailsStatus: "institution_method_verified" },
    ],
  },
  {
    id: "hust", name: "Đại học Bách khoa Hà Nội (HUST)", region: "Bắc",
    fieldTags: ["Công nghệ thông tin", "Kỹ thuật", "Điện - điện tử", "Cơ khí", "Vật liệu"],
    portalUrl: "https://ts-hn.hust.edu.vn/", applicationUrl: "https://ts-hn.hust.edu.vn/",
    years: [
      { year: 2026, schemeUrl: "https://ts.hust.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026", schemeLabel: "Thông tin tuyển sinh chính thức 2026", methods: ["TAI_NANG", "TSA", "THPT"], methodNotes: "Ba nhóm chính: xét tuyển tài năng, TSA và điểm thi THPT; điều kiện chi tiết theo đề án năm 2026.", cutoffUrl: "https://hust.edu.vn/vi/news/tin-tuc-su-kien/diem-chuan-dai-hoc-bach-khoa-ha-noi-nam-2026-656013.html", detailsStatus: "institution_method_verified" },
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
      { year: 2026, schemeUrl: "https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/", schemeLabel: "Thông tin tuyển sinh HCMUS 2026", methods: ["TAI_NANG", "THPT", "DGNL", "KHAC"], methodNotes: "Trang chính thức công bố 39 ngành/nhóm ngành, 4.926 chỉ tiêu; phương thức 1a xét tuyển thẳng/ưu tiên, 1b diện thí sinh nước ngoài, phương thức 2 kết hợp kết quả THPT hoặc ĐGNL ĐHQG-HCM với học bạ. Chi tiết điều kiện theo từng ngành phải xem văn bản gốc.", cutoffUrl: "https://tuyensinh.hcmus.edu.vn/2026-diem-chuan/", detailsStatus: "institution_method_verified" },
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
      { year: 2026, schemeUrl: "https://tuyensinh.uit.edu.vn/2026-du-kien-phuong-huong-tuyen-sinh-dai-hoc-chinh-quy-nam-2026", schemeLabel: "Phương hướng tuyển sinh UIT 2026", methods: [], methodNotes: "Cổng chính thức có phương hướng tuyển sinh, đề án và thông báo 2026; nội dung chi tiết phương thức chưa được trích xuất và chuẩn hóa đầy đủ trong CLA.", cutoffUrl: "https://tuyensinh.uit.edu.vn/2026-thong-bao-diem-trung-tuyen-theo-phuong-thuc-xet-tuyen-tong-hop", detailsStatus: "official_archive_only" },
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
      { year: 2026, schemeUrl: "https://tuyensinh.uet.vnu.edu.vn/ban-nen-biet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/", schemeLabel: "Thông tin tuyển sinh đại học chính quy UET 2026", cutoffUrl: "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", methods: [], methodNotes: "Trường công bố thông tin tuyển sinh 2026 và tài liệu điều chỉnh; phương thức, điều kiện theo từng ngành chưa được CLA chuẩn hóa từ văn bản gốc.", detailsStatus: "official_archive_only" },
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
  {
    id:"agu", name:"Trường Đại học An Giang (AGU)", region:"Nam", fieldTags:["Công nghệ thông tin","Kinh tế","Luật","Sư phạm","Nông nghiệp","Khoa học dữ liệu"], portalUrl:"https://tuyensinh.agu.edu.vn/",
    years:[
      {year:2026,schemeUrl:"https://tuyensinh.agu.edu.vn/tuyen-sinh",schemeLabel:"Tuyển sinh 2026",methods:["TAI_NANG","KHAC"],methodNotes:"Tuyển thẳng và xét tuyển tổng hợp; kiểm tra hệ số chính thức, không dùng hệ số giả lập.",cutoffUrl:"https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-ve-viec-cong-bo-diem-chuan-trung-tuyen-dai-hoc-hinh-thuc-giao-duc-chinh-quy-nam-2026",detailsStatus:"institution_method_verified"},
      {year:2025,schemeUrl:"https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-cong-bo-diem-chuan-trung-tuyen-dai-hoc-hinh-thuc-giao-duc-chinh-quy-nam-2025",schemeLabel:"Thông báo điểm chuẩn 2025",methods:[],methodNotes:"Nguồn điểm chuẩn; chưa chuẩn hóa.",detailsStatus:"official_archive_only"},
      {year:2024,schemeUrl:"https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-cong-bo-diem-chuan-trung-tuyen-dai-hoc-hinh-thuc-chinh-quy-xet-tuyen-dua-tren-ket-qua-ky-thi-tot-nghiep-thpt-2024",schemeLabel:"Thông báo điểm chuẩn THPT 2024",methods:["THPT"],methodNotes:"Chưa nhập bảng điểm từng mã.",detailsStatus:"official_archive_only"}
    ]
  },
  {
    id:"ctu",name:"Đại học Cần Thơ (CTU)",region:"Nam",fieldTags:["Công nghệ thông tin","Kỹ thuật","Kinh tế","Luật","Sư phạm","Nông nghiệp","Y sinh"],portalUrl:"https://tuyensinh.ctu.edu.vn/",years:[
      {year:2026,schemeUrl:"https://tuyensinh.ctu.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh",schemeLabel:"Thông tin tuyển sinh 2026",methods:["THPT","KHAC"],methodNotes:"THPT, học bạ và V-SAT dùng điểm chuẩn chung sau quy đổi theo CTU.",cutoffUrl:"https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/1163-thong-bao-diem-chuan-trung-tuyen-dai-hoc-chinh-quy-nam-2026.html",detailsStatus:"institution_method_verified"},
      {year:2025,schemeUrl:"https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2025/TB2939_Thong-bao-bang-quy-doi-diem-Hoc-ba-nam-2025.pdf",schemeLabel:"Quy đổi học bạ 2025",cutoffUrl:"https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2025/diemchuan2025-tb.pdf",methods:["THPT","KHAC"],methodNotes:"Điểm chung quy đổi thang 30; học bạ và V-SAT theo quy định 2025. Đã nhập bảng điểm chính; chưa nhập bảng quy đổi từng môn.",detailsStatus:"institution_method_verified"},
      {year:2024,schemeUrl:"https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2024/diemchuanhocba.pdf",schemeLabel:"Bảng điểm học bạ 2024 (nguồn riêng, chưa nhập)",cutoffUrl:"https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/diemchuan-ptdt.pdf",methods:["THPT","KHAC"],methodNotes:"Đã nhập bảng PT2 THPT 2024 và tổ hợp. Học bạ là phương thức riêng; không dùng điểm THPT thay thế.",detailsStatus:"institution_method_verified"}]
  },
  {id:"hueuni",name:"Đại học Huế",region:"Trung",fieldTags:["Khoa học","Kinh tế","Luật","Y Dược","Sư phạm","Nông nghiệp","Ngoại ngữ"],portalUrl:"https://tuyensinh.hueuni.edu.vn/",years:[{year:2026,schemeUrl:"https://tuyensinh.hueuni.edu.vn/",schemeLabel:"Cổng tuyển sinh Đại học Huế",cutoffUrl:"https://tuyensinh.hueuni.edu.vn/News/Detail/quyet-dinh-ve-viec-cong-bo-diem-trung-tuyen-dot-1-tuyen-sinh-dai-hoc-he-chinh-quy-nam-2026-cua-dai-hoc-hue_20260810083011",methods:[],methodNotes:"Đã tìm thông báo đợt 1; chưa nhập bảng theo trường thành viên.",detailsStatus:"official_archive_only"}]},
  {id:"ued",name:"Trường Đại học Sư phạm – Đại học Đà Nẵng",region:"Trung",fieldTags:["Sư phạm","Giáo dục"],portalUrl:"https://tuyensinh.ued.udn.vn/",years:[{year:2026,schemeUrl:"https://tuyensinh.ued.udn.vn/index.php/dai-hoc-chinh-quy/tuyen-sinh-dai-hoc-chinh-quy/",schemeLabel:"Thông tin tuyển sinh",cutoffUrl:"https://tuyensinh.ued.udn.vn/index.php/2026/08/10/cong-bo-diem-trung-tuyen-vao-cac-nganh-tuyen-sinh-trinh-do-dai-hoc-hinh-thuc-dao-tao-chinh-quy-nam-2026/",methods:[],methodNotes:"Đã tìm thông báo đợt 1; chưa nhập bảng điểm.",detailsStatus:"official_archive_only"}]},
  {id:"neu",name:"Đại học Kinh tế Quốc dân (NEU)",region:"Bắc",fieldTags:["Kinh tế","Tài chính","Logistics","Công nghệ thông tin","Luật","Quản trị"],portalUrl:"https://neu.edu.vn/",years:[{year:2026,schemeUrl:"https://fit.neu.edu.vn/post/diem-chuan-dai-hoc-chinh-quy-2026-toan-bo-nganh",schemeLabel:"Điểm chuẩn toàn bộ 88 mã NEU 2026",cutoffUrl:"https://fit.neu.edu.vn/post/diem-chuan-dai-hoc-chinh-quy-2026-toan-bo-nganh",methods:[],methodNotes:"Điểm chung quy đổi thang 30; chưa chuẩn hóa công thức từng phương thức.",detailsStatus:"official_archive_only"}]},
  {id:"hnue",name:"Trường Đại học Sư phạm Hà Nội (HNUE)",region:"Bắc",fieldTags:["Sư phạm","Giáo dục"],portalUrl:"https://tuyensinh.hnue.edu.vn/",years:[{year:2026,schemeUrl:"https://tuyensinh.hnue.edu.vn/tuyensinh2026",schemeLabel:"Cổng tuyển sinh 2026",cutoffUrl:"https://tuyensinh.hnue.edu.vn/tuyensinh2026/698",methods:[],methodNotes:"Tìm thấy liên kết chính thức; chưa đọc được bảng điểm khi kiểm tra.",detailsStatus:"official_archive_only"}]},
  {id:"ump",name:"Đại học Y Dược Thành phố Hồ Chí Minh (UMP)",region:"Nam",fieldTags:["Y khoa","Dược","Điều dưỡng","Răng hàm mặt"],portalUrl:"https://ump.edu.vn/",years:[{year:2026,schemeUrl:"https://ump.edu.vn/tin-tuc-su-kien/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-he-chinh-quy-nam-2026/10140",schemeLabel:"Thông tin tuyển sinh 2026",cutoffUrl:"https://ump.edu.vn/tuyen-sinh-dao-tao/dai-hoc/tuyen-sinh/10836/thong-bao-diem-trung-tuyen-dai-hoc-he-chinh-quy-nam-2026",methods:[],methodNotes:"Chưa đọc được bảng điểm; không nhập dữ liệu cá nhân.",detailsStatus:"official_archive_only"},{year:2025,schemeUrl:"https://ump.edu.vn/tin-tuc-su-kien/thong-bao/thong-bao-diem-trung-tuyen-dai-hoc-he-chinh-quy-nam-2025/9062",schemeLabel:"Thông báo điểm trúng tuyển 2025",methods:[],methodNotes:"Liên kết nguồn; chưa chuẩn hóa bảng điểm.",detailsStatus:"official_archive_only"}]},
  {id:"ctump",name:"Trường Đại học Y Dược Cần Thơ (CTUMP)",region:"Nam",fieldTags:["Y khoa","Dược","Điều dưỡng","Răng hàm mặt","Khoa học sức khỏe"],portalUrl:"https://tuyensinh.ctump.edu.vn/",years:[{year:2026,schemeUrl:"https://news.ctump.edu.vn/thong-bao-tuyen-sinh-ai-hoc-nam-2026-37329",schemeLabel:"Thông báo tuyển sinh 2026",cutoffUrl:"https://tuyensinh.ctump.edu.vn/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026.html",methods:["THPT","KHAC"],methodNotes:"THPT và V-SAT theo thông báo trường; bảng điểm chưa nhập.",detailsStatus:"institution_method_verified"}]},
  {id:"ufm",name:"Trường Đại học Tài chính - Marketing (UFM)",region:"Nam",fieldTags:["Kinh tế","Marketing","Tài chính","Luật","Kinh doanh"],portalUrl:"https://ufm.edu.vn/",years:[{year:2026,schemeUrl:"https://dacc.ufm.edu.vn/ufm-cong-bo-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026--148.html",schemeLabel:"Thông tin tuyển sinh 2026",methods:["THPT","DGNL","KHAC"],methodNotes:"Đã tìm thông tin phương thức; bảng điểm trúng tuyển chưa nhập. Không dùng ngưỡng đầu vào làm điểm chuẩn.",detailsStatus:"institution_method_verified"}]},
{"id": "hus", "name": "Trường Đại học Khoa học Tự nhiên – ĐHQGHN", "region": "Bắc", "fieldTags": ["Khoa học", "Toán", "Công nghệ thông tin", "Môi trường"], "portalUrl": "https://tuyensinh.hus.vnu.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://hus.vnu.edu.vn/thong-bao/dao-tao-tuyen-sinh/thong-bao-diem-chuan-trung-tuyen-vao-cac-nganh-chuong-trinh-dao-tao-dai-hoc-chinh-quy-nam-2026-145795", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://hus.vnu.edu.vn/thong-bao/dao-tao-tuyen-sinh/thong-bao-diem-chuan-trung-tuyen-vao-cac-nganh-chuong-trinh-dao-tao-dai-hoc-chinh-quy-nam-2026-145795", "detailsStatus": "official_archive_only"}]},
{"id": "ulis", "name": "Trường Đại học Ngoại ngữ – ĐHQGHN", "region": "Bắc", "fieldTags": ["Ngôn ngữ", "Sư phạm", "Truyền thông", "Kinh tế"], "portalUrl": "https://ulis.vnu.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "detailsStatus": "official_archive_only"}]},
{"id": "vnuump", "name": "Trường Đại học Y Dược – ĐHQGHN", "region": "Bắc", "fieldTags": ["Y khoa", "Dược", "Điều dưỡng", "Khoa học sức khỏe"], "portalUrl": "https://ump.vnu.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "detailsStatus": "official_archive_only"}]},
{"id": "vju", "name": "Trường Đại học Việt Nhật – ĐHQGHN", "region": "Bắc", "fieldTags": ["Kỹ thuật", "Công nghệ", "Nhật Bản học"], "portalUrl": "https://vju.ac.vn/", "years": [{"year": 2026, "schemeUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "detailsStatus": "official_archive_only"}]},
{"id": "ueb", "name": "Trường Đại học Kinh tế – ĐHQGHN", "region": "Bắc", "fieldTags": ["Kinh tế", "Tài chính", "Kinh doanh", "Kế toán"], "portalUrl": "https://ueb.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "detailsStatus": "official_archive_only"}]},
{"id": "vnuis", "name": "Trường Quốc tế – ĐHQGHN", "region": "Bắc", "fieldTags": ["Kinh doanh", "Công nghệ thông tin", "Ngôn ngữ", "Liên kết quốc tế"], "portalUrl": "https://www.is.vnu.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://vnu.edu.vn/diem-chuan-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-post40358.html-0", "detailsStatus": "official_archive_only"}]},
{"id": "vnulaw", "name": "Trường Đại học Luật – ĐHQGHN", "region": "Bắc", "fieldTags": ["Luật"], "portalUrl": "https://law.vnu.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://law.vnu.edu.vn/diem-trung-tuyen-danh-sach-trung-tuyen-dai-hoc-chinh-quy-nam-2026-cua-truong-dai-hoc-luat-dai-hoc-quoc-gia-ha-noi/", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://law.vnu.edu.vn/diem-trung-tuyen-danh-sach-trung-tuyen-dai-hoc-chinh-quy-nam-2026-cua-truong-dai-hoc-luat-dai-hoc-quoc-gia-ha-noi/", "detailsStatus": "official_archive_only"}]},
{"id": "vnuued", "name": "Trường Đại học Giáo dục – ĐHQGHN", "region": "Bắc", "fieldTags": ["Sư phạm", "Giáo dục", "Tâm lý"], "portalUrl": "https://education.vnu.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://education.vnu.edu.vn/tuyen-sinh/dai-hoc-chinh-quy/diem-chuan-trung-tuyen-vao-dai-hoc-chinh-quy-nam-2026-cua-truong-dai-hoc-giao-duc-hqghn/", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://education.vnu.edu.vn/tuyen-sinh/dai-hoc-chinh-quy/diem-chuan-trung-tuyen-vao-dai-hoc-chinh-quy-nam-2026-cua-truong-dai-hoc-giao-duc-hqghn/", "detailsStatus": "official_archive_only"}]},
{"id": "tnue", "name": "Trường Đại học Sư phạm – Đại học Thái Nguyên", "region": "Bắc", "fieldTags": ["Sư phạm", "Giáo dục", "Ngôn ngữ"], "portalUrl": "https://tuyensinh.tnue.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://tuyensinh.tnue.edu.vn/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://tuyensinh.tnue.edu.vn/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026", "detailsStatus": "official_archive_only"}]},
{"id": "usshhn", "name": "Trường Đại học Khoa học Xã hội và Nhân văn – ĐHQGHN", "region": "Bắc", "fieldTags": ["Khoa học xã hội", "Báo chí", "Ngôn ngữ", "Tâm lý", "Du lịch"], "portalUrl": "https://tuyensinh.ussh.edu.vn/", "years": [{"year": 2026, "schemeUrl": "https://ussh.vnu.edu.vn/vi/news/dao-tao/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-truong-dai-hoc-khoa-hoc-xa-hoi-va-nhan-van-dhqghn-24295.html", "schemeLabel": "Thông báo điểm trúng tuyển 2026", "methods": [], "methodNotes": "Đã nhập bảng điểm công bố, chưa chuẩn hóa đầy đủ đề án, học phí và điều kiện từng phương thức.", "cutoffUrl": "https://ussh.vnu.edu.vn/vi/news/dao-tao/thong-bao-diem-trung-tuyen-dai-hoc-chinh-quy-nam-2026-truong-dai-hoc-khoa-hoc-xa-hoi-va-nhan-van-dhqghn-24295.html", "detailsStatus": "official_archive_only"}]},
  {id:"htu",admissionCode:"HHT",name:"Trường Đại học Hà Tĩnh (HTU)",region:"Trung",fieldTags:["Công nghệ thông tin","Kinh tế","Luật","Sư phạm","Nông nghiệp"],portalUrl:"https://tuyensinh.htu.edu.vn/",years:[
    {year:2026,schemeUrl:HTU_SCHEME,schemeLabel:"Thông tin tuyển sinh chính quy 2026",methods:["THPT","DGNL","TSA","TAI_NANG","KHAC"],methodNotes:"20 mã trong bảng công bố; THPT, học bạ, đánh giá năng lực/tư duy, tốt nghiệp ở nước ngoài, tuyển thẳng/ưu tiên. Môn năng khiếu và điều kiện riêng xem đề án.",detailsStatus:"institution_method_verified"},
    {year:2025,schemeUrl:"https://ts.htu.edu.vn/ts-dh/xet-tuyen-bs-2025",schemeLabel:"Thông báo xét tuyển bổ sung 2025",methods:[],methodNotes:"Nguồn lưu trữ đợt bổ sung, chưa nhập bảng điểm.",detailsStatus:"official_archive_only"},
    {year:2024,schemeUrl:"https://tuyensinh.htu.edu.vn/ts-dh/de-an-ts-2024",schemeLabel:"Đề án tuyển sinh 2024",methods:[],methodNotes:"Nguồn lưu trữ, chưa chuẩn hóa điều kiện.",detailsStatus:"official_archive_only"}]},
  {id:"qnu",admissionCode:"DQN",name:"Trường Đại học Quy Nhơn (QNU)",region:"Trung",fieldTags:["Khoa học dữ liệu","Công nghệ thông tin","Kỹ thuật","Kinh tế","Sư phạm"],portalUrl:"https://tuyensinh.qnu.edu.vn/",years:[
    {year:2026,schemeUrl:QNU_SCHEME,schemeLabel:"TB 1906 · thông tin tuyển sinh cập nhật 2026",methods:["THPT","DGNL","TAI_NANG","KHAC"],methodNotes:"53 mã trong bảng cập nhật, gồm THPT, học bạ, ĐGNL, THPT kết hợp năng khiếu và tuyển thẳng. Nguồn ghi tên môn, không ghi mã tổ hợp.",detailsStatus:"institution_method_verified"},
    {year:2025,schemeUrl:QNU_SCHEME,schemeLabel:"Bảng tuyển sinh 2025 tại mục 11 TB 1906",methods:[],methodNotes:"Bảng hồi cứu trong nguồn 2026; chưa gán thang hoặc phương thức cho điểm công bố.",detailsStatus:"official_archive_only"},
    {year:2024,schemeUrl:QNU_SCHEME,schemeLabel:"Bảng tuyển sinh 2024 tại mục 11 TB 1906",methods:[],methodNotes:"Bảng hồi cứu trong nguồn 2026; không dùng ô trống/không tuyển làm điểm chuẩn.",detailsStatus:"official_archive_only"}]},
  {id:"dthu",admissionCode:"SPD",name:"Trường Đại học Đồng Tháp (DThU)",region:"Nam",fieldTags:["Công nghệ thông tin","Kinh tế","Khoa học","Kỹ thuật","Sư phạm"],portalUrl:"https://tuyensinh.dthu.edu.vn/",years:[
    {year:2026,schemeUrl:DTHU_SCHEME_2026,schemeLabel:"Thông tin tuyển sinh dự kiến 2026 · mục 4.1–4.2",methods:["THPT","DGNL","TAI_NANG","KHAC"],methodNotes:"Đề án dự kiến có 57 mã đại học; năm phương thức cấp trường, không đồng nghĩa mọi ngành áp dụng tất cả. Mã 7620302 trong bảng điểm chưa đối chiếu tổ hợp.",cutoffUrl:DTHU_CUTOFF_SOURCE,detailsStatus:"institution_method_verified"},
    {year:2025,schemeUrl:DTHU_CUTOFF_SOURCE,schemeLabel:"Bảng điểm trúng tuyển 2025",methods:["THPT","DGNL","KHAC"],methodNotes:"Bảng điểm theo THPT, học bạ, V-SAT và ĐGNL; chưa nhập đủ điều kiện từng ngành.",cutoffUrl:DTHU_CUTOFF_SOURCE,detailsStatus:"institution_method_verified"},
    {year:2024,schemeUrl:DTHU_CUTOFF_SOURCE,schemeLabel:"Bảng điểm trúng tuyển 2024",methods:["THPT","DGNL","KHAC"],methodNotes:"Bảng điểm theo THPT, học bạ, ĐGNL; không có giá trị V-SAT trong bảng năm này.",cutoffUrl:DTHU_CUTOFF_SOURCE,detailsStatus:"institution_method_verified"}]},
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
    return normalizeForAdmissionSearch(`${university.name} ${university.admissionCode ?? ""} ${university.id} ${university.fieldTags.join(" ")}`).includes(needle);
  });
}
