# CP31 Batch 7 — Start here

Nền áp dụng **chính xác CP31 Batch 6**, không phải Batch 5. Bản vá thêm bước xác nhận project Firebase trên HTML trước khi hỏi mật khẩu QA và đưa `index.html` vào source fingerprint.

## Local gates

```powershell
npm ci
npm run test:cp31:batch7
npm run verify:cp31:batch7
npm run build
npm run test:rules:emulator
npm run verify:cp37
```

## Browser QA: chỉ tiến hành nếu có Firebase QA project riêng và bốn tài khoản QA tổng hợp

- Cấu hình `VITE_FIREBASE_PROJECT_ID` trong `.env.local` của QA project; giữ `.env.local` ngoài ZIP/git.
- PowerShell A: `npm run dev -- --host 127.0.0.1`.
- PowerShell B: `python -m pip install playwright`; `python -m playwright install chromium`.
- PowerShell B: `$env:CLA_E2E_QA_PROJECT_ID = 'PROJECT_ID_QA_THAT'`.
- PowerShell B: `npm run qa:cp31:preflight` — không hỏi tài khoản/mật khẩu, không đếm là E2E.
- Sau preflight PASS, cấu hình 4 email QA và QA ACK rồi chạy `npm run qa:cp31:browser`; mật khẩu nhập ẩn bằng prompt.
- Cuối cùng: `npm run audit:cp31:browser`.

Xem hướng dẫn chi tiết: `docs/CP31/CP31_BATCH7_PREAUTH_QA_BINDING_REPORT_20261115.md`.

**Chưa đóng CP31:** 72 browser cases chưa chạy trên môi trường QA thực; không có chứng cứ CI/deploy/backup/rollback production.
