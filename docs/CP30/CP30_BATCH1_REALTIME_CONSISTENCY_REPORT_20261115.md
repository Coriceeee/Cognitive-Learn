# CLA CP30 — Batch 1: Realtime Seed read consistency

**Ngày:** 2026-11-15. **Đầu vào:** `CLA_FULL_SOURCE_CP29_BATCH4_DATA_INTEGRITY_20261115.zip`.

## Phạm vi đã sửa (không đồng nghĩa hoàn thành CP30)

1. **Bảng điểm realtime:** `useStudentTranscript` yêu cầu Firestore snapshot có `fromCache=false` và `hasPendingWrites=false`, đăng ký `includeMetadataChanges` để nhận chuyển trạng thái khi máy chủ phản hồi. Không hiển thị bảng điểm cache hoặc dữ liệu ghi chưa hoàn tất như dữ liệu đã đồng bộ.
2. **Phân tách tài khoản:** Session epoch chống callback cũ sau A→B→A. Legacy epoch ngăn callback của hồ sơ lưu cũ ghi đè bảng điểm nguồn chính. Dữ liệu sai UID hoặc `dataScope` bị chặn ở read-side. Legacy không có `userId` vẫn được xem qua đường dẫn UID đã bảo vệ để tránh hỏng tương thích; cần migration riêng.
3. **Giao diện:** Trạng thái `syncing` cho biết chưa xác minh được với Firestore, không kết luận đã đồng bộ trong khi offline.
4. **Trang dữ liệu của tôi:** Khi đổi tài khoản/logout, xóa trạng thái kiểm tra cũ. Kết quả `getDocFromServer` trả về trễ bị từ chối theo UID và generation; không hiện trạng thái lưu của tài khoản trước.
5. **Kiểm thử:** 10 ca mới CP30-R01…R10 và 13 ca Seed–Atlas cũ có cập nhật mocks cho Firestore SDK; 23/23 PASS.

## Bằng chứng đã chạy ở môi trường tạo gói

- `npm run test:cp30:realtime`: **23/23 PASS**.
- `npm run verify:cp30:batch1`: **PASS** (bao gồm regression CP29 Batch 4, Rules tĩnh, layout).
- Transpile syntax của 4 file TypeScript/TSX: **0 lỗi cú pháp**.
- `npm test`: **CHƯA PASS** ở môi trường này — kẹt ở `CONTRACT-01` của `step11-prediction-semantics` vì `node_modules` thiếu type definitions `d3-*`, `@types/node`, `@types/react` v.v. Đây là trở ngại môi trường; **không** được tự quy thành PASS trên Batch 1.
- `npm run build`, Firestore Emulator (83 ca), browser E2E: **chưa xác nhận trong môi trường này**.

## Nghiệm thu trên máy Windows đã cài dependencies

```powershell
npm run test:cp30:realtime
npm run verify:cp30:batch1
npm test
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

Cần kiểm chứng thêm: thiết bị online/offline; hai tài khoản A→B→A; tạo/bổ sung bảng điểm sau legacy; Teacher/Parent/Student permission behavior; profile dashboard vẫn dùng one-time `getDoc` (chưa đổi sang realtime toàn phần). **Chưa triển khai Rules hoặc Functions production.**

## Giới hạn

Cải tiến này là cơ chế bảo vệ hiển thị và nhất quán theo phiên. Nó không thay thế Firebase Authentication, Firestore Rules, consent gate, hoặc thử nghiệm E2E. Các mục CP30 về transaction, schema toàn hệ thống, cập nhật hồ sơ realtime liên module và thời gian giữ dữ liệu vẫn cần các đợt tiếp theo.
