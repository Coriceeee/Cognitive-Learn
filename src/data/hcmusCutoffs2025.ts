/** HCMUS 2025 method-specific cutoff records transcribed from the official six-panel announcement.
 * Scope is deliberately limited to the A00 column of method 2, all method-3 DGNL values,
 * and all ten method-1d certificate + THPT values. Other THPT combinations and method 1b/1c
 * are not imputed. Scores include the bonus/priority points as stated in the source tables.
 */
export const HCMUS_CUTOFF_2025 = "https://tuyensinh.hcmus.edu.vn/2025-diem-chuan-cac-phuong-thuc/";
const rows: Array<[string,string,number,number,number?]> = [
 // code, major, method-2 THPT A00 /30, method-3 HCMUS DGNL /1200, method-1d /30 (when published)
 ["7140103","Công nghệ giáo dục",24.25,797],
 ["7420101","Sinh học",22.10,696],
 ["7420101_DKD","Sinh học (CT tăng cường tiếng Anh)",21.50,673,25.70],
 ["7420201","Công nghệ Sinh học",24.72,817],
 ["7420201_DKD","Công nghệ Sinh học (CT tăng cường tiếng Anh)",24.30,800,26.99],
 ["7440102_DKD","Vật lý học (CT tăng cường tiếng Anh)",24.40,804,27.11],
 ["7440102_NN","Nhóm ngành Vật lý học, Công nghệ Vật lý điện tử và tin học",26.75,917],
 ["7440112","Hóa học",26.18,886],
 ["7440112_DKD","Hóa học (CT tăng cường tiếng Anh)",24.25,797,26.99],
 ["7440122","Khoa học Vật liệu",24.10,790],
 ["7440122_DKD","Khoa học Vật liệu (CT tăng cường tiếng Anh)",23.10,742,26.50],
 ["7440201_NN","Nhóm ngành Địa chất học, Kinh tế đất đai",22.30,707],
 ["7440228","Hải dương học",22.40,711],
 ["7440301","Khoa học Môi trường",21.20,658],
 ["7440301_DKD","Khoa học Môi trường (CT tăng cường tiếng Anh)",19.00,573,24.49],
 ["7460101_NN","Nhóm ngành Toán học (Toán học, Toán ứng dụng, Toán tin)",26.61,910],
 ["7460108_NN","Nhóm ngành Khoa học dữ liệu, Thống kê",28.50,1019],
 ["7480101_TT","Khoa học máy tính (CT Tiên tiến)",29.92,1136,29.98],
 ["7480107","Trí tuệ nhân tạo",29.39,1092],
 ["7480201_DKD","Công nghệ thông tin (CT tăng cường tiếng Anh)",25.87,906,28.99],
 ["7480201_NN","Nhóm ngành máy tính và Công nghệ thông tin",27.27,972],
 ["7510401_DKD","Công nghệ kỹ thuật Hóa học (CT tăng cường tiếng Anh)",25.22,842,27.49],
 ["7510402","Công nghệ Vật liệu",25.07,832],
 ["7510406","Công nghệ kỹ thuật Môi trường",21.50,673],
 ["7520207","Kỹ thuật điện tử - viễn thông",26.50,910],
 ["7520207_DKD","Kỹ thuật điện tử - viễn thông (CT tăng cường tiếng Anh)",25.70,864,27.69],
 ["75202a1","Thiết kế vi mạch",28.27,1002],
 ["7520402","Kỹ thuật hạt nhân",25.95,876],
 ["7520403","Vật lý y khoa",26.13,882],
 ["7520501","Kỹ thuật địa chất",22.70,723],
 ["7850101","Quản lý tài nguyên và môi trường",22.00,693],
];
export const hcmusCutoffs2025 = rows.flatMap(([code,major,thptA00,dgnl,certificate]) => [
 {universityId:"hcmus",university:"Trường Đại học Khoa học tự nhiên – ĐHQG-HCM",campus:"HCMUS",code,major,year:2025 as const,method:"HCMUS_2025_THPT_A00",label:"Điểm thi THPT · tổ hợp A00 (phương thức 2)",scale:30,cutoff:thptA00,source:HCMUS_CUTOFF_2025,note:"Chỉ là ngưỡng trúng tuyển công bố cho tổ hợp A00 năm 2025; điểm đã gồm điểm cộng và điểm ưu tiên. Không thay thế điểm của A01/B00/C01/D01/D07 hoặc phương thức khác.",reviewedAt:"2026-11-25"},
 {universityId:"hcmus",university:"Trường Đại học Khoa học tự nhiên – ĐHQG-HCM",campus:"HCMUS",code,major,year:2025 as const,method:"HCMUS_2025_DGNL",label:"Đánh giá năng lực ĐHQG-HCM (phương thức 3)",scale:1200,cutoff:dgnl,source:HCMUS_CUTOFF_2025,note:"Điểm trúng tuyển phương thức 3 theo thang ĐGNL; không so trực tiếp với thang điểm THPT 30.",reviewedAt:"2026-11-25"},
 ...(certificate===undefined?[]:[{universityId:"hcmus",university:"Trường Đại học Khoa học tự nhiên – ĐHQG-HCM",campus:"HCMUS",code,major,year:2025 as const,method:"HCMUS_2025_CERT_THPT",label:"Chứng chỉ ngoại ngữ quốc tế kết hợp học bạ THPT (phương thức 1d)",scale:30,cutoff:certificate,source:HCMUS_CUTOFF_2025,note:"Chỉ áp dụng cho chương trình có dòng điểm công bố tại phương thức 1d; không suy rộng sang chương trình khác. Điểm đã gồm điểm cộng và điểm ưu tiên.",reviewedAt:"2026-11-25"}])
]);
