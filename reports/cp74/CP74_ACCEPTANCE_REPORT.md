# Biên bản kỹ thuật CP74 — UX Navigation / About / Contact

**Ngày:** 22/11/2026  
**Nguồn:** CP73 nguyên bản, chỉnh trực tiếp.  
**Mục tiêu:** khắc phục các lỗi giao diện được chỉ ra bằng ba ảnh người dùng; không tăng phạm vi AI/ML.

## 1. Chuyển đổi thực hiện

- Thanh tab dùng chung: bỏ dropdown `Phân hệ`, giữ `Mục khác`, không xóa route con hoặc bảo vệ SPA.
- Thiết kế lại thành ngôn ngữ rõ ràng: nền trắng, focus state rõ, active underline, responsive 2 cột mobile.
- Chuẩn hóa nút thao tác và trạng thái lỗi/khôi phục trong Seed và các vùng có button trần.
- About viết lại theo sáu module học sinh; mô tả nghiên cứu thận trọng, không tự nhận mô hình đã kiểm định.
- Contact viết lại có xử lý thực: phân loại vấn đề và mở mailto; không có nút gửi giả, không thêm role giáo viên/phụ huynh.
- QA CP68 chuyển từ dropdown thừa sang link hiển thị trong Seed LearningCircuit.

## 2. Bằng chứng kiểm thử

| Gate | Kết quả | Phạm vi |
|---|---|---|
| CP74 mới | **8/8 PASS** | Điều hướng, CTA, About/Contact, mailto Unicode |
| CP63 + CP68 + CP71 điều hướng | **32/32 PASS** | Test liên quan sau khi cập nhật hợp đồng điều hướng |
| CP73 riêng | **13/13 PASS** | Gate QA MVP trước đó |
| Firestore Rules tĩnh | **15/15 PASS** | Static only; không thay Emulator |
| CSS Chromium độc lập | **8/8 PASS** | 1280/900/390/360 × sáng/tối; contrast và overflow |
| QA CP71 độc lập cập nhật | **4/4 PASS** | Atlas, Lumen, Seed, Orion tại mẫu standalone |
| Cú pháp TS/TSX thay đổi | **7/7 PASS** | transpileModule, chưa phải full typecheck |
| CSS parser | **2/2 PASS** | 48, 49 |
| Demo synthetic | **11/11 PASS** | Deterministic offline, không xác nhận hiệu quả khoa học |
| Layout | **PASS** | 22 tệp bắt buộc |
| Safe packaging tests | **3/3 PASS** | exclusion templates / secrets |
| Full npm test | **CHƯA HOÀN TẤT** | 1.326 TAP `ok` / 0 `not ok` trước timeout; các nhóm cuối chạy riêng PASS |
| Production build | **BLOCKED** | thiếu module `react` và type dependencies; lỗi build ghi trong log |
| Firebase Emulator + React E2E | **CHƯA CHẠY** | không khẳng định UX production đã được xác minh |

Độ tương phản computed từ mẫu CSS ở hai trạng thái được chọn/thông báo lỗi: 8.14–10.69:1 (xem JSON), không phải kiểm toán WCAG toàn trang.

## 3. Các giả định và giới hạn

- Ảnh QA được sinh từ HTML kiểm tra độc lập với CSS sản phẩm, không phải ảnh website chạy React.
- Nội dung email chỉ được tạo thành URI trên máy người dùng; việc gửi phụ thuộc ứng dụng email. Không hề triển khai backend ticketing.
- Thanh tab vẫn giữ nguyên các route/URL và cơ chế guard lưu bản nháp từ CP73.
- Full build/Emulator/E2E là các gate bắt buộc trước khi tuyên bố MVP.

## 4. Kiểm tra tái tạo

Xem `START_HERE_CP74_UX_NAV_ABOUT_CONTACT_20261122.md` và `reports/cp74/CP74_CSS_SMOKE_RESULTS.json`.
