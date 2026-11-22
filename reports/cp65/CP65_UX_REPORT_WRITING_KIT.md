# CP65 — UX Atlas & Lumen: nội dung dùng trong báo cáo NCKH

**Phạm vi:** CP65 được xây trực tiếp trên CP64, chỉ thay đổi trình bày và điều hướng của Atlas và Lumen. Không mở rộng kho tuyển sinh, không huấn luyện/thẩm định ML và không triển khai production.

## 1. Đoạn mô tả thiết kế có thể trích dẫn

**Atlas — Hành trình quyết định có truy xuất nguồn.** Giao diện tổng quan Atlas được tổ chức thành chuỗi tác vụ: (1) tìm nguồn chính thức, (2) lọc ngành/trường/phương thức, (3) đối chiếu những bản ghi có căn cứ, và (4) chuẩn bị nguyện vọng. Bên dưới là biểu đồ thanh về **số bản ghi điểm công bố đã nhập trong kho** theo ba năm 2024–2026. Biểu đồ dùng số lượng bản ghi thực sự có trong registry của mã nguồn, không ngoại suy trường thiếu và không tự suy ra chất lượng tuyển sinh hay tỷ lệ đỗ. Người dùng được nhắc xem nguồn tuyển sinh và phương thức tương ứng trước khi sử dụng dữ liệu.

**Lumen — Đọc dữ liệu theo thứ tự nhận thức đúng.** Giao diện tổng quan Lumen đưa học sinh đi qua bốn bước quan sát, diễn giải, theo dõi, hành động. Dải tác vụ hiển thị trạng thái phụ thuộc vào dữ liệu hiện có: phép đo thiếu không trở thành điểm 0; tính năng diễn giải được gắn điều kiện `scoreAvailable`; lịch sử chỉ được nhận là có dữ liệu khi đã hết trạng thái xác minh và tồn tại cặp đo phù hợp. Biểu đồ Signal Atlas (đã tồn tại trong ứng dụng) được chuyển lên tổng quan để người học nhìn thấy radar và độ bao phủ trước khi mở phần nhận xét.

**Điều hướng và khả năng tiếp cận.** Thanh tab Atlas được đẩy lên đầu workspace để không phải cuộn qua phần giới thiệu. Các phần mới hỗ trợ keyboard focus, độ tương phản sáng/tối, bố cục desktop/mobile, giảm chuyển động và in báo cáo.

## 2. Chú thích hình đề xuất

- **Hình CP65-1 — Atlas, desktop:** Hành trình bốn bước và biểu đồ kiểm kê bản ghi 2024–2026; dữ liệu **minh họa** trong ảnh QA, khác với số bản ghi runtime.
- **Hình CP65-2 — Atlas, mobile:** Cấu trúc tác vụ chuyển từ bốn cột sang một cột, nhãn và liên kết được giữ nguyên.
- **Hình CP65-3 — Lumen, desktop:** Lộ trình quan sát–diễn giải–theo dõi–hành động từ thành phần React thực, dữ liệu đầu vào **minh họa**.
- **Hình CP65-4 — Lumen, mobile:** Tình trạng thiếu phép đo và các hành động bổ sung hồ sơ giữ khả năng đọc.

Tệp ảnh: `reports/cp65/preview-atlas-desktop-light.png`, `preview-atlas-desktop-dark.png`, `preview-atlas-mobile.png`, `preview-lumen-desktop-light.png`, `preview-lumen-desktop-dark.png`, `preview-lumen-mobile.png`.

**Bắt buộc khi đưa vào báo cáo:** Các ảnh trên được chụp bằng Chromium từ HTML dựng lại **trực tiếp hai TSX component** với **fixture minh họa** và CSS CP65 thực. Đây là bằng chứng QA bố cục độc lập, **không phải ảnh website React/Firebase đang chạy**. Muốn gắn nhãn “Ảnh giao diện ứng dụng vận hành”, cần build, chạy app và chụp lại từ URL staging/localhost. Không trình bày số bản ghi trong fixture như dữ liệu tuyển sinh thật.

## 3. Điều mới so với CP64

| Tính năng | CP64 | CP65 |
|---|---|---|
| Atlas tổng quan | Hero dài và sơ đồ luồng tĩnh | Dải tác vụ 4 bước + chart kiểm kê theo năm |
| Atlas so sánh | Biểu đồ lịch sử nằm trong `<details>` | Biểu đồ hiện trực tiếp tại tab so sánh |
| Atlas tab | Dưới nội dung hero | Đầu workspace |
| Lumen tổng quan | Giới thiệu và điểm trạng thái | Hành trình đọc dữ liệu + Signal Atlas thật |
| Lumen thiếu dữ liệu | Chủ yếu qua tab con | Thể hiện ngay trong lộ trình, không tự gán điểm |

## 4. Ranh giới nghiên cứu

- Số lượng bản ghi điểm đã nhập **không phải** độ bao phủ các trường hoặc năng lực dự báo.
- Biểu đồ radar Cognitive là các proxy thử nghiệm, **không phải** kết quả thẩm định tâm trắc.
- Nhãn “Có dữ liệu” **không phải** đánh giá học sinh đạt/không đạt; không chẩn đoán tâm lý.
- UX kiểm tra offline không chứng minh tương thích Firestore và Firebase Emulator ở production.

## 5. Việc cần chụp khi website build được

1. Trên môi trường staging, mở `/atlas` (nội dung & tab), `/atlas/compare` (biểu đồ), `/lumen` (journey & Signal Atlas), `/lumen/indices` và `/lumen/history`.
2. Kiểm tra tài khoản chưa có dữ liệu và tài khoản test có dữ liệu đã xác minh. Không dùng dữ liệu học sinh thật để chụp ảnh công khai.
3. Ghi kích thước màn hình, ngày chụp, phiên bản CP65, tình trạng Firebase và hình ảnh tương ứng cho báo cáo.
4. Chỉ đóng UX sau khi browser E2E và responsive thực tế thông qua; hiện trạng chính thức vẫn là **chưa nghiệm thu**.
