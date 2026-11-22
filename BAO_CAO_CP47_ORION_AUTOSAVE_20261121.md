# BÁO CÁO CP47 — ORION DRAFT AUTOSAVE

**Ngày:** 21/11/2026  
**Base:** `Cognitive-Learn-080333b4b7ad7976017ce32e0b0c499d28a76173.zip`  
**Phạm vi:** giảm nguy cơ mất dữ liệu nháp khi học sinh chuyển khỏi Orion; không thay đổi công thức mô phỏng, quyền truy cập hay dữ liệu tuyển sinh.

## 1. Vấn đề được xử lý

CP42 đã chia Orion thành các workspace riêng và ghi rõ học sinh cần lưu dữ liệu trước khi chuyển trang. Tuy nhiên, thao tác lưu vẫn phụ thuộc vào việc người dùng nhớ nhấn nút. Khi rời module hoặc đóng trang trước khi lưu, các chỉnh sửa mới nhất có thể mất.

## 2. Thay đổi

- Orion tự lưu bản nháp lên Firestore sau 700 ms kể từ lần chỉnh sửa cuối.
- Chỉ tự lưu khi tài khoản đã được xác minh và trạng thái bản nháp hiện tại là `ready` hoặc `empty`; không ghi trong lúc tải, khi signed-out hoặc khi đã có lỗi tải.
- Dùng revision counter để không đánh dấu đã lưu nếu có chỉnh sửa mới hơn trong lúc lần lưu trước đang chạy.
- Trạng thái hiển thị rõ: đang tự lưu, đã tự lưu, còn thay đổi chưa lưu hoặc tự lưu chưa thành công.
- Giữ nút lưu thủ công và kiểm tra dữ liệu hiện có.
- Tiếp tục dùng `useModuleDraft` và Firestore theo UID hiện tại; không thêm localStorage/sessionStorage, không đổi Firestore Rules và không tạo collection mới.

## 3. File thay đổi

- `src/page/orion/OrionPage.tsx`
- `tests/cp47-orion-autosave.test.mjs` (mới)
- `package.json` (thêm `test:cp47:orion-autosave` và nối vào `npm test`)

## 4. Kiểm thử

- `node --experimental-strip-types --test tests/cp47-orion-autosave.test.mjs`: **5/5 PASS**.
- `npm test`: **PASS** toàn bộ chuỗi test trong package script, bao gồm các regression CP42 và CP47.
- CP42 focused workspace: **10/10 PASS**.
- CP42 national pathways: **11/11 PASS**.
- CP42 national source discovery: **9/9 PASS**.
- CP42 scheme coverage: **8/8 PASS**.
- CP42 robust decision: **8/8 PASS**.
- CP42 holistic temporal: **13/13 PASS**.
- `npm run build`: **BLOCKED** trong môi trường đóng gói do cài dependency không hoàn tất; TypeScript báo thiếu type packages (`react`, `node`, `d3-*`, ...). `npm ci` đã timeout hai lần. Không kết luận build PASS.
- Browser E2E/Firestore emulator chưa chạy; cần xác nhận trong môi trường có dependency và Firebase Emulator đầy đủ.

## 5. Giới hạn và an toàn

- Đây là lưu bản nháp, không phải ghi nhận intervention/outcome và không tạo bằng chứng nghiên cứu.
- Firestore Rules hiện hành vẫn là lớp quyết định quyền; không nới quyền truy cập.
- Không deploy production từ checkpoint này.
- ZIP đầu vào có `.env`; bản bàn giao đã loại `.env` khỏi gói để tránh phát tán cấu hình môi trường. Giữ cấu hình riêng ở máy triển khai và kiểm tra giới hạn/referrer/API restrictions của Firebase Web API key trong Firebase/Google Cloud Console.

## 6. Trạng thái nghiệm thu

| Hạng mục | Trạng thái |
|---|---|
| Autosave contract tests | PASS |
| CP42 targeted regression | PASS |
| Full npm test | PASS — toàn bộ chuỗi trong package script |
| TypeScript/Vite build | BLOCKED — dependency install incomplete |
| Firebase Emulator / browser E2E | NOT RUN |
| Production deployment | NOT RUN |

**Kết luận:** CP47 giảm rủi ro mất nháp Orion ở mức mã nguồn và contract tests. Chưa được coi là nghiệm thu production cho đến khi chạy build, Firebase Emulator và browser E2E trong môi trường đầy đủ.


## 7. Bổ sung CP47 — dọn cấu trúc nguồn

- Xóa ba component legacy không còn được import: `src/page/main/RolePage.tsx`, `src/components/common/StudentLinkManager.tsx`, `src/components/common/SharedReportPanel.tsx`. Điều này khớp phạm vi sản phẩm hiện tại chỉ dành cho học sinh; các test student-only xác nhận route và client không tham chiếu các màn cũ.
- Di chuyển hai script nghiên cứu Python bị đặt nhầm trong `src/` về đúng bản đã có trong `research/src/`; hai cặp file có SHA-256 trùng khớp trước khi dọn.
- Cập nhật fingerprint source release và tái tạo/verify synthetic demo backup. `npm run check:layout`: PASS; `npm run demo:final`: PASS 11/11 + backup synthetic verified.
- Các thay đổi này không xác nhận hiệu quả nghiên cứu hay production deployment.
