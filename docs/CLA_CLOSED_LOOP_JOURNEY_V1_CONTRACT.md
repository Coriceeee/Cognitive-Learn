# CLA — Closed-Loop Cognitive Journey v1 · Hợp đồng dữ liệu và giới hạn

**Phiên bản:** `cla-closed-loop-v1` · **Ngày:** 13/11/2026  
**Phạm vi:** Tính năng học sinh thử nghiệm nối Orion → Pulse → Lumen; không phải dữ liệu nghiên cứu được xác minh.

## Chuỗi 8 bước và trạng thái bằng chứng

1. **Baseline snapshot:** chốt môn, điểm hiện tại và mục tiêu tại thời điểm tạo kế hoạch Orion. Điểm có thể do học sinh nhập hoặc đã gợi ý từ Seed; KHÔNG chứng thực bài thi.
2. **Assessment:** `runOrionStrategy` tính readiness theo heuristic; không gọi xác suất hay ước lượng hiệu quả.
3. **Recommendation:** chọn một trong 3 kịch bản Orion (balanced, focused, breakthrough).
4. **Intervention plan:** tạo `JourneyCycle` với `id`, `startedAt`, danh sách môn và `plannedWeeklyHours` cố định.
5. **Check-in:** Pulse ghi giờ học thực tế và tỷ lệ nhiệm vụ tự báo cáo, tối đa 1 lần/tuần, 12 check-in/chu kỳ.
6. **Outcome observation:** chỉ được nhập điểm đánh giá lại sau ít nhất một check-in. `provenance = student_self_report`; không có chứng cứ độc lập từ giáo viên/Seed.
7. **Reassessment:** so sánh điểm đánh giá lại với baseline **cùng môn**. Điểm 0 hợp lệ, môn thiếu dữ liệu không được coi là 0.
8. **Adaptation:** Lumen đưa lời nhắc `CONTINUE` hoặc `REPLAN` theo so sánh và mức hoàn thành tự báo cáo. Đây là quy tắc mô tả, không phải hiệu quả nhân quả đã kiểm định.

## Lưu trữ

- `learning_journeys/{uid}/cycles/{cycleId}` (document được tạo bằng client SDK, ID ngẫu nhiên).
- `schemaVersion: 1`, `origin: orion_simulation`, `status: ACTIVE | REVIEWED`.
- Mỗi tài khoản đọc tối đa 8 chu kỳ mới nhất; không xóa/chỉnh sửa chu kỳ đã REVIEWED bằng client.
- Check-in chỉ thêm, baseline bất biến trong candidate Rules; transaction giúp tránh lost updates.
- Không tự ghi ngược điểm tự báo cáo vào `student_transcripts`, `learning_profiles`, hay `cognitive_history`.
- Tài khoản đang đăng nhập và quyết định consent sản phẩm phải hợp lệ trước khi ghi; không tự mở quyền nghiên cứu.
- **Cần kiểm thử Firestore Emulator và duyệt Rules ứng viên trước khi deploy**. `firebase.json` hiện không xác nhận Rules đã dùng trên production.

## Giới hạn chưa giải quyết

- Không có xác minh danh tính người giám hộ, đồng ý nghiên cứu, chứng thực giờ học/điểm kiểm tra, thử nghiệm ngẫu nhiên hoặc mô hình hiệu chuẩn.
- Chưa có cơ chế tổng hợp tất cả chu kỳ vượt quá 8 chu kỳ mới nhất trong UI (tài liệu cũ vẫn có thể tồn tại).
- Chưa có quy trình riêng để trích xuất/xóa dữ liệu chu kỳ và lịch lưu trữ sau rút đồng ý. Hệ thống ngăn ghi mới theo candidate Rules nhưng vẫn cho đọc lịch sử.
- Không có ràng buộc bất biến hệ thống bảo đảm chỉ tồn tại đúng một chu kỳ ACTIVE khi hai thiết bị bắt đầu đồng thời. Giao diện chặn tạo mới nếu đã thấy ACTIVE; cần tiếp tục khóa ở backend.
- Điểm đo lại chỉ là quan sát **trước–sau tự báo cáo**; thay đổi không chứng minh do chiến lược học tập gây ra.
- Không coi hành trình này là `EvidenceRecord` thỏa Protocol §26.1; schema nghiên cứu chuẩn cần triển khai và phê duyệt riêng.

## Kiểm tra trước khi cho học sinh dùng thật

1. `npm run test:closed-loop`, `npm test`, `npm run build` PASS trên Windows + TypeScript 6.
2. `npm run test:rules:emulator` PASS và kiểm tra các test J01–J05.
3. Đối chiếu Rules đã triển khai trên Firebase production (chưa xác nhận).
4. Thử E2E với tài khoản học sinh đã có consent: Orion → Pulse check-in → đánh giá lại → Lumen.
5. Thử đăng nhập khác UID, thu hồi consent, đổi tài khoản giữa giao dịch.
6. Kiểm tra chính sách lưu trữ, xóa dữ liệu và quy trình người giám hộ/đạo đức.
