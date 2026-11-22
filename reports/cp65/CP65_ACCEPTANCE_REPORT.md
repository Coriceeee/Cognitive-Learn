# CP65 — Atlas/Lumen UX acceptance record

**Ngày 2026-11-21** · Kế thừa CP64 · UX-first để viết báo cáo NCKH. Không thay đổi business rules, ML, quota hay Security Rules.

## Mã nguồn thay đổi

- `src/lib/atlasEvidenceOverview.ts`: kiểm kê bản ghi điểm theo năm 2024–2026; không suy diễn nguồn thiếu.
- `src/page/atlas/components/AtlasEvidenceJourney.tsx`: trình bày 4 tác vụ và biểu đồ inventory; liên kết sang những tab đã triển khai.
- `src/page/atlas/AtlasPage.tsx`: đưa thanh điều hướng lên đầu workspace; hiển thị chart công bố ở tab so sánh không cần mở disclosure.
- `src/page/lumen/components/LumenObservationJourney.tsx`: chỉ cho hiển thị trạng thái từ phép đo hợp lệ, dữ liệu history và scoreAvailable.
- `src/page/lumen/LumenPage.tsx`: gắn lộ trình và Signal Atlas vào trang tổng quan, không thay thế các tab phân tích chi tiết.
- `src/styles/44-cla-atlas-lumen-journey.css`: light/dark, mobile, focus, print, reduced motion; `src/styles.css` import ở cuối.
- `tests/cp65-atlas-lumen-ux.test.mjs`: 16 bài kiểm thử mới; package.json thêm vào `npm test`.

## Bằng chứng

| Gate | Trạng thái | Nguồn |
|---|---|---|
| CP65 semantic + module integration | **16/16 PASS** | `cp65-atlas-lumen-ux.log` |
| CP62–CP64 UX regression | **44/44 PASS** | `ux-regression.log` |
| Full `npm test` | **EXIT 0**, 1.318 dòng TAP `ok`, 0 dòng `not ok` | `npm-test.log`, `npm-test.exit` |
| Rules static | **15/15 PASS** | `rules-static.log` |
| Demo synthetic | **11/11 PASS** | `demo-final.log` |
| Source fingerprint | **PASS**, 517 đường dẫn | `source-fingerprint.log` |
| Layout | **PASS** | `layout.log` |
| TSX transpile syntax + CSS parser | **PASS** | `syntax-css.log` |
| Isolated Chromium desktop light/dark/mobile (Atlas, Lumen) | **6/6 PASS**, không tràn ngang | `chromium-preview.log`, `preview-*.png` |
| Source packaging safety | **3/3 PASS** | `packaging-tests.log` |
| Production build | **BLOCKED** — thiếu dependencies/types trong môi trường | `dependency-preflight.log`, `build.log` |
| Firebase Emulator + browser E2E trên app thực | **Chưa nghiệm thu** | Chưa có runtime phù hợp |
| Real-world ML & research validation | **Ngoài phạm vi CP65** | Không có tuyên bố kiểm định mới |

**Lưu ý kết quả:** số dòng TAP `ok` bao gồm cả subtests/lồng nhau; đây là số dòng PASS của log, **không** tự suy diễn là 1.318 test case độc lập. Ảnh QA được sinh từ TSX thành phần thật nhưng với fixture minh họa trong HTML độc lập; không phải ứng dụng production.

## Tiến độ

CP65 hoàn thiện một đợt UX Atlas/Lumen phục vụ viết báo cáo, nhưng **không tăng tự động số mục nghiệm thu chính thức** của backlog 164. Mục tiêu kế tiếp CP66: chuẩn hóa trạng thái loading/empty/error và tương phản mobile toàn bộ sáu module. CP67: nghiệm thu browser app thực và chốt UX khi khả thi.
