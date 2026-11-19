# CP31 Batch 9 — Journey Evidence Record Consistency Gate

**Ngày: 16/11/2026 | Baseline: CP31 Batch 8 | Đầu ra: source + tests + kiểm kê 164**

## Root cause

Trước Batch 9, `isJourneyEvidenceRecord` chỉ xác nhận **hình dạng dữ liệu** và giới hạn giá trị. Một document `REVIEWED` có thể giữ `output.value` đúng thang -10…10 nhưng **không bằng** kết quả `analyzeJourney` từ chính dữ liệu check-in và reassessment. Tương tự, việc sửa các mục `factors`, `evidenceRefs`, `limitations`, `createdAt`, engine version không nhất thiết bị phát hiện. Snapshot hỏng cũng có thể làm Hook báo lỗi trong khi giữ kết quả cũ trên màn hình.

## Thay đổi triển khai

1. `src/lib/closedLoopJourney.ts`: thêm `auditJourneyEvidence(cycle)` với bốn trạng thái `CONSISTENT`, `LEGACY_NO_EVIDENCE`, `NOT_REVIEWED`, `MISMATCH`. Với record đã tổng kết và có evidence, yêu cầu dữ liệu nền hợp lệ (ngày UTC, thứ tự check-in, duy nhất key/tuần/id, bounds, self-report provenance, zero hợp lệ) và **tự sinh lại Evidence Record bằng engine gốc** rồi so sánh đệ quy bao gồm tất cả fields, không phụ thuộc thứ tự key Firestore.
2. `isJourneyCycle`: từ chối `REVIEWED` document có Evidence Record bất nhất; vẫn đọc được legacy không có record để không xóa lịch sử hợp lệ. `ACTIVE` không được tự gắn record giả.
3. `src/lib/useClosedLoopJourney.ts`: khi server trả snapshot hỏng, xóa ngay `cycles` trước khi báo lỗi; tránh để dữ liệu cũ vẫn hiện trên UI.
4. `src/components/journey/ClosedLoopPanel.tsx`: hiển thị `KHỚP CÔNG THỨC`, `BẢN GHI CŨ`, `KHÔNG KHỚP` đúng phạm vi khi trạng thái được đánh giá; snapshot sai bị chặn ở Firestore hook kèm thông báo dữ liệu cũ đã ẩn; không gọi đó là provenance verified hoặc tác động thực nghiệm.
5. `tests/cp31-batch9-evidence-integrity.test.mjs`: 32 ca positive/negative, bao gồm sửa output trong miền hợp lệ, baseline, outcome, check-in, source/version, limitations, map-key reordering, legacy/zero, stale snapshot.
6. `package.json`: `test:cp31:batch9`, `verify:cp31:batch9`. Source fingerprint và baseline được tạo lại để tránh mismatch.

## Kết quả tại môi trường xây dựng

- CP31 B9: **32/32 PASS**.
- `verify:cp31:batch9`: **PASS (exit 0)**; bao gồm cổng B8, B7, B5, B4, old closed-loop/reliability và layout.
- `npm test`: **PASS (exit 0)**.
- TypeScript kiểm tra riêng module Closed-Loop và Shadow: **PASS** với `--allowImportingTsExtensions`.
- `npm run build`: **CHƯA CHẠY ở môi trường này** (không cài `node_modules`); yêu cầu kiểm tra Windows.
- Browser E2E 72 ca: **NOT RUN**, không có Firebase QA độc lập.
- Firestore Emulator 86 ca, staging deploy, rollback, CI/CD: **NOT RUN trong Batch 9**.

## Tính chính xác của tuyên bố

`CONSISTENT` chỉ chứng minh **đồng nhất giữa record đã lưu và công thức engine hiện tại**. Một người có quyền thay đổi cả dữ liệu chu kỳ lẫn record có thể tạo ra hai đối tượng nhất quán giả; đây không phải chữ ký, chứng thực hệ thống, audit server, hoặc kiểm định tâm trắc. Nếu cần bất biến T0 hay provenance nghiên cứu, phải thiết kế server-side append-only với timestamp/commit và audit độc lập. `LEGACY_NO_EVIDENCE` không được xem là PASS.

## Checklist

Cập nhật evidence refs cho `R7.1`, `R7.2`, `R7.7`. **Giữ nguyên 21 đạt kỹ thuật / 126 một phần / 17 thiếu bằng chứng; 0 nghiệm thu độc lập.** Không sử dụng bài test mới để nâng hạng outcome thực hoặc causal effect.
