# CLA CP36 — Full source (gốc ZIP)

CP36 kế thừa CP35, có `package.json`, `package-lock.json`, `vite.config.ts`, `index.html`, `src/`, `api/`, `tests/`, `research/` ngay gốc ZIP.

**Cách dùng khuyến nghị:** giải nén vào thư mục mới, không copy nhầm `index.html` vào `package.json`.

```powershell
cd "C:\Gạo\CLA-CP36"
node -e "const p=require('./package.json'); console.log(p.name, p.scripts.dev)"
npm ci
npm run verify:cp36:static
npm run build
npm run dev
```

Trang kiểm tra:
- `/student`: dashboard với sáu module chính.
- `/student/modules`: **tìm nhanh công việc**, không còn bảng chọn sáu module lần hai.
- `/atlas/sources`: 10 trường có nguồn, 24 bản ghi theo năm và biểu đồ mức độ đầy đủ nguồn.
- `/atlas/vietnam`: tra nguồn năm/phương thức.
- `/haven/scholarships`: 7 học bổng đại học có nguồn, lọc theo nước và tự đánh dấu hồ sơ.
- `/atlas/study-abroad`: tra 249 điểm đến, 7 điểm đến có lộ trình nguồn ban đầu.

Không chia sẻ `.env` hoặc khóa bí mật. Các thông số ngày/điều kiện học bổng chỉ được xem là có nguồn tham khảo, không tự chứng nhận hồ sơ đủ điều kiện. Không deploy Firestore Rules trước khi chạy Emulator.

Chi tiết: `CP36_RELEASE_NOTES_20261111.md`, `CP36_TEST_REPORT_20261111.md`, `CP36_P1_OUTSTANDING_20261111.md`.
