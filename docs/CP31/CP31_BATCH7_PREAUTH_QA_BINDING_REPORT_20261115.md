# CP31 Batch 7 — Pre-auth Firebase QA binding and source-entry integrity

**Ngày:** 15/11/2026. **Cơ sở:** CP31 Batch 6 full source. Không triển khai production, không tạo tài khoản hay truy cập dữ liệu học sinh.

## Mục đích

Khắc phục rủi ro tại CP31 Batch 6: runner kiểm tra Firebase Project ID của website staging **sau khi đã nhập email/mật khẩu Admin QA**. Bản Batch 7 yêu cầu kiểm tra project ID được website phục vụ từ `index.html` **trước khi thu thập mật khẩu**, áp dụng cho localhost và staging HTTPS. Đây là hàng rào vận hành có thể tái lập, không phải chứng thực độc lập chống website giả mạo.

## Thay đổi mã nguồn

1. `index.html` cung cấp marker công khai `<meta name="cla-firebase-project-id" content="%VITE_FIREBASE_PROJECT_ID%" />`; Vite thay biến môi trường trong HTML được phục vụ. Project ID không phải API key/token, không chứa dữ liệu học sinh.
2. `tools/cp31_browser_e2e.py` thêm `qa_preflight`: kiểm tra ID từ `.env` (localhost), fetch HTML tại đúng origin với redirect bị cấm, HTTP 200 HTML, HTML tối đa 128 KiB, duy nhất một marker, giá trị marker đúng project được khai báo. Nếu sai, dừng **trước khi hỏi mật khẩu**. Tiếp theo xác nhận Playwright Chromium đã cài.
3. `--preflight` riêng: kiểm tra website và Chromium **không yêu cầu email/mật khẩu, không ghi lại report browser**, không chạy E2E. `--check-config` vẫn chỉ là source/manifest check.
4. `tools/cp31_release_fingerprint.cjs` bổ sung `index.html` vào các file được bảo vệ bằng fingerprint; checksum mới ghi tại `src/lib/nexusEvidenceBaseline.ts`. Không thay Firestore Rules.
5. Script npm mới `test:cp31:batch7`, `verify:cp31:batch7`, `qa:cp31:preflight`, `qa:cp31:browser`.
6. Kiểm thử tình huống: Project ID sai, thiếu marker, marker không thay biến, marker lặp, HTTP redirect sang host khác, HTTP lỗi, content type sai, HTML vượt giới hạn, `.env` không khớp và Chromium chưa cài. Không dùng tài khoản Firebase thật.

## Các cổng kiểm thử

| Cổng | Trạng thái | Phạm vi |
|---|---|---|
| CP31 Batch 7 Node tests | PASS 7/7 | Source contract, đánh giá marker/fingerprint/luồng |
| CP31 Batch 7 Python tests | PASS 9/9 | HTTP fixture cục bộ, fail-closed, không kiểm tra Firebase đăng nhập |
| CP31 Python tests Batch 6 + cũ | PASS 18/18 | Report 72 ca, URL, role config |
| CP31 Batch 6 Node tests | PASS 7/7 | Regression trên runner preflight mới |
| CP31 Batch 4 tests | PASS 20/20 | Fingerprint cập nhật khớp baseline |
| CP31 Batch 5 tests | PASS 33/33 | Governance không hồi quy |
| Chuỗi `verify:cp31:batch7` | CHƯA PASS HOÀN TẤT TẠI ĐÂY | Regression dài vượt giới hạn thực thi; thực hiện lại trên Windows |
| Playwright Chromium E2E 72 ca với QA accounts | **NOT TESTED** | Không có website/4 account QA thực, không đánh dấu PASS |
| Production deploy/backup/rollback | **NOT TESTED** | Chưa có CI/deploy evidence |

Bộ kiểm thử Python bao gồm 9 ca mới và 18 ca từ Batch 6, tổng 27; không có ca bị skip. Script Python thử chặn trước credentials bằng máy chủ HTTP fixture cục bộ. **Không thể dùng HTTP fixture để suy ra 72 E2E thực đạt PASS.**

## Thực hiện trên Windows

Áp dụng patch Batch 7 **chỉ lên full source Batch 6** (không áp dụng lên Batch 5), hoặc giải nén full source Batch 7 vào thư mục dự án mới để tránh xung đột chỉnh sửa cá nhân.

**Terminal A** (chỉ dùng Firebase project QA riêng đã tạo và cấu hình `.env.local`, không dùng dữ liệu production):

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm ci
npm run dev -- --host 127.0.0.1
```

**Terminal B** (không nhập password khi preflight):

```powershell
cd 'C:\Gạo\Cognitive-Learn'
python -m pip install playwright
python -m playwright install chromium
$env:CLA_E2E_QA_PROJECT_ID = 'FIREBASE_PROJECT_ID_QA_THAT'
npm run qa:cp31:preflight
if ($LASTEXITCODE -ne 0) { throw 'QA PROJECT PREFLIGHT BLOCKED' }
```

Nếu `PREFLIGHT PASS`, có thể tiếp tục cấu hình bốn **email QA hợp lệ, khác nhau**, cùng `$env:CLA_E2E_QA_ACK='I_USE_SYNTHETIC_QA_ACCOUNTS'`, rồi chạy:

```powershell
$env:CLA_E2E_ADMIN_EMAIL = 'EMAIL_QA_ADMIN'
$env:CLA_E2E_STUDENT_EMAIL = 'EMAIL_QA_STUDENT'
$env:CLA_E2E_TEACHER_EMAIL = 'EMAIL_QA_TEACHER'
$env:CLA_E2E_PARENT_EMAIL = 'EMAIL_QA_PARENT'
$env:CLA_E2E_QA_ACK = 'I_USE_SYNTHETIC_QA_ACCOUNTS'
npm run qa:cp31:browser
if ($LASTEXITCODE -ne 0) { throw '72 BROWSER CASES FAILED/BLOCKED' }
npm run audit:cp31:browser
if ($LASTEXITCODE -ne 0) { throw 'EVIDENCE GATE FAILED' }
'CP31_72_BROWSER_QA_PASS'
```

Mật khẩu được nhập qua prompt ẩn, không qua chat, không được đưa vào repo. 72/72 browser PASS cần project QA và tài khoản thật; không thay bằng `--check-config` hay báo cáo giả.

## Giới hạn an toàn

HTML marker chỉ xác định giá trị project ID được **site tự công bố**; không chống website cố ý giả mạo marker, không xác minh quyền truy cập server Firestore và không chứng minh production rollout. Site staging chỉ có thể chạy với HTTPS đúng allowlist. Firebase QA phải được người vận hành xác nhận là tách biệt production.

**Điều kiện đóng CP31:** bảo toàn log chạy 72 ca thật theo báo cáo sạch `reports/e2e/cp31_browser_gate.json`; có kết quả build/Emulator Windows tương ứng cùng commit; reviewer xác nhận vai trò/consent và evidence không bị khai man.
