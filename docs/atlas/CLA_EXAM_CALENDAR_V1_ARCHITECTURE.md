# CLA — Exam Calendar / Candidate-selected reminders V1
**Ngày:** 14/11/2026 · **Nhánh:** Atlas × Daily Companion · **Trạng thái:** có code, chưa browser E2E / mobile push.

## Mục tiêu
Bảng đếm ngược ở đầu `/student` cho kỳ thi học sinh chủ động chọn. Mỗi *đợt* thi có ngày thi, hạn đăng ký, nguồn người dùng lưu, trạng thái đã đăng ký. Mốc thi và mốc đăng ký là hai sự kiện khác nhau. Học sinh có thể thêm nhiều đợt V-SAT, HSA… hoặc kỳ thi bất kỳ. Không tự gán một lịch chung cho tất cả học sinh.

## Nguồn dữ liệu và quyền riêng tư
- Danh mục kỳ thi chỉ có **tên**, mô tả, đường dẫn tham khảo; không tự điền ngày/hạn.
- Ngày học sinh nhập là **tự cung cấp, chưa xác minh**. Link học sinh nhập chưa được CLA kiểm duyệt dù URL phải HTTPS.
- Local V1: `localStorage["cla-exam-calendar-v1:" + firebaseUid]` với schemaVersion=1, max=20 đợt. Không ghi Firestore, không gửi dữ liệu đến Gemini, không xuất dữ liệu nghiên cứu.
- Thay đổi tài khoản → chỉ đọc key theo UID đã đăng nhập, xóa dữ liệu đang hiển thị. Dữ liệu local không đồng bộ nhiều thiết bị, có thể mất khi xóa dữ liệu trang.
- Nếu dữ liệu lưu sai schema → khóa ghi, chỉ xóa bản lỗi khi người dùng xác nhận; không âm thầm overwrite.
- Đã được phân quyền vào `/student` bởi AccessGate; bản xem trước Admin không hiển thị bảng.

## Thuật toán
- Ngày là chuỗi YYYY-MM-DD; validator kiểm tra ngày lịch thực tế, cả năm nhuận.
- Đếm ngược trên **ngày lịch**, không lấy chênh lệch giờ / 86.400.000 giữa hai local midnights (tránh DST/múi giờ).
- Cột mốc: hạn đăng ký (nếu chưa tick "Đã đăng ký") và ngày thi. Được sắp theo mốc trong tương lai gần nhất.
- Banner nhắc trên trang khi còn 14 ngày trở xuống; mốc đã qua không còn gửi banner như thể còn tương lai. Lịch nhận thời gian hiện tại theo thiết bị, cập nhật mỗi phút.
- **Không** tự gửi push nền khi đóng website; đây không phải bộ lập lịch Cloud Functions/Web Push hiện tại.

## Lộ trình xác minh / mở rộng
1. Browser E2E tại `/student`: chọn HSA, nhập 1 đợt HSA, thử 2 đợt V-SAT, reload, đổi tài khoản, xóa mục; kiểm tra responsive 360px.
2. Nguồn chính thức: Gemini Reader **đề xuất** mốc theo năm, kỳ thi, địa điểm, đợt; review bắt buộc trước khi đưa vào danh mục xác minh, ghi source URL / fetchedAt / verifiedAt.
3. Đồng bộ theo tài khoản qua collection riêng `exam_reminders/{uid}`, chỉ sau khi đủ consent, Firestore Rules emulator PASS và triển khai backend; không tự kích hoạt trên production.
4. Tích hợp Cloud Functions/Web Push có cơ chế chống gửi trùng, giờ yên lặng và quyền bật/tắt trên từng thiết bị; chỉ nội dung chung trên màn hình khóa.
5. Bản mobile PWA/Capacitor chỉ được ghi PASS sau khi kiểm tra Android/iOS thật, không chỉ qua unit test.

## Liên hệ các chức năng khác
- **Gemini API:** hỗ trợ đọc/cập nhật lịch thi và bảng quy đổi chứng chỉ trường/ngành theo năm, mọi thông tin AI là nháp chờ duyệt.
- **Rules Engine:** tính mốc/đếm ngược, tính điểm quy đổi chỉ khi có dữ liệu đã xác minh và quy tắc phù hợp.
- **ML:** không cần tham gia vào việc xác định lịch thi hoặc quy đổi chứng chỉ, không được tự dự đoán ngày thi.
