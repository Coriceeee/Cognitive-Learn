# CP59 — Bản nháp Orion/Pulse/Haven chỉ đọc dữ liệu được máy chủ xác minh

**Ngày:** 21/11/2026 (Asia/Ho_Chi_Minh)  
**Cơ sở:** `Cognitive-Learn-CP58-20261121.zip`  
**Phạm vi:** Cải thiện an toàn đọc/lưu dữ liệu liên thông Seed ↔ Orion/Pulse/Haven; không thay schema, Rules production hoặc deploy.

## Lỗi thực tế phát hiện trong mã nguồn CP58

- `useStudentTranscript` của Seed kiểm tra `isServerConfirmedSnapshot(metadata)`, nhưng `useModuleDraft` chưa có kiểm tra tương đương. Firestore `onSnapshot` có thể trả dữ liệu cache/pending-write và giao diện vẫn báo `ready` / `empty`, dù dữ liệu chưa được máy chủ xác nhận.
- Bản nháp ở collection riêng và fallback `module_drafts` chưa xác minh trường owner trước khi hiển thị, khác với chính sách đọc của Seed.
- Nút lưu thủ công chỉ chặn `loading/error/signed-out`; chưa chặn trạng thái `syncing` khi có dữ liệu chưa được xác nhận.

## Bản vá

1. `src/lib/useModuleDraft.ts`:
   - Lắng nghe metadata của Firestore ở collection chính và fallback legacy.
   - Chỉ chấp nhận snapshot từ máy chủ khi `fromCache=false`, `hasPendingWrites=false`.
   - Trạng thái `syncing` riêng; không dùng dữ liệu cache để cập nhật CAS baseline. Giữ bản nhập cục bộ nếu đang chỉnh sửa.
   - Kiểm tra `userId`/`dataScope` của bản ghi với tài khoản hiện tại ở cả live snapshot và `acceptRemote`.
   - Chỉ cho phép lưu khi `status=ready|empty`; `runTransaction` và kiểm tra revision trước đó tiếp tục hoạt động.
   - Không tái tạo listener legacy khi primary vẫn thiếu bản ghi và chỉ phát metadata event.
2. `src/page/orion/OrionPage.tsx`, `src/page/pulse/PulsePage.tsx`, `src/page/haven/HavenPage.tsx`: khóa nút lưu lúc `syncing`, thông báo trạng thái chờ server; Orion autosave vẫn chỉ chạy ở `ready|empty`.
3. `tests/cp59-verified-module-drafts.test.mjs`: tám trường hợp kiểm thử mới cho metadata, ownership, CAS readiness, legacy, UI và Seed prefill.
4. `tests/cp47-orion-autosave.test.mjs`: cập nhật một assertion lỗi thời nhằm kiểm tra **điều kiện mạnh hơn** (`ready|empty`) thay vì chỉ so khớp biểu thức cũ (`loading|error`). Không bỏ test bảo vệ tài khoản và không giảm ràng buộc an toàn.
5. `package.json`, `.github/workflows/cla-cp21-verify.yml`: tích hợp test mới vào hồi quy/CI.
6. `src/lib/nexusEvidenceBaseline.ts` + synthetic demo artifacts: cập nhật source fingerprint để chứng cứ demo **OFFLINE / SYNTHETIC** gắn đúng mã nguồn mới.

## Kết quả thực thi

| Gate | Trạng thái | Minh chứng |
| --- | --- | --- |
| Test CP59 mới | **PASS 8/8** | `last-groups.log` |
| Hồi quy CP47–CP59 riêng | **PASS** | chạy các scripts CP47→CP59; các nhóm cuối trong `last-groups.log` |
| CP57 + CP58 + CP59 chạy nối | **PASS 35/35** | `last-groups.log` |
| Rules tĩnh | **PASS 15/15** | `rules-static.log` |
| Layout | **PASS** | `layout.log` |
| Demo offline / source fingerprint | **PASS 11/11** | `demo-final.log` |
| Demo backup synthetic | **PASS** | `demo-final.log` |
| Kiểm tra cú pháp 5 file TS/TSX | **PASS 0 diagnostic cú pháp** | `ts-syntax.log`; **không** thay thế TypeScript typecheck |
| Packaging safety unit tests | **PASS** | `packaging-tests.log` |
| Full `npm test` 1 lần liên tục | **TIMEOUT / NOT COMPLETE** | `npm-test.log`: 1.199 TAP `ok`, không có `not ok` trước khi timeout tại nhóm CP57; các nhóm cuối được chạy lại riêng; **không gọi full test PASS** |
| `npm run check:dependencies` | **BLOCKED (19 thiếu)** | `dependencies.log` |
| `npm run build` | **FAIL (thiếu node_modules)** | `build.log`; nhiều TS lỗi thiếu React/types; chưa có cơ sở kết luận build sạch |
| Firebase Emulator | **BLOCKED / NOT RUN** | `emulator-preflight.log` |
| Browser E2E 2 phiên / production deploy | **NOT RUN** | không có môi trường browser/Firebase được cấp |

## Giới hạn và rủi ro cần nghiệm thu

- Bản vá đã được kiểm tra bằng pure-function và source-contract tests; **chưa thử listener thật** với Firebase Emulator, mất mạng, reconnect hoặc hai phiên browser. Không công bố mức an toàn production.
- Khi offline/snapshot pending, trạng thái `syncing` có thể khiến thao tác lưu phải đợi server. Đây là lựa chọn fail-closed để giảm mất dữ liệu.
- Firestore Rules trên server mới là thẩm quyền phân quyền; các bước kiểm tra UID ở client chỉ hỗ trợ giảm hiển thị sai, không thay thế Rules/Emulator.
- Demo và Evidence Record synthetic chỉ chứng minh replay kỹ thuật, không chứng minh tác động học tập, psychometric validity, calibration hay khả năng trúng tuyển.
- Checklist 164 mục không tự đóng PASS nào trong lượt này vì thiếu build, Emulator và browser E2E; CP59 bổ sung bằng chứng một phần cho đọc/đồng bộ và module Orion/Pulse/Haven.

## Lệnh nghiệm thu bổ sung trên máy có npm internet + Firebase CLI

```bash
npm ci --no-audit --no-fund
npm run check:dependencies
npm run build
npm test
npm run test:rules:emulator
```

Sau đó dùng hai tài khoản/thiết bị giả lập hợp lệ: ghi bản nháp ở A → đăng nhập B → xác nhận không lộ A; ngắt mạng/khôi phục → chỉ hiển thị `ready` sau server ack; ghi đồng thời A1/A2 → một giao dịch cũ bị từ chối và dữ liệu local vẫn còn.
