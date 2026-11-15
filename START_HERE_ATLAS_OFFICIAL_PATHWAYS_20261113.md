# CLA — Hướng dẫn áp dụng FULL SOURCE Atlas Official Pathways

1. **Sao lưu** `C:\Gạo\Cognitive-Learn` trước khi cập nhật. ZIP là **FULL SOURCE**: giải nén, chép các thư mục `src`, `tests`, `research`, `api` và file gốc vào thư mục dự án, ghi đè theo thay đổi; không tạo một thư mục lồng `CLA_...` bên trong.
2. Giữ nguyên `.env`, `.env.local`, `node_modules` và mọi dữ liệu/cấu hình riêng đã cập nhật ở máy. Đặc biệt, nếu bạn đã sửa source khác sau bản bước 08, **so sánh/backup trước khi ghi đè**.
3. Vì **không đổi dependencies**, nếu lần trước `npm ci` đã xanh thì **không cần cài lại** (tránh lỗi EPERM khóa file Vite).
4. Mở PowerShell tại thư mục dự án, chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:official-pathways
npm test
npm run build
npm run dev
```

5. Mở Atlas, nhấn **“Khám phá môn thi → chương trình có nguồn”**, chọn ít nhất hai môn đã học lớp 12. Chọn một **phương án môn thi** trong các thẻ để mở **Official Pathway Match**.

**Ba ca dùng thử:**
- Toán 8, Văn 7, Anh 9, Tin 9.5; xác nhận **Anh + Tin** → tập PTIT BVH hiện **X26** (26.50/30) và ở một số chương trình có **D01** (24.00/30). Điểm thuộc chế độ đã chọn; không phải xét tuyển chính thức.
- Toán 8, Lý 8.5, Tin 9.5; xác nhận **Lý + Tin** → thấy **X06** (26.00/30). X06 chưa có trong 9 tổ hợp thử nghiệm nhưng có trong đề án PTIT 2026.
- Xác nhận **Sử + Địa** → không có chương trình khớp **trong tập PTIT BVH**. Không có nghĩa tổ hợp này bị tất cả đại học từ chối.

**Giới hạn:** 10 chương trình PTIT BVH là phạm vi dữ liệu thí điểm, không đại diện cho cả nước. Mọi liên kết có thể mở đề án PTIT 2026 để kiểm tra. Học bạ/thi thử không đồng nghĩa điểm thi tốt nghiệp THPT. Chưa có Browser E2E/Firebase Emulator chạy trên máy người dùng nên chưa coi là nghiệm thu sản phẩm.

**Rollback:** phục hồi bản sao lưu trước khi ghi đè (hoặc chép lại FULL SOURCE bước 08 nếu máy bạn không có sửa đổi nào mới). Không xóa tài khoản hoặc kho dữ liệu Firebase.
