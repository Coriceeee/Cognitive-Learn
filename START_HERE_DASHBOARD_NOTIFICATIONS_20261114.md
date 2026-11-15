# CLA — Bắt đầu với bố cục Dashboard và thông báo nổi

1. Sao lưu `C:\Gạo\Cognitive-Learn`; giải nén FULL SOURCE mới, copy **nội dung bên trong** vào thư mục dự án. Giữ `.env`, `.env.local` và `node_modules` đang hoạt động.
2. PowerShell:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:notifications
npm run test:exam-calendar
npm test
npm run build
npm run dev
```

3. Đăng nhập học sinh tại `/student`: banner chào → hai thẻ ưu tiên/trạng thái → **Lịch thi của tôi** → module.
4. Nhấn **Thông báo** trong thanh điều hướng để mở lịch sử các sự kiện trong phiên. Bạn có thể thử tạo/sửa một kỳ thi và quan sát popup lưu; nhập mốc còn <=14 ngày để xem nhắc hạn.
5. Để xem popup phân tích thực, yêu cầu Gemini giải thích trên Lumen hoặc tra cứu trên Atlas. Chỉ kết quả trả về thật mới thông báo thành công; khi lỗi sẽ hiện cảnh báo khác.
6. Khi mất Internet, app hiển thị thông báo offline/online (không thay thế kiểm tra backend).

**Chú ý:** Toast trong web không phải thông báo nền khi tắt trang. Không chỉnh Firebase Rules hay triển khai Cloud Functions trong bản này. Build & Browser E2E cần chạy trên máy Windows có dependencies.
