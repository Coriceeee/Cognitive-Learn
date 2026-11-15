# CP36 — Danh sách P1 còn thiếu, ưu tiên theo hạn báo cáo

## P1 đã có tiến triển trong CP36

- [x] Loại trang chọn lặp sáu module; thay bằng task finder.
- [x] Không hiển thị gợi ý demo như dữ liệu của học sinh thật.
- [x] Thêm bộ lọc/biểu đồ nguồn Atlas có nhãn rõ phạm vi dữ liệu.
- [x] Thêm 3 nguồn tuyển sinh chính thức 2026 (UET, UEL, UEH).
- [x] Thêm 7 hồ sơ học bổng đại học có URL nguồn chính thức, checklist hồ sơ và trạng thái kỳ tuyển.
- [x] Kiểm thử unit/contract và TS frontend/API từ dependency cache.

## P1 chưa hoàn thành — không được đánh dấu PASS

1. [ ] **Nationwide admissions:** Toàn bộ trường đại học Việt Nam và từng ngành/mã ngành/cơ sở/phương thức/tổ hợp, điểm chuẩn, chỉ tiêu, điều kiện/học phí 2024, 2025, 2026. Hiện chỉ có 10 trường trong registry, 24 bản ghi trường-năm và một bộ chi tiết PTIT 10 ngành/2024–2025.
2. [ ] **Atlas admission engine:** Đối chiếu hồ sơ thật với chương trình được xác minh; phân loại an toàn/vừa sức/bứt phá theo đúng thang điểm và năm, không dùng ngưỡng quy tắc khi thiếu benchmark.
3. [ ] **Du học toàn cầu:** 249 mục ISO chỉ là tên quốc gia/vùng lãnh thổ; 7 điểm đến có lộ trình nguồn tham khảo; chưa có toàn bộ trường, ngành, điều kiện visa, chi phí hoặc deadline.
4. [ ] **Học bổng:** 7 hồ sơ nguồn chỉ là thí điểm; cần dữ liệu rộng theo nước/trường/ngành, điều kiện chứng chỉ đúng kỳ, mức tài trợ và hạn nộp được xác minh.
5. [ ] **Ngân sách Haven:** Học phí/sinh hoạt/visa/bảo hiểm từ từng trường, quốc gia và năm; so với mức ngân sách người dùng thực nhập.
6. [ ] **UX QA:** E2E desktop/mobile trên các trang tách mới, xác nhận không có section trống do CSS route isolation, kiểm tra contrast/keyboard và role.
7. [ ] **Runtime security:** Firebase Emulator cho Student/Teacher/Parent/Admin, cross-UID deny và liên kết quyền thật.
8. [ ] **Release:** Fresh npm ci, Vite bundle trên máy bạn, staging smoke và rollback.
9. [ ] **Nghiên cứu:** Chưa có dataset CLA nghiên cứu đủ điều kiện; không biến demo thành ML outcome. LLM benchmark chưa chạy model scoring.

## Thứ tự ưu tiên nếu còn rất ít thời gian

**A. Bắt buộc để demo:** build chạy trên Windows; nhập hồ sơ và bảng điểm; Seed→Lumen→Orion→Pulse; Atlas/Haven có source; mở các trang mới qua link; phân quyền thực.

**B. Chốt báo cáo phần đã có bằng chứng:** hệ thống/kiến trúc, data governance, source coverage, quy tắc/chỉ số, test kỹ thuật, closed-loop synthetic replay và giới hạn; không tuyên bố mô hình đã chứng minh tác động.

**C. Có thể để mở rộng sau deadline:** chuẩn hóa toàn quốc theo từng ngành/đợt, 249 quốc gia chương trình chi tiết, ML training + calibration trên tập đủ quyền và thử nghiệm Adaptive có comparator.
