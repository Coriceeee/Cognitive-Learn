# CLA CP80 — Bản đầy đủ đã sửa lỗi được xác định và kèm bộ nghiệm thu

**Nguồn:** `Cognitive-Learn-CP79-Gradient-Sang-20261122.zip`. **Ngày:** 22/11/2026.

## Cách chạy trên Windows (khuyến nghị dùng thư mục sạch)

1. Giải nén toàn bộ ZIP này vào **thư mục mới**, không chép đè thư mục CLA đang dùng. Thư mục dự án con là `Cognitive-Learn`.
2. Mở PowerShell tại thư mục `Cognitive-Learn` (nơi có `package.json`).
3. Tắt các phiên Vite / Node đang giữ tệp cài đặt trong dự án trước khi chạy.
4. Chạy: `./CHAY_NGHIEM_THU_CP80.cmd` (trong PowerShell có thể dùng `.\CHAY_NGHIEM_THU_CP80.cmd`).
5. Xem `reports/acceptance/CLA_CP80_YYYYMMDD-HHMMSS/SUMMARY.md`, `status.csv`, `status.json`, `logs/`.

Script không deploy, không sửa tên phân hệ, không đọc dữ liệu học sinh thật. Nó kiểm tra dependencies rồi `npm ci` nếu thiếu; nếu Windows báo `EPERM`, đóng các tiến trình Vite/Node và chạy lại từ **thư mục sạch**. Không vô hiệu hóa Defender, không xóa package-lock hay mã nguồn. CMD dùng PowerShell ExecutionPolicy Bypass **chỉ cho tiến trình chạy script**; nếu máy tính áp chính sách quản trị tổ chức, cần xin phê duyệt.

**Chạy nhóm test đơn lẻ để không bị che lỗi:**

```powershell
python tools/acceptance_cp80_batch.py --start 0 --end 111
```

## Mã nguồn được sửa

- `src/lib/useDailyCompanion.ts`: sửa biến `current` dữ liệu đè lên hàm kiểm tra phiên `current()`, xử lý 7 lỗi TS2349/TS2448/TS2454 đã được báo.
- `tests/student-role-isolation.test.cjs`: cập nhật 3 tên mới đã được khóa; không đổi text UI.
- `tests/step09-ptit-official-pathways.test.cjs`: kiểm tra điều hướng Atlas tại thanh module thay vì đòi nút hero trùng lặp.
- `tests/step17-exam-reminders.test.mjs`: kiểm tra `Những cột mốc` tại đúng đường dẫn.
- `tests/cp31-batch4-evidence.test.mjs`, `tests/cp31-batch17-demo-backup.test.mjs`, `tests/cp31-batch8-golden-path.test.mjs`, `tests/cp31-batch9-evidence-integrity.test.mjs`: sửa giả định sai về SHA của source CP31 trên nhánh CP80, **không thay mã băm lịch sử**; luồng phát hành/demo CP31 vẫn từ chối nhận bản CP80 là CP31.
- `tests/cp80-regressions.test.cjs`: thêm 4 kiểm thử chống tái phát.

## Kết quả đã thực chạy trong môi trường này

- **111/111 lệnh con của `npm test` chạy độc lập: PASS**, có CSV và log theo lệnh trong `reports/acceptance/CP80/independent-tests/`.
- 4/4 hồi quy CP80: PASS.
- `check:layout`: PASS.
- `test:rules:static`: 15/15 PASS.
- `test:rules:v5:static`: 51/51 PASS. Chúng là test tĩnh, **không thay thế Firebase Emulator**.
- Nghiên cứu Python: OULAD 13/13, Cognitive 18/18, Adaptive 18/18, VNHSGE 4/4, Research general 24/24: PASS. Bộ này không xác nhận hiệu quả thực tế trên học sinh Việt Nam.
- **`npm ci --offline`: BLOCKED** vì môi trường không có gói `yargs-parser` trong cache (`ENOTCACHED`); chưa có `node_modules`, do đó **production build chưa được kiểm tra thành công** tại đây. Không được báo PASS.
- `npm run demo:gate` phiên bản CP31: **FAIL (chặn lịch sử)** tại bước tạo bằng chứng với SHA CP31, vì source hiện là CP80. Không sửa lịch sử hoặc làm giả bằng chứng CP31; cần tạo bộ nghiệm thu và bằng chứng phát hành cho bản CP80 riêng.
- Browser QA thật, Firebase Emulator, dữ liệu nghiên cứu có phép, CI/CD, production: **NOT VERIFIED**.

> Không gọi CP80 "đạt 100% nghiệm thu" hoặc "đã sẵn sàng giải Nhất tỉnh" trước khi các cổng bắt buộc ở trên có bằng chứng PASS. Bản ZIP là toàn bộ mã nguồn đã sửa các lỗi cụ thể tìm thấy, **không phải khẳng định mọi lỗi tiềm ẩn trong sản phẩm đã biến mất**.

## Các bước cần chạy khi môi trường đã sẵn sàng

```powershell
npm ci --no-audit --no-fund
npm run check:layout
npm run build
npm test
npm run test:rules:emulator
.\CHAY_NGHIEM_THU_CP80.cmd
```

Không chạy emulator với dữ liệu/credentials production. Script tổng hợp đã ghi log và sẽ báo BLOCKED khi thiếu yêu cầu môi trường.
