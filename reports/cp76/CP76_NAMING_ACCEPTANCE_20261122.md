# CP76 · Đổi tên tiếng Việt cho không gian học sinh

**Ngày:** 2026-11-22  
**Nền:** CP75 (UX audit)  
**Phạm vi:** tên hiển thị ở thanh tab dùng chung, catalogue module, sơ đồ sáu phân hệ, trang Giới thiệu và hướng dẫn học sinh; không đổi định danh kỹ thuật.

## Thực hiện

- Đổi tên 33 mục trong `studentSubmoduleDirectory`, gồm một mục Haven chưa có route đang ở trạng thái `planned`.
- Đổi tên tab đầu của cả sáu phân hệ; đổi tên ba trong bốn bước nhỏ nhánh du học Atlas và giữ “Trường & chương trình”.
- Thống nhất sáu nhãn tên thương hiệu ở module navigator, catalogue, LearningCircuit, trang About và StudentGuide.
- Giữ nguyên toàn bộ `id`, `href`, `status`, mô tả nguồn, quyền truy cập và dữ liệu; không chỉnh thuật toán hoặc Firestore.
- Cập nhật test UX-V7 vốn phụ thuộc tên marketing cũ; thêm kiểm tra CP76 về đường dẫn và tính nhất quán.

## Kết quả xác minh đã chạy

| Kiểm tra | Kết quả |
|---|---|
| `npm run test:cp76:names` | **9/9 PASS** |
| `npm run test:cp71:unified-nav` | **6/6 PASS** |
| `npm run test:cp74:product-polish` | **8/8 PASS** |
| `npm run test:cp75:ux-audit` | **6/6 PASS** |
| `npm run test:cp62:student-rail` | **9/9 PASS** |
| `node --test tests/ux-v7.test.cjs` | **6/6 PASS** |
| `npm run test:cp53:integrity` | **5/5 PASS** |
| `npm run test:rules:static` | **15/15 PASS** |
| `npm run check:layout` | **PASS** |
| `npm run demo:final` (synthetic) | **11/11 PASS** |
| Kiểm tra cú pháp TS/TSX ở thành phần điều hướng | **PASS** |
| Toàn bộ `npm test`, React production build và Firebase/Browser E2E | **Chưa chạy / chưa nghiệm thu trong CP76** |

**Giới hạn:** test offline không chứng minh React render trên trình duyệt thật hay xác thực các giả thuyết AI/ML. Các tên mô tả định hướng sản phẩm, không đại diện cho phép đo trí tuệ có tính chẩn đoán.

Xem `START_HERE_CP76_VIETNAMESE_TABS_20261122.md` cho đối chiếu chi tiết tên cũ–mới.
