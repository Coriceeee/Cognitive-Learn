# CP30 Batch 2 — Realtime Profile / Lumen

Đầu vào: full source **CP30 Batch 1**. Đã bổ sung listener hồ sơ realtime, bảo vệ cache/pending writes, tách phiên A→B→A và không dùng lịch sử Cognitive cache như dữ liệu đã xác minh.

- `npm run test:cp30:profile`: 12/12 PASS cục bộ.
- `npm run verify:cp30:batch2`: PASS cục bộ.
- `npm test`: bị chặn ở TypeScript contract test do thiếu type definitions trong môi trường đóng gói, chưa ghi PASS.
- `npm run build`, 83 Firestore Emulator cases, browser E2E: chưa xác nhận tại đây.

**Áp dụng patch:** sao lưu source CP30 Batch 1, giải nén patch vào root dự án, ghi đè các file cùng tên. Không cần sửa Firebase Rules production.

```powershell
npm run test:cp30:profile
npm run verify:cp30:batch2
npm test
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

Báo cáo: `docs/CP30/CP30_BATCH2_PROFILE_REALTIME_REPORT_20261115.md`.
