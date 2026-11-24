# CLA CP92 — PULSE đọc dữ liệu trực tiếp từ các phân hệ

## Thay đổi
- Trang `/pulse` hiển thị 8 tín hiệu trực tiếp từ SEED/LUMEN/ATLAS/ORION (không còn yêu cầu học sinh nhập PULSE mô phỏng).
- `/pulse/inputs`: màn hình *nguồn dữ liệu liên thông*, không có biểu mẫu nhập tay đối với học sinh.
- `/pulse/progress`: biểu đồ thanh giá trị của các tín hiệu đã lưu; giá trị thiếu giữ trạng thái trống.
- `/pulse/reports`: bản tóm tắt giá trị và nguồn (không tính điểm năng lực tổng hợp giả).
- `/pulse/actions`: điều hướng đến phân hệ còn thiếu dữ liệu.
- Dữ liệu mô phỏng PULSE cũ còn được giữ cho tài khoản Admin để tương thích với thử nghiệm, **không đưa vào báo cáo học sinh**.

## Dòng dữ liệu (8 tín hiệu)
1. LUMEN tổng hợp: tính từ hồ sơ SEED *đã xác minh từ Firestore* và có đủ phép đo.
2. LUMEN kỳ trước: bản ghi thứ hai trong lịch sử Cognitive có thời gian hợp lệ, `scoreAvailable: true`.
3. LUMEN CRI: chỉ số proxy của phép đo hiện tại.
4. ATLAS số chương trình: đếm `atlas_workspaces/{uid}.programs` đã xác minh.
5. ATLAS số nguồn: đếm `atlas_workspaces/{uid}.sources` đã xác minh.
6. ORION readiness: chạy lại engine ORION từ bản nháp môn học, mục tiêu, tuần còn lại đã lưu `orion_drafts/{uid}` (hoặc nguồn legacy được hook đọc an toàn).
7. SEED giờ học/tuần: `learning_profiles/{uid}.behavior.studyHoursPerWeek` (hoặc trường legacy).
8. SEED hoàn thành kế hoạch: `learning_profiles/{uid}.behavior.planCompletionRate` (hoặc legacy).

`0` chỉ được tính nếu trường dữ liệu thực sự tồn tại và có giá trị 0. Chỉ có một lịch sử LUMEN thì **không suy ra kỳ trước**. Atlas thiếu chương trình/nguồn vẫn hiện `Chưa có dữ liệu`.

Không có bước đo học sinh mới, không khẳng định AI dự báo, không tạo tài liệu Firestore; tất cả dữ liệu đọc theo UID đang đăng nhập và chỉ sử dụng ảnh chụp **đã xác minh từ máy chủ**. Quyền được Firestore Security Rules bảo vệ.

## Áp dụng bản vá nhỏ
1. Sao lưu thư mục nguồn hiện tại. Đóng Vite cũ bằng Ctrl+C.
2. Tải ZIP `CLA_CP92_PULSE_AUTO_LINKED_OVERLAY_20261122.zip` vào Downloads, giải nén **đè vào thư mục gốc dự án** `C:\Gạo\Cognitive-Learn`.
3. Mở PowerShell ở thư mục dự án và chạy:

```powershell
node tools/verify-cp92-snapshot.cjs
node --experimental-strip-types --test tests/cp92-pulse-linked-data.test.mjs tests/cp64-input-ux.test.mjs
npm run build
npm run dev -- --mode live --host 127.0.0.1 --port 3000 --strictPort
```

Nếu cổng 3000 bị chiếm, cần dừng Vite cũ trước khi mở. Đừng khởi động trần `npm run dev` trên 5173 vì có thể đi nhầm Emulator.

## Phạm vi kiểm chứng
- Kiểm thử mô hình nguồn và UX cục bộ đạt PASS; cú pháp TS/TSX của các tệp thay đổi đã được kiểm tra.
- Môi trường đóng gói này không cài được các dependency cần thiết nên **chưa xác minh `npm run build` hoặc Firebase production**.
- Không thay Firebase Auth, Consent Gate, Gemini, Firestore Rules hoặc Firebase Hosting.
