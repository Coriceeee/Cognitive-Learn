# Gợi ý mô tả CP70 trong báo cáo NCKH

## Có thể mô tả dựa trên mã nguồn

- **Thiết kế hành trình sáu phân hệ dành cho học sinh:** Seed (hồ sơ học tập), Lumen (phân tích), Atlas (ngành/trường), Orion (lập kế hoạch), Pulse (nhật ký thực hiện), Haven (học bổng/tài chính).
- **Điều hướng theo trạng thái chu kỳ:** Hồ sơ chưa hoàn chỉnh → Seed; chưa khởi tạo chu kỳ → Orion; đang thực hiện → Pulse; đã có check-in và cần đánh giá lại → Pulse; sau tổng kết → Lumen để xem căn cứ trước khi lập chu kỳ mới.
- **Ranh giới dữ liệu:** Chỉ trình bày chu kỳ được xác nhận bởi Firestore server và trùng UID, document ID; ẩn dữ liệu cache/pending. Tài khoản mới vẫn truy cập đường dẫn tạo hồ sơ mà không phụ thuộc kết nối kho chu kỳ.
- **Minh bạch khoa học:** Dữ liệu hoạt động theo tuần trong chu kỳ là học sinh tự báo cáo; xác nhận bản ghi máy chủ không chứng minh độ đúng thực tế hoặc hiệu quả nhân quả.

## Chú thích hình đề xuất sau khi có ảnh React thật

**Hình X.** Màn hình tổng quan Seed trình bày hành trình sáu phân hệ và chức năng chuyển tác vụ tiếp theo theo trạng thái chu kỳ đã được đồng bộ từ Firestore.

**Hình Y.** Trạng thái bảo vệ dữ liệu khi Firestore chưa xác nhận chu kỳ, không hiển thị dữ liệu từ cache như kết quả chính thức và chưa mở thao tác cập nhật chu kỳ.

**Hình Z.** Luồng Orion → Pulse → Lumen: xác lập kế hoạch, ghi nhận hoạt động tự báo cáo, xem đánh giá lại và hạn chế diễn giải khoa học.

## Không được khẳng định trước khi có bằng chứng mới

- Đã vận hành trọn vẹn sáu module trên website React/Firebase production.
- Dữ liệu tuyển sinh có độ phủ toàn quốc đầy đủ hoặc học bổng được cập nhật trực tiếp hoàn toàn.
- Chu kỳ nâng cao thành tích học sinh hoặc dự đoán xác suất đỗ trường chính xác.
- Kiểm thử Emulator, bảo mật sản xuất, browser E2E đã PASS khi mới có test offline.

**Danh mục ảnh cần chụp trên React QA:** Desktop Seed hành trình 6 phân hệ; mobile Seed; Orion tạo chu kỳ; Pulse check-in; Lumen evidence; trạng thái mất mạng/cache; chuyển tài khoản; Atlas/Haven liên kết. Để ảnh cùng phiên bản nguồn và dữ liệu thử nghiệm tổng hợp, không lộ PII.
