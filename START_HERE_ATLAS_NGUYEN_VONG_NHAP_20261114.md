# CLA — Hướng dẫn sử dụng bản nguyện vọng nháp 2026

**Đây là FULL SOURCE**, giữ lại code Daily Companion / Web Push V2 và các module cũ.

## Cài trên Windows

1. Sao lưu `C:\Gạo\Cognitive-Learn` và `.env`/`.env.local` trước.
2. Giải nén ZIP, chép nội dung vào `C:\Gạo\Cognitive-Learn`, ghi đè các file trùng nhưng không xóa cấu hình bí mật và `node_modules` đang hoạt động.
3. Chạy lần lượt:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:aspiration-draft
npm test
npm run test:rules:static
npm run build
npm run dev
```

4. Mở `/atlas`. Ở đầu mục Admission Engine chọn “Mở sổ tay nguyện vọng nháp để tự sắp xếp”. Thử thêm thủ công, đổi thứ tự, cảnh báo sư phạm NV6, xuất và nhập JSON.
5. Các chương trình PTIT chỉ xuất hiện trong danh sách để thêm khi bạn đã xác nhận môn lớp 12, chọn cặp môn và có đối chiếu nguồn. Danh sách **không tự động đăng ký nguyện vọng**.

## Giới hạn

- Nháp **chỉ tồn tại trong trang**. Tải lại sẽ mất nếu chưa xuất JSON; import sẽ đánh dấu nội dung là chưa xác minh.
- Không có điểm số hoặc dữ liệu tài khoản trong tệp xuất.
- Các quy tắc 15 NV/NV1–NV5 đang ràng buộc theo bản chính sách **2026** trong CLA, **không tái sử dụng mặc định cho 2027**.
- Trước khi dùng với học sinh thật: cần nghiệm thu consent, Firebase Rules Emulator, kiểm thử trình duyệt/thiết bị và dữ liệu tuyển sinh chính thức.
