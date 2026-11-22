# CP78 · Kiểm toán UX tập trung: màu, độ rõ ràng và nội dung lặp

**Đầu vào:** CP77, yêu cầu không đổi bố cục, tránh rối cho học sinh mới, bỏ các nội dung thực sự trùng lặp trong cùng phân hệ, đồng bộ sáu tên tiếng Việt CP76.

## Quyết định thay đổi

- **Không thay:** khung trang, vị trí module, sơ đồ quỹ đạo, lưới chỉ số, cấu trúc tab, URL, ID, schema, thuật toán, lưu hồ sơ, dữ liệu, rào an toàn.
- **Thay màu tại các tệp CSS hiện có:** `37-cla-orbital-theme.css`, `38-cla-daylight-studio.css`, `40-cla-exam-horizon-learning-circuit.css`, `48-cla-unified-navigation.css`, `49-cla-product-polish.css`. Nền sáng tươi nhẹ; màu nhấn sáu phân hệ có tương phản cho chữ; không tạo CSS layer số 50.
- **Giữ một điểm điều hướng sáu phân hệ trong SEED:** sơ đồ LearningCircuit. Bỏ hàng sáu lối tắt trong StudentJourneyBridge nhưng giữ khối đề xuất bước tiếp theo dựa trên dữ liệu từ máy chủ. Bỏ thêm lối tắt bảng điểm trùng tab.
- **LUMEN:** thay nhãn trạng thái lỗi/trống đang trùng h1; nội dung cảnh báo và hướng dẫn tạo hồ sơ vẫn đủ.
- **ATLAS:** bỏ hai nút ở hero trùng với tab `/atlas/vietnam`, `/atlas/subjects`, giữ thanh tab và hành trình tra cứu có thông tin khác biệt.
- **HAVEN:** công cụ tra nguồn web không bị xóa, chỉ nằm trong phần tự mở sau thư viện học bổng để tránh hiển thị hai bộ tìm kiếm một lúc.
- **ORION / PULSE:** không xóa các biểu mẫu và biểu đồ chỉ vì cùng nhắc tới một chỉ số. Đó là các tác vụ *nhập → mô phỏng → theo dõi* khác nhau; xóa sẽ làm hỏng luồng.
- **Người mới:** trang hướng dẫn dùng câu ngắn, nói rõ bước đầu tiên; chỉ Admin mới thấy nội dung demo Admin. Ba hero có nhãn mức sẵn sàng ghi rõ là *tham khảo*.
- **Tên hiển thị:** SEED · Bản sắc học tập; LUMEN · Dấu vân tay trí tuệ; ATLAS · Bản đồ tương lai; ORION · Kiến trúc tương lai; PULSE · Đường cong tiến hóa; HAVEN · Hành trang thế giới. Giữ tên Anh làm mã kỹ thuật, route như cũ.

## Tại sao không xóa thêm?

- **ATLAS** thanh tab khác với sơ đồ quy trình bốn bước có ngữ cảnh nguồn; học sinh cần được giải thích việc gì làm trước.
- **ORION** biểu mẫu xuất hiện ở tab nhập và trong disclosure `Xem/chỉnh` của màn mô phỏng, nhưng trên mỗi màn chỉ có một phiên biểu mẫu, không phải hai hộp giống nhau mở cùng lúc.
- **PULSE** trang dữ liệu tự nhập, nhật ký hành động và báo cáo là các chức năng riêng.
- **HAVEN** tìm kiếm trong thư viện đã kiểm nguồn và tìm kiếm web nguồn công khai có phạm vi khác nhau, nên giữ mục nâng cao và tránh tuyên bố nguồn chưa xác minh là chắc chắn.

## Bằng chứng kiểm tra

- Bài test nguồn CP78 `tests/cp78-clarity-palette-dedupe.test.mjs`: 7/7 PASS.
- Test CP70 hồi quy được cập nhật theo quyết định loại điều hướng trùng, không thay quy tắc dữ liệu server-confirmed; 19/19 PASS.
- Kiểm tra CSS độc lập Chromium: 6 phân hệ × 4 kích thước (390, 768, 1024, 1440px) = **24/24 PASS**. Kiểm tra màu thực tế theo computed style, chữ tab chọn contrast >=4.5:1, không tràn ngang, tên sơ đồ không bị cắt. **Đây không phải browser E2E React**.
- Kiểm tra cú pháp TSX các tệp thay đổi bằng TypeScript parser: PASS. `npm run check:layout` PASS. `npm run test:rules:static` 15/15 PASS. `npm run demo:final` 11/11 offline synthetic PASS.
- Không chạy được build production React, Firebase emulator hoặc end-to-end trên website thật trong môi trường thiếu 19 dependency. Không tuyên bố đã nghiệm thu người dùng hoặc 47 route live.

## Việc cần nghiệm thu khi có môi trường đủ dependency

1. Load app thật, đăng nhập học sinh tổng hợp có sự đồng ý; kiểm tra 6 module và mọi route theo ma trận CP75.
2. Ở màn hình rộng/nhỏ, tab được chọn đúng, không che nút, không tải lại toàn trang bất ngờ.
3. Kiểm tra lưu/khôi phục dữ liệu, nhiều thiết bị, trạng thái lỗi và các trang mở rộng (Atlas nguồn / Haven tra cứu).
4. Thử với học sinh chưa từng dùng CLA (5–8 người): yêu cầu tạo hồ sơ, xem chỉ số, tìm ngành, lập kế hoạch mà không có hướng dẫn trực tiếp. Đo tỷ lệ hoàn thành và nơi bị mắc.
5. Đối chiếu screenshot thật với screenshot CSS độc lập; sửa nếu cascade từ các tệp cũ tạo khác biệt.

**Ghi chú:** các công cụ nghiên cứu, chỉ số nhận thức, dự báo hay chỉ số sẵn sàng vẫn mang tính thử nghiệm, không dùng việc đổi màu làm bằng chứng kiểm định khoa học.
