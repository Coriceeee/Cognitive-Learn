# CP78 — Cập nhật màu và giảm trùng lặp mà không đổi bố cục

Giải nén ZIP đầy đủ, thay phiên bản CP77. Không chép đè riêng CSS vào một bản cũ khác phiên bản.

**Đã thay:** Màu nhấn từng module và nền sáng; 6 tên tiếng Việt trong sơ đồ và tiêu đề; bỏ điều hướng 6 mục trùng ở Seed và 2 link trùng ở Atlas; Haven có duy nhất một ô tìm kiếm học bổng chính; Lumen không đọc lặp nhãn lỗi; hướng dẫn cho học sinh được đơn giản hóa.

**Không thay:** bố cục chính, pathname, dữ liệu, quyền và thuật toán.

**Xem báo cáo** `reports/cp78/CP78_UX_AUDIT_REPORT.md` và ma trận `reports/cp78/CP78_UX_DUPLICATE_MATRIX.csv`.

**Kiểm tra nhanh trên máy:** `npm ci`, `npm run dev`, đăng nhập tài khoản QA, thử sáu phân hệ desktop/mobile và mở tab Mục khác. `npm run test:cp78:clarity` là test mã nguồn; `python tools/cp78_visual_smoke.py` là QA CSS cô lập, không phải React E2E. Để nghiệm thu Firebase cần emulator và QA account; xem hướng dẫn CP73.

**Tình trạng:** Chưa có build React/Firebase E2E được xác minh trong môi trường đóng gói. Không sử dụng dữ liệu synthetic làm kết quả khảo sát người thật.
