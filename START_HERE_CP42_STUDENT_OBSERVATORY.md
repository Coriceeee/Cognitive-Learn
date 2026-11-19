# CLA — CP42 Student Observatory UI

Bản vá UI trên source CP42 Focused Workspaces 19/11/2026. Không đổi engine, Firebase rules, API hoặc cấu trúc route.

- Trang /student: GPA đối soát, SCI/MAS/CSL có trạng thái phép đo, biểu đồ lịch sử có lựa chọn 3 chỉ số, liên kết vòng lặp học tập; đồ thị trước các thao tác và module.
- CSS 33: giảm gradient, bo góc, shadow ở workspace; CSS 34: dashboard dạng editorial (xanh rêu, đường phân cách, typography, chart-first).
- Không hiển thị giá trị thiếu thành 0, không vẽ lịch sử khi chưa có chuỗi hợp lệ.

## Cài đặt
Sao lưu dự án hiện tại. Giải nén patch vào thư mục gốc Cognitive-Learn, đúng bản CP42, ghi đè 2 file cũ và thêm 3 file mới. Hoặc dùng full source mới. Chạy ở máy đã cấu hình Firebase: `npm ci`, `npm run build`, `npm run dev`. Không cần thay rules/secret.

## Kiểm tra thực hiện trong phiên này
- Focused Workspaces + exam reminders: 40/40 PASS.
- Chart-first: 7/7 PASS.
- Layout: PASS. TSX transpile syntax và CSS parse: PASS.
- Preview HTML được dựng từ component với fixture demo; Chromium 1440px và 390px không tràn chiều ngang, đổi biểu đồ thành công. Fixture thiếu dữ liệu không vẽ đường.
- Chưa chạy full build/production E2E: môi trường không có node_modules của dự án. Preview không kết nối Firebase và không phải website đang deploy.
