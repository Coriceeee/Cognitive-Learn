/** UIT official historical cutoff tables transcribed from the university's published result images.
 * The two methods and their score scales remain separate. This file does not include
 * UIT's early/priority-admission cutoffs because those are not part of these four tables.
 */
const sources = {
  y2024Thpt: "https://tuyensinh.uit.edu.vn/sites/default/files/uploads/images/202408/diem_trung_tuyen_2024.png",
  y2024Dgnl: "https://tuyensinh.uit.edu.vn/sites/default/files/uploads/images/202407/cong_bo_web_dgnl_2_0.png",
  y2025Thpt: "https://tuyensinh.uit.edu.vn/sites/default/files/uploads/images/202508/trung_hoc_pho_thong_1.png",
  y2025Dgnl: "https://tuyensinh.uit.edu.vn/sites/default/files/uploads/images/202508/danh_gia_nang_luc_0.png",
} as const;
type Row = readonly [code: string, major: string, cutoff: number];
const thpt2024: readonly Row[] = [
  ["7340122","Thương mại điện tử",26.12],
  ["7460108","Khoa học dữ liệu",27.5],
  ["7480101","Khoa học máy tính",27.3],
  ["7480107","Trí tuệ nhân tạo",28.3],
  ["7480102","Mạng máy tính và truyền thông dữ liệu",25.7],
  ["7480103","Kỹ thuật phần mềm",26.85],
  ["7480104","Hệ thống thông tin",26.25],
  ["7480104_TT","Hệ thống thông tin (chương trình tiên tiến)",25.55],
  ["7480106","Kỹ thuật máy tính",26.25],
  ["7480201","Công nghệ thông tin",27.1],
  ["7480201_N","Công nghệ thông tin (Việt Nhật)",25.55],
  ["7480202","An toàn thông tin",26.77],
  ["75202a1","Thiết kế vi mạch",26.5],
];
const dgnl2024: readonly Row[] = [
  ["7340122","Thương mại điện tử",870],
  ["7460108","Khoa học dữ liệu",935],
  ["7480101","Khoa học máy tính",925],
  ["7480102","Mạng máy tính và truyền thông dữ liệu",855],
  ["7480103","Kỹ thuật phần mềm",926],
  ["7480104","Hệ thống thông tin",880],
  ["7480104_TT","Hệ thống thông tin (chương trình tiên tiến)",850],
  ["7480106","Kỹ thuật máy tính",888],
  ["7480107","Trí tuệ nhân tạo",980],
  ["7480201","Công nghệ thông tin",915],
  ["7480201_N","Công nghệ thông tin (Việt Nhật)",850],
  ["7480202","An toàn thông tin",910],
  ["75202a1","Thiết kế vi mạch",910],
];
const thpt2025: readonly Row[] = [
  ["7320104","Truyền thông đa phương tiện",25.00],
  ["7340122","Thương mại điện tử",24.57],
  ["7460108","Khoa học dữ liệu",27.70],
  ["7480101","Khoa học máy tính",27.20],
  ["7480102","Mạng máy tính và truyền thông dữ liệu",24.00],
  ["7480103","Kỹ thuật phần mềm",26.00],
  ["7480104","Hệ thống thông tin",24.70],
  ["7480104_TT","Hệ thống thông tin (chương trình tiên tiến)",24.20],
  ["7480106","Kỹ thuật máy tính",25.30],
  ["7480107","Trí tuệ nhân tạo",29.60],
  ["7480201","Công nghệ thông tin",26.60],
  ["7480201_VN","Công nghệ thông tin (Việt Nhật)",24.20],
  ["7480202","An toàn thông tin",26.27],
  ["75202A1","Thiết kế vi mạch",27.00],
];
const dgnl2025: readonly Row[] = [
  ["7320104","Truyền thông đa phương tiện",911],
  ["7340122","Thương mại điện tử",889],
  ["7460108","Khoa học dữ liệu",993],
  ["7480101","Khoa học máy tính",993],
  ["7480102","Mạng máy tính và truyền thông dữ liệu",854],
  ["7480103","Kỹ thuật phần mềm",946],
  ["7480104","Hệ thống thông tin",891],
  ["7480104_TT","Hệ thống thông tin (chương trình tiên tiến)",867],
  ["7480106","Kỹ thuật máy tính",923],
  ["7480107","Trí tuệ nhân tạo",1098],
  ["7480201","Công nghệ thông tin",956],
  ["7480201_VN","Công nghệ thông tin (Việt Nhật)",867],
  ["7480202","An toàn thông tin",956],
  ["75202A1","Thiết kế vi mạch",984],
];
const base = {
  universityId: "uit",
  university: "Trường Đại học Công nghệ Thông tin – ĐHQG-HCM (UIT)",
  campus: "UIT",
  reviewedAt: "2026-11-25",
};
function records(year: 2024|2025, method: string, label: string, scale: number, source: string, note: string, rows: readonly Row[]) {
  return rows.map(([code,major,cutoff]) => ({
    ...base, code, major, year, method, label, scale, cutoff, source, note,
  }));
}
export const uitHistoricalCutoffs = [
  ...records(2024,"UIT_2024_THPT","Thi tốt nghiệp THPT (phương thức 100)",30,sources.y2024Thpt,
    "Điểm chuẩn thang 30 theo bảng công bố chính thức; ảnh nguồn ghi đã tính điểm ưu tiên. Không suy rộng sang phương thức ĐGNL hoặc các chương trình không có dòng điểm.",thpt2024),
  ...records(2024,"UIT_2024_DGNL","Đánh giá năng lực ĐHQG-HCM (phương thức 401)",1200,sources.y2024Dgnl,
    "Điểm chuẩn thang 1.200 theo bảng công bố chính thức; ảnh nguồn ghi đã tính điểm ưu tiên. Không quy đổi hoặc so trực tiếp với thang THPT 30.",dgnl2024),
  ...records(2025,"UIT_2025_THPT","Thi tốt nghiệp THPT (phương thức 3)",30,sources.y2025Thpt,
    "Điểm trúng tuyển thang 30; bảng công bố ghi đã bao gồm điểm cộng và điểm ưu tiên. Đây là phương thức 3, không đại diện cho phương thức tuyển thẳng/ưu tiên.",thpt2025),
  ...records(2025,"UIT_2025_DGNL","Đánh giá năng lực ĐHQG-HCM (phương thức 2)",1200,sources.y2025Dgnl,
    "Điểm trúng tuyển thang 1.200; bảng công bố ghi đã bao gồm điểm cộng và điểm ưu tiên. Đây là phương thức 2, không so trực tiếp với thang THPT 30.",dgnl2025),
];
