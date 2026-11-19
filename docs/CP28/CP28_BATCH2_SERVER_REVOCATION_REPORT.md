# CP28 — Đợt 2: thu hồi chia sẻ phía server (CHƯA DEPLOY)

Ngày: 2026-11-15. Source nền: CLA CP28 đợt 1, dựa trên candidate Rules V5.

## Mục tiêu

Sửa điểm yếu P0 còn lại của CP28 đợt 1: khi học sinh rút đồng ý, trình duyệt có thể offline/đăng xuất giữa chừng và không xoá được metadata liên kết Teacher/Parent. Giảm phụ thuộc vào browser bằng một **tùy chọn Cloud Function** riêng, KHÔNG nằm trong `firebase.json` gốc.

## Thay đổi đã thực hiện

1. Thêm `functions-privacy/index.mjs` — trigger `student_consents/{uid}` chỉ xử lý chuyển đổi consent **accepted → withdrawn** với schema/notice version chính xác.
2. `functions-privacy/src/consentCleanup.mjs` — quét theo UID, pagination theo ID, giới hạn 80 bản ghi/trang × 25 trang/lượt; phát hiện record không thuộc học sinh và dừng an toàn. Giữ lại liên kết **được tạo sau mốc rút consent** (trường hợp học sinh đồng ý lại).
3. `functions-privacy/src/firestoreAdapter.mjs` — xóa report + link trong cùng Firestore batch, kiểm tra quan hệ student/viewer và bắt buộc `lastUpdateTime` của cả hai bản ghi nếu tồn tại. Xung đột đồng thời báo lỗi để trigger retry, không xóa mù.
4. `firebase.privacy.json` — Functions codebase **riêng** `cla-privacy-revocation`, không sửa `firebase.json` mặc định, không tự deploy service push.
5. `functions-privacy/.env.example` — `CLA_CONSENT_REVOCATION_ENABLED=false`. Khi không được bật thì trigger (nếu được deploy) cũng không can thiệp.
6. Thêm **17 test** (`tests/step21-consent-server-cleanup.test.mjs`) cho validator, pagination, tái chạy, cutoff, xóa nguyên tử có điều kiện, lỗi thiếu precondition, quan hệ record và cô lập config.
7. Thêm script `npm run test:consent-server-cleanup`, tích hợp vào `npm test` và `npm run verify:cp28:static`.

## Trạng thái nghiệm thu: không nâng số PASS trên 164

| Mã | Bằng chứng CP28 đợt 2 | Trạng thái reviewer |
|---|---|---|
| B5 | Server cleanup thiết kế + 17 test; thiếu deploy, E2E quyền viewer sau rút consent | PENDING |
| F1 | Thu hồi owner-linked metadata bằng batch; thiếu integration Firebase, UI role matrix | PENDING |
| F2 | Xóa báo cáo và liên kết trong một batch có precondition; thiếu E2E export/review/revoke | PENDING |
| R2.4 | Có thiết kế retention/cleanup; thiếu đánh giá pháp lý, cache, backup và retention audit | PENDING |

**Đã kiểm thử cục bộ**: 51 Rules static/contract V5 + 9 client revocation + 17 server revocation + 18 closed-loop + 15 journey reliability = **110/110 PASS**.

**Chưa kiểm chứng trong môi trường đóng gói**: 
- Firestore Emulator CP28 **75 ca** (V5 trước đó 74/74 PASS trên Windows, không tái sử dụng kết quả làm CP28 PASS).
- Node dependencies / `npm run build` (source ZIP không chứa `node_modules`; lỗi TS2307 khi chạy build không phản ánh một lần build hợp lệ).
- Browser E2E, Functions Emulator integration, IAM, Cloud Functions trigger, Firestore indexes và production deployment.

## Lỗ hổng còn tồn tại

- Quy tắc `student_links` V5 vẫn cho phép viewer list theo `viewerId` trong khi metadata liên kết chưa bị xóa. Việc xoá từ trigger chỉ **eventual**, không bảo đảm không có một khoảng thời gian metadata còn hiển thị sau khi rút consent.
- Browser cache, dữ liệu đã xuất/file đã được Teacher/Parent tải, backup và dữ liệu ở bên thứ ba không bị thu hồi ngược tự động.
- Cloud Functions có độ trễ, lỗi mạng, retry hoặc thiếu chỉ mục có thể khiến cleanup thất bại; cần theo dõi operational logs và dead-letter/reconciliation job trước production.
- Trigger không được bật mặc định; chỉ thiết kế và test logic, không được coi là tính năng đã được triển khai.
- Quyền nghiên cứu cho người chưa thành niên chưa có xác minh phụ huynh và phê duyệt đạo đức.

## Nghiệm thu bắt buộc trên máy chủ dự án

Từ thư mục source Windows:

```powershell
npm run test:consent-share-revocation
npm run test:consent-server-cleanup
npm run verify:cp28:static
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
npm run verify:cp37
```

Kỳ vọng: 75/75 Emulator; cổng static/test PASS, build PASS. Cần thêm bộ test Functions Emulator với sự kiện consent rút thực tế, thử lỗi mạng, logout, chuyển UID, hai thiết bị, re-consent và rollback. **Không deploy** `firebase.privacy.json` hoặc candidate Rules lên Firebase production trước khi cổng này và rà soát bảo mật được phê duyệt.

## Quản lý phiên bản

File `docs/CP28/CP28_164_FULL_REVIEW_LEDGER.csv` và bảng 100 mục của đợt 1 được bảo toàn; không đổi bất kỳ trạng thái PENDING nào. Các bằng chứng mới chỉ là `CP28_BATCH2_SERVER_REVOCATION_REPORT.md`, source, tests và báo cáo chạy test.
