# CLA Research — cấu trúc chuẩn CP21/CP22

Nguồn hiện tại: bản CLA(6).zip cung cấp trong hội thoại, đã chỉnh đường dẫn, **chưa có kết quả thực chứng**.

- `registry/`: metadata nguồn/mô hình, không đồng nghĩa đã được cấp phép tải dữ liệu.
- `protocol/`: câu hỏi nghiên cứu, giới hạn kết luận và phương pháp.
- `data/synthetic_demo/`: dữ liệu mô phỏng để kiểm thử kỹ thuật, **không dùng train/evaluation cho claim học sinh thực**.
- `src/`: pipeline Python độc lập với React/Vite.
- `benchmarks/`: 120 tình huống LLM **bản nháp, chưa đánh giá model**.
- `evidence/`: bằng chứng kỹ thuật và claim-evidence. File ngày đầu không phải kết quả cuối cùng.

Chạy kiểm tra scope data khi có Python:

```bash
python research/src/audit_dataset.py --input research/data/synthetic_demo/scope_gate_smoke.csv --output research/evidence/DATA_SCOPE_GATE_SMOKE_RESULT.json
```

Trạng thái mong đợi: `BLOCKED` và eligible=0, vì tất cả các dòng là synthetic/demo. Việc không huấn luyện trên dữ liệu này là đúng. Trước khi đưa dữ liệu thật vào research, phải xác minh legal basis, quyền nghiên cứu, dữ liệu ẩn danh và nhãn outcome có thật.

Kiểm tra 120 template (không đánh giá LLM):

```bash
python research/src/validate_benchmark.py
python -m unittest discover -s tests -p "test_research_scope.py" -v
```
