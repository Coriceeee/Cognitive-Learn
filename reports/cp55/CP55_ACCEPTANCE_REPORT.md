# CP55 — Chống phản hồi Firestore cũ và tải lại ghi đè chỉnh sửa mới

**Ngày:** 21/11/2026 (Asia/Ho_Chi_Minh)  
**Nguồn:** `Cognitive-Learn-CP54-20261121.zip`; sửa trực tiếp source, không triển khai Firebase/production.  
**Phạm vi:** Orion/Pulse/Haven sử dụng chung hook `useModuleDraft`.

## Lỗi được sửa tận gốc

1. **Listener không có định danh phiên riêng**: dữ liệu Firestore có thể đến sau khi đã đổi UID hoặc unmount. CP55 dùng `observerEpoch` độc lập với `session` ghi dữ liệu và hàm thuần `currentDraftListener`; callback snapshot và error bị bỏ qua khi UID/epoch/lifetime không hợp lệ. Tránh dùng `session` làm listener epoch: thao tác “Tải bản mới nhất” cần hủy các lần ghi cũ nhưng không được vô hiệu hóa listener realtime còn sống.
2. **Race giữa tải lại và chỉnh sửa mới**: một học sinh có thể bấm tải từ máy chủ rồi tiếp tục gõ trước khi yêu cầu mạng trả lời. CP55 chụp `editGeneration` lúc yêu cầu và xác minh cả trước lẫn sau khi lấy dữ liệu, trước khi thay bản nháp. Nếu có lần gõ mới, thao tác tải bị hủy với thông báo rõ ràng và dữ liệu đang nhập được giữ.
3. **Thông báo lỗi cũ còn hiển thị khi snapshot khôi phục**: xóa `error` sau snapshot hợp lệ, chỉ khi listener vẫn thuộc đúng UID/epoch.

## Thay đổi mã nguồn

- `src/lib/useModuleDraft.ts`: tách vòng đời listener khỏi write session; chặn callback cũ và refresh muộn.
- `src/lib/draftAsyncGuards.ts`: guard thuần kiểm thử được cho listener/refresh.
- `tests/cp55-draft-session-safety.test.mjs`: 5 kiểm thử hồi quy bổ sung.
- `package.json`: thêm `test:cp55:safety` vào `npm test`.
- `src/lib/nexusEvidenceBaseline.ts`: cập nhật fingerprint source để demo offline có thể kiểm toán.
- `reports/cp55/*`, `START_HERE_CP55_DRAFT_SESSION_SAFETY_20261121.md`: tài liệu và log kiểm chứng.

## Test matrix

| Kiểm thử | Trạng thái | Chứng cứ |
|---|---|---|
| CP55 5 tình huống listener, UID, refresh, cleanup | PASS | `npm run test:cp55:safety` |
| CP52 + CP54 + CP55 regression | PASS (20/20) | Test Node riêng |
| `npm run test:rules:static` | PASS (15/15) | `reports/cp55/rules-static.log` |
| `npm run check:layout` | PASS | `reports/cp55/layout.log` |
| TS strict cho 3 thư viện thuần | PASS | `reports/cp55/pure-typescript.log`; không phải project build |
| TS/TSX syntax check 5 file liên quan | PASS | Transpile syntax-only, không thay thế typecheck |
| `npm run demo:final` | PASS (11/11 offline synthetic gates) | `reports/cp55/demo-final.log` |
| `npm test` toàn bộ | PASS (1190/1190, 0 fail, 83 TAP groups) | `reports/cp55/npm-test-final.log` và exit code |
| `npm ci` + build production | BLOCKED | Registry DNS EAI_AGAIN; dependency tree không được cài hoàn chỉnh |
| Firebase Emulator | BLOCKED/NOT RUN | `reports/cp55/emulator-preflight.log`: static PASS, emulator BLOCKED |
| Browser hai thiết bị, staging, deploy | NOT RUN | Chưa có môi trường kiểm thử thực |

Trong lúc thử `npm ci`, registry không phân giải được tên miền. npm đã tạo một phần `node_modules`, làm bài test TypeScript độc lập thất bại do thiếu `@types/*`. Đã **xóa cây phụ thuộc cài dở**, chạy lại bài test đó thành công. Đây là lỗi môi trường, không phải dữ liệu học sinh hay TS build của dự án.

**Đã xác minh:** exit code `npm test` = 0; 1190 ca test PASS trên 83 nhóm TAP.

## Giới hạn

- Firestore candidate Rules chưa được publish, và chưa có bằng chứng Emulator allow/deny. Không được coi static tests là security certification.
- Race conditions đã được giảm và kiểm thử thuần; kiểm thử hai thiết bị trong điều kiện mạng thật vẫn cần thực hiện.
- Dữ liệu synthetic/offline không xác nhận effectiveness, prediction accuracy hoặc psychometric validity.
- Checklist 164 gate: **không đóng thêm một mục nghiệm thu tích hợp đầy đủ** chỉ từ các bài test này.

## Để nghiệm thu tiếp

Trên máy có Internet: `npm ci --no-audit --no-fund && npm run build && npm test`, sau đó `npm run test:rules:emulator` trên project demo được bảo vệ, cuối cùng browser E2E hai thiết bị, refresh khi đang gõ và đổi UID. Chỉ nâng phiên bản production khi tất cả gate P0 có log chính thức.
