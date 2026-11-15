# COGNITIVE LEARN AI — BÁO CÁO SAU BƯỚC 05A (12/11/2026)

## Phạm vi duy nhất

Nền: `CLA_CP37_FULL_SOURCE_GOP_BUOC02_04_20261112.zip`, giữ nguyên toàn bộ thay đổi bước 02–04.

Bước 05A của Seed Profile: kiểm soát **10 trường số hành vi/tài chính** tại ranh giới trước khi ghi Firestore; không sửa công thức tính GPA, tính chỉ số nhận thức, cấu trúc Firestore, rules hoặc các module khác. Form vốn bắt buộc 8 trường hành vi; bản vá kiểm tra cả khi giá trị bị chỉnh qua code thay vì qua UI.

### File thay đổi so với ZIP nền bước 02–04

- **Sửa 1 file:** `src/page/seed/StudentProfilePage.tsx` — gọi validator trước `writeBatch()`.
- **Thêm 1 file source:** `src/page/seed/services/profileInputValidation.ts` — chuẩn hóa kiểm tra dữ liệu số.
- **Thêm 1 file test:** `tests/step05a-seed-input-validation.test.mjs`.
- **Không có file nào bị xóa.** Các file hướng dẫn/báo cáo mới không ảnh hưởng runtime.

### Hành vi được kiểm tra

- Chặn các tỷ lệ phần trăm ngoài [0,100], giờ học >168/tuần, số lần/đề luyện âm hoặc thập phân, ngân sách/học phí âm, định dạng số lỗi, `Infinity`, ký hiệu khoa học.
- Giá trị `0` được giữ là giá trị quan sát hợp lệ; ô tài chính bỏ trống được giữ là thiếu dữ liệu.
- Khi sai đầu vào: hiển thị thông báo và không thực hiện ghi hồ sơ/bảng điểm/snapshot.

## Bằng chứng kiểm thử trong môi trường đóng gói

| Kiểm tra | Trạng thái |
|---|---|
| Test Seed 05A | **9/9 PASS** |
| Test Atlas 03–04 | **18/18 PASS** |
| Academic calculation | **14/14 PASS** |
| Cognitive observation | **4/4 PASS** |
| Admissions & chat | **25/25 PASS** |
| Scientific visuals | **13/13 PASS** |
| CP35 contract | **8/8 PASS** |
| CP37 guide | **4/4 PASS** |
| Static Firestore Rules | **15/15 PASS** |
| Module hierarchy / student role isolation / layout | **PASS** |
| TypeScript mới (`profileInputValidation.ts`) strict standalone | **PASS** |
| TS/TSX syntax 2 file liên quan | **PASS** |
| `npm test` toàn bộ | **FAIL** ở assertion CP30 về stylesheet import cuối của CP36; lỗi tồn tại ở nền CP37, chưa sửa ngoài phạm vi |
| `npm run build` trong môi trường đóng gói | **CHƯA PASS**: không có `node_modules`, tsc thiếu React/Firebase types; máy Windows có dependencies mới là môi trường nghiệm thu |
| Browser E2E / Firebase Emulator / tính đúng dữ liệu thực | **CHƯA CHẠY** |

**Không khẳng định nghiệm thu sản phẩm từ test tĩnh.** Bước 05 vẫn cần phần **05B: lưu → tải lại bảng điểm/GPA/biểu mẫu trên tài khoản thực** và kiểm tra mô hình Firestore đúng quyền.

## Tiến độ tích lũy theo lộ trình 28 bước / checklist 164 việc

| Bước | Tình trạng | Nghiệm thu trên máy người dùng |
|---|---|---|
| 01 — Backup, commit | Chưa xác minh nguồn Git/backup hiện hành | CHƯA ĐÓNG |
| 02 — Khôi phục Lumen | Patch đã gộp và test tĩnh | CHỜ E2E |
| 03 — Atlas chặn thiếu benchmark | Patch đã gộp, test đơn vị PASS | CHỜ E2E |
| 04 — Atlas benchmark bridge | Patch đã gộp, test đơn vị PASS | CHỜ E2E |
| **05A — Seed numeric validation** | **Đã sửa và test PASS 9/9** | **CHỜ BUILD/E2E** |
| 05B — Seed save/reload/GPA | Chưa sửa | CHƯA BẮT ĐẦU |
| 06–28 | Chưa triển khai trong gói | CHƯA BẮT ĐẦU |

- **4 cụm có bản sửa**: 02, 03, 04, 05A; **chưa cụm nào được chủ dự án xác nhận nghiệm thu E2E**.
- **23 bước nguyên vẹn chưa thực hiện**: 06–28; thêm phần 05B đang thiếu. Bước 01 chưa có chứng cứ backup.
- **Checklist 164 mục:** Không tự cộng PASS khi chưa có bằng chứng nghiệm thu từng đầu việc.

## Cách áp dụng full source

1. **Sao lưu** `C:\Gạo\Cognitive-Learn` (hoặc commit Git) trước khi làm gì khác.
2. Giải nén ZIP vào thư mục tạm; trong ZIP có `package.json`, `src/`, `public/`, `api/`, `tests/`, `research/`, `docs/` ở cấp gốc.
3. Chép toàn bộ nội dung bên trong vào `C:\Gạo\Cognitive-Learn`; chỉ ghi đè sau khi bảo đảm không mất thay đổi cục bộ mới hơn.
4. **Giữ nguyên** `.env` và `node_modules` đang dùng; ZIP không chứa hai mục đó.
5. Chạy kiểm tra:

```powershell
cd "C:\Gạo\Cognitive-Learn"
node --experimental-strip-types --test tests/step05a-seed-input-validation.test.mjs
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs
npm run build
npm run dev
```

6. Trên web: vào `/student/profile`, thử giá trị `101` ở tỷ lệ phần trăm, thử `169` giờ học/tuần, bảo đảm có cảnh báo và không ghi dữ liệu; thử hồ sơ hợp lệ, lưu và truy cập `/student/transcript` để kiểm tra. Bước 05B mới kiểm thử đủ vòng lưu/đọc trên Firebase Emulator.

### Điểm lưu ý

Bản ZIP này là checkpoint **CP37 + bước 02–04 + 05A**; không phải một release đã được nghiệm thu production. Không deploy hoặc thay đổi Firestore Rules từ bản này khi chưa chạy Emulator/role tests.
