# COGNITIVE LEARN AI — CP31 Batch 11

**Dùng PATCH trên CP31 Batch 10, không áp lên Batch 9.** Sao lưu source đang có trước khi thay đổi. Hoặc giải nén FULL SOURCE B11 vào một thư mục mới; giữ riêng `.env.local` của bạn, không đưa secrets vào ZIP.

## Mục đích

Đối chiếu dữ liệu **T0 đã chốt → T1 tự báo cáo** ở các môn có cả hai mốc, không thay điểm thiếu bằng 0, không khẳng định tác động hay dự báo ML khi không có forecast hợp lệ. Tích hợp trực tiếp vào bảng Closed-Loop trên Orion/Pulse/Lumen và Golden Path offline.

## Windows verify

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch11
if ($LASTEXITCODE -ne 0) { throw 'B11 TEST FAILED' }
npm run verify:cp31:batch11
if ($LASTEXITCODE -ne 0) { throw 'B11 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
'CP31_BATCH11_LOCAL_PASS'
```

`npm run research:golden-path` và `npm run research:golden-path:verify` tạo, phát lại **dữ liệu synthetic duy nhất**; không ghi Firebase và không xác nhận học sinh thật đã tiến bộ.

**Báo cáo:** `docs/CP31/CP31_BATCH11_T0_T1_COMPARISON_REPORT_20261116.md`.

**Checklist:** `docs/CP31/CLA_REAUDIT_164_CP31_BATCH11_20261116.csv` và `docs/CP31/CLA_TAI_CHAM_CHI_TIET_164_CP31_BATCH11_20261116.xlsx`.

**Chưa nghiệm thu:** 72 browser QA, Firestore Emulator runtime Batch 10/11, production release/rollback, xác thực outcome nghiên cứu.
