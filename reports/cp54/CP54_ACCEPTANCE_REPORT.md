# Cognitive Learn AI — CP54: Atomic draft refresh & revision-only writes

**Ngày:** 2026-11-21 (Asia/Ho_Chi_Minh)  
**Nguồn:** `Cognitive-Learn-CP53-20261121.zip`, giải nén trong thư mục làm việc riêng.  
**Phạm vi:** sửa nguồn + kiểm thử offline. Không có deploy hoặc quyền truy cập Firebase production.

## Thay đổi đã thực hiện

1. `src/lib/serializedDraftWrites.ts`: `enqueue<T>` trả kết quả theo đúng generic type; chuỗi promise được normalize thành `Promise<void>`. Lần ghi thất bại không cản tác vụ tiếp theo.
2. `src/lib/useModuleDraft.ts`: `acceptRemote()` đi qua cùng hàng đợi FIFO với `save()`; kiểm tra lại UID/session trước và sau đọc máy chủ. Tải lại từ máy chủ không còn chạy đè với một transaction lưu còn dang dở. Các lần lưu xếp sau thao tác tải lại bị từ chối theo token phiên cũ.
3. `firestore.rules.CANDIDATE` và `firestore.rules.CANDIDATE_CP21`: yêu cầu `revision` số nguyên cho CREATE (=1) và UPDATE (= revision hiện tại +1). Các record cũ thiếu revision vẫn đọc được và có thể nâng cấp lên revision 1; không còn cho tạo/cập nhật không có revision. Đây là **candidate rules**, chưa publish.
4. `tests/firestore.rules.cp21.test.mjs`: cập nhật các ca M01/M02/C08 để tạo record mới có revision=1 và thêm M05 kiểm tra từ chối CREATE/UPDATE thiếu revision, nâng cấp legacy, từ chối bản stale. Ca M05 **chưa chạy trên Emulator**; chỉ được kiểm tra cú pháp offline.
5. `tests/cp54-draft-refresh-security.test.mjs`: thêm 6 kiểm thử offline, bao gồm thứ tự save→reload, lỗi ghi, token phiên, hợp đồng Rules và độ phủ ca Emulator.
6. `package.json`: đưa `test:cp54:safety` vào `npm test`; tên bước workflow được đổi thành trung tính, không đóng cứng số ca bảo mật.
7. `src/lib/nexusEvidenceBaseline.ts`: tái tạo SHA sau khi thay đổi được rà soát; ba bundle SYNTHETIC + demo dự phòng được phát lại đúng fingerprint mới. Không sử dụng để chứng minh hiệu quả học tập.

## Bằng chứng chạy thực tế

| Gate | Trạng thái | Log / ghi chú |
|---|---|---|
| `npm test` nguyên chuỗi | **PASS** | `reports/cp54/npm-test-final.log`; 82 TAP summaries, **1.185/1.185 tests**, 0 fail |
| `npm run test:cp54:safety` | **PASS** | 6/6 |
| `npm run test:rules:static` | **PASS** | `reports/cp54/rules-static.log`; 15/15 static only |
| `npm run check:layout` | **PASS** | `reports/cp54/layout.log` |
| `npm run demo:final` | **PASS** | `reports/cp54/synthetic-demo.log`; 11/11 synthetic/offline gates |
| Safe ZIP packaging tests | **PASS** | `reports/cp54/packaging-tests.log`; 3/3 |
| Isolated `tsc` for two pure TS modules | **PASS** | `reports/cp54/isolated-tsc.log`; not project build |
| Emulator authorization test syntax | **PASS** | `reports/cp54/emulator-test-syntax.log`; syntax check only |
| Dependency readiness | **BLOCKED** | `reports/cp54/dependency-readiness.log`; 19 missing modules/tools |
| Firebase Emulator preflight | **BLOCKED** | `reports/cp54/emulator-preflight.log`; static check succeeds, live emulator not invoked |
| `npm run build` full Vite/API | **NOT VERIFIED** | npm registry DNS `EAI_AGAIN` when probing registry; locked dependency tree unavailable |
| Two-device browser E2E / staging / production | **NOT RUN** | Requires provisioned test environment and actual Firestore access |

## Fingerprints

- Source fingerprint: `a86c5e5af72fbcb944e6160c26224a997fe0b61fded9aff4f89f54d29fd4dd32` (448 tracked files, excludes generated baseline).
- Candidate Rules CP21 SHA-256: `27c762abb25fde89aec8015109a70769c18758c3423bce1d953a9d4eeaa9113c`.

## Giới hạn và điều kiện nghiệm thu

- Kiểm thử Node/contract **không thay thế** việc chạy Rules thực tế trên Firebase Emulator. Quyết định chấp thuận candidate Rules phải dựa trên Allow/Deny Matrix Emulator, không publish theo kết quả static test.
- Không thể nói website production build PASS khi chưa cài dependencies qua `npm ci` và chưa chạy `npm run build`.
- Chức năng an toàn trong một phiên đã được kiểm tra offline; kết quả xung đột đa thiết bị vẫn cần E2E staging thật.
- CP54 không chứng minh độ tin cậy tâm trắc, cải thiện kết quả học tập, xác suất xét tuyển/học bổng hay tính nhân quả.
- **Backlog 164 gate:** không đóng thêm gate nghiệm thu trọn vẹn. CP54 chỉ tăng bằng chứng kỹ thuật và giảm hai rủi ro data integrity. Ghi phân biệt này khi chấm điểm.

## Nghiệm thu trên máy phát triển có Internet / môi trường staging

1. `npm ci --no-audit --no-fund`, `npm run check:dependencies`, `npm run build`, `npm test`.
2. Dùng project **demo-cla-cp21-security** và local emulator: `npm run test:rules:emulator`; xác minh ca M01, M02, M04, M05 và toàn bộ allow/deny trước khi cân nhắc Rules deployment. Không dùng project production.
3. Browser E2E hai phiên: đồng thời lưu Orion/Pulse/Haven, thử bấm "Tải bản mới nhất" ngay trong lúc lưu, đăng xuất/đổi UID, xác minh không mất dữ liệu hoặc ghi vào UID khác.
4. Nếu các gate không đạt, giữ CP54 ở trạng thái source-only và sửa trước khi triển khai thực tế.
