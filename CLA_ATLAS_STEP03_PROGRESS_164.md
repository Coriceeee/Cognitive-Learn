# CLA — Báo cáo tiến độ sau bước 03 (12/11/2026)

**Nguyên tắc:** Mỗi bước một nguyên nhân, bản vá nhỏ và có diff. Không đánh dấu PASS dựa trên số file hoặc npm build một mình.

| Bước | Phạm vi | Bản vá | Kiểm thử tự động | Nghiệm thu browser máy chủ dự án |
|---|---|---|---|---|
| 01 | Chốt checkpoint/backup | Đã có nguồn đối chiếu CP37 | Có kiểm tra source/hash cục bộ | **Chưa xác minh commit/backup thực tế của máy người dùng** |
| 02 | Lumen: panel bị CSS che | Có ZIP vá riêng, 1 CSS source | CSS selector 5/5 và contract 26 bài đã báo cáo | **Đang chờ xác nhận** |
| 03 | Atlas: ngăn xếp nhóm thiếu benchmark | Có ZIP vá riêng, 2 source + 1 test | Unit/contract 7/7; hồi quy 18/18; cú pháp 2/2 | **Đang chờ áp dụng, build và xác nhận** |
| 04 | Atlas: nối benchmark có provenance theo ngành/năm/phương thức | Chưa sửa | Chưa chạy | **Chưa bắt đầu** |
| 05+ | Seed, Firestore, Lumen evidence, Orion/Pulse closed-loop, Haven, nghiên cứu... | Chưa sửa trong lượt này | Không đổi | Chưa bắt đầu trong lộ trình sửa tuần tự |

### Cách cập nhật checklist 164 việc

Không tự tăng điểm tiến độ hay đổi trạng thái các mã checklist thành PASS: bản vá chỉ mới có bằng chứng unit/regression cục bộ và **chưa có nghiệm thu trên hệ thống đang chạy**. Sau khi người dùng xác nhận STEP03, mới ghi kết quả cụ thể vào mã Atlas liên quan, kèm log và ảnh website.

### Cổng mở bước tiếp theo

- STEP03 DryRun PASS / hoặc diff thủ công khớp.
- STEP03 regression 7/7, `npm run build` PASS trên máy người dùng.
- Trang Atlas không còn đưa ra nhóm nguyện vọng khi chỉ có điểm học sinh nhưng thiếu benchmark, và giao diện hiển thị tình trạng dữ liệu rõ ràng.
- Chỉ sau khi xác nhận các điều kiện trên mới sửa adapter nối benchmark (một phần độc lập), không làm đồng thời với nghiên cứu dữ liệu nationwide.
