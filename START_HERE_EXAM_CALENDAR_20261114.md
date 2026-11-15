# START HERE — CLA Lịch thi & đếm ngược cá nhân

**Phiên bản:** 14/11/2026 — FULL SOURCE kế thừa từ `CLA_FULL_SOURCE_ATLAS_NGUYEN_VONG_NHAP_20261114.zip`.

## Cài đặt Windows
1. Sao lưu toàn bộ thư mục `C:\Gạo\Cognitive-Learn`.
2. Giải nén FULL SOURCE mới, chép đè nội dung vào thư mục dự án; **không xóa `.env`/`.env.local` hoặc dữ liệu riêng**. Không copy `node_modules` từ ZIP; sử dụng thư viện đã cài hoặc `npm ci` nếu cần.
3. Chạy từ PowerShell:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:exam-calendar
npm test
npm run build
npm run dev
```

## Cách sử dụng
1. Đăng nhập **học sinh** và mở `/student`.
2. Bảng **“Lịch thi của tôi”** xuất hiện ở đầu Dashboard; hoặc từ Atlas/Daily Companion chọn **“Lịch thi & đếm ngược”**.
3. Chọn **“+ Thêm kỳ thi / đợt thi”**, sau đó chọn HSA, V-ACT, TSA, V-SAT, THPT, IELTS, SAT hoặc tự đặt tên.
4. Nhập **ngày thi đúng đợt** theo thông báo, hạn đăng ký nếu có và nguồn HTTPS nếu có; bấm **“Lưu thay đổi”**.
5. Mốc gần nhất được đếm ngược tự động. Khi còn **14 ngày hoặc ít hơn**, Dashboard hiện cảnh báo trong trang.
6. Có thể tick **“Đã hoàn tất đăng ký”** để ngừng cảnh báo hạn đăng ký, ẩn kỳ thi không quan tâm hoặc thêm nhiều đợt cùng loại.

## Giới hạn trung thực
- Chức năng dùng được ở mức **lưu trên trình duyệt theo UID**. Nó **không đồng bộ** sang thiết bị khác, kể cả điện thoại có cùng tài khoản.
- Lịch thi chưa do Gemini cập nhật tự động; ngày thi/hạn đăng ký **do học sinh nhập**, phải tự kiểm tra lại từ trường/đơn vị tổ chức.
- Chỉ nhắc khi mở Dashboard. **Chưa có thông báo push nền riêng cho lịch thi**, không gửi khi website đóng.
- Chưa kiểm tra production build/Browser E2E trên máy Windows trong phiên đóng gói này.
- Chức năng Gemini đọc **quy đổi chứng chỉ theo trường/ngành** là phần kế tiếp; bản này **không tự sinh bảng quy đổi**.

## Kiểm thử đã thực hiện ở môi trường đóng gói
- `npm run test:exam-calendar`: **30/30 PASS**.
- `npm test`: PASS.
- `npm run test:rules:static`: **15/15 PASS**, không phải Emulator.
- `npm run check:layout`: PASS.
- `tsc --strict` với `src/lib/examCalendar.ts`: PASS (TypeScript 5.8.3).
- TSX syntax: PASS, chưa thay thế full production build.
- `npm ci --offline`: **BLOCKED** do npm cache thiếu `yargs-parser`; không dùng lỗi này làm bằng chứng code lỗi.
