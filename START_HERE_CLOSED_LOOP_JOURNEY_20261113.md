# CLA FULL SOURCE — Closed-Loop Journey · Hướng dẫn

**Đây là FULL SOURCE**, không phải diff. Nền source: `CLA_FULL_SOURCE_P0_PREDICTION_ORION_SEMANTICS_20261113.zip`.

## Cài đặt Windows

1. Sao lưu thư mục `C:\Gạo\Cognitive-Learn`.
2. Giải nén FULL SOURCE ZIP, chép đè toàn bộ file ở gốc ZIP vào thư mục dự án.
3. Giữ lại `.env`, `.env.local`, `node_modules` đang chạy tốt. Nếu thiếu thư viện mới chạy `npm ci --include=dev` (đóng Vite trước để tránh EPERM).
4. Mở PowerShell:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:closed-loop
npm test
npm run test:rules:static
npm run build
npm run test:rules:emulator
npm run dev
```

## Trải nghiệm chức năng (chỉ sau khi đã xác minh Rules)

1. Đăng nhập **học sinh** và xác nhận quyết định sử dụng dữ liệu trên `/student/consent` (khi quy trình áp dụng đã được bật đúng).
2. Mở `/orion` → nhập điểm hiện tại, điểm mục tiêu và số tuần hợp lệ → tìm mục **Khuyến nghị → hành động → đánh giá lại** → chọn kịch bản và bắt đầu.
3. Mở `/pulse#cla-closed-loop` → nhập tuần, giờ học tự báo cáo, nhiệm vụ đã hoàn thành → **Lưu check-in tuần**.
4. Khi có một lần đo/kiểm tra thực sự, nhập lại điểm một hoặc nhiều môn trong Pulse, sau đó chốt chu kỳ. Không nhập số liệu giả như outcome thực.
5. Mở `/lumen#cla-closed-loop` → xem diễn tiến, khoảng thay đổi điểm tự báo cáo và lời nhắc điều chỉnh kế hoạch.
6. Quay lại Orion bắt đầu một chu kỳ mới nếu muốn.

## Nếu nút lưu báo `permission-denied`

Source mới có thêm đường dẫn `learning_journeys/{uid}/cycles/{cycleId}`. Rules production hiện tại **có thể chưa hỗ trợ**, nên nút lưu có thể bị từ chối dù các bài test tĩnh đều xanh. Không tự thay Rules sản xuất chỉ để làm cho nút hoạt động.

Kiểm tra `reports/security/firestore_emulator_gate.json`: chỉ tiếp tục review và deploy thủ công nếu `overall: PASS`, đã kiểm tra cả test J01–J05 và chính sách consent. Gói ZIP không tự deploy Firebase hoặc thay `.env`.

## Giới hạn

- Rules mới là **CANDIDATE**, chưa qua Emulator trong môi trường đóng gói.
- Code đã qua unit/integration source tests; chưa được xác nhận build TypeScript 6, browser E2E hay Firebase production.
- Không sử dụng dữ liệu học sinh thật cho nghiên cứu; chưa có bước xác minh người giám hộ hay quy trình xóa dữ liệu hoàn chỉnh.
- Lưu `0` hợp lệ; không tự suy ra outcome từ điểm dự đoán; điểm đo lại là tự báo cáo.

Chi tiết: `docs/CLA_CLOSED_LOOP_JOURNEY_V1_CONTRACT.md` và `BAO_CAO_CLOSED_LOOP_JOURNEY_20261113.md`.
