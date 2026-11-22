# COGNITIVE LEARN AI CP79 — Bộ lệnh nghiệm thu trên Windows (22/11/2026)

## Mục tiêu

Đánh giá toàn bộ dự án theo hai bảng độc lập (website A–J 100 điểm; nghiên cứu R1–R10 100 điểm). Bộ script thực hiện **kiểm thử kỹ thuật**, tạo log để người kiểm toán chấm tiêu chí; không tự suy luận đạt 100 điểm hoặc có hiệu quả thực nghiệm.

**Nguồn được đối chiếu:** `package.json`, `.github/workflows/cla-cp21-verify.yml`, `firebase.emulator.cp21.json`, `tools/firestoreSecurityGate.cjs`, `tools/cp73_mvp_gate.py` từ ZIP CP79. Không đổi tên giao diện và không triển khai production.

## 1. Chuẩn bị bản thử nghiệm độc lập (PowerShell)

```powershell
# Chỉnh đường dẫn ZIP đúng theo máy của bạn.
$Zip = "$env:USERPROFILE\Downloads\Cognitive-Learn-CP79-Gradient-Sang-20261122.zip"
$QA = 'C:\CLA_CP79_QA'
Expand-Archive -LiteralPath $Zip -DestinationPath $QA -Force
Set-Location "$QA\Cognitive-Learn"

# Tải file CLA_CP79_NGHIEM_THU_TOAN_BO.ps1 từ phần đính kèm câu trả lời,
# rồi chép vào C:\CLA_CP79_QA\Cognitive-Learn.
node --version
npm --version
python --version
java -version
firebase --version
```

Yêu cầu: Node.js **22.x**, Python **3.11+**, Java **21+**, Firebase CLI (để chạy emulator), internet cho `npm ci`, và PowerShell trên Windows. Nếu cần cài Firebase CLI: `npm install -g firebase-tools`. Không đăng nhập/deploy Firebase production để chạy bộ thử nghiệm này.

## 2. Nghiệm thu bằng một lệnh

```powershell
# Chạy kiểm tra lõi, build, kiểm thử hồi quy, các nhóm nghiên cứu kỹ thuật.
.\CLA_CP79_NGHIEM_THU_TOAN_BO.ps1

# Nếu muốn chạy toàn bộ script test: trong package.json (trừ browser/emulator),
# rồi kiểm tra quyền Firestore trong emulator, nên dùng:
.\CLA_CP79_NGHIEM_THU_TOAN_BO.ps1 -SkipInstall -AllTests -WithEmulator -WithResearchDemos

# Nếu môi trường lần đầu chưa cài, bỏ -SkipInstall để npm ci chạy lại.
```

Nếu Windows chặn `.ps1`, hãy đọc nội dung script trước, rồi có thể chạy tạm ở phạm vi một process:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\CLA_CP79_NGHIEM_THU_TOAN_BO.ps1 -AllTests -WithEmulator
```

Script **không dừng khi một test FAIL**, lưu `reports/acceptance/CP79-YYYYMMDD-HHMMSS/status.csv`, `status.json`, và từng file `.log` để xác định lỗi riêng.

## 3. Các lệnh chạy tay theo nhóm

```powershell
# Dependency, repo layout, TypeScript và bản production build
npm ci --no-audit --no-fund
npm run check:dependencies
npm run check:layout
npm run typecheck:api
npm run build

# Toàn bộ test npm; nếu lỗi, script nghiệm thu ở trên sẽ chạy tách từng nhóm
npm test

# Bảo mật quy tắc và kiểm thử tĩnh
npm run test:rules:static
npm run test:rules:v5:static
npm run test:rules:gate-unit

# Phần sản phẩm và UX hiện tại
npm run test:cp79:theme
npm run test:cp78:clarity
npm run test:cp76:names
npm run test:cp75:ux-audit
npm run test:cp70:journey
npm run test:cp71:unified-nav
npm run test:cp72:lumen-fallback
npm run test:cp73:mvp
npm run test:cp69:firebase-integration
npm run test:cp56:navigation:integration
npm run test:cp52:multidevice
npm run test:cp47:orion-autosave

# Demo closed-loop, chỉ dùng để chứng minh kỹ thuật
npm run demo:gate
npm run demo:backup
npm run research:golden-path
npm run research:golden-path:verify
npm run research:multi-cycle
npm run research:multi-cycle:verify
npm run research:measurement
npm run research:measurement:verify

# Nghiên cứu: các bộ unit test (không chứng minh thực nghiệm học sinh THPT)
python -m unittest discover -s research/oulad/tests -v
python -m unittest discover -s research/cognitive_validation/tests -v
python -m unittest discover -s research/adaptive_study/tests -v
python -m unittest discover -s research/huggingface/vnhsge_benchmark/tests -v
python -m unittest discover -s research/tests -v
python -m unittest discover -s tests -p 'test_research_scope.py' -v
python -m unittest discover -s tests -p 'test_cp53_safe_packaging.py' -v
python research/src/validate_benchmark.py
```

`npm audit --omit=dev --audit-level=high` cần kết nối internet, nên là bước bổ sung riêng, không thay thế pentest hay xác minh bảo mật production.

## 4. Firestore Security Rules — chạy EMULATOR, tuyệt đối không deploy

```powershell
# Cần npm ci + Java 21+ + Firebase CLI có sẵn
npm install -g firebase-tools
npm run test:rules:preflight
npm run test:rules:emulator

# Đọc báo cáo chi tiết
Get-Content .\reports\security\firestore_emulator_gate.json
```

**Chú ý:** `test:rules:preflight` cố ý có thể trả về `BLOCKED` vì chưa chạy phép kiểm tra quyền thực trên emulator. Chỉ `test:rules:emulator` với `overall: PASS` là bằng chứng emulator security. File Rules trong gate là `firestore.rules.CANDIDATE_CP21`, không tự xác nhận Rules đang chạy trên production.

## 5. Kiểm tra website trên Chromium thật (QA local, tài khoản GIẢ LẬP)

Tạo bản QA riêng, đừng ghi đè `.env.local` chứa cấu hình thật. Trong thư mục QA:

```powershell
# Chỉ khi .env.local CHƯA TỒN TẠI, và chắc chắn đây là thư mục QA độc lập
if (-not (Test-Path .env.local)) { Copy-Item .env.mvp-qa.example .env.local }
python -m pip install playwright
python -m playwright install chromium
```

Mở **terminal thứ nhất**:

```powershell
firebase emulators:start --project demo-cla-mvp --config firebase.emulator.cp21.json --only auth,firestore
```

Mở **terminal thứ hai** ở cùng thư mục QA:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Tạo tài khoản học sinh **giả lập** trong **Auth Emulator** theo quy trình QA hiện có; không dùng email/mật khẩu học sinh thật. Mở **terminal thứ ba**:

```powershell
$env:CLA_E2E_QA_ACK = 'I_USE_SYNTHETIC_QA_ACCOUNTS'
$env:CLA_E2E_STUDENT_EMAIL = 'student.qa@example.invalid'  # thay bằng email QA đã tạo
$secret = Read-Host 'Nhap mat khau QA student' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:CLA_E2E_STUDENT_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }

python tools/cp73_mvp_gate.py --preflight
python tools/cp73_mvp_gate.py

# Xóa biến mật khẩu ngay khi xong
Remove-Item Env:CLA_E2E_STUDENT_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:CLA_E2E_STUDENT_EMAIL -ErrorAction SilentlyContinue
```

Xem bằng chứng tại `reports/cp73/mvp-gate.json` và `reports/cp73/react-student-e2e.json`. **Ngay cả `QA_TECHNICAL_PASS_NOT_MVP` vẫn chưa đủ để nghiệm thu production.**

## 6. Nghiệm thu thủ công bắt buộc (ngoài các lệnh)

- **6 phân hệ:** đăng nhập → Seed → Lumen → Atlas → Orion → Pulse → Haven; kiểm tra responsive, tab con, nội dung đúng, trạng thái loading/empty/error, Back/Forward và không reload.
- **Firebase:** thử hai thiết bị, lưu–tải–cập nhật, quyền không đọc chéo UID, thu hồi chia sẻ, logout, lỗi mạng.
- **API/Gemini:** endpoint chạy trên môi trường staging có kiểm soát, rate limit, fallback, không lộ khóa, groundedness/abstention. Nếu chưa có kết quả benchmark model thực, ghi NOT TESTED.
- **Tuyển sinh/học bổng:** điểm chuẩn và phương thức xét tuyển theo năm và nguồn chính thức, ngày kiểm tra, độ phủ toàn quốc, cảnh báo nguồn cũ, không gán fit thành xác suất.
- **Nghiên cứu:** quyền sử dụng dữ liệu; outcome thật đủ điều kiện; participant/temporal holdout; SCI/MAS/CSL reliability/validity; static vs adaptive comparator; giới hạn claim, phiên bản mô hình/dataset, kết quả âm tính; nhật ký sử dụng AI.
- **Bảo vệ KHKT:** báo cáo, poster, demo 30 giây/3 phút/10 phút, câu hỏi phản biện, nhật ký nghiên cứu và minh chứng tác giả thực hiện.

Chỉ đánh dấu `PASS` khi có log, bằng chứng, phiên bản dữ liệu và người xác nhận. Không dùng báo cáo test synthetic để gán `PASS` cho hiệu quả thực nghiệm hoặc xác suất đạt giải.

## 7. Khuyến nghị khi gửi kết quả về để đối chiếu

Gửi **`status.csv`, `status.json` và các `.log` lỗi đã được rà soát/xóa thông tin nhạy cảm**. Không gửi `.env.local`, mật khẩu, Firebase service account, nhật ký chứa dữ liệu học sinh hay tập dữ liệu riêng tư.
