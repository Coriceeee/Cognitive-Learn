# CP31 Batch 3 — Nexus operational read-only audits

Ngày: 2026-11-15. Nền: **CLA_FULL_SOURCE_CP31_BATCH2_NEXUS_BROWSER_E2E_20261115.zip**. Không dùng một phiên bản dự án khác.

## Các thay đổi chức năng

1. **seed-migration:** Đọc duy nhất `learning_profiles/{ownUid}` và `student_transcripts/{ownUid}` bằng `getDocFromServer` sau khi xác minh Admin `role=admin`, `active=true`. Đối chiếu UID, `dataScope=demo`, `schemaVersion=1`, tính nhất quán 4 môn lựa chọn và Ngoại ngữ 1, cảnh báo bảng điểm legacy và tình huống dữ liệu thiếu. Không tự migration, không sửa dữ liệu hoặc truy cập UID học sinh khác.
2. **atlas-fresh:** Quét registry tuyển sinh 2024–2026 thực tế đang đóng gói, phát hiện thiếu năm, trùng năm, URL không phải HTTPS, năm `official_archive_only`, phương thức chưa chuẩn hóa. Không truy cập live trang của trường, không tạo điểm chuẩn, không kết luận ngành/method đã phủ đủ.
3. **haven-sources:** Kiểm tra các bản ghi học bổng thật trong registry về mã duy nhất, URL HTTPS, ngày review hợp lệ, điều kiện, chứng chỉ và giấy tờ; đánh dấu quá 90 ngày cần rà soát. Không xác nhận học bổng đang mở, deadline, tính đủ điều kiện hoặc số tiền tài trợ.

Cả ba tác vụ chuyển từ trạng thái `planned` sang `limited`, nghĩa là **có công cụ kiểm tra thật trong phạm vi nguồn và quyền đã mô tả**, KHÔNG phải nghiệm thu toàn bộ nghiệp vụ.

## Kết quả tại đây

| Cổng | Kết quả | Phạm vi |
|---|---|---|
| `npm run test:cp31:batch3` | **13/13 PASS** | Behavioral tests và negative cases |
| `npm run verify:cp31:batch3` | **PASS** | Batch 3 + Batch 2 + Batch 1 + CP30 regression + `npm test` |
| `npm test` | **PASS** | Node/unit/contract suite, trong lệnh verify |
| `tsc` cho mô-đun audit độc lập | **PASS** | Pure TypeScript module only |
| Kiểm tra syntax TS/TSX của bốn file | **PASS** | Syntax, không thay thế typecheck toàn app |
| Playwright preflight | **CONFIG ONLY PASS** | 7 cụm, 22 tác vụ, 13 diagnostics |
| Thiếu xác nhận QA | **BLOCKED (exit 2)** | Không có browser E2E thực sự |
| Production build và typecheck toàn ứng dụng | **CHƯA CHẠY** | Môi trường phát hành thiếu node_modules |
| Firestore Emulator | **CHƯA CHẠY** | 86 ca cũ; không thay Rules |
| Reviewer chấp thuận | **0 MỚI** | Source link hoặc local PASS không phải reviewer PASS |

## Nexus 22 tác vụ

Sau Batch 3: **13/22 có công cụ chẩn đoán**, **9/22 vẫn planned**, **0/22 được tự động công nhận reviewer PASS**. Danh mục 7 module và 22 IDs không thay đổi. Browser suite: **51 ca dự kiến** (48 ca trước + 3 diagnostic routes), chưa chạy.

## Cổng quan trọng còn chặn

- `release`: chưa đối chiếu thật deploy SHA, CI logs, backup và rollback; không tự công nhận.
- `seed-rules`: cần 86 ca Emulator với Rules SHA và ma trận quyền; không thay bằng regex/string test.
- `model-eval`: cần holdout/calibration theo dữ liệu, mô hình và phiên bản đã khóa; chưa có công cụ chạy trong Console.
- `atlas-fresh`, `haven-sources`: muốn nghiệm thu nghiệp vụ thì phải kiểm tra website official hiện hành, năm/ngành/kỳ, ghi ngày và kiểm duyệt độc lập.
- `seed-migration`: muốn nghiệm thu migration phải có bản sao lưu, dry-run, đối soát và rollback có thể tái hiện.
- Cần QA browser E2E 51 ca, build production, Emulator 86 ca và reviewer theo checklist 164 trước khi đóng CP31.

**Giới hạn quyền:** Không đổi Firestore Rules, không thay `firebase.json`, không deploy, không tự chấp nhận nghiên cứu/consent. Không ghi dữ liệu người học trong ba công cụ mới.
