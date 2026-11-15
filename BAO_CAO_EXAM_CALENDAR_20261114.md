# CLA — Báo cáo bản vá Lịch thi của tôi
**Ngày:** 14/11/2026  · **Nguồn:** `CLA_FULL_SOURCE_ATLAS_NGUYEN_VONG_NHAP_20261114.zip`

## 1. Phạm vi
Bổ sung bảng trên đầu Dashboard học sinh: tự lựa chọn HSA, V-ACT, TSA, V-SAT, THPT, IELTS, TOEFL, SAT, ACT hoặc kỳ thi khác; hỗ trợ nhiều đợt cùng loại; nhập/ngày thi/hạn đăng ký/link nguồn; ẩn kỳ thi, đánh dấu đã đăng ký; đếm ngược mốc gần nhất và nhắc trong trang khi còn <=14 ngày. Thêm liên kết từ Atlas và Daily Companion.

## 2. Files chính
- `src/lib/examCalendar.ts`: hợp đồng, kiểm tra ngày thật, tính ngày lịch an toàn múi giờ, mốc và cảnh báo.
- `src/components/student/ExamReminderBoard.tsx`: giao diện chọn/sửa/xóa, lưu localStorage theo UID Firebase, chặn dữ liệu sai schema.
- `src/styles/30-exam-reminder-board.css`: giao diện responsive.
- `src/page/seed/StudentPage.tsx`: bảng gần đầu trang và điều hướng hash.
- `src/page/atlas/AtlasPage.tsx`: link đến lịch thi.
- `src/page/companion/DailyCompanionPage.tsx`: link đến lịch thi.
- `src/styles.css`, `package.json`: import CSS và script test.
- `tests/step17-exam-reminders.test.mjs`: 30 tình huống kiểm thử (có trên npm test).
- `docs/atlas/CLA_EXAM_CALENDAR_V1_ARCHITECTURE.md`: quyết định kiến trúc / giới hạn.

## 3. Kiểm thử và mức xác nhận
| Nhóm | Kết quả |
|---|---|
| Test mới | 30/30 PASS |
| `npm test` toàn dự án | PASS |
| `npm run test:rules:static` | 15/15 PASS |
| `npm run check:layout` | PASS |
| `tsc --strict` trên engine mới | PASS TypeScript 5.8.3 |
| Kiểm tra cú pháp TSX các file chỉnh sửa | PASS |
| Firebase Emulator, Browser E2E, production build | Chưa nghiệm thu |
| `npm ci --offline` môi trường đóng gói | BLOCKED: cache thiếu yargs-parser, không kết luận lỗi source |

## 4. Ranh giới thông báo và nguồn
- Không tự điền bất kỳ ngày nào từ lịch năm cũ hay từ Gemini. HSA/V-SAT có thể có nhiều đợt, tùy điểm tổ chức và ngày được phân.
- Link catalog chỉ là cổng tham khảo; link do học sinh nhập chưa xác minh.
- Nhắc trong trang không phải thông báo đẩy trên điện thoại lúc đã đóng website.
- Không dùng dữ liệu lịch thi trong nghiên cứu hoặc Gemini ở V1.

## 5. Tiến độ CLA 164 đầu việc
Đối chiếu cùng `CLA_REBASELINE_164_EXAM_CALENDAR_20261114.csv` — **164 dòng**, cập nhật bằng chứng mã `C25-17` (UI/UX của 7 module), **không tự nâng điểm** khi chưa nghiệm thu trình duyệt. Mức kiểm kê tạm thời theo 164 mục giữ **37,2%** (làm tròn từ 37,1951%). Bảng Lịch thi là nhánh mở rộng chưa được nghiệm thu, không tự tạo thành một mục hoàn thành 100%.

## 6. Kế tiếp
- Nghiệm thu board trên Windows/mobile, Firestore Rules Emulator và các tính năng Closed-Loop/Consent đang chờ.
- Dùng Gemini Reader trích xuất mốc lịch thi có nguồn, review theo đợt/năm/đơn vị tổ chức; sau đó mới mở tự đồng bộ.
- Gemini trích bảng quy đổi chứng chỉ theo trường/ngành/năm/phương thức, reviewer duyệt; engine số học áp dụng quy định đã duyệt, không để LLM tính bằng suy đoán.
- Đồng bộ Calendar qua Firestore và Web Push theo thiết bị chỉ sau P0 consent/rules và backend kiểm thử.
