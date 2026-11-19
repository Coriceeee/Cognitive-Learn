# CLA CP28 — Khởi động 100 mục chưa có liên kết bằng chứng

Ngày: 15/11/2026. Source nền: **CP27/V5 đã được chủ dự án chạy Firestore Emulator 74/74 PASS** (Rules ứng viên SHA-256 `1945ca60ce7b62308cf93ceb250178a7d3b982e8fa17bbf6458e14c1bc9c3435`).

## Kết quả đã làm trong gói CP28

1. **Tái lập backlog đúng 100/164 mục** chưa có đường dẫn bằng chứng trong CP27, không xóa/sửa nội dung gốc. Phân nhóm: Website 51; Nghiên cứu 34; Tuyển sinh/Chat 14; UI/Mascot 1.
2. **Rà từng mã và gắn file nguồn ứng viên**: cả 100 mục có đường dẫn file thực sự tồn tại trong source. Phân loại riêng dự thảo nghiên cứu, code có test, và code cần nghiệm thu. **Không có mục nào được tự gán PASS** từ sự tồn tại của file; reviewer vẫn PENDING.
3. Thêm logic `src/lib/studentShareRevocation.ts` để thu hồi các liên kết tự nguyện sau khi học sinh rút product consent: server-only query `studentId == UID`, tối đa 40 bản ghi mỗi lượt; xóa shared report trước khi xóa link; xác minh lại danh sách trống; chặn thay đổi UID và link không thuộc học sinh; giới hạn xử lý để không giả vờ hoàn tất.
4. `StudentConsentPage` **lưu rút đồng ý trước** rồi mới dọn liên kết; lỗi dọn không làm rút consent thất bại; có cảnh báo và nút thử lại sau khi refresh. Không tự xóa dữ liệu bảng điểm, bản sao lưu hay dữ liệu ngoại tuyến.
5. Thêm **9 kiểm thử logic** (`tests/step20-consent-share-revocation.test.mjs`) PASS cục bộ và **1 ca thử Rules thực tế mới L14** (`tests/firestore.rules.cp21.test.mjs`), nên Emulator tăng **74 → 75 ca dự kiến**; phải chạy lại thật trên máy chủ dự án.
6. Giữ nguyên Rules ứng viên V5 và `firebase.json`; **không deploy Firebase production**, không bật `VITE_CLA_STUDENT_CONSENT_GATE` mặc định.
7. Bổ sung script sinh bảng 100 + 164 và kiểm tra độ sạch file trước khi đóng gói. Source release không chứa `.env`, `node_modules`, log runtime Security Gate hoặc dữ liệu nghiên cứu private.

## Kết quả kiểm thử ở môi trường đóng gói

- V5 Rules static + Security Gate unit + consent checks: **51/51 PASS**.
- Step12 closed-loop + Step13 reliability + 9 test mới: **42/42 PASS**.
- Tổng **93/93 kiểm thử cục bộ**; JavaScript syntax kiểm tra thành công; hai TypeScript file mới/chỉnh sửa không có lỗi cú pháp (transpile check).
- Firestore Emulator **75 ca: chưa chạy lại tại môi trường đóng gói** (thiếu Firebase CLI/node_modules). Bằng chứng 74/74 chỉ xác nhận phiên bản V5 **trước** khi thêm L14.
- `npm run verify:cp37` và browser E2E chưa chạy với nguồn CP28; không suy diễn production-ready.

## Hạn chế quan trọng

- **Quyền riêng tư chưa hoàn tất tận gốc**: nếu người dùng offline/chuyển tài khoản/lỗi mạng, link metadata cũ vẫn có thể tồn tại. Sau khi refresh có thể thử dọn lại nhưng không phải sự bảo đảm server-side. Cần backend-driven revocation, kiểm toán retention, xử lý cache và production Rules rollout trước khi đóng B5/F1/F2/R2.4.
- Các ca `PERMISSION_DENIED` trong Emulator có thể là từ chối mong đợi ở assertFails; riêng ca J11 cần phân biệt denied vì vi phạm evidence schema với exceeded 1000 expressions.
- 120 LLM benchmark case trong `research/benchmarks/cla_llm_120_cases_DRAFT.jsonl` **chưa có gold labels được duyệt hoặc kết quả chạy thực**; không coi R8 là PASS.
- OULAD UK là benchmark dự báo ngoài THPT Việt Nam; dữ liệu tổng hợp và fixture synthetic không chứng minh adaptive efficacy/causality.
- **100/100 có file ứng viên ≠ 100/100 hoàn thành**, cũng không có nghĩa 164/164 PASS. Mẫu số 164 giữ nguyên.

## Cách chạy trên máy Windows của dự án

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:consent-share-revocation
npm run test:rules:v5:static
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
npm run verify:cp37
python tools/build_cp28_backlog.py
```

**Acceptance bắt buộc tiếp theo**:
- Emulator 75/75 PASS, nhất là L14 (student withdraw consent → report deny → owner revoke → teacher list empty).
- UI/browser E2E Student/Teacher/Parent/Admin và consent revoke dưới mạng tốt/xấu/refresh/logout, server-side retention review.
- 22 thao tác Nexus; giải quyết source provenance tuyển sinh 2024–2026 và scholarship deadline; R8 benchmark và R7 longitudinal cần thiết kế đánh giá chặt chẽ.

## Hồ sơ đầu ra

- `docs/CP28/CP28_BACKLOG_100_EVIDENCE_CANDIDATES.csv` — 100 mục và file ứng viên.
- `docs/CP28/CP28_164_FULL_REVIEW_LEDGER.csv` — 164 mục giữ đúng trạng thái reviewer PENDING.
- `docs/CP28/CP28_SUMMARY.json` — số đếm nguồn và các gate.
- `tools/build_cp28_backlog.py` — sinh lại từ bảng CP27.
- Workbook bên ngoài ZIP: `CLA_CP28_100_TASKS_KICKOFF_20261115.xlsx`.
