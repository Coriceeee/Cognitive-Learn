# CLA Daily Companion V1 — cài đặt và nghiệm thu

**Nền của source này:** `CLA_STEP12_JOURNEY_RELIABILITY_WORK_20261113` (nhánh reliability đang triển khai từ FULL SOURCE Closed-Loop). Bản này kế thừa các cập nhật Step12 chưa từng được đóng gói riêng và bổ sung Daily Companion. Không trộn với project khác.

## 1. Cài source lên Windows

1. Sao lưu toàn bộ `C:\Gạo\Cognitive-Learn` (đặc biệt là `.env`, `.env.local`, chỉnh sửa riêng).
2. Giải nén FULL SOURCE ZIP, copy nội dung vào thư mục dự án.
3. Giữ nguyên `.env`, `.env.local`, `node_modules` nếu các thư viện đã cài đúng.
4. Chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:daily-companion
npm test
npm run test:rules:static
npm run build
npm run test:rules:emulator
npm run dev
```

## 2. Xem trước trên website

- Đăng nhập tài khoản học sinh, mở `http://localhost:5173/student/companion` hoặc từ Seed → **Đồng hành mỗi ngày**.
- V1 ở trạng thái **preview** mặc định. Có thể xem giao diện, lịch và các liên kết Orion/Pulse/Lumen; thao tác lưu/nhắc học bị chặn có chủ đích cho đến khi bật an toàn.
- Với tài khoản Admin, đây chỉ là xem trước, không lưu dữ liệu hộ học sinh.

## 3. Điều kiện để bật đồng bộ và nhắc học

**Không bật khi chưa nghiệm thu 55+ ca Emulator và rà soát Rules ứng viên mới.** Sau khi các bài kiểm thử quyền đã PASS, đối chiếu Rules production và triển khai theo quy trình có kiểm soát, mới bật `VITE_CLA_STUDENT_CONSENT_GATE=true`, xác nhận consent sản phẩm của tài khoản học sinh, và kiểm tra trên môi trường riêng.

Lưu ý: đã thêm các ca Emulator dành cho `daily_companion/{uid}`, nhưng trong môi trường đóng gói chưa chạy được CLI; báo cáo static PASS không thay thế Emulator PASS.

- Bật nhắc: lưu lịch, cấp quyền thông báo bằng thao tác bấm nút trong HTTPS/localhost.
- Trình duyệt chỉ kiểm tra nhắc khi **trang Daily Companion đang mở**; không có thông báo khi app đã đóng.
- Nếu muốn xem thông báo thiết bị: trên điện thoại cần hỗ trợ service worker; có thể khác nhau giữa trình duyệt và PWA.
- Rút product consent sẽ dừng nhắc khi trang đang mở và chặn ghi mới theo Rules, không tự xóa dữ liệu cũ.

## 4. Không lầm tính năng

- **ĐÃ VIẾT:** web daily companion, manifest/icon/service worker, schedule/check-in, candidate rules, test engine.
- **CHƯA:** native Android APK/iOS IPA, native push, FCM scheduler, offline, nghiệm thu emulator/browser, guardian verification.
- Chi tiết: `docs/mobile/CLA_MOBILE_EXPANSION_ROADMAP.md`.
