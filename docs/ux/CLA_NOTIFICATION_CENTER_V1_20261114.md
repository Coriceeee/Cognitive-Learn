# CLA — Notification Center & Exam Calendar Layout (14/11/2026)

## Quyết định thiết kế
- Dashboard `/student`: `StudentHeader` → hero → `Việc nên làm tiếp theo / Mức độ sẵn sàng` → **`Lịch thi của tôi`** → danh sách module. Các anchor `#cla-exam-reminders` vẫn hoạt động từ Atlas và Daily Companion.
- Thanh UserMenu mọi trang xác thực có **chuông Thông báo** và danh sách các thông báo của **phiên trang hiện tại**. Popup nổi dưới thanh điều hướng, tối đa 3 thẻ đồng thời, nút đóng, tự ẩn, `aria-live`/`role=alert`, responsive.
- Thông báo chỉ phát từ sự kiện đã thực sự xảy ra: Gemini Lumen giải thích xong, Gemini Atlas trích xuất bản nháp, Firestore Seed commit xong, sự cố API/lưu dữ liệu, sự kiện online/offline, mốc lịch thi đã lưu còn <=14 ngày. Không tự thông báo hoàn tất chỉ từ việc mở trang.
- Khi chuyển trang sau khi lưu Seed, dùng một **cờ sessionStorage theo UID** (không chứa điểm số hay chi tiết cá nhân) để hiện popup lần nữa trên Dashboard.
- Nhắc lịch thi tối đa một lần/đợt/mốc/ngày trong mỗi sessionStorage tab. Những ngày thi do người học nhập vẫn cần xác minh từ đơn vị tổ chức.
- `appNotices.ts` chỉ quản lý bộ nhớ ứng dụng; không ghi nội dung lên Firestore, không tự kích hoạt `Notification.requestPermission`, không gọi Web Push hay Cloud Functions.

## Giới hạn và xác nhận
- Popup hoạt động khi website đang mở, không phải OS push khi tắt trang/ứng dụng.
- Những thay đổi về trang/header chưa qua Browser E2E/Firebase production trong môi trường đóng gói; cần người dùng nghiệm thu.
- Không thay đổi schema Firestore, security rules, Gemini API backend, bảng điểm hoặc lịch thi đã lưu.
- Không tăng điểm nghiệm thu nghiên cứu hoặc đoán % hoàn thiện. CSV kiểm kê 164 mục tiếp tục ở mốc bảo thủ.
