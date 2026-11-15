# CLA Step 20 — OULAD baseline pipeline (15/11/2026)

## Thực hiện

- Xuất phát từ ZIP `CLA_FULL_SOURCE_HF_RESUMABLE_429_FIX_20261115.zip` (bản mới nhất có sẵn trong phiên làm việc).
- Bổ sung `research/oulad/pipeline.py`, `README.md`, unit test, bốn npm scripts tiện chạy và `.gitignore` che dữ liệu thực.
- Không sửa React, Firebase Rules, auth, Atlas/Haven/Lumen/Orion/Pulse/Nexus/Seed.
- Nguồn OULAD: UCI 349, DOI 10.24432/C5KK69, giấy phép CC BY 4.0. Thí nghiệm khoa học chỉ diễn giải cho giáo dục đại học trực tuyến Anh.
- Bài toán T0: dùng các trường và log có trước hoặc tại ngày 30 dự báo cuối khóa Pass/Distinction vs Fail/Withdrawn. So sánh prior constant, academic-only logistic và academic+behavior logistic; AUC, Brier, log-loss, accuracy.
- Chia theo `id_student` trước khi huấn luyện để ngăn người học xuất hiện ở cả train/test. Dữ liệu sau ngày 30 không dùng làm feature.
- Giữ thông tin lineage thông qua SHA-256 raw ZIP, freeze cutoff, mã nguồn và trường nguồn/giấy phép trong manifest.

## Kiểm thử

- 3 unit tests nghiên cứu OULAD: kiểm tra AUC, xử lý dữ liệu thiếu ở train, và pipeline end-to-end trên **100 dòng mô phỏng**; PASSED.
- 4 unit tests benchmark VNHSGE của checkpoint trước: PASSED.
- Chưa tải archive OULAD trên môi trường tạo artifact; chưa kiểm toán kết quả thật, chưa báo ML accuracy thực.
- Chưa chạy đầy đủ `npm run build` (node_modules không được đóng gói trong source).

## Không được claim

1. Dữ liệu OULAD là dữ liệu THPT Việt Nam.
2. CLA dự đoán được điểm thi THPT từ bộ dữ liệu này.
3. SCI, MAS, CSL được xác nhận bởi OULAD.
4. Chính sách CLA Adaptive có tác động nhân quả từ kết quả dự báo OULAD.
5. Accuracy trên dữ liệu mô phỏng trong unit test là performance của mô hình trên dữ liệu thật.

## Cách chạy

```powershell
python .\research\oulad\pipeline.py fetch --out research/oulad/data/OULAD.zip
python .\research\oulad\pipeline.py prepare --input research/oulad/data/OULAD.zip --out research/oulad/work --cutoff 30
python .\research\oulad\pipeline.py evaluate --input research/oulad/work/features.csv --out research/oulad/work/results
```

## Gate kế tiếp

Sau khi chạy trên OULAD thật: đối chiếu row counts với codebook, kiểm tra missingness/class imbalance/withdrawn class, thử khóa split theo course/presentation và bootstrap CI theo participant; rồi mới chuyển sang mô hình thích ứng và nghiên cứu các proxy của SCI/MAS/CSL.
