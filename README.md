# COGNITIVE LEARN AI (CLA) — mã nguồn chuẩn hóa CLA(7)

**Trạng thái 08/11/2026:** bản nguồn đã sửa vị trí tệp và loại artifacts/secret khỏi ZIP bàn giao. **Chưa triển khai production.** Quyền Firestore, E2E, kiểm định khoa học chưa được nghiệm thu hoàn chỉnh.

## Cấu trúc

- `src/`: React, TypeScript, Vite; 7 module Seed, Nexus, Lumen, Atlas, Orion, Pulse, Haven.
- `api/`: API server-side Lumen/Atlas và Health.
- `tests/`: Node test, Firestore Rules (static và runtime), nghiên cứu kỹ thuật.
- `research/`: `registry/`, `protocol/`, `data/synthetic_demo/`, `src/`, `benchmarks/`, `evidence/`.
- `tools/`: kiểm tra cấu trúc; sửa layout local Windows; chạy Emulator qua đường dẫn ASCII.
- `docs/`: báo cáo, tracker, tài liệu bàn giao, bản lưu `archive/`, đặc tả `specifications/`.
- `firestore.rules.CANDIDATE_CP21`: **chỉ là Rules ứng viên**, không Publish khi chưa chạy 33 ca Emulator và đối chiếu Rules đang chạy.

## Chạy trên máy Windows

```powershell
npm ci
npm test
npm run check:layout
npm run test:rules:static
npm run typecheck:api
npm run build
```

Bộ Firestore Emulator trên Windows có thể không đọc được thư mục Unicode `C:\Gạo\...` (log bản CLA7: Java thấy `C:\G?o\...`). Không cần đổi tên dự án chính; để chạy test chỉ với Rules và dữ liệu demo tại đường dẫn không dấu:

```powershell
.\tools\RUN_FIRESTORE_ASCII.ps1
```

Script tạo workspace tạm chỉ chứa cấu hình, Rules, test và package metadata; **không copy `.env`, `.git` hoặc dữ liệu học sinh**. Phải có Java 21 và Firebase CLI, sau đó script tự chạy `npm ci` và `firebase emulators:exec` trong đường dẫn ASCII.

## Khắc phục bố cục ở workspace Windows cũ (không áp dụng với ZIP sạch)

```powershell
.\tools\FIX_CLA7_LAYOUT.ps1 -WhatIf
.\tools\FIX_CLA7_LAYOUT.ps1
npm run check:layout
```

File khác nội dung không bị ghi đè; script đưa bản cũ vào `docs/archive/legacy-layout/` nếu có xung đột.

## Biến môi trường và thông tin cá nhân

`.env` và `.env.local` **không** có trong ZIP vì có thể chứa bí mật. Tham khảo `.env.example` và thiết lập từ nguồn riêng an toàn. Không đưa `.env`, `.git`, `node_modules`, log Emulator hoặc private research data vào gói công khai. Nếu khóa từng bị commit, kiểm tra lịch sử và thay khóa liên quan.

## Nghiên cứu và tỷ lệ nghiệm thu

Dữ liệu demo/synthetic chỉ dùng cho kiểm thử kỹ thuật. Bộ 120 LLM case là bản nháp chưa đánh giá mô hình. Xem `docs/BAO_CAO_TOAN_DIEN_CLA7_20261108.md` và `docs/TRACKER_145_STATUS_AS_OF_CLA7.csv`.
