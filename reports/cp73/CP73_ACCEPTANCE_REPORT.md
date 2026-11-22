# CP73 — Báo cáo ứng viên MVP (2026-11-22)

## Phạm vi triển khai

Từ CP72, bản CP73 tạo đường chạy Firebase **local, synthetic-only**: `src/lib/localFirebaseEmulators.ts` bảo vệ project, key, domain, HTTP loopback và chế độ Vite development. `src/lib/firebase.ts` bật Auth Emulator và Firestore Emulator *chỉ khi được phép*. Mẫu `.env.mvp-qa.example`, cổng kiểm tra `tools/cp73_mvp_gate.py` và 13 bài kiểm thử CP73 được thêm vào mã nguồn, test scripts và CI. Không thay giao diện CP71 và không huấn luyện ML.

## Kết quả **đã chạy**

| Bằng chứng | Kết quả | File log |
|---|---|---|
| CP73 guard và MVP QA tests | **PASS 13/13**, exit 0 | `reports/cp73/cp73-tests.log` |
| Hồi quy CP69 xung đột Atlas & Firebase contract | **PASS 10/10**, exit 0 | `reports/cp73/cp69-regression.log` |
| Typecheck thuần `localFirebaseEmulators.ts` + transpile hai file TS | **PASS** | `reports/cp73/pure-ts-typecheck.log` |
| Demo offline SYNTHETIC | **PASS 11/11**, exit 0 | `reports/cp73/demo-final.log` |
| Firestore Rules static contract | **PASS 15/15**, exit 0 | `reports/cp73/rules-static.log` |
| Layout | **PASS**, exit 0 | `reports/cp73/layout.log` |
| Packaging safety | **PASS 3/3**, exit 0 | `reports/cp73/packaging-safety.log` |
| Full `npm test` attempt | **INCOMPLETE / TIMEOUT**; 1.326 dòng `ok`, 0 `not ok` trước khi hết thời gian; CP73 chạy riêng PASS | `reports/cp73/full-npm-test.log` |
| Dependencies preflight | **BLOCKED**, thiếu 19 package/executable | `reports/cp73/dependency-preflight.log` |
| Build `npm run build` | **BLOCKED**, exit 1 do thiếu package và React typings | `reports/cp73/production-build.log` |
| CP73 live QA preflight | **BLOCKED**, exit 2; không có `.env.local` demo, Firebase CLI/Emulator, hoặc server React | `reports/cp73/mvp-gate.json`, `reports/cp73/mvp-preflight.log` |
| Firebase Rules Emulator | **NOT RUN** | Cần Firebase CLI, Java và cài đầy đủ package |
| React browser E2E 12 ca | **0/12 NOT RUN** | Không suy diễn từ unit tests |
| MVP production | **NOT ACCEPTED** | Không có nghiệm thu hoàn chỉnh của workflow lưu/đọc dữ liệu |

**Lưu ý định lượng:** số dòng TAP `ok` không bằng số bài kiểm thử độc lập; có nested TAP. Các test synthetic không phải xác nhận hiệu quả AI/ML hay bảo mật Firebase production.

## Tiêu chí MVP còn mở

1. Khôi phục `npm ci && npm run build` trên Node 22 có npm registry.
2. Chạy Firestore Emulator trên candidate Rules CP69, kiểm tra quyền, UID, đồng ý dữ liệu, giao dịch Atlas hai thiết bị.
3. Dùng tài khoản QA synthetic trên Auth/Firestore Emulator để hoàn thành đăng ký → đồng ý dùng sản phẩm → Seed → Lumen → Atlas → Orion → Pulse → Haven → quay về Seed. Kiểm tra ghi–đọc lại sau tải lại trang và hai phiên trình duyệt. Bộ E2E CP68 hiện chỉ đánh giá 12 ca UX/SPA, nên cần thêm ca nghiệp vụ để nghiệm thu đầy đủ.
4. Có chứng cứ phiên bản deploy, giới hạn khoa học, dữ liệu nguồn và kiểm tra browser desktop/mobile.

**Kết luận:** CP73 là **ứng viên mã nguồn, chưa phải MVP đã nghiệm thu**. Hạng mục này là một cải tiến nền tảng thực chất, không phải tăng checkpoint để thay thế kiểm thử thật. Không triển khai Rules CP69 lên Firebase production từ báo cáo này.
