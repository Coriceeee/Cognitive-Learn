# CP31 Batch 4 — Evidence Audits cho Nexus Console

Ngày: **15/11/2026**. Nền đúng: `CLA_FULL_SOURCE_CP31_BATCH3_NEXUS_OPERATIONS_20261115.zip`.

## Phạm vi source và chức năng

Thêm 3 tuyến Admin-only dưới `/admin/diagnostics?view=`: `release`, `seed-rules`, `model-eval`. Giao diện ở `src/page/nexus/AdminDiagnosticsPage.tsx` chỉ xử lý **JSON nội bộ trình duyệt** (tệp 1–262144 byte, không upload, không ghi Firestore). `AccessGate` bảo vệ tuyến và callback phải kiểm tra `users/{ownUid}` từ server có `role=admin, active=true`; callback đến trễ bị vô hiệu hóa khi UID/session thay đổi.

### 1. Release Audit

- Kiểm tra schema `cla.nexus.release-evidence.v1` và source fingerprint với hash **268 file được theo dõi** (`src`, `tests`, `tests_cp31`, `tools`, package và Rules candidate); `nexusEvidenceBaseline.ts` bị loại khỏi fingerprint để tránh tự tham chiếu.
- Đối chiếu metadata CI (status, exit code, commit, HTTPS CI run, artifact SHA), deployment artifact, backup và rollback. Mọi bằng chứng tự khai chỉ **WARN**, không có bằng chứng thì **NOT TESTED**; sai fingerprint hoặc format thì **FAIL**.
- Có CLI tự chạy và xuất preflight source-only. Việc khớp fingerprint không chứng minh artifact đã chạy trên hosting hay quá trình backup/rollback có thực.

### 2. Firestore Rules Audit

- Nhận đúng report `reports/security/firestore_emulator_gate.json` từ `tools/firestoreSecurityGate.cjs`. So SHA-256 với `firestore.rules.CANDIDATE_CP21` đóng gói; kiểm tra project demo, static PASS, emulator PASS, timestamp, và không giả định đã deploy production.
- **Không** suy luận 86/86 từ gate JSON, vì báo cáo gate không liệt kê tổng số assertion. Cần raw Emulator log và reviewer xác nhận role matrix. Không sửa Rules, không gọi Admin SDK.

### 3. Model Evaluation Audit

- Nhận `public/research/oulad-evidence.json` được tạo bằng `npm run research:oulad:publish-evidence` sau khi chạy CP22 audit với archive thật.
- Kiểm tra schema CP23, nguồn UK OULAD, day-30, split train/val/test, test count đủ lớn, checksum archive/features, ROC-AUC/Brier/logloss, brier delta và participant-bootstrap CI.
- Không có dataset archive/OULAD audit tái chạy trong trình duyệt: chỉ kiểm tra sự nhất quán nội tại của JSON. **Calibration curve, bias subgroup, external validation THPT Việt Nam và hiệu quả can thiệp** luôn NOT TESTED.
- Fixture VNHSGE 1 dòng hay báo cáo tổng hợp nhãn synthetic bị từ chối.

## Trạng thái thực thi tại máy kiểm tra

| Cổng | Kết quả | Giới hạn |
|---|---|---|
| `npm run test:cp31:batch4` | **20/20 PASS** | Functional/negative cases của ba parser và contract UI |
| `npm run verify:cp31:batch4` | **PASS** | Gồm `verify:cp31:batch3`, `npm test`, các hồi quy CP29/30 và layout |
| `tsc --noEmit ... src/lib/nexusEvidenceAudits.ts ...` | **PASS** | Typecheck chỉ hai mô-đun TS độc lập |
| `python tools/cp31_browser_e2e.py --check-config` | **CONFIG PASS** | 7 cụm, 22 tác vụ, 16 diagnostics, **không chạy trình duyệt** |
| `npm run audit:cp31:evidence` | **PREFLIGHT PASS** | Source fingerprint khớp, ba nguồn bằng chứng đang NOT TESTED |
| `npm run build` | **BLOCKED** | Không có node_modules và type definitions React/Firebase trong sandbox; build chưa nghiệm thu |
| Firestore Emulator | **NOT RUN** | 86 ca chờ Windows/Firebase CLI/Java |
| Browser E2E | **NOT RUN** | **60 ca dự kiến**, đòi hỏi QA origin và 4 role accounts giả lập |
| Production CI/deploy/backup/rollback | **NOT TESTED** | Không có chứng cứ ngoài JSON tự khai |
| Reviewer chấp thuận | **0 bổ sung** | Source và local PASS không tự chứng thực reviewer PASS |

Sau Batch 4: **16/22** tác vụ có công cụ chẩn đoán giới hạn; **6/22** chưa có công cụ; **0/22** tự được nâng reviewer PASS.

## Hướng dẫn chạy Windows (PowerShell)

```powershell
npm ci
npm run test:cp31:batch4
npm run verify:cp31:batch4
npm run test:rules:emulator
npm run verify:cp37
"FINAL_EXIT_CODE=$LASTEXITCODE"
```

### Phát hành báo cáo metadata nguồn để nhập vào Nexus

```powershell
node --experimental-strip-types tools/cp31_evidence_preflight.mjs --write-local
node --experimental-strip-types tools/cp31_evidence_preflight.mjs --release reports/nexus/cp31_release_local_preflight.json
```

Mở `/admin/diagnostics?view=release`, chọn file JSON trong `reports/nexus/`. File do script tạo chỉ xác nhận source fingerprint; CI, deploy, backup, rollback vẫn **NOT TESTED**.

### Bằng chứng Firestore sau khi chạy Emulator

```powershell
node --experimental-strip-types tools/cp31_evidence_preflight.mjs --rules reports/security/firestore_emulator_gate.json
```

Mở `/admin/diagnostics?view=seed-rules`, nhập file JSON trên. Hash candidate khớp và báo cáo tự ghi PASS **không thay thế ma trận 86 assertion / deployment proof**.

### Bằng chứng nghiên cứu sau khi có OULAD gốc

```powershell
npm run research:oulad:audit
npm run research:oulad:publish-evidence
node --experimental-strip-types tools/cp31_evidence_preflight.mjs --model public/research/oulad-evidence.json
```

Chỉ làm bước này nếu các tệp OULAD thật và data permission thích hợp đã có; đừng xuất dữ liệu hàng học sinh. Mở `/admin/diagnostics?view=model-eval` và nhập **aggregate-only JSON**, không upload dữ liệu học sinh.

### Browser QA

```powershell
python -m pip install playwright
python -m playwright install chromium
python tools/cp31_browser_e2e.py --check-config
```

Chạy bộ E2E thật theo hướng dẫn CP31 Batch 2 trong môi trường QA cô lập với 4 tài khoản thử nghiệm. `--check-config` chỉ kiểm tra cấu hình, không báo PASS browser.

## An toàn và giới hạn

- Không thay `firestore.rules.CANDIDATE_CP21`, `firebase.json`, `vercel.json`, không tự deploy hoặc tự bật backend đặc quyền.
- Không lưu thông tin tài khoản, mật khẩu, token, dữ liệu dòng học sinh trong gói hoặc log kiểm thử.
- JSON bên ngoài không có chữ ký đáng tin nên các tuyên bố tác nghiệp bên ngoài chỉ WARN hoặc NOT TESTED.
- Các bản phát hành đã có source không tương đương với hiệu lực tuyển sinh hay chất lượng khoa học được hội đồng chứng thực.
