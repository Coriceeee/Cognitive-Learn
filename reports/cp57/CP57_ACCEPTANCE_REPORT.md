# CP57 — Ổn định optimistic concurrency khi Firestore serverTimestamp được xác nhận

Ngày: 21/11/2026 (Asia/Ho_Chi_Minh). Base: Cognitive-Learn-CP56-20261121.zip.

## Vấn đề và nguyên nhân

CP52/CP53 dùng `draftVersion` bao gồm `updatedAt` trong chữ ký xung đột của mọi bản nháp. Trong Firestore, `serverTimestamp()` có thể lần lượt hiện dưới dạng null/ước lượng trên client và một timestamp do server xác nhận, mặc dù revision và nội dung không đổi. Nếu baseline lấy từ snapshot đầu tiên, một lần lưu sau đó có thể bị chặn nhầm là xung đột. Đây là rủi ro logic tái hiện bằng fixture, chưa đo xác suất xuất hiện trên trình duyệt thật.

## Sửa đổi

- `src/lib/draftRevision.ts`: với bản nháp `revision >= 1`, dùng chữ ký canonical của payload (cùng với revision) thay vì dấu thời gian. Giữ kiểm tra `payloadSignature` để phát hiện thay đổi nội dung cùng revision; với bản nháp cũ `revision == 0`, tiếp tục dùng `updatedAt + payload` để nhận diện ABA khi nâng cấp.
- `tests/cp52-multidevice-cas.test.mjs`: hiệu chỉnh tiêu chí: cùng nội dung và cùng revision nhưng timestamp thay đổi không phải xung đột; legacy timestamp đổi vẫn là xung đột.
- `tests/cp57-firestore-timestamp-stability.test.mjs`: thêm 6 test cho timestamp pending→resolved, dữ liệu thực đổi, legacy ABA, acknowledged payload và giao dịch CAS.
- `package.json`, `.github/workflows/cla-cp21-verify.yml`: đưa test CP57 vào chuỗi kiểm thử local và CI.
- `src/lib/nexusEvidenceBaseline.ts`: cập nhật source fingerprint; regenerate các gói phát lại synthetic theo mã nguồn CP57.

Không thay Firestore Rules production, không thay cấu trúc collection, không tự chuyển dữ liệu người học, không deploy.

## Bằng chứng chạy tại môi trường hiện tại

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| CP52 + CP53 + CP57 direct test | PASS 20/20 | `/mnt/data/cla_cp57_timestamp_test.log` trước khi regenerate; test CP57 cũng có trong `npm-test.log` |
| Full `npm test` (continuous process) | **PASS: 1.205 TAP `ok`, 0 `not ok`, exit 0** | `reports/cp57/npm-test.log`, `npm-test.exit` |
| Static Rules | PASS | `reports/cp57/rules-static.log` |
| Layout | PASS | `reports/cp57/layout.log` |
| Offline demo / fingerprint | PASS 11/11 | `reports/cp57/offline-demo.log` |
| ZIP packaging safety | PASS 3/3 | `reports/cp57/packaging-test.log` |
| Dependency preflight | **BLOCKED** | `reports/cp57/dependencies.log`: thiếu node_modules và 19 dependency/bin |
| npm registry probe | **BLOCKED** | `reports/cp57/npm-registry.log`: DNS `EAI_AGAIN` |
| Vite/TS production build | **NOT RUN / BLOCKED** | Thiếu dependencies; không tự gọi build PASS |
| Firebase Emulator allow/deny | **NOT RUN / BLOCKED** | `reports/cp57/emulator-preflight.log`: chỉ static PASS, emulator BLOCKED |
| Two-browser real E2E, deploy, live student data | **NOT RUN** | Không có môi trường / tài khoản kiểm thử thật |

## Giới hạn

Test xác nhận tính đúng đắn của thuật toán so sánh dữ liệu bằng fixture, không đo độ ổn định UI Firestore trên mạng, không chứng minh rules đã chạy production. Phiên bảned timestamp-only out-of-band updates không còn được coi là xung đột: vì không làm thay đổi payload và Rules yêu cầu revision tăng với các cập nhật hợp lệ. Các thao tác thay đổi payload hoặc revision vẫn bị phát hiện.

Trong checklist 164 mục (76 website, 69 research, 19 gate Nexus giao nhóm website), chưa có thêm đầu việc tích hợp nào đủ chứng cứ đóng nghiệm thu hoàn toàn. CP57 cải thiện độ tin cậy của lớp đồng bộ.

## Thứ tự cần chạy ở môi trường có Internet/npm

1. `npm ci --no-audit --no-fund && npm run check:dependencies && npm run build`.
2. `npm run test:rules:emulator` với Firebase CLI + Java 21 và dự án demo-only (không dùng production project).
3. Browser E2E trên hai phiên đăng nhập cùng student test: lưu → onSnapshot đang pending → serverTimestamp resolved → sửa tiếp → lưu, test cập nhật khác thiết bị tạo conflict, đo Back/Forward, sign-out.
4. Chỉ sau các gate trên mới nghiệm thu và triển khai.
