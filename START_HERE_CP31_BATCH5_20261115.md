# CP31 Batch 5 — START HERE

Base bắt buộc: **CLA_FULL_SOURCE_CP31_BATCH4_EVIDENCE_CONSOLE_20261115.zip**.

- Dùng **full source CP31 Batch 5** nếu chưa sửa source nội bộ; hoặc sao lưu rồi **overlay patch Batch 5** lên đúng full source Batch 4.
- Sáu công cụ mới `/admin/diagnostics?view=atlas-approve|orion-policy|orion-scenarios|pulse-evidence|pulse-trends|haven-finance`.
- Nghiệm thu: `npm ci`, `npm run verify:cp31:batch5`, `npm run test:rules:emulator`, `npm run verify:cp37`.
- Bộ browser QA `python tools/cp31_browser_e2e.py --check-config` chỉ kiểm tra config; không chạy 72 E2E.
- Không deploy production, không nạp dữ liệu cá nhân, không cấp quyền/xuất bản nguồn chính thức.
- Chi tiết: `docs/CP31/CP31_BATCH5_GOVERNANCE_REPORT_20261115.md` và `docs/CP31/CP31_BATCH5_INPUT_GUIDE_20261115.md`.
