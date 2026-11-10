# Áp dụng CP23 vào CLA(7) trên Windows

1. Sao lưu hoặc commit mã hiện tại. Giải nén **CP23_ONLY_CHANGED.zip** vào gốc `C:\Gạo\Cognitive-Learn` (không tạo thêm `CLA/`). Bộ này không bao gồm `.env`, `.git`, `node_modules`, `dist`.
2. Ghi đè đúng năm file mã: `package.json`, `src/lib/pipelineEvidence.ts`, `src/lib/usePipelineEvidence.ts`, `src/page/pulse/PulsePage.tsx`, `tests/pipeline-evidence.test.mjs`. Tài liệu `docs` là bổ sung.
3. Đứng ở thư mục gốc và chạy tuần tự:

```powershell
npm ci
npm test
npm run check:layout
npm run test:rules:static
npm run build
npm audit --omit=dev
.\tools\RUN_FIRESTORE_ASCII.ps1
```

Nếu bản nguồn còn file nghiên cứu sai chỗ, chạy `tools/FIX_CLA7_LAYOUT.ps1 -WhatIf` để xem trước rồi mới áp dụng. Không chạy `firebase deploy` trong giai đoạn này.

4. Khi mở Pulse, đăng nhập Student hoặc Admin Demo **đã active**, nhấn **Kiểm tra nguồn liên thông**. Bảng trạng thái là kiểm tra dữ liệu thật từ Firestore tại thời điểm nhấn. Bản nháp không được tính là kết quả đo thực. Teacher/Parent không được cấp quyền đọc hồ sơ khác chỉ vì thấy nút.

5. Chưa đủ 33/33 Emulator và E2E thì giữ nguyên Rules đang chạy production. Không thay `.env` hoặc `package-lock.json` nếu chỉ áp dụng 5 file mã; không có package mới.
