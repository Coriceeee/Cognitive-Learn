# CLA CP63 — UX FIRST / 2026-11-21

**Tập trung UX theo yêu cầu người thực hiện NCKH.** Kế thừa đủ mã nguồn CP62; không thay đổi thuật toán, Firebase Rules, nguồn tuyển sinh hoặc số liệu khoa học. Không coi đây là một bản production.

## Thay đổi chức năng nhìn thấy được

- Bộ điều hướng chung của **Seed, Lumen, Atlas, Orion, Pulse, Haven** giờ có ba mục truy cập nhanh ngoài Tổng quan, thay vì dàn toàn bộ tab thành một dãy dài.
- Khi mở sâu một chức năng, tên chức năng vẫn hiện trong danh sách truy cập nhanh; mục khác chuyển vào `Khám phá thêm`, không bị bỏ.
- Có `Trước / Tiếp theo` theo thứ tự điều hướng của mỗi phân hệ.
- Có bộ chuyển sáu phân hệ gọn trong `Chuyển phân hệ`; không trộn chức năng Admin vào menu học sinh.
- Bố cục hai cột cho màn hình <=860px, ngăn việc mục đang chọn bị cắt khỏi vùng nhìn.
- Đồng bộ theme light/dark, focus-visible, giảm chuyển động, bố cục in.

## Cấu trúc thay đổi

- `src/lib/moduleWayfinding.ts`: hàm lập sơ đồ điều hướng thuần dữ liệu, không đo học lực.
- `src/components/common/ModuleSectionNav.tsx`: giao diện điều hướng chia lớp.
- `src/styles/42-cla-guided-workspaces.css`: thiết kế sáng/tối và responsive.
- `tests/cp63-guided-workspaces.test.mjs`: 18 kiểm thử logic/contract.
- `tools/cp63_guided_preview.mjs` + `tools/cp63_ux_visual_qa.py`: tạo & kiểm tra ảnh bố cục độc lập.
- `reports/cp63/CP63_UX_REPORT_WRITING_KIT.md`: đoạn mô tả và chú thích ảnh thích hợp dùng trong báo cáo NCKH.

**Không tuyên bố:** UX đã hoàn tất toàn website, E2E production, khả năng chính xác của AI, hoặc các chỉ số tăng trưởng của học sinh.
