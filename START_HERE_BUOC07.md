# CÀI ĐẶT — CLA BƯỚC 07: SEED → ATLAS

**Đây là full source, không phải patch riêng.** Gói bao gồm tất cả các bản sửa trước đến hotfix đăng nhập Admin.

1. Sao lưu `C:\Gạo\Cognitive-Learn`.
2. Giải nén ZIP, copy toàn bộ **nội dung** (nhánh `src`, `tests`, `package.json`, ...) vào `C:\Gạo\Cognitive-Learn`. Chọn ghi đè sau khi backup; không xóa `.env`/`node_modules`.
3. Mở PowerShell trong dự án và chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm ci
npm run test:seed-atlas
npm test
npm run build
npm run dev
```

4. Đăng nhập tài khoản học sinh có quyền đọc bảng điểm của chính mình; vào Seed lưu dữ liệu Toán 8, Văn 7, Anh 9 **trong cùng học kỳ, có đầy đủ các loại điểm để được tính TB môn**.
5. Mở `/atlas` → tìm **“Dùng bảng điểm học sinh đã lưu”** → chọn học kỳ cần lấy → **“Nạp điểm học bạ từ Seed”**. D01 trong phần khám phá phải = **24/30**, nhưng có nhãn **học bạ**, không phải điểm THPT chính thức.
6. Chọn loại điểm **“Điểm thi THPT 2026 chính thức”** → ô điểm phải được xóa để tránh đổi nhãn sai. Trở lại Seed hoặc dùng nút nạp để xem học bạ.

Nếu có lỗi: gửi **dòng lỗi đầu tiên** của `npm run build` hoặc Console; không đăng ảnh chứa mật khẩu hay dữ liệu học sinh thật.

**Chưa nghiệm thu:** Firebase Emulator, production build, trình duyệt E2E; xem `BAO_CAO_BUOC07_SEED_ATLAS_20261113.md`.
