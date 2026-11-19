# CP31 Batch 1 — Nexus Console · kiểm toán 22 tác vụ

Ngày lập: 2026-11-15. Nền source: CP30 Batch 4.

## Phạm vi thực hiện
- Thêm `/admin/audit` trong AccessGate; Vercel rewrite SPA explicit, Firebase Hosting fallback sẵn có.
- Lập 22 hạng mục của 7 cụm Nexus từ `adminConsoleDirectory`: 10 đã có trang chẩn đoán (phần lớn chỉ đọc UID hiện tại), 12 chưa có công cụ. Tất cả có tiêu chí nghiệm thu và bằng chứng cần có.
- Trên các thẻ Nexus bổ sung liên kết xem điều kiện nghiệm thu; giữ nhãn `Chưa triển khai` cho tác vụ không có công cụ, không tạo nút giả PASS.
- Chặn URL chẩn đoán ngoài allowlist và các mã trùng, lạ hoặc thiếu khỏi bản kiểm toán.
- Vô hiệu hóa kết quả chẩn đoán đến muộn khi người dùng đổi tài khoản; loại bỏ mô tả cũ sai rằng backend quản trị chưa có code (hiện có code, chưa bật production).
- Giao diện responsive, focus-visible, không gọi write Firestore, không tiết lộ UID người khác.

## Kết quả kiểm thử đã thực sự chạy
- `npm run test:cp31:nexus`: PASS (9/9 ca mới + 2 script contract cũ PASS).
- `npm run verify:cp31:batch1`: PASS (test CP31, 5/5 test route CP29, layout PASS).
- `npm run verify:cp30:batch4`: PASS (CP29 + CP30 regression).
- `npm test`: PASS (toàn bộ chuỗi kiểm thử unit/contract có trong script source).
- `npm run build`: **KHÔNG PASS trong môi trường đóng gói** do không cài `node_modules` (thiếu react, React JSX typings v.v.). Không có kết luận build source bị lỗi; cần `npm ci` rồi chạy lại trên máy Windows.
- `npm run test:rules:emulator`: **CHƯA CHẠY** cho CP31; Rules và tests Firestore cũ không đổi; dự kiến 86 ca trong source.
- Browser E2E 22 thao tác và kiểm thử accessibility trên các thiết bị: **CHƯA CHẠY**.

## Quy tắc nghiệm thu
Không chuyển tác vụ sang PASS chỉ từ trạng thái có trang chẩn đoán. `accepted:0` ở bảng này thể hiện **không có phê duyệt reviewer mới từ riêng đợt kiểm toán này**, không có nghĩa toàn bộ dự án 0% hoàn thành.

## Cách áp dụng
1. Sao lưu source CP30 Batch 4 rồi áp dụng PATCH đúng vào thư mục dự án.
2. `npm ci`
3. `npm run test:cp31:nexus`
4. `npm run verify:cp31:batch1`
5. `npm test`
6. `npm run test:rules:emulator`
7. `npm run verify:cp37`
8. Đăng nhập vai trò Admin, mở `/admin`, kiểm tra 7 cụm/22 tác vụ, mở `/admin/audit` và các trang chẩn đoán; thử Student/Teacher/Parent không được vào `/admin/audit`.

## Hạn chế và bước tiếp theo
Đây là công cụ rà soát tiến độ/bằng chứng Nexus, **không phải 22 chức năng vận hành đều đã triển khai**. Batch 2 cần xây dựng kiểm thử trình duyệt cho điều hướng và nút bấm, xử lý các hạng mục `planned` theo ưu tiên và liên kết log release thực tế từ backend được xác thực.
