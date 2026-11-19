# CLA CP27 — V5 Firestore Authorization Repair (2026-11-15)

## Kết luận từ phép chạy THẬT trên Windows của chủ dự án

V4 đã xử lý được lỗi đường dẫn Unicode và cổng Emulator. Firestore Emulator thực sự chạy 74 ca, **68 PASS / 6 FAIL**. Đây là lỗi thực thi Rules ứng viên, không phải lỗi Java/Firebase CLI nữa:

| Test lỗi | Dấu hiệu runtime | Xử lý V5 |
|---|---|---|
| L02 | `studentId is undefined` trong truy vấn `student_links` chỉ lọc `viewerId` | Tách quy tắc `list` khỏi `get`, dùng trường owner-safe `map.get` và bắt buộc lọc theo viewer/student UID; vẫn chặn list không điều kiện |
| J04 | Vượt 1.000 biểu thức khi append check-in | Tách `validJourneyUpdate` khỏi validator tạo chu kỳ; chỉ đánh giá trường được phép sửa |
| J09/J10/J12 | Vượt 1.000 biểu thức khi cập nhật/review/khóa legacy | Giảm phép đánh giá lặp lại, giữ xác thực student + consent, mutex, `getAfter` |
| J11 | Vượt 1.000 biểu thức trước khi kiểm tra evidence giả | Chỉ gọi `validJourneyEvidence` khi review; xác suất giả, pseudonym sai vẫn phải bị từ chối |

**Chưa có kết quả Firestore Emulator V5 trên máy người dùng.** 84/84 kiểm thử local Node/contract PASS trong môi trường đóng gói; bộ 74 ca authorization phải chạy lại trên Windows. Không đổi trạng thái C3/I3/K17 thành PASS khi chưa có báo cáo mới.

## Phạm vi thay đổi

- `firestore.rules.CANDIDATE_CP21` — quy tắc **ứng viên**, KHÔNG phải Rules production.
- `tests/cp27-firestore-rules-v5.contract.test.cjs` — 8 regression/static guard, không thay thế 74 ca Emulator hiện hữu.
- `package.json` — thêm lệnh `test:rules:v5:static`, giữ nguyên các lệnh sẵn có.
- README này.

`tools/firestoreSecurityGate.cjs` được giữ nguyên bản V4, bao gồm staging ASCII và chọn cổng loopback. `firebase.json` không thay đổi. Toàn bộ 74 ca kiểm thử trong `tests/firestore.rules.cp21.test.mjs` không bị sửa hoặc xóa.

## Cảnh báo bảo mật cần xử lý sau V5

Firestore **list query** của Teacher/Parent chỉ có điều kiện `viewerId == uid` không thể tự xác thực trạng thái consent của *mỗi* student qua đường dẫn động `student_consents/{studentId}` một cách an toàn ở query planner. Bản V5 cho phép xem metadata của liên kết đã cấp theo `viewerId` hoặc `studentId` (người dùng active), nhưng `get` trực tiếp và toàn bộ *shared report* vẫn giữ consent gate. **Tên trong metadata liên kết có thể tiếp tục hiện diện sau khi student rút product consent cho đến khi liên kết được thu hồi**. Không chấm toàn bộ consent/privacy gate là hoàn tất chỉ vì 74 ca PASS. Hướng giải quyết tận gốc: server-controlled recipient inbox/consent-aware revoke, loại bỏ tên cá nhân khỏi metadata có thể liệt kê, hoặc quy trình thu hồi liên kết tin cậy có audit.

Không thể lấy một test tĩnh của Rules để chứng minh quyền truy cập thực. Nếu L02 vẫn FAIL, **không mở rộng quyền đọc collection** để làm xanh test; cần xem log Emulator, phân tích query planner, có thể phải đổi data model/inbox.

## Áp dụng trên máy Windows

1. Sao lưu `firestore.rules.CANDIDATE_CP21` và `package.json` hiện tại. Giải nén ZIP V5 **vào đúng thư mục root của dự án**, giữ nguyên cấu trúc tương đối; **không thay thế `.env`, `firestore.rules` production hoặc toàn bộ dự án**.
2. Chỉ chạy trên `C:\Gạo\Cognitive-Learn`, PowerShell:

```powershell
npm run test:rules:v5:static
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw -Encoding UTF8
Select-String -Path .\reports\security\firestore_emulator_gate.log -Pattern 'failing tests:|not ok|FAIL|maximum of 1000|evaluation error' -Context 1,4
```

3. `overall: PASS` và `emulatorAuthorizationTests: PASS` mới đủ để xác nhận **Rules ứng viên trong Emulator**. Mã nguồn ứng viên mới có SHA-256: `1945ca60ce7b62308cf93ceb250178a7d3b982e8fa17bbf6458e14c1bc9c3435`.
4. **Không tự deploy Rules ứng viên**; Rules production chưa được xác minh, không có thay đổi production nào trong bản vá này.
5. Nếu FAIL: gửi cuối log chứa `failing tests` và JSON; các `PERMISSION_DENIED` xuất hiện ở các test `assertFails` là dự kiến, không phải tất cả đều là lỗi.

## Nguyên tắc nghiệm thu

- CP27 *source build* đã được chủ dự án chạy PASS trước đó.
- V4: 68/74 Emulator tests PASS; 6 FAIL.
- V5: 84/84 local unit/contract tests PASS; Emulator **NOT RUN** tại môi trường đóng gói.
- Không sửa `firestore.rules` production, không tắt firewall/bảo mật Windows, không thay dữ liệu người dùng.
