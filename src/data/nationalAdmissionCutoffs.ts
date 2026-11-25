import {dthuHistoricalCutoffs} from './dthuHistoricalCutoffs.ts';
import { expanded2026Cutoffs } from "./expanded2026Cutoffs.ts";
import { ctuHistoricalCutoffs } from './ctuHistoricalCutoffs.ts';
import { HCMUS_CUTOFF_2026 } from './hcmusCombinations2026.ts';
import { hcmusCutoffs2025 } from './hcmusCutoffs2025.ts';
// Manually transcribed public numerical facts; 2026 main round. No inferred missing rows.
export type ExternalCutoff = { universityId: string; university: string; campus: string; code: string; major: string; year: 2024|2025|2026; method: string; label: string; scale: number; cutoff: number; source: string; note: string; reviewedAt: string; combinations?: string[] };
const aguSource = 'https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-ve-viec-cong-bo-diem-chuan-trung-tuyen-dai-hoc-hinh-thuc-giao-duc-chinh-quy-nam-2026';
const ctuSource = 'https://tuyensinh.ctu.edu.vn/images/upload/TT_TS/2026/TB2532_Thong-bao-ket-qua-va-diem-chuan_2026_web.pdf';
const hustSource = 'https://seee.hust.edu.vn/vi/tin-tuc/2026-08-09_diem-chuan-2026-chao-tan-sinh-vien-k71/';
const aguRows = [
 [
  "7620112",
  "Bảo vệ thực vật",
  64.0
 ],
 [
  "7620105",
  "Chăn nuôi",
  50.0
 ],
 [
  "7310201",
  "Chính trị học",
  74.3
 ],
 [
  "7510401",
  "Công nghệ kỹ thuật hóa học",
  63.0
 ],
 [
  "7510406",
  "Công nghệ kỹ thuật môi trường",
  60.0
 ],
 [
  "7620190",
  "Công nghệ nông nghiệp số",
  50.0
 ],
 [
  "7540104",
  "Công nghệ sau thu hoạch",
  50.0
 ],
 [
  "7420201",
  "Công nghệ sinh học",
  50.0
 ],
 [
  "7480201",
  "Công nghệ thông tin",
  50.0
 ],
 [
  "7540101",
  "Công nghệ thực phẩm",
  66.0
 ],
 [
  "7540106",
  "Đảm bảo chất lượng và an toàn thực phẩm",
  50.0
 ],
 [
  "7140205",
  "Giáo dục chính trị",
  82.06
 ],
 [
  "7140201",
  "Giáo dục mầm non",
  78.9
 ],
 [
  "7140202",
  "Giáo dục tiểu học",
  82.79
 ],
 [
  "7340301",
  "Kế toán",
  57.0
 ],
 [
  "7620110",
  "Khoa học cây trồng",
  59.0
 ],
 [
  "7460108",
  "Khoa học dữ liệu",
  52.2
 ],
 [
  "7620191",
  "Kinh doanh nông nghiệp số",
  58.0
 ],
 [
  "7310106",
  "Kinh tế quốc tế",
  50.0
 ],
 [
  "7480103",
  "Kỹ thuật phần mềm",
  50.0
 ],
 [
  "7380101",
  "Luật",
  66.67
 ],
 [
  "7340115",
  "Marketing",
  55.5
 ],
 [
  "7220201",
  "Ngôn ngữ Anh",
  67.6
 ],
 [
  "7620301",
  "Nuôi trồng thủy sản",
  60.0
 ],
 [
  "7620116",
  "Phát triển nông thôn",
  55.0
 ],
 [
  "7850101",
  "Quản lý tài nguyên và môi trường",
  62.1
 ],
 [
  "7340101",
  "Quản trị kinh doanh",
  52.0
 ],
 [
  "7140219",
  "Sư phạm địa lý",
  84.29
 ],
 [
  "7140212",
  "Sư phạm hóa học",
  86.6
 ],
 [
  "7140247",
  "Sư phạm khoa học tự nhiên",
  82.81
 ],
 [
  "7140218",
  "Sư phạm lịch sử",
  86.49
 ],
 [
  "7140249",
  "Sư phạm lịch sử - địa lý",
  84.18
 ],
 [
  "7140217",
  "Sư phạm ngữ văn",
  84.8
 ],
 [
  "7140213",
  "Sư phạm sinh học",
  82.39
 ],
 [
  "7140231",
  "Sư phạm tiếng Anh",
  84.37
 ],
 [
  "7140209",
  "Sư phạm toán học",
  87.98
 ],
 [
  "7140211",
  "Sư phạm vật lý",
  86.21
 ],
 [
  "7340201",
  "Tài chính - ngân hàng",
  50.0
 ],
 [
  "7640101",
  "Thú y",
  63.2
 ],
 [
  "7340122",
  "Thương mại điện tử",
  50.0
 ],
 [
  "7229001",
  "Triết học",
  75.5
 ],
 [
  "7229030",
  "Văn học",
  79.8
 ],
 [
  "7310630",
  "Việt Nam học",
  70.5
 ]
] as const;
const ctuRows = [
 [
  "7420201T",
  "Công nghệ sinh học (CTTT)",
  15.0
 ],
 [
  "7620301T",
  "Nuôi trồng thủy sản (CTTT)",
  15.0
 ],
 [
  "7220201C",
  "Ngôn ngữ Anh (CTCLC)",
  23.4
 ],
 [
  "7340101C",
  "Quản trị kinh doanh (CTCLC)",
  20.01
 ],
 [
  "7340120C",
  "Kinh doanh quốc tế (CTCLC)",
  21.5
 ],
 [
  "7340201C",
  "Tài chính - ngân hàng (CTCLC)",
  20.85
 ],
 [
  "7480102C",
  "Mạng máy tính và truyền thông dữ liệu (CTCLC)",
  18.85
 ],
 [
  "7480103C",
  "Kỹ thuật phần mềm (CTCLC)",
  20.1
 ],
 [
  "7480104C",
  "Hệ thống thông tin (CTCLC)",
  19.28
 ],
 [
  "7480201C",
  "Công nghệ thông tin (CTCLC)",
  21.4
 ],
 [
  "7510401C",
  "Công nghệ kỹ thuật hóa học (CTCLC)",
  17.0
 ],
 [
  "7520103C",
  "Kỹ thuật cơ khí (CTCLC)",
  19.5
 ],
 [
  "7520201C",
  "Kỹ thuật điện (CTCLC)",
  20.86
 ],
 [
  "7520216C",
  "Kỹ thuật điều khiển và tự động hóa (CTCLC)",
  22.0
 ],
 [
  "7540101C",
  "Công nghệ thực phẩm (CTCLC)",
  15.0
 ],
 [
  "7580201C",
  "Kỹ thuật xây dựng (CTCLC)",
  15.0
 ],
 [
  "7620112C",
  "Bảo vệ thực vật (CTCLC)",
  15.0
 ],
 [
  "7640101C",
  "Thú y (CTCLC)",
  17.12
 ],
 [
  "7810103C",
  "Quản trị dịch vụ du lịch và lữ hành (CTCLC)",
  19.2
 ],
 [
  "7140201",
  "Giáo dục mầm non",
  25.82
 ],
 [
  "7140202",
  "Giáo dục tiểu học",
  26.85
 ],
 [
  "7140204",
  "Giáo dục công dân",
  26.68
 ],
 [
  "7140206",
  "Giáo dục thể chất",
  25.36
 ],
 [
  "7140209",
  "Sư phạm toán học",
  28.12
 ],
 [
  "7140210",
  "Sư phạm tin học",
  26.16
 ],
 [
  "7140211",
  "Sư phạm vật lý",
  27.62
 ],
 [
  "7140212",
  "Sư phạm hóa học",
  27.93
 ],
 [
  "7140213",
  "Sư phạm sinh học",
  26.6
 ],
 [
  "7140217",
  "Sư phạm ngữ văn",
  27.16
 ],
 [
  "7140218",
  "Sư phạm lịch sử",
  27.82
 ],
 [
  "7140219",
  "Sư phạm địa lý",
  27.25
 ],
 [
  "7140231",
  "Sư phạm tiếng Anh",
  27.06
 ],
 [
  "7140233",
  "Sư phạm tiếng Pháp",
  23.54
 ],
 [
  "7140247",
  "Sư phạm khoa học tự nhiên",
  27.09
 ],
 [
  "7140249",
  "Sư phạm lịch sử - địa lý",
  26.77
 ],
 [
  "7220201",
  "Ngôn ngữ Anh",
  24.37
 ],
 [
  "7220201H",
  "Ngôn ngữ Anh - cơ sở Hậu Giang",
  21.6
 ],
 [
  "7220203",
  "Ngôn ngữ Pháp",
  20.15
 ],
 [
  "7229001",
  "Triết học",
  23.55
 ],
 [
  "7229030",
  "Văn học",
  25.47
 ],
 [
  "7310101",
  "Kinh tế",
  22.51
 ],
 [
  "7310201",
  "Chính trị học",
  25.08
 ],
 [
  "7310301",
  "Xã hội học",
  24.01
 ],
 [
  "7310403",
  "Tâm lý học giáo dục",
  24.15
 ],
 [
  "7320101",
  "Báo chí",
  24.9
 ],
 [
  "7320104",
  "Truyền thông đa phương tiện",
  23.9
 ],
 [
  "7320201",
  "Thông tin - thư viện",
  19.65
 ],
 [
  "7340101",
  "Quản trị kinh doanh",
  22.24
 ],
 [
  "7340101H",
  "Quản trị kinh doanh - cơ sở Hậu Giang",
  17.1
 ],
 [
  "7340115",
  "Marketing",
  23.4
 ],
 [
  "7340120",
  "Kinh doanh quốc tế",
  23.54
 ],
 [
  "7340121",
  "Kinh doanh thương mại",
  22.4
 ],
 [
  "7340122",
  "Thương mại điện tử",
  22.41
 ],
 [
  "7340201",
  "Tài chính - ngân hàng",
  23.97
 ],
 [
  "7340205",
  "Công nghệ tài chính",
  21.68
 ],
 [
  "7340301",
  "Kế toán",
  23.78
 ],
 [
  "7340301S",
  "Kế toán - khu Sóc Trăng",
  19.3
 ],
 [
  "7340302",
  "Kiểm toán",
  23.09
 ],
 [
  "7380101",
  "Luật",
  23.88
 ],
 [
  "7380101H",
  "Luật - cơ sở Hậu Giang",
  20.0
 ],
 [
  "7380101S",
  "Luật - khu Sóc Trăng",
  20.0
 ],
 [
  "7380103",
  "Luật dân sự và tố tụng dân sự",
  20.55
 ],
 [
  "7380107",
  "Luật kinh tế",
  24.5
 ],
 [
  "7420101",
  "Sinh học",
  21.36
 ],
 [
  "7420201",
  "Công nghệ sinh học",
  21.53
 ],
 [
  "7420203",
  "Sinh học ứng dụng",
  19.55
 ],
 [
  "7440112",
  "Hóa học",
  24.63
 ],
 [
  "7440301",
  "Khoa học môi trường",
  15.0
 ],
 [
  "7460108",
  "Khoa học dữ liệu",
  19.2
 ],
 [
  "7460112",
  "Toán ứng dụng",
  23.8
 ],
 [
  "7460201",
  "Thống kê",
  19.24
 ],
 [
  "7480101",
  "Khoa học máy tính",
  23.22
 ],
 [
  "7480102",
  "Mạng máy tính và truyền thông dữ liệu",
  20.7
 ],
 [
  "7480103",
  "Kỹ thuật phần mềm",
  22.2
 ],
 [
  "7480104",
  "Hệ thống thông tin",
  20.85
 ],
 [
  "7480106",
  "Kỹ thuật máy tính (Thiết kế vi mạch bán dẫn)",
  24.03
 ],
 [
  "7480107",
  "Trí tuệ nhân tạo",
  20.55
 ],
 [
  "7480201",
  "Công nghệ thông tin",
  23.73
 ],
 [
  "7480201H",
  "Công nghệ thông tin - cơ sở Hậu Giang",
  17.6
 ],
 [
  "7480202",
  "An toàn thông tin",
  22.85
 ],
 [
  "7510401",
  "Công nghệ kỹ thuật hóa học",
  24.61
 ],
 [
  "7510601",
  "Quản lý công nghiệp",
  21.83
 ],
 [
  "7510605",
  "Logistics và quản lý chuỗi cung ứng",
  24.32
 ],
 [
  "7510605S",
  "Logistics và quản lý chuỗi cung ứng - khu Sóc Trăng",
  17.75
 ],
 [
  "7520103",
  "Kỹ thuật cơ khí (Cơ khí chế tạo máy)",
  23.84
 ],
 [
  "7520114",
  "Kỹ thuật cơ điện tử",
  24.22
 ],
 [
  "7520130",
  "Kỹ thuật ô tô",
  23.2
 ],
 [
  "7520201",
  "Kỹ thuật điện",
  23.6
 ],
 [
  "7520207",
  "Kỹ thuật điện tử - viễn thông",
  22.69
 ],
 [
  "7520212",
  "Kỹ thuật y sinh",
  22.0
 ],
 [
  "7520216",
  "Kỹ thuật điều khiển và tự động hóa",
  25.33
 ],
 [
  "7520309",
  "Kỹ thuật vật liệu",
  21.51
 ],
 [
  "7520320",
  "Kỹ thuật môi trường",
  15.95
 ],
 [
  "7520401",
  "Vật lý kỹ thuật",
  22.46
 ],
 [
  "7540101",
  "Công nghệ thực phẩm",
  21.55
 ],
 [
  "7540104",
  "Công nghệ sau thu hoạch",
  15.0
 ],
 [
  "7540105",
  "Công nghệ chế biến thủy sản",
  16.3
 ],
 [
  "7540106",
  "Đảm bảo chất lượng và an toàn thực phẩm",
  19.0
 ],
 [
  "7580101",
  "Kiến trúc",
  15.5
 ],
 [
  "7580105",
  "Quy hoạch vùng và đô thị",
  15.0
 ],
 [
  "7580201",
  "Kỹ thuật xây dựng",
  18.5
 ],
 [
  "7580202",
  "Kỹ thuật xây dựng công trình thủy",
  15.0
 ],
 [
  "7580205",
  "Kỹ thuật xây dựng công trình giao thông",
  15.0
 ],
 [
  "7580213",
  "Kỹ thuật cấp thoát nước",
  15.0
 ],
 [
  "7580302",
  "Quản lý xây dựng",
  15.0
 ],
 [
  "7620103",
  "Khoa học đất (Quản lý đất và công nghệ phân bón)",
  15.0
 ],
 [
  "7620105",
  "Chăn nuôi",
  15.0
 ],
 [
  "7620109",
  "Nông học",
  15.0
 ],
 [
  "7620110",
  "Khoa học cây trồng",
  15.0
 ],
 [
  "7620112",
  "Bảo vệ thực vật",
  15.0
 ],
 [
  "7620113",
  "Công nghệ rau hoa quả và cảnh quan",
  15.0
 ],
 [
  "7620114",
  "Kinh doanh nông nghiệp",
  17.0
 ],
 [
  "7620114H",
  "Kinh doanh nông nghiệp - cơ sở Hậu Giang",
  15.0
 ],
 [
  "7620115",
  "Kinh tế nông nghiệp",
  20.1
 ],
 [
  "7620115H",
  "Kinh tế nông nghiệp - cơ sở Hậu Giang",
  15.0
 ],
 [
  "7620301",
  "Nuôi trồng thủy sản",
  15.0
 ],
 [
  "7620302",
  "Bệnh học thủy sản",
  15.0
 ],
 [
  "7620305",
  "Quản lý thủy sản",
  15.0
 ],
 [
  "7640101",
  "Thú y",
  22.45
 ],
 [
  "7720203",
  "Hóa dược",
  23.9
 ],
 [
  "7810101",
  "Du lịch",
  24.88
 ],
 [
  "7810101H",
  "Du lịch - cơ sở Hậu Giang",
  21.85
 ],
 [
  "7810101S",
  "Du lịch - khu Sóc Trăng",
  20.15
 ],
 [
  "7810103",
  "Quản trị dịch vụ du lịch và lữ hành",
  21.85
 ],
 [
  "7850101",
  "Quản lý tài nguyên và môi trường",
  15.11
 ],
 [
  "7850102",
  "Kinh tế tài nguyên thiên nhiên",
  19.4
 ],
 [
  "7850103",
  "Quản lý đất đai",
  16.5
 ]
] as const;
const hustRows = [
 [
  "EE2",
  "Kỹ thuật điều khiển - tự động hóa",
  28.98,
  76.5
 ],
 [
  "EE-E8",
  "Kỹ thuật điều khiển - tự động hóa (CTTT)",
  28.75,
  74.31
 ],
 [
  "ET1",
  "Kỹ thuật điện tử - viễn thông",
  28.57,
  73.13
 ],
 [
  "ET-E9",
  "Hệ thống nhúng thông minh và IoT (CTTT)",
  28.4,
  72.0
 ],
 [
  "EE1",
  "Kỹ thuật điện",
  28.24,
  70.95
 ],
 [
  "ET-E4",
  "Kỹ thuật điện tử - viễn thông (CTTT)",
  28.13,
  70.22
 ],
 [
  "EE-EP",
  "Tin học công nghiệp và tự động hóa (PFIEV)",
  28.13,
  70.22
 ],
 [
  "ET-E16",
  "Truyền thông số và kỹ thuật đa phương tiện (CTTT)",
  27.48,
  66.71
 ],
 [
  "ET-LUH",
  "Điện tử - viễn thông (Leibniz Hannover)",
  27.45,
  66.58
 ],
 [
  "EE-E18",
  "Hệ thống điện và năng lượng tái tạo (CTTT)",
  27.29,
  65.89
 ],
 [
  "ET2",
  "Kỹ thuật y sinh",
  27.15,
  65.29
 ],
 [
  "ET-E5",
  "Kỹ thuật y sinh (CTTT)",
  26.74,
  63.53
 ]
] as const;
const neuSource = 'https://fit.neu.edu.vn/post/diem-chuan-dai-hoc-chinh-quy-2026-toan-bo-nganh';
const neuRows = [
 [
  "7480202",
  "An toàn thông tin",
  26.0
 ],
 [
  "7340204",
  "Bảo hiểm",
  25.35
 ],
 [
  "7340116",
  "Bất động sản",
  25.36
 ],
 [
  "EP20",
  "Công nghệ logistics và quản lý chuỗi cung ứng",
  27.39
 ],
 [
  "EP19",
  "Công nghệ marketing",
  26.68
 ],
 [
  "EP26",
  "Công nghệ môi trường và phát triển bền vững",
  23.48
 ],
 [
  "7340205",
  "Công nghệ tài chính",
  27.52
 ],
 [
  "EP09",
  "Công nghệ tài chính và ngân hàng số",
  26.86
 ],
 [
  "7480201",
  "Công nghệ thông tin",
  25.68
 ],
 [
  "7480104",
  "Hệ thống thông tin",
  27.09
 ],
 [
  "7340405",
  "Hệ thống thông tin quản lý",
  28.01
 ],
 [
  "7340301",
  "Kế toán",
  27.3
 ],
 [
  "TT1",
  "Nhóm chương trình TT1",
  25.25
 ],
 [
  "EP04",
  "Kế toán với chứng chỉ quốc tế ICAEW CFAB",
  26.62
 ],
 [
  "EP15",
  "Khoa học dữ liệu",
  26.52
 ],
 [
  "7480101",
  "Khoa học máy tính",
  26.19
 ],
 [
  "7340401",
  "Khoa học quản lý",
  26.3
 ],
 [
  "EP02",
  "Khoa học tính toán trong tài chính và bảo hiểm",
  26.44
 ],
 [
  "EP01",
  "Khởi nghiệp và phát triển kinh doanh (BBAE)",
  25.22
 ],
 [
  "7340302",
  "Kiểm toán",
  28.84
 ],
 [
  "EP21",
  "Kiểm toán nội bộ",
  26.39
 ],
 [
  "EP12",
  "Kiểm toán với chứng chỉ quốc tế ICAEW CFAB",
  28.25
 ],
 [
  "7620114",
  "Kinh doanh nông nghiệp",
  24.75
 ],
 [
  "7340120",
  "Kinh doanh quốc tế",
  28.5
 ],
 [
  "CLC3",
  "Nhóm chương trình CLC3",
  25.89
 ],
 [
  "EP05",
  "Kinh doanh số (E-BDB)",
  26.84
 ],
 [
  "7340121",
  "Kinh doanh thương mại",
  27.94
 ],
 [
  "7310104",
  "Kinh tế đầu tư",
  27.56
 ],
 [
  "CLC2",
  "Nhóm chương trình CLC2",
  24.83
 ],
 [
  "7310101P1",
  "Kinh tế",
  26.64
 ],
 [
  "EP13",
  "Kinh tế tài chính (FE)",
  25.89
 ],
 [
  "7620115",
  "Kinh tế nông nghiệp",
  24.59
 ],
 [
  "7310105",
  "Kinh tế phát triển",
  26.79
 ],
 [
  "CLC1",
  "Nhóm chương trình CLC1",
  25.28
 ],
 [
  "7310106",
  "Kinh tế quốc tế",
  28.3
 ],
 [
  "EP22",
  "Kinh tế quốc tế",
  27.2
 ],
 [
  "EP23",
  "Kinh tế số",
  26.51
 ],
 [
  "7850102",
  "Kinh tế tài nguyên thiên nhiên",
  24.38
 ],
 [
  "7310101P2",
  "Kinh tế và quản lý đô thị",
  25.9
 ],
 [
  "7310101P3",
  "Kinh tế và quản lý nguồn nhân lực",
  27.07
 ],
 [
  "EP24",
  "Kinh tế y tế",
  24.42
 ],
 [
  "EP17",
  "Kỹ thuật phần mềm",
  25.0
 ],
 [
  "7510605",
  "Logistics và quản lý chuỗi cung ứng",
  28.53
 ],
 [
  "EP14",
  "Logistics và quản lý chuỗi cung ứng với chứng chỉ quốc tế (LSIC)",
  27.87
 ],
 [
  "7380101",
  "Luật",
  25.52
 ],
 [
  "POHE4",
  "Luật kinh doanh",
  25.68
 ],
 [
  "7380107",
  "Luật kinh tế",
  26.62
 ],
 [
  "7380109",
  "Luật thương mại quốc tế",
  26.38
 ],
 [
  "7340115",
  "Marketing",
  27.99
 ],
 [
  "7220201",
  "Ngôn ngữ Anh",
  26.46
 ],
 [
  "EP03",
  "Phân tích dữ liệu kinh tế (EDA)",
  27.24
 ],
 [
  "EP06",
  "Phân tích kinh doanh (BA)",
  27.4
 ],
 [
  "EP25",
  "Phát triển quốc tế",
  24.68
 ],
 [
  "7320108",
  "Quan hệ công chúng",
  27.58
 ],
 [
  "7340408",
  "Quan hệ lao động",
  25.52
 ],
 [
  "7340403",
  "Quản lý công",
  25.37
 ],
 [
  "EPMP",
  "Quản lý công và chính sách (E-PMP)",
  24.05
 ],
 [
  "7850103",
  "Quản lý đất đai",
  24.75
 ],
 [
  "7340409",
  "Quản lý dự án",
  26.67
 ],
 [
  "7850101",
  "Quản lý tài nguyên và môi trường",
  24.2
 ],
 [
  "POHE6",
  "Quản lý thị trường",
  24.89
 ],
 [
  "EP08",
  "Quản lý chất lượng và đổi mới (E-MQI)",
  25.12
 ],
 [
  "EP27",
  "Quản lý công nghiệp sáng tạo",
  24.08
 ],
 [
  "7810103",
  "Quản trị dịch vụ du lịch và khách sạn",
  25.79
 ],
 [
  "EP07",
  "Quản trị vận hành thông minh (E-SOM)",
  25.8
 ],
 [
  "EP18",
  "Quản trị giải trí và sự kiện",
  25.89
 ],
 [
  "7810201",
  "Quản trị khách sạn",
  26.08
 ],
 [
  "POHE1",
  "Quản trị khách sạn",
  25.05
 ],
 [
  "EP11",
  "Quản trị khách sạn quốc tế (IHME)",
  24.93
 ],
 [
  "7340101",
  "Quản trị kinh doanh",
  26.85
 ],
 [
  "EBBA",
  "Quản trị kinh doanh (E-BBA)",
  25.74
 ],
 [
  "POHE5",
  "Quản trị kinh doanh thương mại",
  26.64
 ],
 [
  "POHE2",
  "Quản trị lữ hành",
  24.77
 ],
 [
  "7340404",
  "Quản trị nhân lực",
  27.25
 ],
 [
  "EP28",
  "Quản trị nhân lực quốc tế",
  25.75
 ],
 [
  "EP29",
  "Quản trị rủi ro định lượng",
  26.15
 ],
 [
  "TT2",
  "Nhóm chương trình TT2",
  26.0
 ],
 [
  "7340201",
  "Tài chính - ngân hàng",
  27.43
 ],
 [
  "EP10",
  "Ngân hàng, tài chính và đầu tư (BFI)",
  26.76
 ],
 [
  "POHE7",
  "Thẩm định giá",
  24.96
 ],
 [
  "EP31",
  "Thẩm định giá / Tài chính - ngân hàng",
  24.1
 ],
 [
  "7310107",
  "Thống kê kinh tế",
  27.29
 ],
 [
  "EP32",
  "Thống kê và trí tuệ kinh doanh",
  25.54
 ],
 [
  "7340122",
  "Thương mại điện tử",
  28.62
 ],
 [
  "7310108",
  "Toán kinh tế",
  27.22
 ],
 [
  "EP30",
  "Toán ứng dụng",
  25.6
 ],
 [
  "EP16",
  "Trí tuệ nhân tạo",
  25.64
 ],
 [
  "POHE3",
  "Truyền thông marketing",
  27.39
 ]
] as const;
const hcmusRows: Array<[string,string,number]> = [
 ['7140103','Công nghệ giáo dục',23.89],
 ['7420101','Sinh học',23.50],
 ['7420101_DKD','Sinh học (CT TCTA)',22.60],
 ['7420201','Công nghệ Sinh học',24.75],
 ['7420201_DKD','Công nghệ Sinh học (CT TCTA)',24.10],
 ['7440102_DKD','Vật lý học (CT TCTA)',24.30],
 ['7440102_NN','Nhóm ngành Vật lý học, Công nghệ Vật lý điện tử và tin học',25.88],
 ['7440107_DKD','Công nghệ Vật lý điện tử và tin học (CT TCTA)',24.86],
 ['74401a1','Công nghệ bán dẫn',27.34],
 ['7440112','Hóa học',26.15],
 ['7440112_DKD','Hóa học (CT TCTA)',24.89],
 ['7440122','Khoa học Vật liệu',25.30],
 ['7440122_DKD','Khoa học Vật liệu (CT TCTA)',24.25],
 ['7440201_NN','Nhóm ngành Địa chất học, Kinh tế đất đai',22.60],
 ['7440228','Hải dương học',23.92],
 ['7440228_DKD','Hải dương học (CT TCTA)',21.69],
 ['7440301','Khoa học Môi trường',23.10],
 ['7440301_DKD','Khoa học Môi trường (CT TCTA)',21.50],
 ['7460101_NN','Nhóm ngành Toán học (Toán học, Toán ứng dụng, Toán tin)',26.28],
 ['7460108_DKD','Khoa học dữ liệu (CT TCTA)',27.48],
 ['7460108_NN','Nhóm ngành Khoa học dữ liệu, Thống kê',27.63],
 ['7460112_DKD','Toán ứng dụng (CT TCTA)',25.70],
 ['7460117_DKD','Toán tin (CT TCTA)',25.52],
 ['7480101_TT','Khoa học máy tính (CT Tiên tiến)',29.32],
 ['7480107','Trí tuệ nhân tạo',28.68],
 ['7480201_DKD','Công nghệ thông tin (CT TCTA)',24.70],
 ['7480201_NN','Nhóm ngành máy tính và Công nghệ thông tin (CNTT, Kỹ thuật phần mềm, Hệ thống thông tin, Khoa học máy tính)',26.30],
 ['7510401_DKD','Công nghệ kỹ thuật Hóa học (CT TCTA)',24.90],
 ['7510402','Công nghệ Vật liệu',25.58],
 ['7510402_DKD','Công nghệ Vật liệu (CT TCTA)',24.50],
 ['7510406','Công nghệ kỹ thuật Môi trường',23.10],
 ['7520207','Kỹ thuật điện tử - viễn thông',26.55],
 ['7520207_DKD','Kỹ thuật điện tử - viễn thông (CT TCTA)',25.60],
 ['75202a1','Thiết kế vi mạch',27.93],
 ['7520402','Kỹ thuật hạt nhân',26.21],
 ['7520403','Vật lý y khoa',26.00],
 ['7520403_DKD','Vật lý y khoa (CT TCTA)',24.80],
 ['7520501','Kỹ thuật địa chất',23.85],
 ['7850101','Quản lý tài nguyên và môi trường',22.30],
];
const hcmusSourceNote = 'Điểm chuẩn phương thức xét tuyển tổng hợp năm 2026, thang 30; công bố đã gồm điểm cộng và điểm ưu tiên. Phương thức tổng hợp sử dụng kết quả THPT hoặc ĐGNL ĐHQG-HCM kết hợp học bạ 03 năm; không so trực tiếp với tổng điểm thi THPT thô.';
const common = { year: 2026 as const, reviewedAt: '2026-11-17' };
export const externalCutoffs: ExternalCutoff[] = [
 ...ctuHistoricalCutoffs,
 ...dthuHistoricalCutoffs,
 ...expanded2026Cutoffs,
 ...aguRows.map(([code,major,cutoff]) => ({...common, universityId:'agu', university:'Đại học An Giang', campus:'AGU', code,major, cutoff,method:'AGU_COMPOSITE',label:'Tổng hợp (điểm xét tuyển chính thức)',scale:100,source:aguSource,note:'Đợt chính; chỉ nhập điểm tổng hợp đã tính theo quy định AGU; không dùng công thức giả lập hoặc điểm THPT thô.'})),
 ...ctuRows.map(([code,major,cutoff]) => ({...common, universityId:'ctu', university:'Đại học Cần Thơ', campus:code.endsWith('H')?'Hậu Giang':code.endsWith('S')?'Sóc Trăng':'CTU',code,major,cutoff,method:'CTU_COMMON',label:'Điểm xét tuyển chung đã quy đổi',scale:30,source:ctuSource,note:'Đợt 1; học bạ và V-SAT cần quy đổi theo CTU; không nhập điểm thô. Chương trình phân biệt theo mã.'})),
 ...hustRows.flatMap(([code,major,thpt,tsa]) => ([{...common, universityId:'hust',university:'Đại học Bách khoa Hà Nội',campus:'HUST',code,major,cutoff:thpt,method:'HUST_THPT_A00',label:'THPT (tổ hợp gốc A00, gồm ưu tiên)',scale:30,source:hustSource,note:'Chỉ tổ hợp gốc A00; phải áp dụng quy định độ lệch tổ hợp nếu khác A00.'},{...common,universityId:'hust',university:'Đại học Bách khoa Hà Nội',campus:'HUST',code,major,cutoff:tsa,method:'HUST_TSA_A00',label:'TSA tương đương A00',scale:100,source:hustSource,note:'Điểm tương đương theo công bố; không so với thang THPT.'}])),
 ...neuRows.map(([code,major,cutoff]) => ({...common, universityId:'neu',university:'Đại học Kinh tế Quốc dân',campus:'NEU',code,major,cutoff,method:'NEU_COMMON',label:'Điểm tương đương chung đã quy đổi',scale:30,source:neuSource,note:['TT1','TT2','CLC1','CLC2','CLC3'].includes(code)?'Mã nhóm: phân ngành sau nhập học; xem danh sách chương trình ở thông báo gốc. Điểm chung đã quy đổi.':'Điểm chung đã quy đổi cho các phương thức, không nhập điểm thô khác thang. Tên tiếng Việt chuẩn hóa từ bản tiếng Anh của khoa; đối chiếu mã và thông báo gốc.'})),
 ...hcmusCutoffs2025,
 ...hcmusRows.map(([code,major,cutoff]) => ({...common, reviewedAt:'2026-11-25', universityId:'hcmus', university:'Trường Đại học Khoa học tự nhiên – ĐHQG-HCM', campus:'HCMUS', code, major, cutoff, method:'HCMUS_COMPOSITE', label:'Xét tuyển tổng hợp (THPT/ĐGNL + học bạ 3 năm)', scale:30, source:HCMUS_CUTOFF_2026, note:hcmusSourceNote})),
];
