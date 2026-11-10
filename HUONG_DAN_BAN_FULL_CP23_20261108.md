# BÀN GIAO MÃ NGUỒN ĐẦY ĐỦ — COGNITIVE LEARN AI CP23 + HOTFIX

Đóng gói: 08/11/2026. Đây là bản mã nguồn đầy đủ CP23 đã ghép hotfix cấu trúc & Firebase Emulator. Không chỉ là các file thay đổi.

## Cấu trúc
- `src/`: website React/TypeScript, 7 module, engines, Firestore services, pipeline CP23.
- `api/`: 3 Vercel API functions cùng định nghĩa kiểu.
- `research/`: dữ liệu demo, protocol, nguồn, benchmark, công cụ Python, evidence.
- `tests/`: unit tests, Rules static, Firestore Emulator test, research tests.
- `tools/`: `fix-cla-layout.cjs`, `check-cla-layout.cjs`, `run-firestore-ascii.cjs` và tools khác.
- `docs/`: các báo cáo kỹ thuật, tracker 145 nhiệm vụ và đặc tả.

## Cách mở dự án trên Windows
1. **Sao lưu dự án hiện tại trước.** Giải nén ZIP vào `C:\CLA-CP23` hoặc thư mục cha `C:\Gạo` để được thư mục con `Cognitive-Learn`. Không giải nén nguyên ZIP vào *bên trong* một thư mục `Cognitive-Learn` có sẵn, tránh lồng thư mục.
2. Chuyển vào thư mục gốc chứa `package.json` rồi chạy:

```powershell
npm ci
npm run check:layout
npm test
npm run test:rules:static
npm run typecheck:api
npm run build
node tools/run-firestore-ascii.cjs --prepare-only
node tools/run-firestore-ascii.cjs
```

3. `node tools/run-firestore-ascii.cjs` cần **Firebase CLI** (`firebase --version`), JDK21+ và khả năng tải Firebase Emulator. Script tự tìm Temurin Java đã cài dù PowerShell không tự nhận PATH. Chỉ sử dụng project demo; không deploy production.
4. Với cấu hình riêng, sao chép `.env.example` thành `.env.local` rồi điền cấu hình Firebase của bạn **trong máy**; không gửi file chứa bí mật. `npm run dev` để chạy website.

## Kết quả đã kiểm tra trong môi trường đóng gói
- `npm run check:layout`: PASS, 22 đường dẫn bắt buộc; 19 đường dẫn legacy không tồn tại.
- `npm test`: 43/43 kiểm thử Node PASS.
- `npm run test:rules:static`: 12/12 PASS (chỉ phân tích tĩnh).
- `python -m unittest discover -s tests -p test_research_scope.py`: 4/4 PASS.
- `node tools/run-firestore-ascii.cjs --prepare-only`: PASS (chuẩn bị file, **không chạy Emulator**).
- `npm ci`, `npm run build` trên bản ghép, 33 bài Firestore Emulator, browser E2E, Vercel Preview/production: **CHƯA NGHIỆM THU trên bản ZIP mới**. Log build Windows của CP23 trước đó đã PASS nhưng không thay thế cho chạy lại bản ZIP này.

## An toàn
- ZIP loại `.env`, `.env.local`, `node_modules`, `dist`, `.git` và dữ liệu cá nhân thật.
- Có `.env.example` với các trường rỗng; không chứa khóa sản xuất.
- `firestore.rules.CANDIDATE_CP21` là ứng viên cần kiểm thử; **không tự động publish Rules lên Firebase production**.
- Không dùng dữ liệu demo/synthetic để tuyên bố hiệu quả khoa học.
