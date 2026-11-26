/** UIT official 2026 composite-admission cutoff table.
 * Scores are on the published 100-point composite scale, including bonus and priority points.
 * Never compare these raw scores with the 30-point THPT or 1,200-point VNU-HCM aptitude scales.
 */
export const UIT_CUTOFF_2026_SOURCE = "https://tuyensinh.uit.edu.vn/sites/default/files/uploads/files/202608/1786251355631_4922612359185114090_g8137726995995895893_d05d950a8ec4b023b735c2276bfe982d.jpg";
const rows: Array<[string,string,number]> = [
 ["7320104","Truyền thông đa phương tiện",82.20],
 ["7340122","Thương mại điện tử",79.00],
 ["7460108","Khoa học dữ liệu",91.70],
 ["7460108TA","Khoa học dữ liệu (chương trình dạy và học bằng tiếng Anh)",85.50],
 ["7480101","Khoa học máy tính",88.50],
 ["7480101TA","Khoa học máy tính (chương trình dạy và học bằng tiếng Anh)",85.00],
 ["7480102","Mạng máy tính và truyền thông dữ liệu",78.30],
 ["7480103","Kỹ thuật phần mềm",81.00],
 ["7480103TA","Kỹ thuật phần mềm (chương trình dạy và học bằng tiếng Anh)",76.00],
 ["7480104","Hệ thống thông tin",80.80],
 ["7480104TT","Hệ thống thông tin (chương trình tiên tiến)",78.00],
 ["7480106","Kỹ thuật máy tính",84.00],
 ["7480107","Trí tuệ nhân tạo",100.00],
 ["7480201","Công nghệ thông tin",84.20],
 ["7480201VN","Công nghệ thông tin Việt Nhật",80.00],
 ["7480202","An toàn thông tin",88.70],
 ["7480202TA","An toàn thông tin (chương trình dạy và học bằng tiếng Anh)",77.50],
 ["75202A1","Thiết kế vi mạch",90.50],
 ["75202A1TA","Thiết kế vi mạch (chương trình dạy và học bằng tiếng Anh)",80.00],
];
export const uitCompositeCutoffs2026 = rows.map(([code,major,cutoff])=>({
 universityId:"uit",university:"Trường Đại học Công nghệ Thông tin – ĐHQG-HCM (UIT)",campus:"UIT",
 code,major,year:2026 as const,method:"UIT_2026_COMPOSITE",
 label:"Xét tuyển tổng hợp (thang điểm 100)",scale:100,cutoff,
 source:UIT_CUTOFF_2026_SOURCE,
 note:"Điểm trúng tuyển theo phương thức xét tuyển tổng hợp, thang 100; bảng công bố ghi đã bao gồm điểm cộng và điểm ưu tiên. Không so trực tiếp với điểm THPT thang 30 hoặc ĐGNL ĐHQG-HCM thang 1.200.",
 reviewedAt:"2026-11-25",
}));
