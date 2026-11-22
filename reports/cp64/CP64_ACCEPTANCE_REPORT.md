# CP64 — UX-first release evidence

**Ngày:** 2026-11-21 · **Nguồn:** CP63 đã bàn giao · **Phạm vi:** 3 tổng quan Orion/Pulse/Haven; không sửa mô hình học máy.

## Thay đổi kiểm chứng được

- Tạo `src/lib/moduleInputReadiness.ts`: phân biệt `ready / missing / invalid`, sử dụng cùng `readNumber` validation của dự án, cấm trùng định danh ô để tránh đếm hai lần.
- Tạo `src/components/common/ModuleInputObservatory.tsx` với dải tín hiệu màu có chú giải, thông báo có dữ liệu chưa hợp lệ và CTA theo module.
- Thêm `src/styles/43-cla-input-observatory.css`: palette sáng/tối, trạng thái focus, mobile, print, giảm chuyển động.
- Tích hợp biểu đồ ở trang tổng quan `OrionPage.tsx`, `PulsePage.tsx`, `HavenPage.tsx`, **không hiển thị** ở route quản trị hay giả lập dữ liệu khoa học.
- Bổ sung test `tests/cp64-input-ux.test.mjs` vào `npm test`; cập nhật công cụ dấu vân tay để theo dõi mọi tệp CSS trong `src`.

## Tiêu chí nghiệm thu và giới hạn

| Phạm vi | Kết quả | Bằng chứng |
|---|---|---|
| Logic + hợp đồng CP64 | **17/17 PASS** | `cp64-input-ux.log` |
| Quy tắc Firestore tĩnh | **15/15 PASS** | `rules-static.log` |
| Bố cục project | **PASS** | `layout.log` |
| Demo offline tổng hợp | **11/11 PASS** | `demo-final.log` |
| Parse TSX/TS và CSS | **PASS** | `syntax.log`, `css-parser.log` |
| Ảnh QA desktop light/dark và mobile | **PASS 3/3, không tràn ngang** | `chromium-preview.log`, `preview-*.png` |
| Đóng gói mã nguồn an toàn | **3/3 PASS** | `packaging-tests.log` |
| `npm test` toàn dự án | **PASS, exit code 0** | `npm-test.log`, `npm-test.exit` |
| Production build + Firebase Emulator | **BLOCKED, 19 dependency/executable thiếu** | `dependency-preflight.log`, `build.log` |
| Browser E2E ứng dụng thực | **Chưa thực hiện** | Cần runtime website và backend test |
| Kiểm định nghiên cứu/thực nghiệm | **Không nằm trong CP64** | Không tuyên bố hiệu quả dựa vào biểu đồ nhập liệu |

**Chỉ số 164:** Không tự tăng nghiệm thu chính thức; kế thừa backlog CP62/CP63. CP64 là cải tiến UX có thể kiểm thử offline, chưa phải đóng nghiệm thu tích hợp.

## Chống ngộ nhận trong báo cáo NCKH

`7/14` trong hình QA là **số ô dữ liệu minh họa hợp lệ / tổng số ô**. Không đại diện cho điểm nhận thức, readiness, xác suất đậu hoặc tiến bộ đã quan sát. Hình được xuất từ TSX thực tế qua trình dựng DOM độc lập, nhưng **không phải ảnh website React đã build**. Bộ mô tả chính xác nằm tại `CP64_UX_REPORT_WRITING_KIT.md`.

## Hướng UX tiếp theo

- CP65: đơn giản hóa Atlas so sánh ngành/trường/nguồn và Lumen đọc kết quả, ưu tiên trực quan hóa và điều hướng nhanh.
- CP66: nhất quán các trạng thái loading/empty/error và chuẩn mobile/theme/accessibility xuyên sáu module.
- CP67: sau khi có dependencies và Firebase test, chụp ảnh browser thật, nghiệm thu UX và chốt ảnh cho báo cáo.

## Kết quả tổng kiểm thử

`npm test` kết thúc exit code **0**. Log chứa **1288** lượt PASS ở các khối TAP độc lập, **0** FAIL; không nhầm số dòng `ok` lồng nhau với số test. Dấu vân tay nguồn/stylesheet: `3f49005969af0b3cb1f6094d78d9dca02a4b112b733bf27b53a86942421f5409` (512 đường dẫn được theo dõi).
