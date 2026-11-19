# CLA CP29 — Batch 4 (C1 / C5 / F4)

**Nền bắt buộc:** `CLA_FULL_SOURCE_CP29_BATCH3_ADMIN_SECURITY_20261115.zip` (hoặc dùng trực tiếp full source Batch 4).

- **Patch nhỏ:** giải nén giữ nguyên cấu trúc thư mục vào dự án đã có Batch 3, sao lưu trước khi ghi đè.
- **Full source:** dùng để so sánh/tạo môi trường kiểm thử độc lập; không xóa `.env` hoặc dữ liệu thật khi nâng cấp.
- Các thay đổi chính: transaction chống stale writes ở Seed; kiểm tra schema/UID/scope; account/link listener fail-closed, nút retry.

## Nghiệm thu

Mở PowerShell tại `C:\Gạo\Cognitive-Learn` (đã cài Node dependencies):

```powershell
npm run test:cp29:batch4
npm run verify:cp29:batch4
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

Kỳ vọng bộ Rules Emulator vẫn **83/83** (không sửa Rules). `verify:cp37` cần EXIT_CODE=0 và dòng `✓ built`.

**Lưu ý:** CP29 Batch 4 có regression tĩnh PASS tại môi trường tạo bản vá nhưng chưa xác nhận Emulator/browser E2E/production. Bản ghi Seed legacy không có `updatedAt` sẽ bị khóa an toàn thay vì ghi đè; cần đối soát và migration riêng.

Chi tiết xem `docs/CP29/CP29_BATCH4_DATA_INTEGRITY_REPORT_20261115.md`.
