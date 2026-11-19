# CP30 Batch 1 — Trước khi áp dụng

- **Bản vá:** Chỉ giải nén lên **CP29 Batch 4** đã được sao lưu, giữ nguyên cấu trúc thư mục.
- **Full source:** Có thể giải nén thành thư mục riêng, không chép đè `node_modules`/`.env`/dữ liệu cá nhân.
- **Không deploy production:** File cấu hình Rules, Admin/Privacy Functions và môi trường production không thay đổi.
- **Kiểm thử:** `npm run test:cp30:realtime`, `npm run verify:cp30:batch1`, `npm test`, `npm run test:rules:emulator`, `npm run verify:cp37`.
- **Xem báo cáo:** `docs/CP30/CP30_BATCH1_REALTIME_CONSISTENCY_REPORT_20261115.md`.
- **Rollback:** Khôi phục các file đã bị thay từ bản sao CP29 Batch 4; không cần migration dữ liệu.
