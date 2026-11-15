# Cognitive Learn AI — Báo cáo tiến độ bước 05B (13/11/2026)

## Phạm vi
- Nền: `CLA_CP37_FULL_SOURCE_GOP_BUOC02_05A_20261112.zip`.
- **Chỉ 2 file source thay đổi**: `src/page/seed/hooks/useStudentProfile.ts` và `src/page/orion/OrionPage.tsx`.
- **1 file test mới**: `tests/step05b-seed-roundtrip.test.cjs`.
- Không thay Firestore Rules, schema, thuật toán GPA, công thức Lumen, Atlas, Haven hay UI khác.

## Nội dung đã xử lý
1. Trong hook Seed, đặt bộ nhận diện yêu cầu đọc Firestore và kiểm tra UID hiện tại; dữ liệu yêu cầu cũ không được hiển thị nếu đã đổi tài khoản hoặc unmount.
2. Trong Orion, bản ghi bảng điểm rỗng không được khóa chế độ tự điền. Khi có quan sát hợp lệ, điểm được đề xuất vào các ô còn trống; điểm `0` hợp lệ được giữ.
3. Xác nhận logic đang có: Seed tiếp tục ghi learning profile, transcript và snapshot trong cùng batch; GPA lấy từ academic engine, không sửa công thức.

## Kết quả kiểm thử đã chạy trong môi trường đóng gói
| Bài kiểm thử | Kết quả | Giới hạn |
|---|---|---|
| `node --test tests/step05b-seed-roundtrip.test.cjs` | **9/9 PASS** | Mô phỏng cấu trúc document và mock auth/Firebase, chưa phải kết nối Firestore thật |
| Atlas step03 + step04 | **18/18 PASS** | Regression chọn lọc |
| `node tests/academic.test.cjs` | **14/14 PASS** | Academic engine |
| `node tests/cognitive-observation.test.cjs` | **4/4 PASS** | Observation handling |
| `node --test tests/cp37-operating-guide.test.cjs` | **4/4 PASS** | Guide contracts |
| Cú pháp TS/TSX hai file sửa | **2/2 PASS** | Transpile syntax-only, chưa thay typecheck |
| `npm test` toàn bộ | **BLOCKED** | `tests/cp30-chat-readability.test.cjs` vẫn yêu cầu import CSS CP36 nằm cuối, trái với import CP37; lỗi có trước bản vá 05B |
| `npm run build`, Browser E2E, Firebase Emulator | **NOT RUN / CHƯA NGHIỆM THU** | Không có bộ dependency cục bộ/Firebase Emulator trong môi trường đóng gói |

## Phát hiện mới — Atlas quy chế 2026 (chưa sửa trong bước 05B)
- Nguồn xác minh: Trả lời chính thức của Bộ GDĐT về khoản 3 Điều 14 Thông tư 06/2026/TT-BGDĐT: https://chinhsachonline.chinhphu.vn/tuyen-sinh-2026-thi-sinh-duoc-dang-ky-toi-da-bao-nhieu-nguyen-vong-85406.htm
- Tối đa **15 nguyện vọng** năm 2026; các **chương trình đào tạo giáo viên chỉ được xét khi đứng ở NV01–NV05**.
- `src/lib/aspirationPlanner.ts` đã cố gắng ưu tiên Sư phạm nhưng nếu nhiều hơn năm lựa chọn đào tạo giáo viên vẫn có thể đưa mục dư xuống NV06+; còn can thiệp sai vào thứ tự ưu tiên của người học.
- `src/lib/atlasBenchmarkBridge.ts` nhận diện `isPedagogy` bằng chữ `su pham` trong tên ngành, có thể bỏ sót chương trình đào tạo giáo viên tên khác.
- Cần **bản sửa riêng của Atlas**: năm áp dụng 2026, phạm vi chương trình đào tạo giáo viên được định danh bằng dữ liệu có chứng cứ, kiểm tra NV01–NV05 và không thay đổi ưu tiên một cách không minh bạch. Chưa được gọi PASS.
- Nếu kỳ 2027 có quy chế mới, phải xác minh lại; không mặc định mọi quy định 2026 áp dụng vô thời hạn.

## Tiến độ tổng theo lộ trình 28 bước / 164 mục
| Bước | Trạng thái |
|---|---|
| 01. Backup bản đang chạy | Chưa xác nhận trên máy người dùng |
| 02. Khôi phục Lumen | Bản sửa đã gộp, chờ nghiệm thu trình duyệt |
| 03. Atlas chặn benchmark thiếu căn cứ | Bản sửa đã gộp, chờ nghiệm thu trình duyệt |
| 04. Atlas nối benchmark có nguồn | Bản sửa đã gộp, chờ nghiệm thu trình duyệt |
| 05A. Seed kiểm tra input | Bản sửa đã gộp, chờ nghiệm thu trình duyệt |
| **05B. Seed roundtrip + Orion prefill** | **Source và test hoàn tất, chờ nghiệm thu thực tế** |
| Atlas 2026: thứ tự NV và chương trình đào tạo giáo viên | **Đã xác định lỗ hổng; chờ bản vá riêng** |
| 06–28 | Chưa triển khai theo roadmap |

**Checklist 164:** không tự tăng số mục PASS vì chưa kiểm chứng E2E/Emulator/build tại hệ thống người dùng. Tổng bước khung vẫn 28, có thể có các tiểu bước sửa độc lập.

## Cách áp dụng
1. Backup `C:\Gạo\Cognitive-Learn` trước khi ghi đè; không giải nén lên source chưa được sao lưu.
2. Giải nén ZIP vào thư mục riêng rồi sao chép nội dung vào dự án nếu chắc chắn không có local changes mới hơn.
3. Không chép `.env`, `.env.local` hoặc `node_modules` từ ZIP (gói không chứa các mục này).
4. Chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
node --test tests/step05b-seed-roundtrip.test.cjs
npm run build
npm run dev
```

5. Nghiệm thu bằng hai tài khoản test A/B (không dùng dữ liệu học sinh thật): lưu bảng điểm Seed, tải lại, mở Lumen/Orion, chuyển tài khoản, kiểm tra dữ liệu cũ không còn hiển thị. Xác minh không có lỗi console.
