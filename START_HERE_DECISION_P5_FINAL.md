# CLA Decision P5 FINAL — Bản ứng viên bàn giao mã nguồn P1–P5

Nền: CLA_DECISION_P4_FULL_20261124.zip. Không thay đổi CSS, màu, route, Firestore Rules (các candidate), tài khoản, API key, cấu hình Firebase, GitHub hoặc production.

## P5 đã thực hiện
- Atlas: bỏ hai nút bắt đầu chọn tổ hợp trùng với hành trình bốn bước; giữ điều hướng chính, toàn bộ 4 bước và các đường sang Orion. Panel gợi ý có điều kiện route độc lập, sửa test cấu trúc Atlas kế thừa mà không sửa test đó.
- Pulse: nhóm tín hiệu còn thiếu theo cùng phân hệ và đích thực tế. Giữ từng lý do; không coi số 0 là thiếu. Khi đang đồng bộ hoặc lỗi đọc, không quy lỗi thiếu dữ liệu cho học sinh. Bổ sung trạng thái profile loading/syncing/error vào trạng thái Pulse. Không sửa nguồn dữ liệu hay thuật toán tính điểm.
- Điều hướng: đóng menu Mở rộng khi đổi route, làm rõ tên các mục Pulse; không loại bỏ tab hay thay đổi quyền truy cập.
- P1–P4 được giữ nguyên; thêm test P5 vào verify:focused và cập nhật manifest riêng, không thay manifest lịch sử.

## Kết quả kiểm tra
- verify:focused PASS 141/141 (11+51+29+23+20+7), 68 file manifest đã xác minh.
- UX regression PASS 71/71, gồm CP42 focused workspace, CP65, CP74, CP76, CP78, CP87, CP92 và CP93. Có thể trùng phạm vi với focused; không cộng thành số test duy nhất.
- Pure helper strict TypeScript PASS; transpile syntax 6 file TS/TSX PASS. Đây không phải full typecheck.
- npm test FAIL tại Daily Companion: DC14 kỳ vọng nhãn cũ, DC16 thiếu public/cla-companion-sw.js, DC18 thiếu public/manifest.webmanifest. Hai file thiếu từ P4; StudentPage và test Daily Companion không thay đổi. Chuỗi && dừng tại đây, các bộ phía sau chưa được chạy qua lệnh này. Không tắt test, không khôi phục push/PWA ngoài phạm vi.
- check:layout FAIL vì src/audit_dataset.py là bản sao ở vị trí legacy có từ P4. Giữ nguyên các file nghiên cứu lịch sử, không xóa dữ liệu.
- npm ci không hoàn tất (timeout); full build, browser E2E, Firebase/Gemini live, multi-device và nghiệm thu khoa học chưa chạy. Không coi FINAL là production-ready hoặc 100% nghiệm thu dự án.
- Reports: reports/decision-p5/. Không có secret thật được tạo hoặc đưa vào file.

## Kiểm tra trên máy phát triển
Sao lưu môi trường và source đang dùng. Giải nén vào thư mục mới; lấy lại .env local riêng của bạn, không chép đè cấu hình Firebase từ máy khác. Chạy `npm ci`, `npm run verify:focused`, `npm test`, `npm run build -- --mode live`. Không deploy khi còn test FAIL hoặc thiếu xác minh auth/API. Khi đã kiểm tra, chạy `npm run dev` để kiểm tra giao diện P5. Script BUILD_CLA_FOCUSED.cmd vẫn giữ gate npm test trước build; không dùng script để bỏ qua lỗi.
