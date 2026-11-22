# CLA CP79 — Giao diện gradient sáng theo màu gốc 6 phân hệ

Ngày: 22/11/2026. Base: `Cognitive-Learn-CP78-20261122.zip` do người dùng cung cấp.

## Phạm vi khóa

- **KHÔNG đổi tên** 6 phân hệ: Seed — Bản sắc học tập; Lumen — Dấu vân tay trí tuệ; Atlas — Bản đồ tương lai; Orion — Kiến trúc tương lai; Pulse — Đường cong tiến hóa; Haven — Hành trang thế giới.
- **KHÔNG đổi bố cục, route, nghiệp vụ, thuật toán hay dữ liệu.** Chỉ cập nhật lớp màu và thuộc tính `data-module` để định danh chủ đề trên các thành phần đã có.
- **KHÔNG thêm lớp CSS import mới.** Các giá trị màu có một nguồn chung trong `src/styles/37-cla-orbital-theme.css`, được tiêu thụ bởi các tệp CSS hiện hữu.

## Đã thực hiện

1. Đồng bộ sáu palette đúng thông số chốt: 2 màu accent, một màu nền mềm, một màu viền, một màu chữ đậm đủ tương phản và glow cho mỗi phân hệ.
2. Gradient mảnh ở tab active, huy hiệu nhận diện phân hệ; nền trắng với tint nhẹ ở hero, thẻ giới thiệu và khu vực chọn module.
3. Sơ đồ 6 phân hệ: giữ nguyên tọa độ và liên kết; đổi màu từng node, vòng số thứ tự, panel mô tả theo node đang chọn; đường trung tâm dùng xanh dương → cyan → tím. Mobile giữ danh sách hiện tại.
4. Các phân hệ có màu riêng: Seed xanh ngọc; Lumen vàng đồng; Atlas xanh dương; Orion tím; Pulse hồng đỏ; Haven cyan.
5. Đổi accent cho các thành phần biểu đồ cụ thể: thanh chỉ số Lumen, thanh tiến trình Pulse, thanh dữ liệu Atlas, chuỗi thời gian Seed. Cảnh báo nguy cơ và trạng thái nghiệp vụ giữ màu ngữ nghĩa riêng.
6. Nút chính dùng phiên bản gradient đậm với chữ trắng; tab/pill tint nhẹ có chữ đậm. Tập trung bàn phím có dấu hiệu trực quan. Quy tắc mới chỉ áp dụng light theme, dark theme giữ giao diện riêng và được bảo vệ ở thanh điều hướng.
7. Trang giới thiệu và bộ chọn module kế thừa palette tương ứng qua `data-module` mà không thêm mục, không đổi tên hay đổi vị trí.

## Các tệp nguồn thay đổi

- `src/styles/37-cla-orbital-theme.css` — palette 6 chủ đề tập trung.
- `src/styles/48-cla-unified-navigation.css` — thanh tab, icon và active state từng chủ đề.
- `src/styles/40-cla-exam-horizon-learning-circuit.css` — node, panel, CTA của sơ đồ, cả mobile.
- `src/styles/49-cla-product-polish.css` — màu light theme xuyên các trang, card, chart và module picker.
- `src/page/seed/components/LearningCircuit.tsx` — gắn chủ đề theo node, giữ vị trí và link.
- `src/page/main/AboutPage.tsx` — gắn chủ đề vào 6 thẻ giới thiệu.
- `src/components/common/ModuleClusterGrid.tsx` — gắn chủ đề vào bộ chọn module.
- `tests/cp79-six-gradient-theme.test.cjs` — kiểm thử palette, giữ tên/route, tương phản, và scope.
- `package.json` — thêm lệnh `npm run test:cp79:theme` vào suite.

## Kiểm tra thực tế

| Kiểm tra | Kết quả |
|---|---|
| `npm run test:cp79:theme` | PASS, 5/5 |
| `npm run test:cp78:clarity` | PASS, 7/7 |
| `npm run test:cp76:names` | PASS, 9/9 |
| `npm run test:cp75:ux-audit` | PASS, 6/6 |
| `npm run test:cp74:product-polish` | PASS, 8/8 |
| `npm run test:cp70:journey` | PASS, 19/19 |
| `npm run check:layout` | PASS, 22 tệp bắt buộc hợp lệ |
| CSS syntax (tinycss2) | PASS, 4/4 CSS sửa không có parse error |
| CSS selectors (cssselect2) | PASS, các selector mới ở CSS cuối hợp lệ |
| WCAG AA màu chữ sáng | PASS: chữ đậm trên nền tint ≥6.2:1; trắng trên màu CTA gradient tối thiểu ≥5.3:1 |
| `npm ci --offline` | BLOCKED: cache npm thiếu `yargs-parser@21.1.1`; không phải lỗi mã nguồn |
| `npm run build` / trình duyệt E2E | **CHƯA XÁC MINH** do phụ thuộc npm chưa cài đủ, và phiên Chromium tĩnh trong sandbox không hoàn thành |

**Lưu ý:** PASS test tĩnh không được xem là bằng chứng đã thử nghiệm trên website đang deploy. Khi có môi trường npm/CI hoạt động, cần chạy `npm ci`, `npm run build` và kiểm tra hai kích thước desktop/mobile + dark mode, các luồng 6 phân hệ trên staging trước khi đưa lên production.

## Rủi ro đã kiểm soát

- Palette không được dùng để ghi đè màu trạng thái nguy cơ, rủi ro tài chính hay lỗi dữ liệu.
- Không chạm Firestore Rules, Gemini, engine nghiên cứu, kết quả SCI/MAS/CSL, dữ liệu trường và học bổng.
- Tỉ lệ màu vẫn ưu tiên nền trắng/xanh rất nhạt; accent tập trung ở tab, đường biểu đồ và hành động chính.

## Công việc tiếp theo khi có CI/staging

- Chạy build đầy đủ và browser screenshot diff trên 6 trang, mỗi trang một desktop/mobile viewport.
- Audit tương phản bằng công cụ accessibility trong trình duyệt, đặc biệt nút disabled, biểu đồ nhỏ, thông báo và chế độ dark.
- Chỉ triển khai sau khi các gate thực tế đạt, không tự chấm PASS thay bằng test tĩnh.
