# CLA(7) — kết quả kiểm thử trong môi trường kiểm toán (08/11/2026)

Các lệnh chạy trong `/mnt/data/CLA7_AUDIT_20261108/CLA` sau khi tách sạch source từ `CLA(7).zip`:

| Test | Command | PASS/FAIL |
|---|---|---|
| Cấu trúc | `node tools/check-cla-layout.cjs` | **PASS** 22 file bắt buộc, 11 đường dẫn cũ không còn |
| Bảng điểm | `node tests/academic.test.cjs` | **PASS 14/14** |
| Cognitive observed/missing | `node tests/cognitive-observation.test.cjs` | **PASS 4/4** |
| Điều hướng tĩnh | `node tests/admin-deeplink.test.cjs` | **PASS 8/8** |
| Hợp đồng Rules tĩnh | `node --test tests/cp21.rules.contract.test.cjs` | **PASS 12/12** |
| Cổng dữ liệu nghiên cứu | `python -m unittest discover -s tests -p 'test_research_scope.py' -v` | **PASS 4/4** |
| Benchmark manifest | `python research/src/validate_benchmark.py` | **PASS** 120 template, 7 nhóm; *không có điểm model* |
| Cú pháp công cụ Node | `node --check tools/{check-cla-layout,doctor-cp22,split-css}.cjs` | **PASS** |

Không thể xác nhận trong container này: `npm ci`, TypeScript/Vite full build lại, 33 ca Emulator, frontend/browser E2E, CI GitHub, deployment. Log Windows trong hội thoại trước đó đã có Vite build PASS và npm audit 0; đó là bằng chứng **trước khi chuẩn hóa bố cục**, không phải kết quả mới. Công cụ PowerShell mới được rà soát tĩnh, chưa được chạy trên Windows tại thời điểm xuất gói.

Nguyên nhân crash Emulator theo `firestore-debug.log` trong ZIP: đường dẫn Unicode `C:\Gạo\...` bị Java đọc thành `C:\G?o\...`, `FileNotFoundException`. Script mới `tools/RUN_FIRESTORE_ASCII.ps1` khắc phục bằng cách chạy bộ test ở bản sao chỉ có đường dẫn ASCII; phải kiểm chứng thực tế trên Windows.

**Tuyệt đối không Publish Rules ứng viên cho production chỉ dựa trên kiểm thử tĩnh.**
