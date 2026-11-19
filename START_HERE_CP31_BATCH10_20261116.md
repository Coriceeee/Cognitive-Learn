# CLA — CP31 Batch 10 | T0 freeze

Base: CP31 Batch 9. Sử dụng PATCH để cập nhật vào source Batch 9 đã sao lưu, hoặc full source độc lập. Không áp PATCH lên Batch 7/8.

1. `npm ci`
2. `npm run test:cp31:batch10`
3. `npm run verify:cp31:batch10`
4. `npm run build`
5. `npm run test:rules:emulator` (chỉ emulator localhost/demo project; không chạy production)
6. `npm run research:golden-path` và `npm run research:golden-path:verify`

**Không có deploy tự động; QA Browser 72 ca và dữ liệu nghiên cứu thực chưa được nghiệm thu.**

Mã checklist tăng bằng chứng: R5.2, R6.3, R9.6. Không nâng trạng thái nghiệm thu.

Tệp `.env.example` là template an toàn. Không chép `.env` chứa secret vào ZIP hoặc chat.
