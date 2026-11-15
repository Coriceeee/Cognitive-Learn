# COGNITIVE LEARN AI — Báo cáo tích lũy sau bước 04 (12/11/2026)

## Phạm vi bàn giao
- Nền: `CLA_CP37_OPERATING_GUIDE_FULL_SOURCE_20261111.zip`.
- Gộp đúng các bản sửa **bước 02 Lumen**, **bước 03 Atlas**, **bước 04 Atlas**.
- **Không có thay đổi của bước 05 (Seed)**. Không chỉnh sửa Firebase Rules, nguồn dữ liệu tuyển sinh, bộ máy ML hoặc vai trò.
- Full source chứa toàn bộ thư mục `src/`, `public/`, `api/`, `tests/`, `research/`, `docs/` và các file cấu hình dự án; **không kèm `node_modules` hoặc `.env`**.
- Các file trong ZIP nằm ngay ở thư mục gốc (`package.json`, `src/`, `public/`...), không có thêm một lớp thư mục bao ngoài.

## Diff chính xác so với CP37 gốc
**4 file source đã sửa:**
1. `src/styles/24-cla-subpages-ui.css` — khôi phục những panel Lumen bị CSS che.
2. `src/lib/admissionRules.ts` — chặn gán nhóm nguyện vọng khi thiếu benchmark hợp lệ.
3. `src/page/atlas/AtlasPage.tsx` — truyền nguồn dữ liệu cho Admission Engine.
4. `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx` — kết nối benchmark đã kiểm tra qua bridge.

**3 file thêm mới:**
1. `src/lib/atlasBenchmarkBridge.ts` — kiểm tra benchmark, năm, trường, phương thức và nguồn.
2. `tests/step03-admission-benchmark.test.mjs` — bài test của bước 03, cập nhật cho bước 04.
3. `tests/step04-atlas-benchmark-bridge.test.mjs` — bài test mới của bước 04.

**Không xóa file CP37 nào.** Báo cáo nằm trong ZIP dưới tên `BAO_CAO_BUOC02_04.md`, ngoài ra có file báo cáo tải riêng.

## Kiểm thử đã chạy lại
- Bước 03 + 04: **18/18 PASS** (`node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs`).
- Regression Atlas/admissions + registry: **28/28 PASS**.
- CP37 operating guide: **4/4 PASS**.
- Kiểm tra selector CSS Lumen bằng DOM mô phỏng: **5/5 route PASS**.
- Kiểm tra danh mục thay đổi ZIP so với CP37: **PASS** (4 file sửa, 3 file thêm, 0 file bị xóa).

**Chưa xác nhận:** `npm ci`, full `npm test`, `npm run build`, browser E2E, Firebase Emulator trên chính gói này. Trong bản nguồn hiện tại test CP30 còn một assertion lỗi thời về stylesheet import cuối. **Không tuyên bố toàn bộ test PASS.**

## Tiến độ lộ trình 28 bước / checklist 164 việc
| Bước | Trạng thái | Nghiệm thu trên máy người dùng |
|---|---|---|
| 01 — Lưu nguồn chuẩn, backup/rollback | Chưa xác nhận Git/backup | Chưa đóng |
| 02 — Khôi phục Lumen | Đã có bản vá; kiểm tra CSS 5/5 | Chờ kiểm tra giao diện |
| 03 — Atlas ngừng xếp nhóm khi thiếu benchmark | Đã có bản vá; test đạt | Chờ kiểm tra giao diện |
| 04 — Kết nối benchmark hợp lệ vào engine | Đã có bản vá; test đạt | Chờ kiểm tra giao diện |
| 05 — Seed Profile | Chưa đưa vào gói | Chưa bắt đầu/đóng |
| 06–28 | Không thuộc gói này | Chưa triển khai theo lộ trình |

**Đã chuẩn bị bản vá:** 3 bước (02–04). **Chưa triển khai sau bước 04:** 24 bước (05–28). **Checklist 164:** chưa được cộng thêm điểm nghiệm thu; bản vá và unit test không thay E2E/đối chiếu dữ liệu thật.

## Cách sử dụng trên Windows
1. Sao lưu thư mục đang dùng `C:\Gạo\Cognitive-Learn` hoặc tạo Git commit trước khi chép.
2. Giải nén ZIP vào thư mục **tạm mới**. Xem các mục `package.json`, `src/`, `public/` ở cấp đầu.
3. Nếu muốn thay toàn bộ theo source CP37 + bước 02–04, chép **nội dung bên trong** thư mục vừa giải nén vào `C:\Gạo\Cognitive-Learn`, chọn ghi đè file trùng. **Không xóa `node_modules`/`.env` hiện có; không chép đè nếu máy có thay đổi chưa sao lưu.**
4. Vào PowerShell tại thư mục dự án rồi chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs
npm run build
npm run dev
```

5. Kiểm tra bằng trình duyệt các route `/lumen`, `/lumen/indices`, `/lumen/history`, `/lumen/insights`, `/lumen/assistant` và phần Atlas Admission Engine. Kiểm tra cả trạng thái có và thiếu dữ liệu.

**Cảnh báo khi chép đè:** ZIP kế thừa CP37, vì vậy nếu thư mục trên máy đã có thay đổi mới hơn, thao tác chép toàn bộ có thể làm mất thay đổi đó. Khi không chắc, chạy bản source từ một thư mục riêng trước để so sánh.
