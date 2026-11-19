# CLA CP28 — Batch 2 privacy server cleanup (non-production)

Đọc `docs/CP28/CP28_BATCH2_SERVER_REVOCATION_REPORT.md` trước khi dùng.

Đã bổ sung Functions codebase riêng, chỉ triển khai sau nghiệm thu và phê duyệt. **Không có hành động deploy nào trong gói**; `firebase.json` và candidate Rules giữ nguyên bản CP28 Batch 1.

```powershell
npm run test:consent-server-cleanup
npm run verify:cp28:static
npm run test:rules:emulator
npm run verify:cp37
```

- **110/110** bài kiểm thử cục bộ (5 suite) đã PASS trong môi trường đóng gói.
- **75 Emulator** và `npm run verify:cp37` vẫn cần chạy trên máy đã cài dependencies.
- **B5, F1, F2, R2.4**: chưa được chấm reviewer PASS; hậu triển khai cần integration và kiểm soát retention.
