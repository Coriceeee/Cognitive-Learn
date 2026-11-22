# CP84 – Sửa lệnh Firebase Emulator trên Windows (22/11/2026)

## Nguyên nhân dựa trên log CP83

- Firebase Rules static PASS; Emulator trả `error: unknown option '--test'` trước khi kiểm thử ủy quyền thực sự chạy.
- `firebase emulators:exec` trên Windows nhận chuỗi `node --test ...` bị tách thành đối số tuỳ chọn Firebase.
- CP84 tạo `cla-firestore-authz.cmd` ở thư mục staging ASCII tạm và đưa tên file duy nhất làm đối số cho `emulators:exec`. File này gọi chính xác `node --test tests\firestore.rules.cp21.test.mjs`, truyền lại exit code thật.
- Dùng demo project cố định, chỉ loopback, candidate Rules được kiểm tra SHA-256; không deploy.

## Cài đặt overlay trong thư mục gốc dự án

Overlay ZIP có các đường dẫn tương đối từ gốc `C:\Gạo\Cognitive-Learn`; giải nén trực tiếp vào gốc bằng `Expand-Archive -Force`. Sao lưu riêng `tools/firestoreSecurityGate.cjs` trước khi ghi đè; các tệp CP83 khác giữ nguyên.

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
node tools/verify-cp84-snapshot.cjs
if ($LASTEXITCODE -ne 0) { throw 'CP84 snapshot FAIL' }
node --test tests/cp84-firestore-windows-invocation.test.cjs
if ($LASTEXITCODE -ne 0) { throw 'CP84 unit FAIL' }
.\CHAY_NGHIEM_THU_CP84.cmd
```

## Đọc kết quả

- `reports/security/firestore_emulator_gate.json` là trạng thái authorization thật; `emulator_diagnostic PASS` chỉ là công cụ đọc log.
- `reports/acceptance-cp84/run-YYYYMMDD-HHMMSS/SUMMARY.md` có chi tiết toàn bộ QA.
- Firebase Emulator/Browser E2E/production và hiệu quả nghiên cứu khoa học vẫn phải được kiểm chứng riêng.
- Nếu Emulator vẫn FAIL, gửi `firestore_emulator_gate.log` và `firestore_emulator_debug.log` đã lọc bí mật.

Không thay đổi UI, 6 phân hệ hoặc CP31 historical evidence. Không thêm LMM.
