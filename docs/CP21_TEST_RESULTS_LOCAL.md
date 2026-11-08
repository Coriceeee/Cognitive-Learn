# CP21/CP22 kiểm tra bản chuẩn hóa CLA(6)

Ngày kiểm tra: 2026-11-04. Nguồn: CLA(6).zip. Không truy cập production.

| Test | Quan sát | Kết quả |
|---|---|---|
| `node tools/check-cla-layout.cjs` | 22 đường dẫn cần có, 11 đường dẫn cũ không còn | PASS |
| `node --test tests/cp21.rules.contract.test.cjs` | 12/12 static contract tests | PASS; KHÔNG thay Emulator |
| `npm test` | 14/14 academic units (TypeScript được trích từ gói ZIP để chạy) | PASS |
| `python -m unittest discover -s tests -p test_research_scope.py -v` | 4/4 technical research gate tests | PASS |
| `python research/src/validate_benchmark.py` | 120 templates, 7 nhóm, unique IDs | PASS template structure; NOT evaluated LLM |
| `python research/src/audit_dataset.py ...` | Demo/synthetic bị loại, eligible 0 | PASS technical scope gate; BLOCKED for real ML |
| `node --check tests/firestore.rules.cp21.test.mjs` | Syntax hợp lệ | PASS syntax only |
| `npm install --package-lock-only` | DNS `EAI_AGAIN` với npm registry | FAIL/blocked network: lockfile chưa đồng bộ |
| `npm run test:rules:emulator` | Chưa có Firebase CLI và rules-unit-testing trong môi trường này | NOT RUN |
| `npm run build` sau chuẩn hóa | Chưa cài đủ toàn bộ packages; bản CLA6 trước đó đã build trên Windows theo log người dùng | NOT RUN ở đây |
| Deploy Vercel/Firebase | Không truy cập production | NOT RUN |

Đã thêm workflow GitHub Actions để chạy Emulator thực tế sau khi code được đưa vào repo và các dependencies được cài. Đây là file cấu hình chưa thực thi, **không chứng minh CI xanh**.

Đầu việc 145: chỉ cập nhật nguồn và bằng chứng kỹ thuật; không thay đổi tự động trạng thái `IN_PROGRESS` thành `PASS`. Không thể kết luận validation ML, hiệu quả học tập hay Static/Adaptive khi thiếu dữ liệu thật.
