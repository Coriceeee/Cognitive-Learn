# COGNITIVE LEARN AI — CP31 Batch 6: Nexus Browser Evidence Gate

Ngày lập: 15/11/2026. Nền phát triển: **CLA_FULL_SOURCE_CP31_BATCH5_GOVERNANCE_20261115.zip** (CP31 Batch 5, đã có build PASS qua log Windows của người dùng).

## 1. Điều chỉnh có mã nguồn

1. **Sửa lỗi API Playwright mobile**: thay lệnh không tồn tại `BrowserContext.set_viewport_size` bằng `Page.set_viewport_size`, giữ phiên đăng nhập khi chuyển viewport 390×844 và trở lại desktop.
2. **Không tái sử dụng PASS cũ**: ngay khi bắt đầu chạy thật, `reports/e2e/cp31_browser_gate.json` được thay bằng trạng thái `BLOCKED`; nếu thiếu QA project, tài khoản, trình duyệt hoặc Admin đăng nhập thất bại thì không thể dùng báo cáo PASS cũ.
3. **Gate đủ 72 ca duy nhất**: danh mục sinh ra từ 7 cụm, 22 thẻ, 22 trang diagnostics, 12 thao tác kiểm tra, 6 ca lõi và 3 vai trò bị chặn. Ghi rõ `PASS`, `FAIL`, `NOT RUN` trên từng ca; hoàn tất 72/72 mới được đóng PASS.
4. **Kiểm tra Firebase QA project**: với Vite local, so project ID khai báo trong `.env.development.local`/`.env.local`/`.env.development`/`.env` với `--qa-project-id`; sau khi Admin đăng nhập, kiểm tra project ID do `db.app.options.projectId` hiển thị trong giao diện diagnostics trước khi chạy các ca sâu. Đây là hàng rào vận hành, chưa phải xác nhận độc lập một môi trường là QA.
5. **Báo cáo sạch và nguyên tử**: chỉ chứa ID ca, kết quả, loại lỗi, tên project QA, thời gian UTC, manifest/runner SHA-256; không lưu email, password, UID, token, nội dung trang, trace, video hoặc screenshot. Báo cáo được ghi bằng file tạm rồi `os.replace`.
6. **Kiểm toán bằng chứng độc lập**: `python tools/cp31_browser_gate.py` xác minh 72 ca đúng thứ tự, timestamp <=72h, manifest/runner SHA và số lượng ca PASS; từ chối báo cáo cũ hoặc thiếu dữ liệu. Đây là **kiểm tra nhất quán báo cáo do runner tạo**, KHÔNG chứng minh không thể giả mạo hoặc đã deploy production.
7. **Không đóng gói report runtime**: `.gitignore` bổ sung `reports/e2e/`; ZIP release loại bỏ output QA runtime. Giữ nguyên Rules production và các mã chức năng học sinh.

## 2. Bằng chứng kiểm thử thực sự trong môi trường tạo bản vá

| Gate | Kết quả | Giới hạn |
|---|---|---|
| 7 Node contract tests Batch 6 | PASS 7/7 | Source contract, KHÔNG chạy browser |
| 14 Python report-gate tests Batch 6 | PASS 14/14 | Thử đủ 72, thiếu ca, trùng ca, manifest giả, timestamp cũ, QA config |
| 4 Python tests cấu hình cũ | PASS 4/4 | Kiểm thử cấu hình URL/role |
| CP31 Batch 4 tests | PASS 20/20 | Regression sau khi cập nhật contract dùng chung |
| CP31 Batch 5 tests | PASS 33/33 | Cũ không bị hồi quy |
| CP31 Batch 2 contract | PASS | Kiểm tra 7 cụm/22 thẻ và E2E runner |
| Layout source | PASS | 22 file bắt buộc |
| `--check-config` | PASS cấu hình 7/22/72 | **Không** chạy browser |
| Thiếu QA project ID/cấu hình local | BLOCKED exit 2 | Chủ động chặn browser và thay báo cáo PASS cũ |
| Audit báo cáo E2E chưa chạy thật | BLOCKED exit 1 | Không có bằng chứng 72/72 |
| `verify:cp31:batch6` toàn chuỗi | CHƯA XÁC NHẬN TẠI ĐÂY | Chuỗi regression dài bị giới hạn thời gian; cần chạy Windows |
| `npm run build`, Firestore Emulator | Cần nghiệm thu lại sau thay đổi này | Log Windows trước thuộc Batch 5 |
| 72 ca browser Playwright với QA thật | **CHƯA CHẠY** | Cần 4 account QA và Firebase project tách biệt |

**Lưu ý:** 21/21 kiểm thử mới không phải 72/72 browser E2E. Không sinh kết quả giả, không lưu credentials.

## 3. Các cổng release

Cục bộ, không đòi tài khoản QA:

```powershell
npm ci
npm run test:cp31:batch6
npm run verify:cp31:batch6
npm run build
npm run test:rules:emulator
npm run verify:cp37
```

Thử browser bằng **Firebase QA riêng**, không dùng dữ liệu học sinh hoặc tài khoản production:

Terminal A: kiểm tra file `.env.local` có `VITE_FIREBASE_PROJECT_ID` đúng **QA project**, rồi:

```powershell
npm run dev -- --host 127.0.0.1
```

Terminal B (PowerShell; giữ bí mật mật khẩu; thay `example.test` bằng email QA thật):

```powershell
python -m pip install playwright
python -m playwright install chromium
$env:CLA_E2E_QA_ACK = 'I_USE_SYNTHETIC_QA_ACCOUNTS'
$env:CLA_E2E_QA_PROJECT_ID = 'ID_DU_AN_FIREBASE_QA_THAT'
$env:CLA_E2E_ADMIN_EMAIL = 'admin-qa@example.test'
$env:CLA_E2E_STUDENT_EMAIL = 'student-qa@example.test'
$env:CLA_E2E_TEACHER_EMAIL = 'teacher-qa@example.test'
$env:CLA_E2E_PARENT_EMAIL = 'parent-qa@example.test'
python tools/cp31_browser_e2e.py --check-config
python tools/cp31_browser_e2e.py --base-url http://127.0.0.1:5173 --prompt-passwords
if ($LASTEXITCODE -ne 0) { throw 'BROWSER QA FAILED/BLOCKED' }
npm run audit:cp31:browser
if ($LASTEXITCODE -ne 0) { throw 'E2E EVIDENCE FAILED/BLOCKED' }
```

Thay địa chỉ email và project ID bằng **thông tin QA riêng**, không dán mật khẩu vào chat. `--prompt-passwords` dùng `getpass` để nhập mật khẩu ẩn, không lưu trong báo cáo.

## 4. Kiểm thử browser và giới hạn khoa học

- **72 ca** là acceptance E2E về **đăng nhập, điều hướng, trạng thái diagnostics và phân quyền client/server**; không có ca nào tự chứng minh 22 nghiệp vụ đã đạt yêu cầu hội đồng.
- Một ca chẩn đoán có dòng `NOT TESTED` **có thể** PASS E2E nếu ứng dụng hiển thị trung thực phạm vi chưa xác minh. Không được đổi `NOT TESTED` thành giả định nguồn trường/học bổng hoặc mô hình được xác thực.
- Dù 72/72 browser PASS cũng không chứng minh quy tắc production, độ chính xác mô hình trên học sinh Việt Nam, hiệu quả can thiệp hoặc phép thử rollback đã được xác nhận.
- Bước đóng nghiệm thu CP31 cần reviewer có quyền xem log browser, Firebase Emulator, build artifact, chứng cứ deployment và kết quả rà soát đúng phiên bản.
