# START HERE — Cognitive Learn AI CP61

Nguồn kế thừa CP60, bảo toàn cấu trúc sáu module học sinh. CP61 sửa lỗi stale Firestore callbacks của bộ đọc bản nháp dùng chung cho Orion, Pulse và Haven.

- Xem `reports/cp61/CP61_ACCEPTANCE_REPORT.md` để biết bản vá, bằng chứng và giới hạn.
- Chạy `npm run test:cp61:legacy-drafts`, hoặc `npm test` cho kiểm thử offline toàn bộ.
- Toàn bộ test offline PASS ở bản bàn giao, nhưng **build và Firebase Emulator chưa được nghiệm thu** do thiếu gói và môi trường QA.
- Khi cài dependency được từ npm registry: `npm ci && npm run check:dependencies && npm run build`.
- Không gửi lên production khi chưa chạy Rules Emulator và browser E2E.
