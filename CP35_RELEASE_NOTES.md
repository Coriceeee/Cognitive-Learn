# CLA CP35 — Release notes (11/11/2026)

## Quyết định UX
Chọn phương án **tách trang lớn thành các trang chức năng riêng theo module**, không xóa tên chức năng con. Sáu module học sinh vẫn giữ nguyên; Nexus Core vẫn là khu vực Admin.

## P0 đã xử lý trong source
- Bỏ PTIT khỏi gợi ý trường mặc định; dữ liệu PTIT BVH 2024–2025 được ghi rõ là ví dụ có phạm vi hẹp và đặt trong phần mở rộng.
- Bỏ Singapore mặc định; Atlas Du học bắt đầu ở trạng thái chưa chọn quốc gia.
- Seed Profile dùng chung danh mục ISO 249 quốc gia/vùng lãnh thổ, không còn danh sách 7 nước hard-code.
- Điểm môn và điểm ưu tiên của Atlas Admission Engine để trống; không tạo kết quả khi thiếu dữ liệu đầu vào.
- Chuyển trang trạng thái dữ liệu của học sinh sang ngôn ngữ người dùng; không hiển thị tên collection/project hay nhắc Firestore.
- Thay UID trong hướng dẫn chia sẻ bằng “mã kết nối”.
- Siết `AccessGate` bằng allowlist route cho học sinh, giáo viên và phụ huynh; không còn mặc định cho Student đi vào mọi route không bị chặn.
- Các đường dẫn từ chatbot và các module được chuyển sang route chức năng riêng.
- Công cụ kiểm tra liên thông, nhập đề án, Knowledge Base và tác vụ quản trị vẫn thuộc Admin/Nexus.

## P1 đã xử lý trong source
- Thêm route-focused pages cho Atlas, Lumen, Orion, Pulse, Haven và các nhánh Du học.
- Thêm điều hướng chức năng gọn, đường quay về tổng quan module, active state và responsive layout.
- Thêm lớp CSS thống nhất CP35 sau design-system/chat/scientific visuals.
- Tách Atlas thành: tuyển sinh Việt Nam, du học, liên kết quốc tế, gợi ý ngành/trường và nguồn tuyển sinh.
- Thêm Atlas Official Source Registry: hiện có 7 trường, 21 bản ghi nguồn theo năm 2024–2026; 17 bản ghi có phương thức đã đối chiếu, 4 bản ghi có nguồn chính thức nhưng còn chờ chuẩn hóa.

## Nguồn tuyển sinh được bổ sung
- HCMUS: nguồn chính thức 2024, 2025, 2026.
- UIT: nguồn chính thức 2024, 2025, 2026.
- HCMUT: nguồn chính thức 2024, 2025, 2026.

## Giới hạn chưa được phép tuyên bố hoàn tất
- 7 trường trong source registry **không phải toàn bộ đại học Việt Nam**. Cần tiếp tục thu thập và chuẩn hóa nguồn từng trường/ngành/cơ sở/phương thức/chỉ tiêu/điểm chuẩn.
- Danh mục 249 quốc gia/vùng lãnh thổ chỉ là danh mục lựa chọn. Hồ sơ chương trình/trường/visa/học phí được đối chiếu hiện chỉ có ở một số điểm đến; không suy rộng cho 249 nước.
- Haven hiện phân loại nhóm chính sách hỗ trợ; chưa có kho học bổng cụ thể đầy đủ đã xác minh.
- Atlas Admission Engine chưa thể đưa ra gợi ý trường nếu tài khoản học sinh chưa có dữ liệu chương trình đã xác minh.
- Không có tuyên bố về validity/reliability, ML accuracy, calibration hoặc hiệu quả can thiệp nếu chưa có nghiên cứu/outcome phù hợp.

## Kiểm thử trong môi trường tạo bản
- `npm test`: PASS (105 TAP subtests; 14 academic checks, 4 cognitive-observation checks và các contract phụ cũng PASS).
- `npm run test:rules:static`: PASS (15/15).
- `npm run check:layout`: PASS.
- TS/TSX syntax transpile: PASS (147 files).
- `tsc -b`: BLOCKED do dependencies/type definitions chưa được cài đầy đủ trong sandbox.
- `npm ci`: không hoàn tất trong sandbox (registry request timeout; chế độ offline thiếu gói `yargs-parser`).
- `npm run build`: NOT RUN / NOT VERIFIED.
- Firebase Emulator, Browser E2E và staging: NOT RUN.

Không được coi CP35 là production-ready cho đến khi cài dependency sạch, build, Browser E2E, Firebase Emulator và staging chạy thành công.
