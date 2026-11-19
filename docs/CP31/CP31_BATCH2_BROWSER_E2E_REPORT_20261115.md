# CP31 Batch 2 — Nexus browser E2E readiness and navigation safeguards

Ngày: 2026-11-15. Nền: **CP31 Batch 1 full source**, không dựa trên một ZIP khác.

## Phạm vi thay đổi mã nguồn

1. `src/page/nexus/AdminPage.tsx`: thêm `data-nexus-cluster`, `data-nexus-task` và `aria-pressed` cho bộ chọn 7 cụm để kiểm thử UI ổn định, đồng thời cải thiện trạng thái điều khiển cho assistive technology.
2. `src/page/nexus/AdminAuditPage.tsx`: thêm `data-nexus-audit-id` và **không hiển thị 22 kết quả không liên quan** nếu query `task` không hợp lệ; hiện thông báo lỗi tương ứng.
3. `tests/e2e/cp31_nexus_manifest.json`: 7 cụm, đúng 22 thẻ, 10 trang chẩn đoán, 12 thẻ chưa có công cụ, được đối chiếu tự động với `adminConsoleDirectory.ts`.
4. `tools/cp31_browser_e2e.py`: bộ kiểm thử **Playwright/Chromium với xác thực thật** bằng 4 tài khoản QA; không mock Firebase Auth, không sửa dữ liệu Firestore. Gồm **48 phép kiểm dự kiến**: ẩn nội dung khi chưa đăng nhập, Admin login, kiểm toán 22 thẻ, query lỗi, 7 lần bấm nút cụm, 22 lần bấm link tác vụ, 10 trang chẩn đoán, refresh, mobile và 3 vai trò từ chối Admin.
5. `tests/cp31-batch2-e2e-contract.test.cjs` và `tests_cp31/test_browser_gate_config.py`: kiểm thử source contract, drift manifest, fail-closed URL/QA, không được tính là browser E2E.

## Bằng chứng thực sự có trong môi trường này

| Cổng | Kết quả | Giới hạn |
|---|---|---|
| `npm run test:cp31:batch2:contract` | **PASS: 6 Node + 4 Python** | Static/unit, không mở browser |
| `npm run verify:cp31:batch2` | **PASS** | Bao gồm CP31 Batch 1 và regression CP30/CP29 |
| `npm test` | **PASS** | Unit/contract toàn source |
| `python tools/cp31_browser_e2e.py --check-config` | **PASS cấu hình 7/22/10** | In ra `CONFIG ONLY`, KHÔNG mở browser |
| Không khai báo QA ack hoặc tài khoản | **BLOCKED, exit 2** | Fail closed, không PASS giả |
| `npm run build` | **CHƯA PASS** | Môi trường đóng gói thiếu `node_modules`, thiếu module `react` và TypeScript types |
| 86 Firestore Emulator cases | **CHƯA CHẠY** | Chỉ chạy được với Firebase CLI + Java + dependencies |
| `npm run test:cp31:browser` | **CHƯA CHẠY** | Chưa có website QA và 4 tài khoản thử nghiệm trong phiên này |
| Functions Emulator và admin privileged operations | **CHƯA CHẠY** | Không thay đổi backend hoặc cấp quyền production |

**Điều kiện nghiệm thu K16/K17/A4:** phải có file `reports/e2e/cp31_browser_gate.json` từ một lần Playwright thực sự chạy toàn bộ PASS; xác nhận `npm run build`, Firestore Emulator, và rà soát tiêu chí từng nhiệm vụ. Cả 22 thẻ xuất hiện trong UI **không đồng nghĩa** 22 tác vụ nghiệp vụ đã triển khai hoặc được reviewer nghiệm thu.

## Chạy E2E có bảo vệ trên Windows

Chỉ dùng **Firebase QA/demo/staging**, tách khỏi dữ liệu học sinh thật. Tài khoản QA là bốn tài khoản có vai trò Admin, Student, Teacher, Parent thật được tạo qua quy trình hợp lệ của môi trường QA. Không cấp Admin tự động từ giao diện. Không gửi mật khẩu cho người khác hoặc dán vào chat.

Terminal A (sử dụng `.env.local` của **QA project**, không chứa thông tin production):

```powershell
npm ci
npm run dev -- --host 127.0.0.1
```

Terminal B:

```powershell
python -m pip install playwright
python -m playwright install chromium
$env:CLA_E2E_QA_ACK = 'I_USE_SYNTHETIC_QA_ACCOUNTS'
$env:CLA_E2E_ADMIN_EMAIL = 'admin-qa@example.test'
$env:CLA_E2E_STUDENT_EMAIL = 'student-qa@example.test'
$env:CLA_E2E_TEACHER_EMAIL = 'teacher-qa@example.test'
$env:CLA_E2E_PARENT_EMAIL = 'parent-qa@example.test'
# Thay bốn email trên bằng địa chỉ QA có thật, không dùng example.test để đăng nhập.
python tools/cp31_browser_e2e.py --base-url http://127.0.0.1:5173 --prompt-passwords
```

Mật khẩu được nhập bằng prompt **ẩn ký tự**, chỉ lưu trong bộ nhớ tiến trình. Khi thực hiện thành công, script in `CP31 BROWSER E2E: 48/48 PASS`, file `reports/e2e/cp31_browser_gate.json` có kết quả theo ca **không chứa UID, email, mật khẩu, nội dung trang, ảnh chụp hay token**. Nếu thiếu tài khoản/URL không hợp lệ, lệnh dừng với `exit 2` và không tạo báo cáo PASS. Có thể dùng `npm run test:cp31:browser` khi bốn email và mật khẩu QA đã được khai báo qua biến môi trường riêng.

Với staging HTTPS không phải localhost, chỉ cho phép địa chỉ được chỉ định **chính xác**:

```powershell
python tools/cp31_browser_e2e.py --base-url https://cla-qa.example.org --staging-host cla-qa.example.org --prompt-passwords
```

Lệnh trên là cú pháp ví dụ, không phải website tồn tại. Tuyệt đối không trỏ vào Firebase production hay dữ liệu học sinh thật.

## Các chặn nghiệm thu vẫn còn

- Browser E2E, production build, 86 ca Emulator, bảo mật role/consent trên môi trường QA thật.
- 12/22 tác vụ chưa có công cụ trực tiếp và 10 công cụ hiện có vẫn phần lớn chỉ là chẩn đoán đọc dữ liệu; không tự công nhận PASS.
- Chưa làm end-to-end Firebase Functions admin MFA, audit trace, tài khoản bị khóa trong khi session mở, responsive/a11y đa thiết bị thực tế ngoài 390px QA run.

Không thay Firebase Rules, không deploy, không thay default production config.
