# CLA CP36 — P1 Source & Task-first UX

**Ngày:** 11/11/2026  
**Base:** `CLA_CP35_FULL_SOURCE_20261111.zip`  
**Scope:** P1 dữ liệu và UX, không thay đổi IAM/Firestore Rules production.

## Đã sửa trong mã nguồn

1. **Không hiển thị lặp sáu phân hệ.** `src/page/seed/StudentPage.tsx` vẫn có sáu ô module chính. `/student/modules` được viết lại thành *Bộ tìm nhanh chức năng*, có ô tìm kiếm, ba nhóm công việc và đường dẫn thẳng tới trang chức năng. Không còn một bảng chọn sáu module lần hai.
2. **Ẩn dữ liệu minh họa khỏi dashboard học sinh thường.** Kế hoạch và gợi ý mẫu trong `studentDashboardData.ts` chỉ hiển thị trong Admin Preview, giảm nguy cơ hiểu nhầm dữ liệu demo là tư vấn cá nhân.
3. **Haven có thư viện 7 hồ sơ học bổng bậc đại học từ nguồn chính thức:** NUS ASEAN, NUS International Undergraduate, NUS Science & Technology, NTU Nanyang Global, MEXT Undergraduate 2027, GKS Undergraduate 2026 (đợt lịch sử), Melbourne International Undergraduate Scholarship. Thư viện tìm kiếm theo tên/quốc gia, trình bày điều kiện, đường dẫn nguồn, chứng chỉ cần tra và checklist tự kiểm. Tình trạng kỳ tuyển được đánh dấu cần kiểm tra, không tạo deadline hay xác suất.
4. **Atlas bổ sung ba trường có nguồn chính thức 2026:** UET (ĐHQG Hà Nội), UEL (ĐHQG-HCM), UEH. UET đang ở mức nguồn chính thức chưa chuẩn hóa phương thức; UEL và UEH được đối chiếu nhóm phương thức 2026. Không tự điền năm 2024–2025 cho ba trường mới.
5. **Atlas Source Registry cải tiến tìm kiếm và kiểm kê nguồn:** có tìm tên trường/lĩnh vực, lọc miền, hiển thị 10 trường, 24 bản ghi trường-năm, 19 bản ghi đã đối chiếu nhóm phương thức, 5 nguồn còn chuẩn hóa, 6 cặp trường-năm chưa có bản ghi. Biểu đồ phân đoạn được tính từ dữ liệu registry thật và ghi rõ mẫu số chỉ là danh mục hiện có.
6. **CSS đồng bộ CLA:** lớp cuối `25-p1-task-scholarship.css` cho bộ tìm chức năng và thư viện học bổng, font rõ, màu chữ tương phản cao, responsive, keyboard focus và reduced-motion.
7. **Regression tests mới:** kiểm thử component contract và kiểm thử trực tiếp lọc dữ liệu nguồn, trùng ID, trạng thái nguồn, thiếu bản ghi theo năm và chứng cứ học bổng.

## Tính đúng đắn và giới hạn

- Danh mục có 10 trường **không phải tất cả trường đại học Việt Nam**. Trong 10 trường này, 7 trường đã có 3 bản ghi năm 2024–2026, 3 trường mới chỉ có nguồn năm 2026. Mức `institution_method_verified` chỉ nói đến **nhóm phương thức tại cấp trường**, không có nghĩa mọi mã ngành, tổ hợp, điểm chuẩn và chỉ tiêu đã chuẩn hóa.
- 7 học bổng chỉ là **hồ sơ có nguồn chính thức**, không phải 7 học bổng đang mở, không phải 7 kết quả trúng tuyển hoặc đủ điều kiện. MEXT 2027 và GKS-U 2026 phải kiểm tra tình trạng kỳ tuyển; GKS-U 2026 là dữ liệu kỳ cũ.
- Dữ liệu du học toàn cầu còn 249 tên quốc gia/vùng lãnh thổ nhưng chỉ có 7 điểm đến có hồ sơ lộ trình tham khảo. Chưa thể khẳng định tất cả 249 quốc gia có cơ sở dữ liệu trường, học phí, visa và học bổng đầy đủ.
- Không tạo hoặc ghi dữ liệu Firestore thực, không deploy, không thay đổi quyền role hoặc phân quyền backend.
- Chưa có Browser E2E/Firebase Emulator/staging, không tuyên bố production-ready.

## Sources reviewed

- UET 2026: https://tuyensinh.uet.vnu.edu.vn/ban-nen-biet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/
- UEL 2026: https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/
- UEH 2026: https://www.ueh.edu.vn/tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026-76935
- NUS ASEAN: https://www.nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students/asean-undergraduate-scholarship
- NUS International: https://www.nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students/nus-international-undergraduate-scholarship
- NUS Science & Technology: https://nus.edu.sg/oam/scholarships/scholarships-for-freshmen-international-students/science-technology-undergraduate-scholarship
- NTU Nanyang: https://www.ntu.edu.sg/admissions/undergraduate/scholarships/scholarship-opportunities/detail/nanyang-scholarship
- MEXT 2027: https://www.studyinjapan.go.jp/en/smap-stopj-applications-undergraduate.html
- GKS-U 2026: https://www.studyinkorea.go.kr/ko/notice/scholarshipsRead.do?bbsId=BBSMSTR_000000000461&nttId=4385
- Melbourne: https://study.unimelb.edu.au/how-to-apply/undergraduate-study/international-applications/applications
