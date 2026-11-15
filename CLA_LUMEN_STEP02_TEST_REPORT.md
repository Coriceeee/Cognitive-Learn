# CLA — Bước 02: Khôi phục các panel Lumen bị CSS che

Ngày: 12/11/2026. Nền kiểm tra: `CLA_CP37_OPERATING_GUIDE_FULL_SOURCE_20261111.zip`.

## Phạm vi thay đổi

- **Chỉ một file source:** `src/styles/24-cla-subpages-ui.css`.
- Không chỉnh sửa `LumenPage.tsx`, engine, Firestore, routing, Atlas, Seed, Orion, Pulse, Haven, package.json hoặc test suite cũ.
- Gỡ quy tắc Lumen gộp trong nhóm CSS ẩn cấp module. Thay bộ lọc riêng theo 5 route Lumen để không che nhầm `LumenSignalAtlas`, `LumenEvidencePanel`, `LumenDecisionPanel`, `LumenStrategyPanel`, thông báo dữ liệu và footer.

| Route | Nội dung giữ lại |
|---|---|
| `/lumen` | Chỉ số tổng quan, bản đồ tín hiệu, evidence, thông báo, footer |
| `/lumen/indices` | Chỉ số, bản đồ tín hiệu, evidence, thông báo, footer |
| `/lumen/history` | Lịch sử Growth, bản đồ biến động, evidence, thông báo, footer |
| `/lumen/insights` | Phân tích, Decision/Strategy, evidence, thông báo, footer |
| `/lumen/assistant` | Gemini (khi đủ điều kiện), evidence, thông báo, footer |

Các empty/error state vẫn hiển thị theo điều kiện hiện có trong LumenPage.

## Kết quả kiểm tra trong môi trường này

- CSS parse + kiểm tra selector với `tinycss2`, `cssselect2`, DOM tổng hợp: **PASS 5/5 đường dẫn**. Đây là kiểm thử hiển thị dựa trên selector, không phải browser screenshot.
- Kiểm tra thay đổi source từ CP37 theo SHA256: **PASS: đúng 1 file thay đổi; không thêm file source**.
- `node tests/module-hierarchy.test.cjs`: **PASS**.
- `node --test tests/cp35-p0-p1-contract.test.cjs`: **8/8 PASS**.
- `node --test tests/scientific-visuals.test.cjs`: **13/13 PASS**.
- `node --test tests/cp37-operating-guide.test.cjs`: **4/4 PASS**.
- `node --test tests/cp30-chat-readability.test.cjs`: **3/4 PASS, 1 FAIL có trước**. Test `CP30 chat readability layer loads after the final CP28 theme` kỳ vọng file import cuối là `25-p1-task-scholarship.css`, trong khi CP37 đã import thêm `26-operating-guide.css` ở cuối. Không sửa test này vì khác phạm vi Lumen.
- `npm ci`, full `npm test`, `npm run build`, browser E2E và Firebase Emulator **chưa chạy** trong môi trường kiểm tra này.

## Cách áp dụng an toàn trên Windows

Giải nén ZIP vá vào một thư mục mới (không giải nén đè source). Trong PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\duong-dan-den-thu-muc-ban-va\CLA_LUMEN_STEP02_APPLY.ps1" -ProjectRoot "C:\Gạo\Cognitive-Learn"
```

Script kiểm tra SHA256 của file gốc CP37. Nếu file trên máy đã khác, script **dừng và không ghi đè**. Nếu đúng, script tự sao lưu file CSS rồi chỉ thay đúng file đó.

Sau đó chạy ở thư mục source:

```powershell
npm run build
npm run dev
```

Kiểm tra trực tiếp `/lumen`, `/lumen/indices`, `/lumen/history`, `/lumen/insights`, `/lumen/assistant` với cả tài khoản có dữ liệu và tài khoản chưa có đủ dữ liệu. Không coi bước 02 hoàn tất nghiệm thu browser trước khi người dùng xác nhận trực quan.

**Rollback:** Dùng đường dẫn `Backup:` mà script in ra, copy file `.bak` đó về `src/styles/24-cla-subpages-ui.css` (không chạy npm ci hoặc xóa dữ liệu).
