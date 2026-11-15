# CLA — Cài bản sửa đăng nhập Admin

1. Sao lưu `C:\Gạo\Cognitive-Learn` đang chạy.
2. Giải nén ZIP, copy **toàn bộ nội dung bên trong ZIP** vào thư mục dự án. Giữ nguyên `.env`, `.env.local`, `node_modules` trên máy.
3. Mở PowerShell tại thư mục dự án và chạy:

```powershell
npm run test:admin-recovery
npm run build
npm run dev
```

4. Đăng nhập tài khoản đã có role Admin. Màn login không còn yêu cầu chọn tab; hệ thống xác minh role từ Firestore server. Nếu Firestore trả lỗi tạm thời, nhấn “Thử lại xác minh quyền” mà không nhập lại mật khẩu.
5. Nếu vẫn không vào được, kiểm tra Firebase Project đang dùng, `users/<Authentication UID>` (`role: admin`, `active: true`), Firestore Database/Rules và F12 Console. KHÔNG cấp quyền Admin chỉ dựa vào email.

Chi tiết và giới hạn xác nhận: `BAO_CAO_HOTFIX_DANG_NHAP_ADMIN_20261113.md`.
