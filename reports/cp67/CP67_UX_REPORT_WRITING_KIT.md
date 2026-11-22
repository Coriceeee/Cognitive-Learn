# CP67 — Bộ nội dung UX để viết báo cáo nghiên cứu

Ngày kiểm tra: 21/11/2026. Mã nguồn kế thừa: CP66 → CP67. Đối tượng giao diện: **học sinh**.

> **Phân loại bằng chứng:** Đây là tài liệu mô tả những thành phần đã có trong mã nguồn và những kiểm thử riêng đã chạy. Ảnh `preview-skip-desktop.png` và `preview-skip-mobile.png` là ảnh QA **môi trường HTML độc lập**, không phải website React/Firebase đang chạy. Không dùng các ảnh này để khẳng định đã nghiệm thu ứng dụng thật. Không dùng số liệu minh họa/synthetic làm kết quả thử nghiệm khoa học.

## Đoạn thuyết minh có thể sử dụng trong báo cáo — thiết kế trải nghiệm

Giao diện Cognitive Learn AI được định hướng theo quy trình học sinh tự quan sát và cập nhật hồ sơ, diễn giải các chỉ số học tập, tham khảo thông tin tuyển sinh, xây dựng kế hoạch, theo dõi tiến độ và chuẩn bị điều kiện học bổng. Sáu không gian Seed, Lumen, Atlas, Orion, Pulse và Haven sử dụng điều hướng theo tác vụ; các mục quan trọng xuất hiện trước, còn nhóm ít dùng được mở bằng mục “Khám phá thêm”. Tại các màn hình nhập liệu, hệ thống phân biệt đầu vào hợp lệ, còn thiếu và cần sửa, đồng thời trình bày trạng thái đồng bộ với Firestore dưới dạng văn bản thay vì chỉ dựa vào màu sắc. Các biểu đồ mức độ đầy đủ đầu vào không được dùng như điểm nhận thức, dự đoán đỗ đại học hoặc bằng chứng khoa học.

Trong CP67, chuyển trang nội bộ tiếp tục sử dụng SPA. Khi học sinh mở một trang chức năng mới, tiêu điểm bàn phím chuyển tới nội dung và tên trang được thông báo cho công cụ hỗ trợ truy cập. Trường hợp thay đổi duy nhất bộ lọc hoặc quốc gia bằng tham số URL, hệ thống giữ vị trí cuộn, không làm người dùng mất chỗ đang đọc. Trang cũng bổ sung liên kết “Bỏ qua điều hướng, đến nội dung”, nhãn tiêu đề tab trình duyệt theo vị trí và quy tắc giảm hiệu ứng chuyển động nếu người dùng đã chọn. Đây là cải tiến khả năng tiếp cận giao diện, **không thay đổi thuật toán AI/ML hay bảo mật phía máy chủ**.

## Bản đồ sáu phân hệ cho phần thiết kế hệ thống

| Phân hệ | Chức năng người dùng nhìn thấy trong luồng UX | Góc chụp khuyến nghị cho báo cáo thực |
|---|---|---|
| Seed | Hồ sơ, bảng điểm và GPA, lịch thi trên giao diện chính, mức độ đủ nguồn dữ liệu | Dashboard, lịch thi và biểu đồ trạng thái nguồn |
| Lumen | Chỉ số thử nghiệm, diễn giải giới hạn, lịch sử thay đổi khi có dữ liệu hợp lệ | Tổng quan, giải thích chỉ số và nhãn dữ liệu thiếu |
| Atlas | Tìm ngành/trường, phương thức tuyển sinh, đối chiếu nguồn, lộ trình tra cứu trong nước/du học | Hành trình bốn bước, biểu đồ độ phủ theo năm **với nguồn và giới hạn** |
| Orion | Dữ liệu mục tiêu, kịch bản học tập, lộ trình | Biểu đồ đầy đủ dữ liệu đầu vào, tình huống còn trống/cần sửa |
| Pulse | Theo dõi tiến độ, báo cáo và hành động; trạng thái lưu | Biểu đồ đầu vào và trạng thái thay đổi chưa lưu |
| Haven | Học bổng, chứng chỉ cần có, ngân sách và kế hoạch cá nhân | Biểu đồ đầy đủ đầu vào, phần điều kiện và chi phí có nguồn |

## Chú thích hình mẫu (chỉ sử dụng sau khi chụp từ website thực)

- **Hình X.** Trang tổng quan Seed với lịch thi và tín hiệu sẵn có của các nguồn dữ liệu cá nhân. Sơ đồ biểu thị mức độ sẵn có của nguồn, không phải xếp hạng năng lực.
- **Hình X+1.** Không gian Atlas: luồng tìm trường/ngành, đối chiếu điều kiện tuyển sinh và nguồn chính thức theo từng năm.
- **Hình X+2.** Không gian Lumen: giải thích các chỉ số thử nghiệm, tình trạng bằng chứng và giới hạn diễn giải.
- **Hình X+3.** So sánh trạng thái đầu vào Orion/Pulse/Haven: hợp lệ, trống và cần sửa; đây không phải dự báo kết quả.
- **Hình X+4.** Điều hướng bằng bàn phím trên website React: liên kết bỏ qua điều hướng, tiêu điểm ở trang mới, thông báo trang hiện tại.
- **Hình X+5.** Giao diện mobile khi truy cập trang chức năng và thay đổi bộ lọc mà không bị tải lại tài liệu.

## Kiểm tra thực tế còn bắt buộc trước khi “khóa” UX

1. Trên máy có mạng/npm: `npm ci --no-audit --no-fund`, `npm run check:dependencies`, `npm run build`, `npm run dev`.
2. Đăng nhập bằng tài khoản kiểm thử **không chứa dữ liệu học sinh thật**, kiểm tra sáu trang `/student`, `/lumen`, `/atlas`, `/orion`, `/pulse`, `/haven`.
3. Chụp website **thật** ở 390px và 1280px; kiểm tra không tràn ngang, tab đang chọn không mất, nhãn biểu đồ và trạng thái trống/lỗi.
4. Dùng bàn phím Tab từ đầu trang và chuyển giữa các phân hệ; thử Back/Forward, thay đổi filter bằng query URL, thử thoát Orion/Pulse/Haven khi chưa lưu, xác minh không mất dữ liệu.
5. Kiểm chứng với Firebase Emulator trước khi dùng tài khoản/nguồn thật; không gọi bộ demo synthetic là kết quả khoa học.
6. **Chế độ tối:** `index.html` trong bản hiện tại cố định light mode từ CP44 do thiếu kiểm toán tương phản toàn hệ thống; ảnh tối CP63–CP66 chỉ là QA CSS thành phần. Chưa đánh dấu dark mode website là hoàn thiện.

## Kết luận phạm vi CP67

**Đã làm ở mức mã nguồn + test offline:** hệ thống điều hướng có trọng tâm của CP63; biểu đồ đầu vào CP64; hành trình Atlas/Lumen CP65; trạng thái xác minh CP66; cải thiện scroll/focus/a11y CP67.

**Chưa chứng minh được:** build production thành công, website React/Firebase đang chạy, thao tác thực tế đầy đủ trên sáu phân hệ, E2E đa tài khoản, độ tương phản toàn trang và dark mode website. UX có thể **chốt nội dung thiết kế để viết báo cáo bản thảo**, nhưng **chưa thể tuyên bố đóng nghiệm thu UX sản phẩm**.
