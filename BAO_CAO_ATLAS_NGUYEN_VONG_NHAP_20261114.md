# CLA — Bàn giao Atlas Nguyện vọng Nháp 2026 + Vercel SPA Route Fix

**Ngày:** 14/11/2026. **Nền:** `CLA_FULL_SOURCE_DAILY_COMPANION_WEB_PUSH_V2_20261114.zip` (459 file). **Mục tiêu cuối:** 100%; **mốc mong muốn hôm nay:** 80%, chưa đạt căn cứ nghiệm thu.

## Đã triển khai

1. **Trình soạn thảo nguyện vọng trong nước** tại Atlas `#atlas-nguyen-vong-nhap`, chỉ là danh sách do **học sinh tự quyết định thứ tự**. Có thể thêm từ chương trình PTIT BVH 2026 đã có nguồn trong CLA, hoặc tự nhập trường, ngành, mã ngành gắn nhãn **chưa xác minh**.
2. Giới hạn tối đa **15 nguyện vọng**. Đổi thứ tự ↑/↓ và xóa riêng từng mục; **không tự đảo** vì rủi ro, điểm hoặc vì ngành sư phạm. Cảnh báo khi ngành đào tạo giáo viên nằm sau NV5; **không tự xóa** mục bị cảnh báo.
3. Xuất JSON bản nháp **không chứa điểm số, tài khoản/UID**, nhập JSON khôi phục thứ tự; **mọi nguồn nhập lại đều bị hạ về chưa xác minh** để ngăn giả mạo dữ liệu trường. Tệp giới hạn 100 KB. Không tự gửi lên Firestore.
4. Bổ sung đường dẫn từ đầu Atlas đến sổ tay. Sửa `vercel.json` cho **`/student/consent` và `/student/companion`**; thêm kiểm thử đối chiếu các route React được khai báo và SPA rewrites mà không đè `/api/*`.
5. **Không thay đổi** quy tắc Firestore production, đăng nhập Admin, công thức điểm số, chức năng Seed/Orion/Pulse/Lumen, các bản vá Consent và Web Push.

## Kết quả đã chạy tại môi trường đóng gói

| Hạng mục | Kết quả | Giới hạn |
|---|---|---|
| `npm run test:aspiration-draft` | **PASS 30/30** | Unit/contract, không phải trình duyệt |
| `npm test` toàn dự án | **PASS (exit 0)** | Dependency TypeScript dùng global `NODE_PATH` ở môi trường đóng gói |
| `npm run test:rules:static` | **PASS 15/15** | Không thay Emulator Rules |
| `npm run check:layout` | **PASS** | Kiểm tra cấu trúc |
| `tsc --noEmit --strict` engine mới | **PASS** | Chỉ engine và import phụ thuộc |
| Cú pháp hai file TSX | **PASS** | Transpile check, không full JSX typecheck |
| `npm run build` | **BLOCKED (exit 1)** | Máy đóng gói **không có node_modules React/Firebase**, nên TS2307 ở các file nhiều module; không suy là build Windows lỗi |
| Firestore Emulator, staging/production, browser E2E | **NOT RUN** | Không chấm nghiệm thu |

## Tiến độ theo 164 việc (chỉ nhích các mục có bằng chứng)

- Điểm kiểm kê thận trọng trước: **36.9%** (đã cộng nguồn từ 12 mục; chưa rà soát lại 152 mục).
- Sau đợt này: **37.2%**. Tăng **0.3 điểm phần trăm**; vẫn không phải tỷ lệ nghiệm thu cuối.
- **A5: 50 → 75** vì SPA route parity có kiểm thử, chưa deploy thật.
- **C25-11: 25 → 50** vì editor nguyện vọng có engine/UI/test, chưa E2E và chưa bao phủ dữ liệu quốc gia.
- Các mục khác giữ nguyên; **80% hôm nay chưa đủ bằng chứng**.

## Còn thiếu / cần kiểm trên Windows

1. Giải nén, chép đè, giữ `.env`, `.env.local` và `node_modules` cũ.
2. Chạy `npm run test:aspiration-draft && npm test && npm run build` (PowerShell: chạy từng lệnh) và `npm run dev`.
3. Vào `/atlas`, chọn “Mở sổ tay nguyện vọng nháp”; thêm PTIT từ danh sách sau khi xác nhận hai môn, thêm mục tự khai báo, di chuyển một ngành sư phạm tới NV6 để thấy cảnh báo, xuất/nhập JSON; kiểm tra các đường dẫn `/student/consent` và `/student/companion` khi triển khai Vercel.
4. **Không dùng bản nháp này để đăng ký chính thức.** Cần xác minh điều kiện ngành–năm–phương thức, chương trình đào tạo giáo viên và chính sách 2026 với cơ quan/trường có thẩm quyền, do hệ thống nguồn còn thí điểm.
5. Gate production còn cần Rules Emulator, bảo vệ consent người vị thành niên, Firebase và Web Push thiết bị thật. Bản này không bật tự động các dịch vụ đó.
