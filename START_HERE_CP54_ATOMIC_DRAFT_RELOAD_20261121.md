# CP54 — Hướng dẫn nhanh

Bản này tiếp nối nguyên vẹn mã nguồn **CP53** và bổ sung bảo vệ thao tác **save / tải lại bản nháp** trên Orion, Pulse, Haven cùng Rules revision-only (dự thảo).

- Báo cáo chính: `reports/cp54/CP54_ACCEPTANCE_REPORT.md`
- Kiểm thử mới: `npm run test:cp54:safety` (6 test offline)
- Chuỗi kiểm thử tổng: `npm test` (1.185 test PASS trong môi trường thực thi CP54)
- Rules dự thảo **chưa được publish**; trước khi deploy phải qua `npm run test:rules:emulator` với project demo an toàn.
- Production build **chưa được xác minh** vì không thể tải dependency npm ở môi trường thực thi này.
- Dữ liệu nghiên cứu SYNTHETIC chỉ để demo/hồi quy kỹ thuật, không phải kết quả của học sinh thật.

Giữ các cấu hình `.env.example`, **không đưa `.env` thật hoặc secret** vào ZIP.
