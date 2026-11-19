# CLA CP29 — Batch 4: C1 + C5 + F4

**Ngày:** 2026-11-15. **Baseline:** `CLA_FULL_SOURCE_CP29_BATCH3_ADMIN_SECURITY_20261115.zip`.

## 1. Thay đổi source

| Mã | Thay đổi thật | Mức nghiệm thu |
|---|---|---|
| C1 — Chuẩn hóa schema | Bổ sung `seedPersistenceContract.ts`: xác nhận `schemaVersion=1`, UID, `dataScope`, danh tính 9 môn, trạng thái bản ghi và dấu thời gian máy chủ; dữ liệu legacy không có version không được ghi đè tự động | **PARTIAL**: hợp đồng cho 2 collection Seed, **chưa** kiểm toán toàn bộ collection trong hệ thống |
| C5 — Giao dịch nhất quán | Thay `writeBatch` bằng `runTransaction` đọc lại `users/{uid}`, `learning_profiles/{uid}`, `student_transcripts/{uid}` trước mọi thao tác ghi; so sánh version chính xác đến nanosecond, kiểm tra role/active và khóa môn; ghi ba tài liệu (profile, transcript, cognitive history) nguyên tử | **Code + unit/contract PASS**; cần chạy Firebase Emulator và hai tab thật để khẳng định integration |
| F4 — Tài khoản/liên kết lỗi | `StudentLinkManager` theo dõi tài khoản qua listener server-verified, ẩn dữ liệu cache/pending, xóa liên kết khỏi UI khi account khóa/xóa/đổi role, lọc metadata giả/thiếu timestamp và ngăn hồi sinh callback cũ, có nút tải lại | **PARTIAL**: chưa xử lý xóa orphan link server-side, retention hay thiết kế đồng bộ khi mất mạng |

**Không sửa** `firestore.rules.CANDIDATE_CP21`, `firebase.json`, `firebase.emulator.cp21.json`, `functions-admin` hoặc bộ test Emulator gốc. **Không deploy production.**

## 2. Các quy tắc dữ liệu đang có hiệu lực trong luồng Seed

- Hai tài liệu chính đều có `schemaVersion: 1`, `userId` bằng UID đăng nhập, và `dataScope` phân biệt `student`/`demo`.
- `curriculum.program = GDPT 2018`, 4 môn tự chọn khác nhau, Ngoại ngữ 1 và danh mục 9 môn giữ nhất quán.
- Điểm trong `student_transcripts` theo `grade10/11/12` và `semester1/semester2`, không coi ô trống là 0.
- Lần đọc đầu lưu dấu vết phiên bản `updatedAt.seconds:nanoseconds`. Bản ghi legacy thiếu timestamp -> chặn lưu và yêu cầu đối soát/migration. Không âm thầm tạo lại.
- Khi bấm Lưu, transaction đọc lại account/profile/transcript; nếu có bất kỳ thay đổi cập nhật từ phiên khác -> fail closed, không ghi đè.
- Snapshot nhận thức chỉ được tạo sau hành động lưu chủ động, ghi cùng transaction với hai tài liệu Seed.
- `student_links` hiển thị theo UID+vai trò+document ID+timestamp hợp lệ; dữ liệu cache/pending bị ẩn khi chưa có xác nhận server. Đây là phòng vệ UI, không phải thay thế Firestore Rules.

## 3. Bằng chứng đã chạy ở môi trường tạo bản vá

- `npm run test:cp29:batch4`: **31/31 PASS** (20+ ca về version/scope/identity/links và 9 kiểm thử Seed cũ; có bổ sung kiểm thử timestamp và retry).
- `npm run verify:cp29:batch4`: **PASS**, gồm regression của các CP trước và Rules tĩnh.
- `tsc --noEmit ...` với hai module pure TypeScript: **PASS**.
- TypeScript transpile syntax 4 file mới/sửa: **0 diagnostic**.
- `npm test` và `npm run build` **KHÔNG PASS tại môi trường đóng gói** vì bộ `node_modules` ở đây chỉ có các thư mục rỗng/thiếu `@types`, không đủ dependency cho typecheck. Trước đó trên máy bạn đã PASS với Batch 3, **không thể suy rộng** thành Batch 4.
- Firebase Emulator **83 ca của Batch 3 chưa chạy lại** trên source Batch 4. Không có ca Emulator mới; số mục tiêu vẫn là 83, không tự cộng test local vào số Emulator.

## 4. Gating cần nghiệm thu trên Windows

```powershell
npm run test:cp29:batch4
npm run verify:cp29:batch4
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

**Manual E2E tối thiểu** (tài khoản test, dự án demo/staging; không dùng dữ liệu học sinh thật):

1. Đăng nhập Student, lưu hồ sơ/9 môn thành công; mở hai tab. Tab A đọc bản cũ, tab B lưu điểm mới; tab A bấm Lưu -> phải bị từ chối, và điểm tab B không bị ghi đè.
2. Lưu mới một profile và transcript trong cùng transaction; đảm bảo cả hai tồn tại, cùng tổ hợp môn, một cognitive snapshot mới. Thử đổi môn/ngoại ngữ -> Firestore Rules từ chối.
3. Tài khoản bị `active=false` hoặc role đổi trong tab quản trị staging: màn liên kết phải ẩn danh sách, không hiển thị cache cũ; khôi phục role chỉ khi được cấp hợp lệ.
4. Đăng xuất và đăng nhập UID khác, ngắt mạng, thao tác retry: không tái hiện liên kết từ UID trước.
5. Trường hợp doc Seed legacy thiếu `updatedAt`: UI phải từ chối ghi và yêu cầu đối soát, không tạo bản sao giả.

## 5. Những gì **chưa** được tuyên bố hoàn tất

- C1 chưa là kiểm toán toàn bộ schema collection (Atlas/Orion/Pulse/Haven/Functions), chỉ có phần Seed cross-document được làm ở Batch 4.
- C5 cần kiểm thử transaction với Firestore Emulator, retry dưới đồng thời thực tế, và kiểm chứng liệu Rules cho phép đúng thao tác sau khi chuyển từ batch sang transaction.
- F4 vẫn cần quy trình dọn orphan link/report ở backend, Firebase Auth deletion recovery và retention/backup audit riêng. Khi consent bị rút, Rules ứng viên vẫn có giới hạn về metadata link-list đã được ghi nhận từ CP28.
- Browser E2E, Admin MFA/Functions thật, xác minh Rules production, điều kiện cho học sinh chưa thành niên, retention và phiên triển khai thật: **PENDING**.

## 6. Hướng dẫn rollback

Áp dụng patch chỉ trên CP29 Batch 3 đã sao lưu. Nếu test fail, phục hồi các file được thay từ bản sao lưu Batch 3, **không tự deploy Rules production**. File mới không thay schema production hoặc chạy migration; bản ghi hiện có không bị biến đổi bởi thao tác giải nén patch.
