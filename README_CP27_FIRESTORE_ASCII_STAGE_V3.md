# CP27 — Firestore Emulator Unicode-path fix V3

## Nguyên nhân

Firestore Emulator Java không đọc được đường dẫn project có ký tự tiếng Việt trong `C:\Gạo\Cognitive-Learn`: log hiển thị `C:\G?o\...`. Firebase CLI V2 đã chạy, nhưng tiến trình Java không mở được file Rules. Dùng `subst X:` có thể vẫn gặp lỗi nếu runtime chuẩn hóa trở lại đường dẫn gốc.

## Bản vá

Chỉ thay **`tools/firestoreSecurityGate.cjs`**. Khi chạy trên Windows, script:

1. Chạy preflight và Rules static test như trước.
2. Sao chép **chỉ** `firebase.emulator.cp21.json`, `firestore.rules.CANDIDATE_CP21`, `tests/firestore.rules.cp21.test.mjs` vào thư mục tạm ASCII thực.
3. Tạo junction tạm `node_modules` tới dependencies đã cài ở thư mục gốc (không sao chép file dữ liệu học sinh).
4. Chạy Firebase CLI bằng **demo** project `demo-cla-cp21-security` và Firestore Emulator loopback, sau đó dọn staging.
5. Ghi `reports/security/firestore_emulator_gate.json`, `.log`; nếu có debug log trong staging, sao chép về `reports/security/firestore_emulator_debug.log`.

Không sửa `firestore.rules` production, không gọi `firebase deploy`, không tắt chức năng bảo mật Windows.

## Cách áp dụng

Trong `C:\Gạo\Cognitive-Learn`, sao lưu file cũ rồi chép `tools\firestoreSecurityGate.cjs` từ ZIP patch vào thư mục cùng tên (chỉ một file).

```powershell
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
Get-Content .\reports\security\firestore_emulator_gate.log -Tail 80
```

Nếu Java/Emulator vẫn lỗi, đọc `reports\security\firestore_emulator_debug.log` hoặc file `firestore-debug.log` (nếu tồn tại). `preflight: PASS`/`staticTests: PASS` không đồng nghĩa phân quyền Emulator PASS.

## Phạm vi xác minh

- `node --check`: PASS.
- 26/26 static/SG unit tests: PASS.
- ASCII staging creation + exact-file copy + junction + safe cleanup: thử nghiệm đơn vị trên Linux PASS.
- **Chưa có kết quả thực thi Firebase Emulator trên máy Windows của người dùng.**
