# CLA — Bước 05A: Seed Profile numeric input validation

**Source base:** CP37 + bản vá Lumen bước 02 + Atlas bước 03–04. Bản này không tự nhận là nguồn GitHub/production mới nhất trên máy người dùng.

## Phạm vi nhỏ (KHÔNG sửa nhiều module)

- Chỉnh đúng **1 file source đang có**: `src/page/seed/StudentProfilePage.tsx` để kiểm tra dữ liệu số ngay trước thao tác ghi Firestore.
- Thêm **1 helper mới**: `src/page/seed/services/profileInputValidation.ts` để không lặp rải rác điều kiện ở UI.
- Thêm **1 bài kiểm thử mới**: `tests/step05a-seed-input-validation.test.mjs`.
- Giữ nguyên schema, Firestore Rules, GPA engine, công thức Lumen, Orion, Atlas và Haven.

## Hành vi mới

- Không cho ghi tỷ lệ phần trăm ngoài khoảng 0–100; số giờ học trên 168 giờ/tuần; số lần/đề luyện không nguyên hoặc âm; ngân sách/học phí âm, lỗi định dạng hoặc số không hữu hạn.
- Phân biệt số `0` hợp lệ với dữ liệu bị thiếu; hai trường tài chính là tùy chọn.
- Hiện thông báo lỗi và dừng trước `writeBatch()` nếu giá trị không hợp lệ.
- Vẫn tuân thủ form cũ (8 trường hành vi bắt buộc); **chưa cải tiến UX nhập liệu hoặc thay đổi tiêu chí nghiên cứu**.

## Phạm vi chưa thực hiện

- Chưa chạy Firebase Emulator, browser E2E hay thử lưu/tải dữ liệu trên tài khoản thực.
- Chưa hoàn tất nhiệm vụ kiểm tra Seed từ đầu tới cuối; đây chỉ là nhánh 05A kiểm tra dữ liệu đầu vào.
- Test CP30 về thứ tự import CSS lỗi từ nền CP37, không sửa ngoài scope.

## Cách chạy

```powershell
node --experimental-strip-types --test tests/step05a-seed-input-validation.test.mjs
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs
npm run build
npm run dev
```
