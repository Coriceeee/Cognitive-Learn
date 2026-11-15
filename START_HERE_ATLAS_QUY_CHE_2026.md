# Cognitive Learn AI — Full source 05B + Atlas quy chế nguyện vọng 2026

**Nền:** `CLA_CP37_FULL_SOURCE_GOP_BUOC02_05B_20261113.zip`.

**Phạm vi duy nhất của lượt sửa:** quy chế xếp nguyện vọng 2026 trong Atlas. Không thêm Gemini Search hoặc sửa Seed/Lumen/Pulse/Haven.

## Những thay đổi source

1. `src/lib/aspirationPlanner.ts`: Version quy chế 2026, tối đa 15 nguyện vọng, chỉ xếp chương trình đào tạo giáo viên trong NV01–NV05; loại lựa chọn đào tạo giáo viên vượt số vị trí thay vì chuyển xuống NV06+; nhận diện bằng mã ngành, cờ phân loại hoặc tên ngành; không dùng bản ghi năm khác 2026 để lập danh sách kỳ 2026.
2. `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx`: Hiển thị quy chế 2026 và liên kết văn bản chính thức, nhãn ngành đào tạo giáo viên và ưu tiên cảnh báo của danh sách nguyện vọng.
3. `tests/atlas-aspiration-policy-2026.test.cjs`: 14 bài kiểm thử mới (gồm unit và integration Admission Engine với dữ liệu tổng hợp).

## Văn bản pháp lý được đối chiếu

- Thông tư **06/2026/TT-BGDĐT**, khoản 3 Điều 14. Nguồn chính thức: https://vanban.chinhphu.vn/?classid=1&docid=217071&pageid=27160
- Trả lời của Bộ GDĐT trên Cổng chính sách Chính phủ: https://chinhsachonline.chinhphu.vn/tuyen-sinh-2026-thi-sinh-duoc-dang-ky-toi-da-bao-nhieu-nguyen-vong-85406.htm

## Cách áp dụng trên Windows

1. Sao lưu `C:\Gạo\Cognitive-Learn` (hoặc tạo commit Git trước khi chép).
2. Giải nén toàn bộ ZIP vào thư mục tạm và kiểm tra các file `src/`, `tests/`, `package.json`.
3. Chép **nội dung bên trong** thư mục giải nén vào thư mục dự án, không xóa `.env`, `.env.local`, `node_modules` đang hoạt động. Nếu có thay đổi source mới của bạn, so diff trước khi ghi đè.
4. Trong PowerShell:

```powershell
cd "C:\Gạo\Cognitive-Learn"
node --test tests/atlas-aspiration-policy-2026.test.cjs
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs
npm run build
npm run dev
```

## Các bước nghiệm thu trên website

- Trang `/atlas` hiển thị 15 NV và giáo viên NV1–NV5 kèm link văn bản.
- Nếu có dữ liệu đã xác minh: kết quả tối đa 15 nguyện vọng, không có chương trình đào tạo giáo viên ở NV6–NV15.
- Khi có >5 lựa chọn đào tạo giáo viên: phần dư bị loại **và cảnh báo hiện rõ**, không lặng lẽ đưa xuống NV6+.
- Chương trình Giáo dục Tiểu học/Mầm non được áp quy tắc, không dựa duy nhất vào tên trường Sư phạm.
- Không lấy dữ liệu lịch sử 2024/2025 để giả làm nguồn 2026. Chưa đủ dữ liệu thì hệ thống từ chối xếp hạng.

## Giới hạn và bước tiếp theo

- Đây là **danh sách gợi ý**, không thực hiện thao tác đăng ký/nguyện vọng thực tế thay học sinh. Chưa có trình tự kéo thả ưu tiên thủ công trong tính năng này.
- Nhận diện nhóm ngành bằng mã/tên vẫn cần Admin xác minh danh mục chính thức; không phải bộ phân loại pháp lý hoàn hảo.
- Kiểm thử Firestore Emulator, browser E2E và full build tại máy bạn còn chờ xác nhận.
- Việc tiếp theo: thiết kế `Official Source Intelligence` dùng Gemini + tra cứu nguồn chính thức, tách biệt với việc tự động xác minh dữ liệu.

**Báo cáo chi tiết:** `BAO_CAO_TIEN_DO_ATLAS_QUY_CHE_2026_20261113.md`.
