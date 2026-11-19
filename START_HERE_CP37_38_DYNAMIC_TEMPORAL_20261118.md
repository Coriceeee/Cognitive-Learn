# CP37–38 (V4) Dynamic Student & Temporal Intelligence — 18/11/2026

Base: CLA_FULL_SOURCE_CP36_DECISION_LINEAGE_20261118.zip. Không xóa file, không thay rules hay production config. Dùng patch đúng base (hoặc full source riêng). Backup source và giữ `.env.local` tại máy cá nhân; không gửi key.

## Thay đổi
- `src/lib/dynamicStudentState.ts`: view read-only của learning_profiles schemaVersion 1, đúng UID/scope và server timestamp. Không dùng numeric fallback của StudentProfile; 0 hợp lệ, null thiếu. 15 trường gồm 4 GPA, 4 hành vi, 3 cognitive proxy, 2 mục tiêu, 2 tài chính. Không phát sinh collection, không gửi nội dung panel sang LLM. Cognitive availability chỉ nhận mapping v2 và dimension nhất quán.
- `src/lib/temporalStudentIntelligence.ts`: 6 chuỗi (giờ học, hoàn thành kế hoạch, động lực, SCI, MAS, CSL), tối đa 10 snapshot mới nhất; lần lưu cuối mỗi ngày UTC; require >=3 ngày quan sát và span >=7 ngày cho từng trục. Null hoặc gap >28 ngày cắt chuỗi, không bù giả. EMA time-aware alpha = 1 - 0.5^(delta_days/7). Cờ chênh lệch thử nghiệm 3 giờ hoặc 15 điểm trên các trục 0–100, không phải phát hiện anomaly / change-point đã kiểm định. Không dùng để tự điều chỉnh chiến lược.
- `useStudentProfile` tận dụng subscription hiện có, reset khi đổi UID/cache/lỗi; chặn history trả về từ phiên/snapshot cũ. Chưa tối ưu query lịch sử gốc (đọc toàn bộ để giữ luồng growth cũ; temporal chỉ sử dụng 11 record đầu để xác định truncation). Timestamp thiếu không được tự thay bằng now trong verified history.
- `LumenDynamicState` hiển thị state/EMA, dữ liệu không đủ và giới hạn. Chưa kiểm thử trên browser. Không đổi logic COGNITIVE formula hay Adaptive Engine CP36.

## Chạy tại máy
```powershell
npm ci
npm run test:cp37-38:dynamic
npm run test:cp30:profile
npm run demo:final
npm test
npm run build
npm run dev
```
Không chạy deploy Rules production. Thử Lumen với tài khoản demo riêng, sửa/lưu Seed rồi mở lại Lumen. Không tự tạo dữ liệu thật/giả để kết luận hiệu quả. Cần kiểm tra hồ sơ thiếu, hồ sơ có điểm 0, sign-out, cache và hai thiết bị. Nếu chưa có 3 ngày quan sát trong >=7 ngày, EMA phải chưa khả dụng.

## Kết quả tại môi trường bàn giao
- 14/14 test engine mới, cộng 2 test hook mới; nhóm hook 14/14.
- npm test chạy đến hết CP30 batch4: 609/609 TAP, không lỗi, bị timeout khi bắt đầu CP31 batch3. Các file còn lại theo cùng script chạy gộp: 419/419, exit 0. Tổng 1028/1028 TAP qua hai lượt (không tuyên bố npm test một lượt thành công).
- TypeScript strict riêng 2 engine PASS; demo offline 11/11; Atlas retrieval 848/848; Knowledge Retrieval 120/120; Rules static 15/15. Full build FAIL vì thiếu dependencies; chưa xác nhận typecheck UI toàn hệ thống. Firebase Emulator/Browser E2E/production và AI live chưa chạy. CP36 candidate Rules giữ nguyên. Các chỉ số output là mô tả tự báo cáo, không phải validated science. Không tái chấm % dự án.
- EMA chỉ là thống kê mô tả; ngưỡng, cửa sổ, UTC day là quyết định thiết kế v1 chưa được kiểm định. Nhiều lần lưu không tương đương nhiều lần đo độc lập. Không huấn luyện ML hoặc deploy trong đợt này.

Roadmap: `research/protocol/CLA_ADAPTIVE_ROADMAP_V4_20261118.md`. Bằng chứng: `reports/verification/cp37_38_local/`.
