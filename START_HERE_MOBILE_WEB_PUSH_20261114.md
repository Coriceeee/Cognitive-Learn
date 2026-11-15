# CLA — Tiếp tục Daily Companion: Web Push PWA V2

**Ngày:** 14/11/2026. Bản này kế thừa toàn bộ FULL SOURCE Daily Companion V1, không tạo ứng dụng viết lại.

## Cài đè trên Windows

1. Sao lưu `C:\Gạo\Cognitive-Learn`, nhất là `.env`, `.env.local` và các sửa đổi riêng.
2. Giải nén FULL SOURCE, chép các thư mục/file vào dự án. Không xóa `node_modules`, không ghi đè cấu hình Firebase thật.
3. Chạy kiểm thử:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:companion-push
npm run test:daily-companion
npm test
npm run test:rules:static
npm run build
npm run dev
```

4. Vào `/student/companion`. Mục **Bật nhắc nền trên thiết bị** là tính năng opt-in; nếu chưa cấu hình public VAPID, nút sẽ tắt và hiển thị `Chưa cấu hình VAPID`. Đây là hành vi bảo vệ mặc định, không phải lỗi build.

## Chỉ khi bạn chuẩn bị bật Web Push thực tế

Đọc `docs/mobile/CLA_WEB_PUSH_PWA_V2_IMPLEMENTATION.md`. Không chạy lệnh triển khai Rules/Functions trước khi bộ Firestore Emulator đạt, đã cấu hình consent/guardian và rà soát quyền riêng tư. Khóa riêng VAPID chỉ được lưu bằng Firebase Secret Manager; backend mặc định `CLA_PUSH_ENABLED=false`.

**Không nên dùng `npm ci` nếu `node_modules` trên máy đang xanh và không thay package-lock.** Dependencies web không đổi; Cloud Functions là thư mục độc lập và chỉ cài khi cần deploy.

## Những gì vẫn chưa nghiệm thu

- Build của bản này trên máy Windows, chạy 6 ca Rules Emulator mới, Firebase production, nhắc thực tế khi tab đóng, iOS PWA, Android PWA.
- Chưa có APK/AAB hoặc IPA. Mốc 80% toàn dự án không được tự tăng từ việc thêm Web Push.
