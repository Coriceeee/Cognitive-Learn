# CLA — Hướng dẫn bản P0 Student Data Consent (13/11/2026)

## Đây là bản gì?
FULL SOURCE kế thừa `CLA_FULL_SOURCE_P0_FIRESTORE_SECURITY_GATE_20261113.zip`; thêm trang `/student/consent` với thiết kế nhất quán CLA, lưu quyết định sản phẩm và thử nghiệm Rules phân quyền chặn ghi mới khi rút đồng ý. **Không phải bản đã đủ điều kiện dùng với học sinh thật**.

## Cài đặt không phá dữ liệu
1. Sao lưu `C:\Gạo\Cognitive-Learn` (gồm `.env`, `.env.local`, cấu hình tùy biến).
2. Giải nén và chép nội dung ZIP vào `C:\Gạo\Cognitive-Learn`. Giữ nguyên `node_modules`, `.env` và `.env.local` đang hoạt động; tránh ghi đè thay đổi cục bộ chưa sao lưu.
3. `npm run test:student-consent`; `npm test`; `npm run test:rules:static`; `npm run build`; `npm run dev`.
4. Mở `/student/consent`: mặc định đây chỉ là giao diện đọc thông báo. Vì Rules production chưa được xác minh, CLA **không tự kích hoạt consent gate**.

## Để nghiệm thu chức năng trên Firebase Emulator (không động production)
- `npm run test:rules:emulator`
- Kiểm tra `reports/security/firestore_emulator_gate.json` phải có `overall: "PASS"`, `emulatorAuthorizationTests: "PASS"` và mã hash của Rules mới.
- Bản thử nghiệm có **50 ca** trong `tests/firestore.rules.cp21.test.mjs` (42 cũ + 8 ca consent), không phải 50 ca đã chạy trong môi trường đóng gói.
- Chỉ sau khi xem xét và triển khai Rules có xác nhận mới bật `VITE_CLA_STUDENT_CONSENT_GATE=true` trên staging, kiểm tra đăng nhập học sinh, đồng ý, lưu bảng điểm, rút đồng ý, chặn ghi mới và vào Admin.
- Bật flag trong `.env.local` yêu cầu chạy lại dev/build; **không dùng flag để thay thế Rules**.

## Các giới hạn bắt buộc phải nhớ
- `firestore.rules.CANDIDATE_CP21` không phải bằng chứng Rules đã triển khai thật. `firebase.json` chưa có cấu hình tự động triển khai Rules production.
- Không có xác minh cha/mẹ/người giám hộ; researchConsent luôn false, chưa có SOP rút khỏi nghiên cứu.
- Chưa có xóa/xuất dữ liệu tự động, kiểm toán retention, kiểm thử E2E production.
- Nếu đã bật flag mà chưa deploy Rules tương thích, người dùng có thể không truy cập được chức năng học sinh; vì vậy mặc định OFF.
