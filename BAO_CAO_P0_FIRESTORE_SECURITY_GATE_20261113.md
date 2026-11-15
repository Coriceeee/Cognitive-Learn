# CLA — Báo cáo tiến độ: P0 Firestore Security Gate
Ngày: 13/11/2026  •  Nền: `CLA_FULL_SOURCE_ATLAS_OFFICIAL_PATHWAYS_20261113.zip`  •  Chế độ: sửa và kiểm thử source; KHÔNG deploy

## Kết luận

Bản này giải quyết một lỗ hổng trong **quy trình kiểm chứng an toàn**, không tuyên bố đã vá được an toàn dữ liệu ở production. Trước đây CLA có 42 ca kiểm thử Firestore Emulator nhưng việc chạy trên Windows phụ thuộc Firebase CLI, Java, thư viện cài đủ, và script PowerShell có thể truyền lại sai mã thoát khi dùng pipeline. Các Rules trong `firestore.rules.CANDIDATE_CP21` **chưa được chứng minh** là Rules của dự án Firebase thực tế; `firebase.json` hiện chỉ cấu hình Hosting.

Đã bổ sung **Security Gate fail-closed**: cố định demo project, rules candidate, loopback host, tự chạy smoke test trước, chạy emulator khi đủ điều kiện, xuất kết quả máy đọc được `PASS / FAIL / BLOCKED` và mã SHA-256 của Rules. Không có bất kỳ `firebase deploy` nào.

## Phạm vi sửa (không sửa business logic)

| File | Thay đổi |
|---|---|
| `tools/firestoreSecurityGate.cjs` | **Mới**: bộ chạy gate đa nền tảng, xác minh config, phụ thuộc, môi trường, tạo báo cáo + log |
| `tests/firestore-security-gate.test.cjs` | **Mới**: 11 bài test an toàn của bộ chạy, chặn prod/host ngoài, xử lý trạng thái |
| `tests/firestore.rules.cp21.test.mjs` | Kiểm tra `FIRESTORE_EMULATOR_HOST` chỉ trỏ loopback trước khi `initializeTestEnvironment` |
| `package.json` | `test:rules:emulator` sử dụng gate, thêm `test:rules:preflight`, `test:rules:gate-unit`, đưa 11 test mới vào `npm test` |
| `RUN_RULES_CHECKPOINT21.ps1` | Sử dụng Node gate, truyền đúng mã thoát; bỏ yêu cầu thủ công sai phiên bản SDK |
| `.gitignore` | Không đưa log/JSON kết quả emulator địa phương vào source |
| `START_HERE_P0_FIRESTORE_GATE_20261113.md` | **Mới**: hướng dẫn Windows, cách đọc status, điều kiện nghiệm thu |
| `BAO_CAO_P0_FIRESTORE_SECURITY_GATE_20261113.md` | **Mới**: báo cáo kiểm toán và tiến độ |

## Kiểm thử thực tế trong môi trường đóng gói

| Kiểm tra | Kết quả |
|---|---|
| Unit tests Security Gate | **11/11 PASS** |
| `npm test` toàn dự án (bao gồm 11 test mới) | **PASS** |
| Firestore Rules static contracts | **15/15 PASS** |
| `npm run check:layout` | **PASS** |
| Node syntax Security Gate và tests | **PASS** |
| `npm run test:rules:preflight` | **BLOCKED, đúng thiết kế**: thiếu Firebase CLI, `firebase`, `@firebase/rules-unit-testing` tại môi trường đóng gói |
| 42 Firestore Emulator authorization test cases | **CHƯA CHẠY**: không có CLI/dependencies |
| Production build | **CHƯA XÁC NHẬN ở môi trường đóng gói** (ZIP không kèm dependencies) |
| Firebase production rules, dữ liệu thật, browser E2E | **CHƯA XÁC MINH** |

`BLOCKED` không phải `PASS`, không được chuyển thành chứng chỉ an toàn. Rules candidate không tự được triển khai trên production.

## Tiến độ dự án

- Mốc đã có source patch theo cách đếm hiện hành: **6/28 = 21,4%** (02–07); bản bổ sung này là checkpoint P0 riêng, không tự tăng số bước hoàn thành.
- Bộ checklist quản lý: **164 mục**, chưa có mục nghiệm thu cuối nào được cộng thêm qua lượt này.
- **P0-1 trạng thái: có công cụ kiểm định và unit tests PASS, kiểm định Firestore Emulator chưa chạy nên CHƯA NGHIỆM THU**.
- **P0-2**: luồng consent/assent vị thành niên chưa hoàn thiện.
- **P0-3/P0-4**: các nhãn probability/uncertainty thử nghiệm chưa được chuẩn hóa xuyên prediction/Orion.
- Dữ liệu tuyển sinh từ nguồn chỉ có phạm vi thí điểm; không coi Gemini Reader là cơ quan xác minh.

## Điều kiện để chuyển P0-1 sang PASS thực tế

1. Trên máy Windows đã cài dependencies và Firebase CLI/Java, chạy `npm run test:rules:emulator`.
2. `reports/security/firestore_emulator_gate.json` phải có `overall: PASS`, `emulatorAuthorizationTests: PASS`, cùng Rules SHA-256.
3. Người phụ trách kiểm tra và quyết định triển khai đúng bản Rules; không tự deploy từ assistant hay script kiểm tra.
4. So sánh cấu hình production thực tế và chạy E2E theo vai trò trước khi cho học sinh thật dùng.

**Lượt này không sửa UI**: đây là bước ngăn phát triển tính năng lên môi trường có nguy cơ lộ dữ liệu chưa được xác minh.
