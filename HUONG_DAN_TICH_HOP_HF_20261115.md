# HƯỚNG DẪN — CLA FULL SOURCE + HUGGING FACE (15/11/2026)

## Nguồn nền
- ZIP source nhận từ người dùng: `CLA_FULL_SOURCE_DASHBOARD_NOTIFICATION_CENTER_20261114.zip`.
- Bộ benchmark gộp: `CLA_HF_BENCHMARK_STARTER.zip`.
- Không thay thế hoặc xóa source, route, components, Firebase Rules hay 7 module CLA.

## Phần được bổ sung
- `research/huggingface/vnhsge_benchmark/`: mã CLI `fetch`, `audit`, `prepare`, `evaluate`, unit tests và ví dụ tổng hợp.
- `research/huggingface/README.md`: phạm vi nghiên cứu, hướng dẫn chạy và cảnh báo license.
- `package.json`: thêm script `test:hf:benchmark` (không thay script `test` đang có).
- `.gitignore`: không vô tình commit file tải từ HF, predictions, môi trường Python.

## Chạy thử
```powershell
cd <thu_muc_source_CLA>
npm install
npm run dev
python -m pip install -r research/huggingface/vnhsge_benchmark/requirements.txt
npm run test:hf:benchmark
```

## Trạng thái khoa học
- Dữ liệu được phát hành trong ZIP: chỉ là synthetic fixtures, KHÔNG có VNHSGE thực.
- Dataset HF VNHSGE: pending review/rights; chỉ dùng cho benchmarking câu hỏi THPT tiếng Việt sau khi làm rõ giấy phép.
- Không có mô hình đã train, độ chính xác thực, cập nhật Firestore hay năng lực Static-vs-Adaptive được chứng minh từ bộ dữ liệu này.
- Mọi số đo chính thức phải ghi dataset revision SHA, sha256, preprocessing/split version và model inference provenance.
