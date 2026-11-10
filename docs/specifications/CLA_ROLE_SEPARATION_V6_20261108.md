# CLA CP25 V6 — Tách chức năng học sinh / Admin / Research

Ngày: 08/11/2026. Nguồn: CP25 V5.1 và phản hồi ảnh màn hình của chủ dự án.

## Quyết định đã khóa

- Tổng kiến trúc có 7 module: Nexus, Seed, Lumen, Atlas, Orion, Pulse, Haven.
- Cognitive Path trong vai trò Student có 6 module: Seed, Lumen, Atlas, Orion, Pulse, Haven. Không đưa Nexus hoặc các chức năng kiểm toán vào Student.
- Danh sách nhỏ Student có 24 chức năng: Seed 4, Lumen 4, Atlas 5, Orion 4, Pulse 3, Haven 4. Trong đó có mục `planned` hiển thị đúng “Đang phát triển”; 24 không phải số chức năng đã nghiệm thu.
- Atlas: tuyển sinh Việt Nam, du học toàn cầu (chọn mọi quốc gia/vùng lãnh thổ), liên kết quốc tế tại Việt Nam, gợi ý ngành trường, nguồn tuyển sinh công khai. Haven: học bổng, ngân sách, kế hoạch hỗ trợ và điều kiện còn thiếu.
- Chatbot nổi chỉ hỗ trợ điều hướng, không thay thế Atlas/Haven.

## Chuyển khỏi menu học sinh

| Chức năng nội bộ | Quyền / điểm đến đúng |
|---|---|
| Sẵn sàng dữ liệu ML (consent, leakage, outcome) | Admin / Research: `/admin/diagnostics?view=ml` |
| Audit dữ liệu liên thông và Evidence Record | Admin: `/pulse#pulse-pipeline` (chỉ render cho Admin) |
| Gemini Admission Reader nhập / kiểm tra đề án | Admin → Atlas: `/atlas#atlas-gemini-reader` (chỉ render cho Admin) |
| Quản trị Knowledge Base / xóa / nhập bản nháp | Admin → Atlas: `/atlas#atlas-programs` (chỉ render cho Admin) |
| Báo cáo cho Teacher / Parent | Không hiển thị trong báo cáo Student; các vai trò dùng `/teacher`, `/parent` theo liên kết chia sẻ |
| Tóm tắt hỗ trợ giáo viên và phụ huynh | Không hiển thị trong Haven Student; Admin có thể kiểm thử, Teacher/Parent có luồng riêng |

## Kỹ thuật thay đổi

- `src/data/moduleSubmodules.ts`: tách `studentSubmoduleDirectory` khỏi `moduleSubmoduleDirectory` của Admin/Research.
- `src/components/common/ModuleClusterGrid.tsx`, `ModuleSectionNav.tsx`: Student chỉ dùng danh mục Student; hiện đúng tổng 24 mục, không còn 28 mục pha trộn.
- `src/lib/useIsAdmin.ts`: ẩn/hiện các vùng quản trị bằng role thực từ Firestore, không dùng URL query làm quyền.
- `src/page/atlas/AtlasPage.tsx`: Student xem explorer nguồn chính thức và công cụ phù hợp; Admin mới thấy Gemini Reader, Knowledge Base bản nháp, xóa dữ liệu, công cụ nhập nguồn.
- `api/gemini-admission-reader.ts`: yêu cầu token hợp lệ, tài khoản `active === true` và `role === admin`. Ẩn UI không thay thế kiểm tra API.
- `src/page/pulse/PulsePage.tsx`: Student thấy báo cáo của chính mình; kiểm tra lineage, lưu Evidence Record và tóm tắt vai trò khác chỉ Admin.
- `src/page/haven/HavenPage.tsx`: loại khối tóm tắt Teacher/Parent ra khỏi góc nhìn Student.
- `tests/student-role-isolation.test.cjs`: test ranh giới role; thêm vào `npm test`.

## Kiểm thử / giới hạn

- `npm test`: PASS tại môi trường kiểm tra (bao gồm role isolation test). Các bài này là test logic/static, không phải role E2E.
- `npm run test:rules:static`: 15/15 PASS (static); Firebase Emulator chưa chạy.
- `npm run check:layout`: PASS.
- Transpile cú pháp TypeScript/TSX của 8 file thay đổi: PASS.
- `npm run build`: NOT PASS vì không có `node_modules` (React/Firebase type declarations và Vite), không thể coi là release production đã xác minh.
- Chưa kiểm tra live Firebase role access, Admin Demo, deep links, API backend Vercel hoặc deploy production. Các vùng quản trị phải được bảo vệ bằng backend/Firestore Rules phù hợp.
- Trang gợi ý cá nhân hóa Atlas cần một tập dữ liệu tuyển sinh **đã công bố / xác minh / chia sẻ đúng quyền**, không được coi bản nháp Gemini nằm trong UID Admin là dữ liệu dùng chung.
