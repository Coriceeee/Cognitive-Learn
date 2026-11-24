# CLA CP91 — Chẩn đoán đúng lỗi AccessGate

Mục tiêu: Khi Firebase Auth đã xác thực thành công nhưng Firestore chặn truy cập, AccessGate hiển thị chính xác **users/{uid}** hay **student_consents/{uid}**, mã Firebase và hướng kiểm tra. Chưa mở quyền khi Firebase trả lỗi; không chỉnh Rules/role/tài khoản/dữ liệu.

## Dùng nhanh
1. Chép bản vá CP91 vào thư mục gốc CLA sau khi sao lưu. Không đè `.env.live.local`.
2. `node --experimental-strip-types --test tests/cp91-access-gate-diagnosis.test.mjs`
3. `npm run dev -- --mode live --host 127.0.0.1 --port 3000 --strictPort`
4. Đăng nhập với tài khoản cũ, chụp **2 dòng** `Vị trí lỗi` và `Mã Firebase` trên màn hình mới.

## Cách hiểu kết quả
- `users/{uid}` + `permission-denied`: Kiểm tra **Firestore Rules trên dự án đang hoạt động**, mục `users/{uid}` có `allow get` cho `request.auth.uid == uid` hay chưa. Kiểm tra đúng Firebase Project. Không thay đổi `role` hay UID.
- `student_consents/{uid}` + `permission-denied`: Consent Gate đang bật nhưng Rules production không cho học sinh đọc quyết định dữ liệu của chính họ. Đối chiếu chính sách trước khi điều chỉnh Rules; KHÔNG tắt kiểm soát để vượt qua.
- `unavailable`, `deadline-exceeded`: Kiểm tra mạng, VPN, DNS, kết nối Firestore.
- `no-profile` hoặc `inactive`: Có lỗi hồ sơ tài khoản thay vì lỗi kết nối; cần quản trị viên xác minh `users/{uid}`.

**Đừng deploy Firestore Rules chỉ để làm màn hình biến mất.** `firestore.rules.CANDIDATE_CP21` là bản ứng viên cần được kiểm thử và rà soát độc lập, không phải chứng cứ nó đang là Rules production. Bản CP91 không chứng minh đã sửa được quyền Firestore production, bởi không truy cập tài khoản Firebase của bạn.
