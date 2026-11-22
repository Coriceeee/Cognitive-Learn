# CP71 — Điều hướng thống nhất và sửa tương phản màu
Ngày bàn giao: 22/11/2026 · Nền kế thừa: CP70

## Phạm vi thay đổi

1. `src/components/common/ModuleSectionNav.tsx`: chuyển tất cả sáu phân hệ Seed/Lumen/Atlas/Orion/Pulse/Haven sang **một thanh điều hướng duy nhất**, gồm nhãn module, Tổng quan, các tab chính, Mục khác và Phân hệ; loại bỏ headline/step counter/pager/start panel trùng lặp bên trong thanh điều hướng.
2. Atlas du học: `/atlas/study-abroad`, `/programs`, `/requirements`, `/sources` nằm trong cùng thanh, giữ tham số `country` khi di chuyển giữa bốn trang; không render thêm thanh `cla-study-actions` riêng trên trang.
3. `src/styles/48-cla-unified-navigation.css`: lớp CSS cuối cùng, dùng màu chữ/nền đi thành cặp cho tab mặc định/chọn/hover/light/dark; đồng bộ hình thức tab phụ (chọn năm học, kịch bản, bộ lọc), tối ưu mobile; trạng thái chọn luôn hiển thị.
4. `src/styles/47-cla-contrast-repair.css`: sửa nhãn tìm kiếm, chip trạng thái, thông báo chưa tìm thấy và các nút trên bản đồ chức năng khi nền chuyển từ tối sang sáng.
5. `tests/cp71-unified-navigation.test.mjs`, `tools/cp71_unified_preview.mjs`, `tools/cp71_unified_visual_qa.py`: kiểm thử cấu trúc, đường dẫn, và Chromium preview độc lập.

**Quan trọng:** Không xoá nội dung của module, không gỡ chức năng hay điều chỉnh Firestore Rules, thuật toán dự báo, dữ liệu học sinh. Các liên kết khác nằm trong "Mục khác" và menu Phân hệ.

## Bằng chứng

| Hạng mục | Kết quả |
|---|---|
| Unit/contract CP71 mới | 6/6 PASS |
| Hồi quy `npm test` đầy đủ | exit 0, 1.404 dòng TAP `ok`, 0 dòng `not ok` (có test lồng nhau) |
| Hồi quy điều hướng CP63/CP64/CP65/CP68 và các contract liên quan | 79/79 PASS khi chạy riêng |
| QA bố cục 6 module x 11 chiều rộng (320–1280px) | 66/66 PASS; không tràn ngang hoặc che tab được chọn |
| Chromium preview sáng/tối, desktop/mobile | 4/4 PASS; kiểm tra trạng thái chọn, dropdown và target |
| Tương phản chữ của tab thường và tab được chọn trong bốn preview | WCAG contrast >= 4.5:1 |
| Demo synthetic offline | 11/11 PASS; không phải scientific validation |
| Rules tĩnh | 15/15 PASS; không phải Emulator |
| Layout | PASS |
| Packaging safety | 3/3 PASS |
| TSX syntax transpile | 0 diagnostics trên hai tệp sửa |
| Production build / Firebase Emulator / browser E2E thật | BLOCKED/CHƯA CHẠY do thiếu dependencies trong môi trường |

Ảnh trong `reports/cp71/preview-unified-*.png` là **preview CSS/DOM độc lập**, không phải ảnh website React thật. Không dùng chúng làm ảnh chứng minh hệ thống đã triển khai khi viết báo cáo NCKH.

## Những điểm còn cần kiểm tra trước khi chốt UX chính thức

- Cài `npm ci` trên môi trường có truy cập npm registry, chạy `npm run build` và `npm run dev`.
- Kiểm thử với học sinh giả lập trên 6 module (desktop/mobile), bao gồm thao tác mở/đóng menu Phân hệ, Mục khác, thay đổi quốc gia và Back/Forward.
- Chụp ảnh website React thật khi running, rà toàn trang với dark mode nếu kích hoạt trong bản cuối.
- Xác minh bản nháp chưa lưu vẫn được bảo vệ khi click các tab và dropdown.
