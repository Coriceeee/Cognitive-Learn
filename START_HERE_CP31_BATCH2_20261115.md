# CP31 Batch 2 — Browser E2E gate và kiểm tra 22 tác vụ

**Nền chính xác:** `CLA_FULL_SOURCE_CP31_BATCH1_NEXUS_AUDIT_20261115.zip`.

- Nếu có CP31 Batch 1, sao lưu rồi giải nén PATCH CP31 Batch 2 vào đúng thư mục dự án.
- Nếu không chắc phiên bản source, dùng FULL SOURCE CP31 Batch 2, không áp nhiều patch lên nhau.
- `npm ci`
- `npm run verify:cp31:batch2` (static/contract + CP29/CP30 regression)
- `npm test`
- `npm run test:rules:emulator` (86 ca mục tiêu)
- `npm run verify:cp37` (production build)
- **Sau khi chuẩn bị website + 4 tài khoản QA**, chạy Playwright bằng hướng dẫn trong `docs/CP31/CP31_BATCH2_BROWSER_E2E_REPORT_20261115.md`.

`npm run test:cp31:browser` chạy browser thật, không nằm trong `verify:cp31:batch2` (static). Thiếu QA credentials sẽ dừng với mã 2 thay vì tạo báo cáo PASS.

**Chưa nghiệm thu:** Browser E2E, 86 ca Emulator trên Batch 2, production build, 12 tác vụ chưa có công cụ. Không triển khai Firebase production hoặc Rules.
