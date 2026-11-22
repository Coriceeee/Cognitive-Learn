# CP69 — Bắt đầu từ đây (Atlas + Daily Companion)

**Mục tiêu:** Gia cố Firebase trước MVP; không chỉnh thiết kế UX đã chốt.

- Atlas lưu Firestore bằng transaction với `revision` tăng tuần tự để tránh ghi đè ngoài ý muốn giữa các thiết bị.
- Dữ liệu cache và bản ghi pending **không** được báo "đã đồng bộ"; giao diện chờ server xác minh.
- Chỉ bản legacy localStorage có UID chủ sở hữu phù hợp mới được phép nhập. Dữ liệu unscoped cũ được giữ nguyên tại browser; không tự xóa.
- Daily Companion kiểm tra lại consent trong transaction và từ chối ghi khi trạng thái consent chưa được xác minh.
- Có thêm 14 test offline và 1 kịch bản Emulator mới M05 (chưa thể chạy tại đây).

## Chạy trên Windows tại máy của bạn

```powershell
npm ci --no-audit --no-fund
npm run check:dependencies
npm run test:cp69:firebase-integration
npm run test:rules:static
npm run build
npm run test:rules:emulator
```

**Cảnh báo:** Chỉ thử với tài khoản và Firebase project QA (demo), không dùng tài khoản học sinh thật. Chưa triển khai Rules candidate lên production khi chưa chạy Emulator và browser QA. Không chép secrets vào ZIP. Bản phát hành là **source-only**.

Xem chi tiết: `reports/cp69/CP69_ACCEPTANCE_REPORT.md`; log nằm ở `reports/cp69/`.
