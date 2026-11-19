# CP29 Batch 3 — Báo cáo phát hành kỹ thuật và giới hạn nghiệm thu

Ngày: **2026-11-15** — baseline **CLA CP29 Batch 2**.

## Điều chỉnh

| Mã | Triển khai | Mức nghiệm thu hiện tại |
|---|---|---|
| B1 | Firebase Auth password-reset, giao diện keyboard accessible, generic response chống nhận biết email; không thay logic role | Code + contract + `npm test` PASS; chưa browser E2E/password delivery thật |
| B3 | Chốt chính sách không tự phục hồi quyền Admin; backend operator không có chức năng cấp Admin hoặc quyền tự nâng | Có quy trình và kiểm thử chính sách; chưa kiểm thử recovery scenario dựa trên project owner thực |
| B4 | Xác nhận Admin Demo chỉ ghi `dataScope=demo` dưới own UID, role preview không impersonate | Contract PASS; chưa E2E admin demo |
| K15 | Firebase Callable backend riêng, tùy chọn, giao dịch audit và giao diện quản trị UID cụ thể | Logic/backend policy unit PASS; chưa Functions Emulator + IAM/App Check + MFA/E2E production |

### Các cổng kiểm soát của K15

- **Default deny**: `CLA_ADMIN_ACCOUNTS_ENABLED=false`/không có biến, `CLA_ADMIN_OPERATOR_UIDS` trống hoặc không có operator `claOperator=true` đều bị chặn.
- Firebase token được xác minh lại với **revocation check**; yêu cầu `firebase.sign_in_second_factor` và `auth_time` trong 5 phút.
- Hồ sơ `users/{actorUid}` phải có `role=admin`, `active=true` ngay tại giao dịch trên server.
- Không thể sửa UID chính mình, UID Admin khác, cấp role Admin, liệt kê users hoặc truy cập dữ liệu học sinh.
- Chỉ cho phép `inspect`, `set-active`, `set-role` giữa student/teacher/parent; kiểm tra input chặt. Việc `set-active=false` chỉ khóa quyền ứng dụng theo Firestore Rules, không tắt Firebase Auth.
- Mỗi lệnh tạo một audit document `admin_account_audit/{requestId}` cùng transaction. `requestId` bị lặp được phát hiện; không ghi tên/email/dữ liệu điểm vào audit.
- Trạng thái admin UI bị khóa khi chưa bật biến client; biến client KHÔNG phải ranh giới bảo mật.
- `firebase.json` production KHÔNG tham chiếu codebase `functions-admin`, và bản này KHÔNG deploy.

### Test cục bộ đã chạy trên bản CP29 Batch 3

- `node --test tests/cp29-privileged-account-ops.test.mjs tests/cp29-account-ui-contract.test.cjs` **28/28 PASS**.
- Kết hợp `tests/step07-admin-auth-recovery.test.cjs`: **44/44 PASS**.
- `npm test`: **PASS / exit 0**.
- `npm run verify:cp29:batch3`: **PASS / exit 0**.
- TypeScript transpile syntax diagnostics trên 3 file TSX liên quan: **0 diagnostic**. Không thay thế `tsc -b` hoặc production build.

### Hạn chế / release blockers

1. Chưa chạy được `npm run build` tại môi trường đóng gói vì thiếu bộ npm dependencies hoàn chỉnh; cần xác nhận `tsc -b`, `tsc -p tsconfig.api.json` và Vite trên Windows.
2. Chưa chạy lại Firestore Emulator **83/83** ca của CP29 Batch 2 trên bản này. Rules ứng viên không sửa trong đợt 3.
3. Chưa triển khai hoặc kiểm thử Functions Emulator riêng cho `functions-admin`; unit test inject fake transaction không xác nhận IAM, Auth, provider MFA hoặc `onCall` thực.
4. Trước khi bật backend production, phải thiết kế App Check/replay protection, IAM least privilege, rate limits, monitoring/audit retention, quy trình phê duyệt hai người, cơ chế kiểm tra account locks và revocation sau commit.
5. Quy trình khóa quyền Firebase Auth, xóa/thu hồi session và đồng bộ consent cần đánh giá riêng; không được coi `active=false` tương đương vô hiệu hóa tất cả phiên đăng nhập.
6. CP29 chưa đóng 11/11; các mục C1, C5, F4 và D3 ngoại lệ có audit còn phụ thuộc nghiên cứu/gate khác.

### Recovery an toàn nếu Admin bị khóa

- Không tồn tại UI tạo role Admin hoặc tự khôi phục `claOperator`.
- Người quản lý Firebase Project đã được xác minh danh tính và được phê duyệt phải xác định lại UID bằng nguồn tin cậy, đối chiếu lịch sử audit và nguyên nhân khóa, rồi thực hiện recovery qua kênh quản trị ngoài ứng dụng. Ghi rõ ticket, người phê duyệt và bằng chứng sau khi mở khóa.
- Khi nghi token bị lộ, **thu hồi phiên Auth** và loại bỏ quyền operator ở nguồn cấp trước khi cho phép truy cập lại. Không dùng email, query param hay thay đổi client làm căn cứ cấp Admin.
- Không có script recovery tự động nào nằm trong bản phát hành này.

## Kết luận

Có thể coi Batch 3 là **đã hoàn thiện phần code và kiểm thử cục bộ**. Không coi là đạt nghiệm thu toàn bộ B1/B3/B4/K15 hoặc an toàn production nếu chưa có kết quả Functions Emulator, E2E, IAM/MFA, deployment review.
