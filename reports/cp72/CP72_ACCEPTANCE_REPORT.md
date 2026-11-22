# CP72 — Lumen measured-only assistant / Gemini safe-routing

Ngày bàn giao: 2026-11-22. Nền phát triển: `Cognitive-Learn-CP71-20261122.zip`.

## Đã thay đổi trong mã nguồn

1. `src/engines/lumen/lumenIntelligenceEngine.ts`: giới hạn chỉ báo Cognitive vào SCI/MAS/CSL/GVI/BDI/FRI/CRI; yêu cầu `scoreAvailable === true`, `dimension.available === true`, loại mã trong `missingDimensions`, điểm hữu hạn 0–100; không coi metadata hay số 0 kỹ thuật là phép đo; phân loại đúng chiều rủi ro GVI/BDI/FRI.
2. `src/engines/lumen/lumenMeasuredGuide.ts`: hướng dẫn theo quy tắc thuần, dựa trên chỉ báo đã đo, không gọi API, không sử dụng dữ liệu cá nhân định danh, không tự nhận kết quả ML/độ chính xác dự báo.
3. `src/engines/ai/reasoningEngine.ts`: chỉ cho phép gợi ý SCI/CRI là tín hiệu được đánh dấu có phép đo hợp lệ.
4. `src/page/lumen/hooks/useLumenIntelligence.ts`, `src/page/lumen/LumenPage.tsx`: hiển thị hướng dẫn CLA độc lập trong tab Lumen Assistant; vẫn cho gọi Gemini theo yêu cầu, thất bại Gemini không làm mất hướng dẫn nội bộ.
5. `src/lib/geminiLumenClient.ts`: chỉ sử dụng API base URL đã cấu hình và được kiểm tra; không sử dụng hostname hard-code; kiểm tra tín hiệu hủy và thay đổi UID trước khi gửi request sau khi lấy ID token.
6. `tests/cp72-lumen-assistant-fallback.test.mjs`: 18 ca kiểm thử, thêm vào `npm test`, script riêng và CI.

## Trạng thái kiểm thử thực hiện trong môi trường hiện tại

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| Test CP72 riêng | PASS 18/18 | `npm run test:cp72:lumen-fallback` |
| Full npm test | PASS exit code 0, 1319 dòng `ok`, 0 dòng `not ok` | `reports/cp72/full-npm-test.log`, `.exit` |
| Kiểm thử cú pháp 6 tệp TS/TSX | PASS | TypeScript `transpileModule` (không thay thế tsc toàn dự án) |
| Typecheck 3 tệp logic thuần | PASS | `reports/cp72/pure-ts-typecheck.log` (exit 0) |
| Demo synthetic | PASS 11/11 | `reports/cp72/demo-final.log` |
| Rules tĩnh | PASS 15/15 | `reports/cp72/rules-static.log` |
| Layout | PASS | `reports/cp72/layout.log` |
| Hồi quy CP71 | PASS 6/6 | `reports/cp72/cp71-navigation-regression.log` |
| Kiểm thử an toàn đóng gói | PASS 3/3 | `reports/cp72/packaging-safety.log` |
| Production build | BLOCKED — thiếu React, Firebase, Vite và types; không có kết quả build | `reports/cp72/production-build.log` |
| Dependencies preflight | BLOCKED — thiếu 19 package / executable | `reports/cp72/dependency-preflight.log` |
| Firebase Emulator | BLOCKED (static PASS, emulator chưa chạy) | `reports/cp72/firebase-preflight.log` |
| Browser E2E và QA 2 thiết bị | NOT RUN | Cần dev server, Firebase QA riêng và tài khoản synthetic |
| Kiểm định chất lượng AI/ML | NOT VALIDATED | Không có kết quả thực nghiệm với người học thật |

**Giới hạn quan trọng:** Bản này chỉ thêm hỗ trợ diễn giải quy tắc; không huấn luyện mô hình, không chứng minh dự báo, không can thiệp khoa học trên học sinh thật. Tỷ lệ PASS offline không xác nhận an toàn backend chạy thực tế.

## Bước để đạt MVP

CP73 nên tập trung vào việc khôi phục `npm ci && npm run build` trong máy CI có mạng, chạy emulator trên project QA riêng, kiểm tra Chrome desktop/mobile luồng đăng nhập → Seed → Lumen (có và không có Gemini) → Atlas → Orion/Pulse → Haven → quay lại Seed, rồi mới nghiệm thu MVP. Không deploy Rules CP69 vào production trước khi vượt Emulator.
