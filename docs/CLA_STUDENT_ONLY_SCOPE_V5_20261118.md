# CLA — Quyết định phạm vi sản phẩm Student-only (18/11/2026)

Chủ dự án yêu cầu bỏ hai không gian giáo viên và phụ huynh, chuyển nội dung về học sinh. Quyết định này thay thế phần đặc tả vai trò trong tài liệu cũ, không thay đổi 7 module, lộ trình AI/ML, RQ1–RQ5 hay 70 đầu việc V4. Nexus vẫn phục vụ quản trị kỹ thuật; không cấp quyền đọc hồ sơ người khác. Giữ nghề sư phạm, ngân sách gia đình, tư vấn từ chuyên gia và tài liệu về đồng ý/người giám hộ cho học sinh vị thành niên.

| ID gốc | Tiêu chí thay thế trong phạm vi mới |
|---|---|
| A4/A5/B1 | Route và đăng ký học sinh, đăng nhập học sinh/Admin; URL cũ không mở workspace. |
| B5/K3/K4/K17 | Tài khoản thuộc vai trò đã loại bỏ phải bị chặn ở app, API và Rules; test deny cho cả dữ liệu chia sẻ lịch sử. |
| F1/F2/F4 | Báo cáo và tiến trình cá nhân trong Pulse/Haven, không tạo liên kết hoặc báo cáo chia sẻ; học sinh sở hữu được thu hồi hồ sơ chia sẻ cũ, có empty/error/retry. |
| F3/K1/K2/K15/K16 | Nexus giữ chẩn đoán, 22 tác vụ quản trị, demo bằng UID riêng. Backend tùy chọn chỉ cho phép gán Student; thao tác với tài khoản cũ phải được xác nhận và ghi audit. |
| K13/K14 | Báo cáo tiến trình và hỗ trợ tài chính, học bổng chỉ hướng đến học sinh. |
| R2/R7/R8 | Bảo vệ trẻ vị thành niên, human review ngoài nền tảng, consent và giới hạn claim giữ nguyên; không suy ra nghiên cứu đã được đồng ý. |

Các ID cũ được giữ để truy vết; yêu cầu workspace đã loại bỏ không tự được tính PASS. Không tái chấm thang 164 mục trong bản này. Báo cáo cũ, tài liệu tham chiếu gốc và dữ liệu legacy không bị xóa hay viết lại để tạo lịch sử giả. Các tài khoản QA cũ chỉ dùng làm negative test, không còn là vai trò sản phẩm.

## Dữ liệu và triển khai
- Không tự đổi role hoặc xóa tài khoản Firebase. Admin xác nhận từng trường hợp theo quy trình audit nếu thực sự là học sinh; tài khoản còn lại có thể được khóa qua backend đặc quyền.
- Rules candidate cấm đăng ký vai trò ngoài Student, cấm chia sẻ mới và cập nhật phản hồi, cấm bên nhận cũ đọc/list. Giữ quyền chủ sở hữu thu hồi report trước link; cleanup không đụng dữ liệu học tập. API chỉ chấp nhận Student/Admin đang active.
- Chỉ triển khai Rules/backend sau Emulator và review độc lập. Trước khi cập nhật production phải sao lưu Rules hiện tại, kiểm kê legacy share ở môi trường được cấp phép và xác nhận không có read path ngoài Rules. Không giả định bản cũ, cache, file đã xuất hoặc backup đã bị xóa.
- Quyền nghiên cứu trẻ vị thành niên vẫn cần căn cứ pháp lý/đạo đức riêng; không mở lại Gemini/LLM live chỉ vì phạm vi thay đổi.
