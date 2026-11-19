# CP27 — Firestore Emulator Port Fallback V4 (Windows)

## Nguyên nhân từ log thực tế

Bản V3 đã chạy Firestore Emulator từ một thư mục ASCII thật (`C:\Users\...\Temp\cla-firestore-gate-...`), vì vậy lỗi đường dẫn Unicode `C:\Gạo` đã được khắc phục.

Lệnh mới bị Firebase CLI chặn trước khi chạy bài kiểm tra quyền:

```
firestore: Port 8080 is not open on 127.0.0.1, could not start Firestore Emulator.
Error: Could not start Firestore Emulator, port taken.
```

Không nhất thiết có listener trên 8080: Windows có thể giữ một dải cổng được loại trừ (excluded port ranges) hoặc có xung đột tạm thời.

## Nội dung V4

- Chỉ thay `tools/firestoreSecurityGate.cjs`.
- Vẫn cố định project **demo-cla-cp21-security**, Rules **firestore.rules.CANDIDATE_CP21**, host **127.0.0.1**, và Firebase Emulator UI bị tắt.
- Trên Windows, sau khi tạo thư mục staging ASCII, script kiểm tra khả năng bind `127.0.0.1` và chọn một cổng hợp lệ trong danh sách cố định: `18080`, `18081`, `18082`, `28080`, `28081`, `38080`, `48080`, `58080`.
- Nếu Firebase báo lỗi bind, thử lại tối đa 3 lần với cổng khác; **không** thử lại khi kiểm thử phân quyền thất bại thực sự.
- **Không chỉnh sửa** `firebase.emulator.cp21.json` trong project gốc; chỉ đổi cổng trong bản sao cấu hình tạm, còn Rules giữ nguyên checksum.
- Ghi cổng chạy vào `emulatorPort` trong `reports/security/firestore_emulator_gate.json` và từng lần thử vào `.log`.
- Không deploy, không thao tác với Rules production, không yêu cầu tắt Windows Defender.

## Áp dụng

1. Sao lưu `C:\Gạo\Cognitive-Learn\tools\firestoreSecurityGate.cjs`.
2. Giải nén patch và chép **chỉ** `tools\firestoreSecurityGate.cjs` vào `C:\Gạo\Cognitive-Learn\tools\`.
3. Trong terminal PowerShell ở thư mục gốc dự án:

```powershell
Select-String -Path .\tools\firestoreSecurityGate.cjs -Pattern 'chooseStagePort'
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
Get-Content .\reports\security\firestore_emulator_gate.log -Tail 100
```

Nếu vẫn lỗi trước khi chạy tests, hãy xem các cổng Windows bị loại trừ:

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object LocalPort -in 8080,18080,18081,18082
```

**Lưu ý:** `preflight: PASS` và `staticTests: PASS` chưa phải là kiểm thử authorization. Chỉ khi `emulatorAuthorizationTests: PASS` và `overall: PASS` mới tính là đã nghiệm thu bộ Rules ứng viên trong Emulator. `productionRulesVerified` vẫn `false`.

## Phạm vi kiểm chứng trước bàn giao

- Cú pháp JavaScript: PASS.
- 26/26 kiểm thử tĩnh và Security Gate unit: PASS trên môi trường thử nội bộ.
- Chọn cổng mới, ghi cấu hình staging, giữ nguyên cấu hình gốc, phát hiện cổng đang bị chiếm: PASS.
- Emulator authorization thực trên Windows: **chưa chạy tại môi trường người dùng**, chưa khẳng định PASS.
