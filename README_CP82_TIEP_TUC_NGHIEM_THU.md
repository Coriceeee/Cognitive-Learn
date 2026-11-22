# CLA CP82 — Tiếp tục nghiệm thu toàn hệ thống (22/11/2026)

## Phạm vi

Bản CP82 kế thừa **nguyên toàn bộ mã nguồn CP81**, không đổi giao diện, tên các phân hệ, đường dẫn, thuật toán học lực, Firestore Rules production hay mô hình AI. Không triển khai LMM. Phạm vi AI giữ **ML nghiên cứu + LLM Gemini + XAI + Adaptive Closed-loop**.

Theo log của người dùng, CP81 từ ZIP sạch có **10/13 bước đạt**, gồm `npm ci`, `production_build`, `npm_test_full`, CP40 Student-only, Rules tĩnh, OULAD, nhận thức và Adaptive. Chưa đạt ba gate: `rules_emulator_qa`, `python_environment`, `research_research`. CP82 tập trung vào các nút chặn này mà không làm giả bằng chứng.

## Các thay đổi trong CP82

1. **Sửa cách gọi Firebase CLI Windows** ở `tools/firestoreSecurityGate.cjs`: thay `shell:true` bằng `cmd.exe` cho đúng lệnh `firebase` cố định, không có đầu vào tự do; phát hiện Java cũ, chú thích nguyên nhân khi emulator gặp lỗi, giữ demo project và ứng viên Rules không triển khai production. Đây là sửa lỗi gọi subprocess, **không phải xác nhận Firestore Emulator đã chạy PASS trên máy bạn**.
2. **Chẩn đoán ML theo tiến trình riêng** ở `tools/cla_cp82_ml_preflight.py`: xác định import `numpy`, `pandas`, `scipy`, `sklearn`, `xgboost`, phân biệt thiếu module, Windows App Control, DLL và lỗi khác. Có `research/requirements-cp82-ml.txt` để cài dependency ML nghiên cứu trong venv được phép.
3. **Tái lập kỹ thuật CP82 từ mã nguồn hiện hành**: `tools/cla_cp82_synthetic_replay.mjs` gọi lại ba engine thực Golden Path, Multi-cycle và Measurement với fixtures `SYNTHETIC_ONLY`, gắn mã băm source tree CP82, không sửa mã băm CP31. File kết quả chỉ ghi `TECHNICAL_REPLAY_ONLY`, không coi là validation khoa học hay thử nghiệm học sinh thật.
4. **Bộ nghiệm thu một lệnh** `CHAY_NGHIEM_THU_CP82.cmd` và `CLA_CP82_ONECLICK.ps1` tạo `status.csv`, `status.json`, `SUMMARY.md`, log từng bước; không deploy hay sử dụng tài khoản QA. Nếu một bước FAIL vẫn chạy nhóm độc lập tiếp theo.
5. **Manifest SHA-256** `CP82_SOURCE_MANIFEST.json` và `tools/verify-cp82-snapshot.cjs` phát hiện mã nguồn bị chép đè. Manifest CP81 và CP31 giữ nguyên như bằng chứng lịch sử.
6. **8 test CP82** về replay và hợp đồng an toàn, được thêm vào `npm test`.

## Cách chạy trên Windows — không ghi đè thư mục cũ

Giải nén **ZIP CP82** vào `C:\CLA-CP82\` sao cho `C:\CLA-CP82\Cognitive-Learn\package.json` tồn tại. Không dùng lại `C:\Gạo\Cognitive-Learn` vì log cũ từng chứa file checkpoint lẫn nhau.

```powershell
cd "C:\CLA-CP82\Cognitive-Learn"
node tools/verify-cp82-snapshot.cjs
npm ci --no-audit --no-fund
npm run build
npm test
.\CHAY_NGHIEM_THU_CP82.cmd
```

**Lưu ý:** script one-click sẽ tự `npm ci` nếu chưa có dependencies, nên có thể chỉ chạy `.\CHAY_NGHIEM_THU_CP82.cmd` sau khi xác minh snapshot. Không cần cài lại npm mỗi lần, tránh EPERM do binary Vite bị khóa. Đừng chạy nhiều Vite/Node cùng lúc trong thư mục này.

## Firebase

```powershell
java -version
firebase --version
npm run test:rules:v5:static
npm run test:rules:emulator
Get-Content .\reports\security\firestore_emulator_gate.json -Raw
Get-Content .\reports\security\firestore_emulator_gate.log -Tail 100
Get-Content .\reports\security\firestore_emulator_debug.log -Tail 100 -ErrorAction SilentlyContinue
```

- Project gate cố định: `demo-cla-cp21-security` và file `firestore.rules.CANDIDATE_CP21` chỉ nằm trong Emulator; **không deploy Rules production**.
- Nếu Emulator báo `Fatal error`/exit 1, xem `firestore_emulator_debug.log`, đừng suy đoán test Rules đã FAIL hay PASS.
- Browser QA dùng cấu hình và project demo riêng, chỉ làm sau khi Emulator khởi động thật sự và có tài khoản thử nghiệm; không sao chép `.env.mvp-qa.example` vào thư mục dùng để deploy production.

## ML nghiên cứu

Trong **venv sạch được phép bởi Windows App Control**, chạy:

```powershell
python -m pip install -r research\requirements-cp82-ml.txt
python tools\cla_cp82_ml_preflight.py --check
python -m unittest discover -s research\tests -v
```

Nếu trả `OS_POLICY_BLOCKED`, việc cài lại pip hoặc tắt Defender không phải cách nghiệm thu. Cần môi trường được quản trị viên cho phép. Import PASS không chứng minh độ chính xác ML hay hiệu quả học tập.

## Replay giả lập theo mã nguồn CP82 (KHÔNG PHẢI bằng chứng nghiên cứu)

```powershell
npm run research:cp82:generate
npm run research:cp82:verify
```

File tạo: `reports/evidence/cla_cp82_SYNTHETIC_LOCAL_REPLAY.json`.
CP31 historical golden-path / multi-cycle / measurement gates vẫn bị khóa khi mã nguồn đổi; đừng chỉnh hash CP31 để ép đạt. Bộ CP82 riêng chỉ chứng minh có thể tái lập hành vi kỹ thuật trên dữ liệu tổng hợp.

## Cổng nghiệm thu chưa hoàn tất

- Firebase Emulator authorization thực tế và Browser E2E: **CHƯA XÁC MINH trên Windows QA**.
- Quyền, consent, bảo mật khi phát hành production: **CHƯA NGHIỆM THU**.
- Reliability / validity SCI/MAS/CSL trên mẫu phù hợp: **CHƯA CHỨNG MINH**.
- ML out-of-sample trên mẫu THPT Việt Nam và so sánh Adaptive vs Static: **CHƯA CHỨNG MINH**.
- Gemini live, API và dữ liệu tuyển sinh toàn quốc: **CHƯA NGHIỆM THU ĐẦY ĐỦ**.
- Bản deploy Vercel/Firebase trước đây không tự động cập nhật CP82: **KHÔNG DEPLOY** từ gói này.

Báo cáo tự động: `reports/acceptance-cp82/run-YYYYMMDD-HHMMSS/`. Chỉ gửi log đã che khóa/API token và dữ liệu cá nhân.
