# CP44 — CLA Daylight Contrast Contract

Xuất phát từ CP43 ZIP do người dùng gửi. Không có thay đổi dữ liệu/AI/ML/Firebase.

1. Giải nén ZIP mới thành thư mục dự án (không chồng vào `node_modules` hiện có).
2. Trong dự án, cài dependency theo lockfile: `npm ci` (trên máy có Internet).
3. Chạy `npm run dev`, kiểm tra các trang Seed, Lumen, Atlas, Orion, Pulse, Haven, Nexus ở các trạng thái có/không có dữ liệu.
4. Chạy `node --test tests/cp44-contrast-contract.test.cjs tests/cp43-daylight-spa.test.cjs`.
5. Nếu áp patch ZIP lên source CP43 trước đó, xóa thủ công `src/styles/34-student-observatory.css` và `src/styles/35-cla-spectral-observatory.css`; `src/styles.css` không nạp chúng nữa.

Đã chủ động khóa giao diện ở chế độ **light-only** để loại bỏ trạng thái dark/light xung đột. Đây là một quyết định UX, không thay đổi quyền truy cập dữ liệu. Chi tiết phân tích: `CP44_ROOT_CAUSE_AND_CONTRAST_REPORT.md`.

Lưu ý: screenshot đi kèm là fixture HTML để kiểm tra CSS, không phải screenshot từ ứng dụng kết nối Firebase hoặc hồ sơ học sinh thật.
