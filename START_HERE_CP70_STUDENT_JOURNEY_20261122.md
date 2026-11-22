# CP70 — Hành trình 6 phân hệ, ưu tiên MVP

**Nguồn kế thừa:** CP69. **Phạm vi:** dashboard Seed + chu kỳ Orion/Pulse/Lumen + điều hướng Atlas/Haven, không mở module và không thay thuật toán AI/ML.

## Trải nghiệm dành cho học sinh

1. Vào **Seed / Tổng quan của tôi** → khu vực **“Tiếp tục từ nơi bạn đang học”**.
2. Có sáu đường dẫn rõ ràng: Seed (hồ sơ), Lumen (phân tích), Atlas (ngành/trường), Orion (lập kế hoạch), Pulse (nhật ký), Haven (nguồn lực). Đó là điều hướng, **không phải bằng chứng đã hoàn thành module**.
3. Nếu chưa có hồ sơ → điền tại Seed. Nếu đã có hồ sơ nhưng chưa có chu kỳ → lập kế hoạch ở Orion.
4. Nếu đã tạo chu kỳ ACTIVE ở Orion và **chưa có check-in** → mở Pulse để ghi nhật ký. Có check-in → mở Pulse để đánh giá lại khi đã có phép đo thực tế.
5. Sau khi tổng kết chu kỳ REVIEWED → mở Lumen để xem bằng chứng, sau đó cân nhắc chu kỳ tiếp theo.
6. Các nguồn Atlas/Haven là hai hướng tra cứu song song, không tự biến dữ liệu không đủ nguồn thành khuyến nghị xác suất.

## Bảo vệ dữ liệu

- Chu kỳ chỉ có trong cache, đang ghi dở hoặc chưa được máy chủ xác minh sẽ **không** hiển thị trong tiến trình Seed, và Orion/Pulse không cho lưu thay đổi vào chu kỳ đó.
- Khi đổi UID, listener cũ được hủy, dữ liệu cũ bị ẩn; chủ sở hữu và ID tài liệu được kiểm tra trước khi công bố kết quả.
- Check-in, số giờ học, điểm đo lại đều là **student self-report**, không phải thành tích được nhà trường xác minh hay bằng chứng tác động nhân quả.
- Ghi Firestore vẫn do các transaction cũ kiểm soát; CP70 gia cố chặn ghi trước xác minh và kiểm tra UID/ID trong transaction cập nhật.

## Lệnh cần chạy tại máy đủ dependency

```powershell
npm ci --no-audit --no-fund
npm run check:dependencies
npm run test:cp70:journey
npm run test:closed-loop
npm run test:journey-reliability
npm run build
npm run test:rules:emulator
```

Kiểm tra trên **Firebase QA riêng** với tài khoản tổng hợp. Kiểm tra đăng nhập → Seed → Orion tạo chu kỳ → Pulse check-in → đánh giá lại → Lumen evidence, thêm một phiên tab/thiết bị để thử xung đột và chuyển tài khoản. Không chạy với hồ sơ thật của học sinh trong quá trình thử. Sau đó hoàn tất bộ browser QA 12 ca từ CP68 trên desktop và mobile.

**Phân biệt trạng thái:** Test domain, test source contract, replay synthetic PASS không tương đương build React, browser E2E, kiểm thử bảo mật Emulator hoặc tác động khoa học. Những gate chưa chạy tiếp tục để OPEN.

Đọc tiếp `reports/cp70/CP70_ACCEPTANCE_REPORT.md`.
