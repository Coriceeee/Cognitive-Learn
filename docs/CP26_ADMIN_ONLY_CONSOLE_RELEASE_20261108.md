# COGNITIVE LEARN AI — CP26 / Admin-only Nexus Console
Ngày kiểm tra: 08/11/2026
Nguồn: `CLA(9).zip`. Sửa trên một bản sao; không deploy production hoặc thay đổi Firebase Rules.

## Đã thực hiện
1. **Tách menu Admin hoàn toàn khỏi menu học sinh.** `AdminPage.tsx` không còn lấy `moduleSubmoduleDirectory` hay hiển thị chức năng Student trong các thẻ Nexus Console.
2. **Tạo danh mục `adminConsoleDirectory.ts` riêng cho Admin**, chia theo 7 nhóm công nghệ nhưng mỗi mục là tác vụ quản trị/kiểm toán.
3. **Tất cả liên kết hoạt động của Nexus Console đều là `/admin/diagnostics?view=...`.** Không mở `/student`, `/teacher`, `/parent`, `/atlas`, `/orion`, `/pulse`, `/haven` từ thẻ Admin.
4. **Thêm các màn chẩn đoán chỉ đọc** cho `roles`, `atlas`, `orion`, `pulse`, `haven`. Chỉ đọc tài liệu chính UID Admin; các phép kiểm định chưa chạy hiển thị `NOT TESTED`.
5. **Bảo toàn menu học sinh riêng** trong `studentSubmoduleDirectory`, 6 module học sinh. Giữ `Nexus` là module thứ bảy trong kiến trúc Admin.
6. **Dọn thư mục sai vị trí** khiến `check:layout` thất bại: loại bản sao y của script và tài liệu đã nằm đúng dưới `research/`, giữ script cũ khác biệt trong `docs/archive/`.
7. Cập nhật kiểm thử tĩnh `tests/admin-deeplink.test.cjs` và `tests/module-hierarchy.test.cjs` để ngăn lỗi trộn menu tái xuất hiện.

## Test tại thời điểm bàn giao
- `npm test`: PASS (toàn bộ script chạy thành công).
- `npm run test:rules:static`: PASS (15 bài kiểm tra tĩnh).
- `npm run check:layout`: PASS.
- `npx tsc -b`: PASS.
- `npx tsc -p tsconfig.api.json`: PASS.
- Vite build: **BLOCKED** do bộ native Rolldown Linux không có trong `node_modules` từ ZIP nguồn. Không ghi build PASS.
- Firebase Emulator, kiểm tra trình duyệt E2E và production smoke: **NOT RUN**.
- Không đưa `.env`, `.env.local`, `.git`, `node_modules` vào gói phát hành.

## Điều kiện để nghiệm thu
- `npm ci`, `npm run build` trên môi trường có đủ dependencies.
- Firebase Emulator: kiểm thử Auth và Rules theo vai trò/UID.
- Browser E2E: 7 cụm Admin, 9 liên kết tới diagnosis, quyền Student/Teacher/Parent không truy cập `/admin`.
- Nếu có công cụ quản trị người dùng thật, phải triển khai qua backend đặc quyền có audit/MFA trước khi bật.

## Ưu tiên tiếp theo để tăng chất lượng vòng trường
1. **P0: Closed loop Seed → Lumen → Orion → Pulse**: kế hoạch thực hiện, check-in, outcome, đo lại; log có thể replay.
2. **P0: Xác minh build/Emulator/E2E và trang demo không có lỗi chặn.**
3. **P1: Bằng chứng khoa học:** hoàn thiện baseline, kiểm định SCI/MAS/CSL ở mức có dữ liệu; không diễn giải mô phỏng là nhân quả.
4. **P1: Atlas/Haven:** kiểm tra năm, nguồn, TTL, trường hợp thiếu dữ liệu; chatbot giữ vai trò điều hướng.

Mục tiêu KHKT nội bộ giữ nguyên ≥95% / ≥80% / ≥50%, nhưng không coi đây là ước tính xác suất đã được xác thực.
