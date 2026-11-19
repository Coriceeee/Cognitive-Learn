# CP31 Batch 10 — Freeze T0 Plan Snapshot (16/11/2026)

## Mục tiêu
Ngăn sử dụng thông tin sau can thiệp để viết lại baseline/giả định ban đầu. Không có claim về xác suất đỗ, kết quả điểm hay hiệu quả nhân quả.

## Triển khai
- `src/lib/closedLoopJourney.ts`: `JourneyT0Snapshot`, `buildJourneyT0Snapshot`, `auditJourneyT0Snapshot`; đóng băng tại `createJourneyCycle`, trước check-in. Mốc gồm `startedAt`, subject baseline/target, scenarioId, weeklyHours, weeksLeft, chỉ số **khoảng cách mục tiêu mô tả** và `forecastStatus=NOT_ESTIMATED`.
- T0 không lưu T1/T2, check-in hoặc outcome. `appendJourneyCheckIn` và `reassessJourneyCycle` từ chối snapshot bị sửa.
- `firestore.rules.CANDIDATE_CP21`: kiểm tra cấu trúc T0 và ràng buộc trường với kế hoạch tạo mới; update whitelist không cho sửa T0 hoặc baseline. **Chưa deploy** và **chưa có Emulator runtime bằng chứng cho Batch 10**. Firestore Rules không tự tái tính gap, mà domain auditor kiểm tra khi đọc.
- `tests/firestore.rules.cp21.test.mjs`: cập nhật fixture tạo chu kỳ đúng schema và thêm J14/J15, chỉ có ý nghĩa khi chạy trong Firestore Emulator biệt lập.
- `ClosedLoopPanel`: hiển thị T0 FROZEN / LEGACY / MISMATCH, công khai chưa ước lượng outcome.
- `tools/cla_golden_path_offline.mjs`: giữ bản sao T0 từ trước check-in và so sánh lại sau reassessment.
- Khôi phục ba tệp `.env.example` **chỉ chứa placeholder** (bị bỏ sót trong full ZIP Batch 9), để `npm test` chạy đúng trên bộ source phân phối. Không bao gồm `.env` thật.

## Bằng chứng kỹ thuật
- `npm run test:cp31:batch10`: **30/30 PASS**.
- `npm run verify:cp31:batch10`: **PASS** (bao gồm regression Batch 9→7, Golden Path và layout).
- `npm test`: **PASS** sau khi khôi phục `.env.example`.
- TypeScript strict cho ClosedLoop/Shadow: **PASS**.
- `research:golden-path:verify`: **PASS**, synthetic only.
- Chưa có `npm run build` do chưa cài node_modules trong môi trường phát hành; **chờ Windows**.
- Firestore Emulator J14/J15 và Browser E2E 72 ca: **NOT RUN**, không xem kiểm tra tĩnh như test authorization.

## Giới hạn và mô hình đe dọa
Snapshot không phải chữ ký, không chứng minh ai nhập giá trị, và client có thể tự báo cáo hoặc cố tình lùi thời gian. Server `createdAt` là timestamp đáng tin cậy hơn nhưng chưa phải nghiên cứu prospective pre-registration. Một kẻ giả cả chu kỳ lẫn snapshot vẫn có thể tạo dữ liệu nhất quán. Rules chỉ khóa những gì được lưu trong tài liệu kể từ lúc tạo. Không được gọi `planGapPoints` là forecast, predicted gain, confidence hoặc effect estimate. Dữ liệu legacy thiếu T0 được đọc với trạng thái `LEGACY_NO_T0`; **không được dùng để đánh giá dự báo tiền cứu**.

## Checklist 164
Tăng bằng chứng cho **R5.2, R6.3, R9.6**. Giữ nguyên **21 đạt kỹ thuật cục bộ / 126 một phần / 17 thiếu bằng chứng**. Không tự nâng `R6.3` lên đạt vì chưa có frozen predictive model, outcome thật và runtime QA authorization.

## Hướng tiếp theo
1. Chạy `npm run build`, `npm run test:rules:emulator` trên Windows sau áp patch lên Batch 9.
2. Đánh giá khả năng khóa và phát lại **một forecast v1 hợp lệ** trên bộ dữ liệu được phép sử dụng, nếu có outcome/horizon tương ứng; nếu chưa, tiếp tục giữ `NOT_ESTIMATED`.
3. Khi có QA tách biệt, chạy J14/J15 và browser E2E. Không chạy trên production thật.
