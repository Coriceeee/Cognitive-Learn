# CLA CP56 — Giữ dữ liệu học sinh khi chuyển trang

- Bản tiếp nối CP55, không rebuild dự án.
- Sửa: cảnh báo khi Orion/Pulse/Haven có chỉnh sửa chưa lưu và người dùng chuyển module, Back hoặc logout.
- Không chặn chuyển giữa các tab trong cùng module; không lưu dữ liệu nhạy cảm trong localStorage.
- Kiểm thử: `npm run test:cp56:navigation`; `npm run test:cp56:navigation:integration` (cần `npm ci` hoặc TypeScript dev dependency); `npm run test:rules:static`.
- Báo cáo: `reports/cp56/CP56_ACCEPTANCE_REPORT.md`.
- Chưa chạy Firebase Emulator, production build hay browser E2E thực. Không deploy Rules dự thảo chỉ từ static tests.
