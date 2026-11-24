# CP87 — Đưa sơ đồ sáu phân hệ lên đầu trang học sinh

Bản thay đổi UX **dựa trên toàn bộ mã nguồn CP86**, không thay thế Firebase, dữ liệu, hai tài khoản ban đầu hoặc nội dung nghiên cứu.

## Thay đổi

- Giữ nguyên `src/page/seed/components/LearningCircuit.tsx` từ CP86: cùng vòng kết nối, sáu nút, tương tác hover/focus, liên kết và bảng mô tả bên phải.
- Trên `/student`, đưa vòng sáu phân hệ ngay sau lời chào và mục tiêu, trước điều hướng con SEED, lịch thi, canvas phân tích, tín hiệu và hành trình.
- Đưa ba tiện ích phụ đi cùng bên dưới vòng sáu phân hệ để không bị bỏ quên ở cuối trang.
- Giảm khoảng trống xung quanh sơ đồ, điều chỉnh chiều cao trên desktop/tablet và khoảng cách trên mobile; giữ nguyên nhánh mobile có sẵn.
- Cập nhật kiểm thử CP62 về thứ tự hiển thị mới và kiểm thử CP87 chuyên biệt; không sửa Rules ứng viên hoặc bằng chứng CP31.

## Cài bản vá overlay vào `C:\Gạo\Cognitive-Learn`

Bản overlay có cấu trúc **từ gốc dự án** (`src/...`, `tests/...`, `tools/...`), không phải toàn bộ nội dung chép vào thư mục `src`.

1. Dừng lượt npm test đang chạy, sao lưu thư mục dự án hoặc các tệp được cập nhật.
2. Giải nén `CLA_CP87_UI_MOVE_UP_OVERLAY_20261122.zip` trực tiếp vào `C:\Gạo\Cognitive-Learn`, chọn ghi đè các tệp trong bản vá.
3. Chạy các lệnh:

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
node tools/verify-cp87-snapshot.cjs
npm run check:layout
npm run test:cp87:nav
npm run build
npm test
```

Nếu cần nghiệm thu đầy đủ (kể cả Firebase Emulator và Python), chạy:

```powershell
.\CHAY_NGHIEM_THU_CP87.cmd
```

**Không chạy `verify-cp86-snapshot.cjs` để nghiệm thu CP87** vì những tệp UX đã thay đổi hợp lệ; manifest CP86 được giữ để lưu dấu phiên bản lịch sử. Dùng `verify-cp87-snapshot.cjs` cho phiên bản mới.

## Giới hạn

Kiểm thử vị trí/điều hướng mã nguồn là kiểm thử tĩnh, không thay thế kiểm thử trình duyệt desktop/mobile. Không có deploy production trong script CP87. Hai tài khoản cũ vẫn phụ thuộc cấu hình Firebase thật của môi trường bạn đang mở.
