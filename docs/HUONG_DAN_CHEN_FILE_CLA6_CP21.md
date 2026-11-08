# CHECKPOINT 21/22 — Chuẩn hóa từ CLA(6).zip

## Các lỗi thực tế trong bản gốc

1. File `CLAIM_EVIDENCE_DAY1.md` và `RESEARCH_SCOPE_DAY1.md` nằm trùng ở `evidence/` và `data/evidence/` (giống byte), sai vị trí; đã chuyển về `research/evidence/` và `research/protocol/`.
2. Script Python `src/audit_dataset.py` và `src/baseline_next_term.py` nằm trong frontend; đã chuyển sang `research/src/`.
3. Bộ benchmark LLM nằm ở `benchmarks/` gốc; đã chuyển sang `research/benchmarks/`.
4. `RUN_RULES_CHECKPOINT21.ps1` và `firebase.emulator.cp21.json` bị copy trùng vào thư mục `evidence`/`data/evidence`; chỉ giữ bản ở thư mục gốc.
5. `package.json` có scripts `test:rules:*` nhưng ZIP thiếu cả 2 file test và thiếu `firestore.rules.CANDIDATE_CP21`; đã thêm từ bản CP21 bàn giao trước.
6. ZIP gốc chứa `.env`, `.env.local`, thư mục `.git`, `node_modules`, `dist`; **không đưa chúng vào bản chia sẻ sạch**. Kiểm tra lịch sử Git và thay secrets nếu từng commit lên remote.

## Các bước thực hiện trên máy bạn

1. Sao lưu thư mục dự án và `package-lock.json`. Với dự án Git hiện tại, **không chép đè cả repo** nếu có thay đổi sau CLA(6). Dùng file `.zip` sạch để đối chiếu/migrate; Git `.git` cũ giữ lại trên máy bạn.
2. **QUAN TRỌNG:** `package-lock.json` trong CLA(6) chưa ghi `@firebase/rules-unit-testing` mặc dù `package.json` có dependency này. Từ root hãy chạy `npm install`, kiểm tra thành công và commit lockfile mới; trước đó **KHÔNG chạy `npm ci` hoặc nhận CI PASS**. Sau đó chạy `npm run check:layout`, `npm test`, `npm run typecheck:api`, `npm run build`, `npm audit`.
3. `npm run test:rules:static` kiểm tra cấu trúc Rules, **không chứng minh bảo mật**.
4. Cài Firebase CLI và Java 21, sau đó `npm run test:rules:emulator` hoặc `./RUN_RULES_CHECKPOINT21.ps1` từ PowerShell. Chỉ khi toàn bộ allow/deny PASS mới xét đưa Rules production lên. Không tự publish candidate.
5. `firebase.json` hiện chỉ có Hosting; Rules production cần so sánh/cấu hình riêng sau khi có Emulator PASS và đối chiếu bản Rules production thực tế.

## Lưu ý quyền và bằng chứng

Không có nội dung nào đã được triển khai production trong bản bàn giao này. Các file nghiên cứu còn là thiết kế/gate kỹ thuật, không phải xác thực tác động ML hay hiệu quả Adaptive trên học sinh THPT Việt Nam.

## Sơ đồ

```text
CLA/
├── api/
├── src/                         # React + TypeScript
├── tests/                       # unit + security
├── tools/
├── research/
│   ├── registry/                # 2 CSV
│   ├── protocol/                # RESEARCH_SCOPE_DAY1.md
│   ├── data/synthetic_demo/     # scope_gate_smoke.csv
│   ├── src/                     # 2 script Python
│   ├── benchmarks/              # 120-case DRAFT JSONL
│   └── evidence/                # claim + audit outputs
├── reports/security/            # log local, không commit
├── firestore.rules.CANDIDATE    # bản legacy chỉ đối chiếu
├── firestore.rules.CANDIDATE_CP21  # bản kiểm thử mới, chưa publish
├── firebase.emulator.cp21.json
├── RUN_RULES_CHECKPOINT21.ps1
├── firebase.json
├── package.json
├── package-lock.json
└── vercel.json
```

## Khởi động từ thư mục dự án hiện có thay vì chép đè toàn bộ

Đặt `tools/FIX_CLA6_LAYOUT.ps1` vào `CLA/tools/`, sao lưu Git, rồi chạy:

```powershell
.\tools\FIX_CLA6_LAYOUT.ps1
npm install
npm run check:layout
npm test
npm run test:rules:static
python -m unittest discover -s tests -p "test_research_scope.py" -v
python research/src/validate_benchmark.py
npm run typecheck:api
npm run build
npm run test:rules:emulator
```

Trong trường hợp file thử nghiệm Rules vẫn thiếu, lấy trực tiếp hai file từ `CLA6_CP21_CP22_SOURCE_CLEAN.zip` vào `tests/`, cùng với `firestore.rules.CANDIDATE_CP21` tại root. **Emulator và production chưa được chạy trong bản bàn giao**.
