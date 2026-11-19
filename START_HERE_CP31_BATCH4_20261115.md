# CP31 Batch 4 — Cách áp dụng

1. Sao lưu thư mục `C:\Gạo\Cognitive-Learn`.
2. Dùng **full source** CP31 B4 để có toàn bộ dự án; hoặc giải nén **patch** CP31 B4 **lên CP31 Batch 3**, giữ nguyên đường dẫn.
3. Chạy `npm ci`, `npm run verify:cp31:batch4`, `npm run test:rules:emulator`, `npm run verify:cp37`.
4. Đăng nhập Admin ở môi trường QA, mở `/admin/audit` hoặc ba diagnostic mới: `/admin/diagnostics?view=release`, `/admin/diagnostics?view=seed-rules`, `/admin/diagnostics?view=model-eval`.
5. Chọn báo cáo JSON (source-only local preflight, Firestore emulator gate, OULAD aggregate evidence) hoặc chạy không có báo cáo để thấy NOT TESTED đúng thực tế.
6. Browser E2E 60 ca chỉ được tính nếu chạy với 4 tài khoản QA trên website QA thật.

Xem báo cáo đầy đủ ở `docs/CP31/CP31_BATCH4_EVIDENCE_AUDITS_REPORT_20261115.md`.

**Lưu ý:** 16/22 có công cụ chẩn đoán không phải 16/22 reviewer PASS. Không dùng dữ liệu học sinh thực hoặc gửi mật khẩu vào chat.
