# CLA CP83 — Chẩn đoán nghiệm thu và sửa vòng lặp snapshot

Ngày: 22/11/2026. Xuất phát từ log CP82 trên `C:\Gạo\Cognitive-Learn`, lượt `run-20261122-152101`.

## Bằng chứng thực tế từ máy người dùng (CP82)
- PASS 11, FAIL 3, BLOCKED 0, NOT_RUN 0.
- PASS: snapshot trước test, layout, build production, npm test, CP82 ops, Rules static, generate+verify replay tổng hợp, OULAD, cognitive validation, adaptive study.
- FAIL: Firestore Emulator, ML environment, `research/tests`.
- ML environment lỗi rõ ràng `UnicodeEncodeError` khi Python 3.11/cp1252 in đường dẫn có dấu, nên bước này chưa chứng minh thư viện ML có lỗi hay không.
- Các lỗi con của `research/tests` cần đọc log đầy đủ (dòng `FAILED (errors=3)` không chứng minh được nguyên nhân cụ thể).
- Emulator gate báo FAIL, chưa đủ dữ liệu để kết luận Java/port/permission/tests; cần `reports/security/firestore_emulator_gate.json`, `.log` và debug logs.

## Thay đổi CP83
1. `tools/verify-cp83-snapshot.cjs`/`CP83_SOURCE_MANIFEST.json`: xác minh SHA-256 nguồn bất biến, từ chối component vai trò cũ; chỉ loại khỏi manifest ba báo cáo có thể ghi lại trong chính hành trình test CP82.
2. `tools/cla_cp82_ml_preflight.py`: buộc stdout/stderr UTF-8 với backslash fallback và ghi tên Python thực dùng vào JSON; mọi import được chạy subprocess độc lập; không coi kết quả import là giá trị khoa học.
3. `CLA_CP83_ONECLICK.ps1` + `.cmd`: nghiệm thu trên dự án CP83; kiểm tra snapshot cả trước và sau; nếu ML preflight bị chặn thì gắn BLOCKED cho test ML phụ thuộc, vẫn chạy nghiên cứu độc lập; không ép PASS.
4. `tools/cla_cp83_emulator_triage.cjs`: đọc báo cáo Emulator, phân loại dấu hiệu theo log hiện có; chỉ chẩn đoán, không tự chữa Rules hay deploy.
5. `tests/cp83-snapshot-regression.test.cjs`: kiểm tra bảo vệ nguồn, cho phép thay đổi báo cáo tái tạo, từ chối tệp role cũ và path traversal.

## Phạm vi không làm
- Không chỉnh giao diện hay tên màu sáu phân hệ SEED/LUMEN/ATLAS/ORION/PULSE/HAVEN.
- Không bổ sung LMM; giữ ML, LLM Gemini, XAI và Adaptive.
- Không sửa hash hoặc biến replay giả lập thành xác nhận hiệu quả khoa học; không sửa luật Firebase production.
- Không deploy, không xử lý dữ liệu học sinh thật, không tắt chính sách bảo mật Windows.

## Những điều CP83 chưa chứng minh
- `rules_emulator` phải chạy thành công trên Windows và kiểm thử authorization mới đủ điều kiện PASS.
- Python ML trên máy người dùng phải nhập đủ numpy/pandas/scipy/sklearn/xgboost; lỗi policy hoặc DLL vẫn có thể BLOCKED.
- Build CP83, `npm test` CP83 và E2E trình duyệt chỉ được xác nhận sau khi chạy trên máy người dùng. Những phép kiểm tra cục bộ Linux không thay thế điều đó.
- Chưa có chứng minh hiệu quả nghiên cứu thực nghiệm, psychometrics hoặc độ phủ trường toàn quốc.

## Cách sử dụng trong thư mục gốc đã trộn CP82
ZIP CP83 có tiền tố `Cognitive-Learn/`; giải nén vào `C:\Gạo` sẽ ghi đè các tệp cùng tên trong dự án CP82 hiện tại. Hãy sao lưu các thay đổi riêng nếu có; **không** xóa hay mirror `/MIR` thư mục. Không đưa `.env.local` từ ZIP vào máy.

```powershell
$zip = Join-Path $env:USERPROFILE 'Downloads\Cognitive-Learn-CP83-FULL-DIAGNOSTIC-20261122.zip'
if (-not (Test-Path -LiteralPath $zip)) { throw 'Khong tim thay ZIP CP83' }
Expand-Archive -LiteralPath $zip -DestinationPath 'C:\Gạo' -Force
Set-Location 'C:\Gạo\Cognitive-Learn'
node tools/verify-cp83-snapshot.cjs
if ($LASTEXITCODE -ne 0) { throw 'Source CP83 FAIL: dung lai' }
npm run check:layout
if ($LASTEXITCODE -ne 0) { throw 'Layout FAIL: dung lai' }
.\CHAY_NGHIEM_THU_CP83.cmd
```

Sau khi chạy, các báo cáo được lưu tại `reports/acceptance-cp83/run-YYYYMMDD-HHMMSS`. Hãy mở `SUMMARY.md`, `logs/*ml_environment*`, `logs/*python_research*`, `firestore_emulator_gate.json` và `firestore_emulator_gate.log`. **Đọc và che thông tin nhạy cảm trước khi gửi.**

Đây là bản hotfix chẩn đoán/nghiệm thu, không phải cam kết toàn dự án sẵn sàng production.
