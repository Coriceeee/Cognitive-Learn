# CP31 Batch 3 — Start here

Áp dụng **patch Batch 3** lên đúng **full source CP31 Batch 2** sau khi backup, hoặc thay bằng full source CP31 Batch 3. Không đặt patch lên CP30/CP29.

```powershell
npm ci
npm run test:cp31:batch3
npm run verify:cp31:batch3
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

Mở ứng dụng bằng tài khoản Admin QA, lần lượt truy cập:
- `/admin/diagnostics?view=seed-migration` — kiểm tra hai tài liệu Demo của chính UID hiện tại.
- `/admin/diagnostics?view=atlas-fresh` — kiểm tra registry 2024–2026 ở thời điểm build.
- `/admin/diagnostics?view=haven-sources` — kiểm tra metadata học bổng trong registry.

Nhấn **Chạy kiểm tra thực tế** và xem PASS/WARN/FAIL/NOT TESTED cho từng tiêu chí. Một PASS ở đây chỉ là PASS kiểm tra nguồn/schema nội bộ, KHÔNG phải duyệt nguồn live hoặc production.

Playwright QA: xem `docs/CP31/CP31_BATCH2_BROWSER_E2E_REPORT_20261115.md` để cấu hình đúng 4 tài khoản QA, không dán mật khẩu vào chat. Batch 3 có **51** kiểm tra browser dự kiến; `--check-config` không chạy Chromium.

`npm run verify:cp31:batch3` đã PASS cục bộ; production build, Emulator 86 ca và browser E2E chưa được chạy trong môi trường đóng gói. Báo cáo: `docs/CP31/CP31_BATCH3_OPERATIONAL_AUDITS_REPORT_20261115.md`.
