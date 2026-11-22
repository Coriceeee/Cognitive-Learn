# CP64 — Bộ mô tả UX dùng khi viết báo cáo NCKH

> Trạng thái: mã nguồn và kiểm thử offline. **Không gọi các ảnh dưới đây là ảnh chụp website React hoạt động**. Các giá trị trong ảnh hoàn toàn là **minh họa bố cục**.

## Đề xuất mục báo cáo: Thiết kế giao diện tương tác với dữ liệu đầu vào

**Nội dung có thể đưa vào báo cáo (mô tả công việc thực sự đã triển khai):**

> Sau khi thống nhất hệ thống điều hướng theo tác vụ ở sáu phân hệ, nhóm triển khai một thành phần trực quan dùng chung cho Orion, Pulse và Haven. Thay vì chỉ hiển thị các biểu mẫu hoặc kết quả, màn hình tổng quan thể hiện các ô dữ liệu đầu vào ở ba trạng thái: đã nhập hợp lệ, còn trống và chưa hợp lệ. Các dải tín hiệu phân nhóm theo chức năng học tập, thời gian, quyết định và tài chính. Người dùng có thể chuyển trực tiếp đến biểu mẫu nhập; liên kết tới trang kết quả chỉ xuất hiện khi thỏa điều kiện đầu vào của từng phân hệ. Hệ thống phân biệt rõ **độ đầy đủ của biểu mẫu** với **chỉ số năng lực, kết quả mô phỏng hay hiệu quả học tập**. Thành phần sử dụng cấu trúc HTML có nhãn hỗ trợ tiếp cận, đồng thời có phương án hiển thị desktop sáng, tối và điện thoại.

## Chú thích hình đề xuất

- **Hình UX-CP64.1 — Đường tín hiệu dữ liệu đầu vào Orion (desktop):** bản kiểm tra bố cục độc lập dựng trực tiếp từ `ModuleInputObservatory.tsx`, hiển thị dữ liệu minh họa; không phản ánh kết quả học tập của người thật. Ảnh: `preview-desktop-light.png`.
- **Hình UX-CP64.2 — Cùng thành phần trên nền tối:** bản kiểm tra tương phản và tính nhất quán phong cách; Ảnh: `preview-desktop-dark.png`.
- **Hình UX-CP64.3 — Dạng điện thoại:** cách các dải biểu đồ, chú giải và nút thao tác co giãn khi màn hình hẹp; Ảnh: `preview-mobile-light.png`.

## Điểm kỹ thuật có thể trình bày với hội đồng

1. `inspectModuleInputs` đọc đúng trạng thái giá trị thật do người dùng nhập; dữ liệu trống không được diễn giải thành điểm 0. Giá trị nằm ngoài thang được xếp là **cần sửa**, không cộng vào số liệu đã hoàn thiện.
2. Orion có các nhóm điểm hiện tại, mục tiêu và khoảng thời gian/định hướng; Pulse có theo dõi Lumen, chiến lược và thời gian; Haven có thông tin học tập và đầu vào hỗ trợ.
3. Liên kết tới biểu đồ mô phỏng tiếp tục dùng logic điều kiện hiện có (`hasInputs`), không coi số lượng ô đã nhập là điều kiện đủ cho mọi phân tích.
4. Thành phần dùng đường dẫn `<a>` nên duy trì cơ chế SPA và bộ chặn điều hướng khi còn bản nháp chưa lưu.
5. Có nhãn giải thích, `role="meter"`, `aria-valuenow`, `role="status"`, độ tương phản theo theme, hỗ trợ focus bằng bàn phím và tùy chọn giảm chuyển động.
6. Trình kiểm tra fingerprint của bản phát hành đã mở rộng theo dõi tất cả CSS trong `src`, tránh tình trạng thay đổi giao diện nằm ngoài dấu vân tay nguồn.

## Giới hạn cần ghi trong báo cáo

- Các ảnh CP64 **không phải kiểm thử website React/Firestore E2E**. Ảnh được dựng từ TSX thực tế thông qua bộ chuyển JSX thành DOM độc lập, sử dụng cùng CSS, nhưng không chạy toàn bộ ứng dụng.
- Thang ô hoàn thiện thể hiện **tình trạng nhập liệu**. Không dùng biểu đồ này để tuyên bố cải thiện năng lực nhận thức, dự báo trúng tuyển, hiệu quả can thiệp hoặc xác suất nhận học bổng.
- Kiểm thử offline và tổng hợp test chỉ xác minh các hợp đồng/logic đã thực thi; nghiệm thu khoa học và bảo mật runtime cần môi trường bổ sung.
- UX các trang Atlas/Lumen và ảnh từ website React thực sự sẽ hoàn thiện ở các giai đoạn UX tiếp theo, trước khi chốt bộ ảnh dùng trong báo cáo.

## Cách lấy ảnh website thật khi môi trường đầy đủ

1. Cài đúng phiên bản phụ thuộc trong `package-lock.json` bằng `npm ci` (chỉ trong môi trường được phép kết nối).
2. Cấu hình Firebase test an toàn; không đưa khóa riêng hoặc thông tin học sinh thật vào ZIP.
3. Chạy ứng dụng trên browser thật, tạo hồ sơ kiểm thử đã đồng ý và chỉ dùng dữ liệu giả được ghi rõ.
4. Chụp lại các route `/orion`, `/pulse`, `/haven` desktop/mobile cùng trạng thái chưa nhập và thiếu/invalid.
5. Đối chiếu ảnh runtime với ảnh QA CP64; thay ảnh QA bằng ảnh runtime nếu dùng làm bằng chứng triển khai ứng dụng.
