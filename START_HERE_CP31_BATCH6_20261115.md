# CP31 Batch 6 — Đọc trước khi áp dụng bản vá

**Nền bắt buộc**: full source CP31 Batch 5. Không áp dụng bản vá này trực tiếp lên Batch 4 hoặc những bản cũ hơn.

## Gói phát hành

- `CLA_CP31_BATCH6_NEXUS_BROWSER_GATE_PATCH_20261115.zip`: chỉ các file mới hoặc thay đổi so với full source Batch 5.
- `CLA_FULL_SOURCE_CP31_BATCH6_NEXUS_BROWSER_GATE_20261115.zip`: source tích hợp đầy đủ, không chứa `.env`, `node_modules`, `dist`, PII hoặc báo cáo QA runtime.

## Kiểm tra trên Windows

```powershell
npm ci
npm run test:cp31:batch6
npm run verify:cp31:batch6
npm run build
npm run test:rules:emulator
npm run verify:cp37
```

**Lưu ý:** `verify:cp31:batch6` kiểm tra source/contract, không chạy browser. `npm run audit:cp31:browser` chỉ PASS nếu đã có báo cáo **72/72 ca** từ QA browser thật.

Chạy E2E cần một Firebase QA riêng và 4 tài khoản QA thật có role Admin, Student, Teacher, Parent. Mật khẩu nhập bằng `--prompt-passwords` để tránh ghi vào file. Xem hướng dẫn đầy đủ `docs/CP31/CP31_BATCH6_BROWSER_ACCEPTANCE_REPORT_20261115.md`.

Cổng `verify:cp31:batch6:full` **sẽ BLOCK** nếu không có môi trường QA, không được dùng `--check-config` thay cho thực thi browser.
