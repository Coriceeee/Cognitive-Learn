# BẮT ĐẦU — CLA STEP05A FULL SOURCE

Đây là ZIP **trọn source**, giữ nguyên thư mục `src/`, `tests/`, `public/`, `api/`, `research/`, `docs/` và cấu hình dự án CP37; đã gộp **Lumen Step02 + Atlas Step03/04 + Seed Step05A**.

## CHÉP NHANH (Windows)

1. Sao lưu `C:\Gạo\Cognitive-Learn` trước khi thay.
2. Giải nén ZIP ra **thư mục tạm**. Trong thư mục vừa giải nén nhìn thấy `src/`, `tests/`, `package.json` ngay ở cấp đầu tiên.
3. Mở thư mục tạm và thư mục `C:\Gạo\Cognitive-Learn` cạnh nhau.
4. Chép **`src/` và `tests/`** từ ZIP vào dự án, chọn thay file trùng. Không xóa file khác. Chỉ làm vậy nếu dự án đang ở nền CP37 / các bản vá 02–04 tương ứng.
5. **Không chép đè** `.env`, `.env.local`, `node_modules`, cấu hình Firebase đang chạy, hoặc thay Rules production.
6. Chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
node --experimental-strip-types --test tests/step05a-seed-input-validation.test.mjs
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs
npm run build
npm run dev
```

Nếu `npm run build` lỗi, gửi nguyên thông báo, không cài lại từ đầu khi chưa biết nguyên nhân.

## Ghi chú nghiệm thu

- Bước 05A là lớp chặn số liệu sai trước khi lưu, **không phải nghiệm thu toàn bộ Seed**.
- Bước 05B sẽ đánh giá đọc/ghi hồ sơ và GPA thật với Firebase và trình duyệt.
- Xem `STEP05A_PROGRESS_REPORT_20261112.md` và `STEP05A_SOURCE_DIFF.patch` để biết đúng những gì đã sửa.
