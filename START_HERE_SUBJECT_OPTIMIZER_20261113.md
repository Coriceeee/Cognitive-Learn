# Cài FULL SOURCE CLA — Subject Optimizer 2026

1. Sao lưu `C:\Gạo\Cognitive-Learn` trước khi ghi đè (đặc biệt các file chỉnh sửa trên máy bạn).
2. Giải nén ZIP và chép **nội dung bên trong ZIP** vào `C:\Gạo\Cognitive-Learn`. Giữ nguyên `.env`, `.env.local` và `node_modules` hiện có.
3. Mở PowerShell và chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:subject-optimizer
npm test
npm run build
npm run dev
```

**Lưu ý:** Nếu các dependency còn nguyên sau bản trước thì không cần chạy lại `npm ci`. Nếu phải chạy lại và gặp lỗi EPERM ở binding Vite, đóng server Vite/Node trước khi cài lại.

**Dùng thử:** mở Atlas → nhập điểm hoặc nạp điểm học bạ từ Seed → tìm mục **"Hai môn tự chọn, nhiều con đường"** → xác nhận môn đã học lớp 12 → chọn cặp và xem những tổ hợp mô phỏng. Kết quả không phải nguyện vọng hay đăng ký thi chính thức.

**Nghiệm thu:** kết quả `npm run build` trên máy có dependencies và E2E trình duyệt chưa có trong báo cáo đóng gói. Hãy giữ nguyên dữ liệu đã nhập và quyền tài khoản.
