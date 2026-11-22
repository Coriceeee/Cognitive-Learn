# CP66 — nội dung gợi ý đưa vào báo cáo NCKH

## Đoạn mô tả hệ thống (có thể chỉnh sửa)

**Nguyên tắc thiết kế UX:** Cognitive Learn AI sử dụng bộ thành phần giao diện nhất quán cho sáu phân hệ Seed, Lumen, Atlas, Orion, Pulse và Haven. Thay vì chỉ phân biệt trạng thái bằng màu, giao diện cung cấp nhãn, nội dung giải thích và hành động cụ thể cho các tình huống: đang tải, đang xác minh dữ liệu với máy chủ, chưa có dữ liệu, đang lưu, đã lưu, lỗi hoặc xung đột dữ liệu. Nội dung hiển thị phụ thuộc trạng thái đọc hoặc ghi dữ liệu, không suy diễn ra kết quả nhận thức hay khả năng trúng tuyển.

**Phân biệt nguồn và độ tin cậy:** Với hồ sơ học tập, một số thao tác chỉ hiển thị trạng thái hoàn thành sau khi Firestore xác minh dữ liệu. Đối với tuyển sinh, Atlas duy trì nhắc nhở kiểm tra thông tin theo năm, trường và phương thức từ nguồn chính thức. Với các dữ liệu mô phỏng do học sinh tự nhập, giao diện không tự thay thế dữ liệu thiếu bằng điểm số giả.

**Hạn chế đã xác định:** Hệ thống đã vượt qua các kiểm tra logic offline và kiểm tra bố cục độc lập, nhưng chưa có bằng chứng nghiệm thu đầy đủ trên ứng dụng React kết nối Firebase production. Các ảnh mô phỏng trạng thái không thay thế được ảnh chụp triển khai thực tế hoặc kết quả thử nghiệm có người dùng.

## Chú thích minh họa CP66

- **Hình UX-66.1 — Bộ trạng thái dữ liệu trong sáu phân hệ (QA desktop sáng):** Các nhãn và hành động được thể hiện đồng bộ ở Seed, Lumen, Atlas, Orion, Pulse và Haven. *Bản dựng độc lập từ thành phần TSX với trạng thái minh họa; không phải ảnh website vận hành.* `preview-desktop-light.png`
- **Hình UX-66.2 — Bộ trạng thái ở chế độ tối:** Thể hiện màu nền, chữ, viền và trạng thái tương ứng trên cùng thành phần. *Bản QA độc lập.* `preview-desktop-dark.png`
- **Hình UX-66.3 — Bộ trạng thái trên màn hình điện thoại:** Bố cục 390 px không tràn ngang, nút thao tác nằm trong chiều rộng màn hình. *Bản QA độc lập.* `preview-mobile-light.png`
- **Hình UX-66.4 — Chế độ tối trên điện thoại:** Kiểm tra tương thích của trạng thái và hành động ở màn hình nhỏ. *Bản QA độc lập.* `preview-mobile-dark.png`

## Cần chụp sau khi có ứng dụng chạy thật (CP67)

Chụp screenshot thực tế từ trình duyệt React với tài khoản demo đã được thiết lập, trước hết ở 6 trang tổng quan và lần lượt trong các tình huống Seed không có bảng điểm, Lumen thiếu đo lường, Atlas tra cứu nguồn, Orion có chỉnh sửa chưa lưu, Pulse lưu thành công, Haven xung đột dữ liệu. Che hoặc ẩn toàn bộ định danh học sinh. Ghi rõ bản build, ngày chụp, kích thước màn hình và trạng thái dữ liệu của ảnh. Không sử dụng điểm số minh họa dưới dạng kết quả thực nghiệm.
