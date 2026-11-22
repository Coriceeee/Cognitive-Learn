# MVP readiness — CP73

| Gate | Điều kiện công nhận | CP73 |
|---|---|---|
| UX sáu module | Điều hướng có nút, trình duyệt thật, không lỗi mobile | Có mã nguồn; chưa nghiệm thu React browser |
| Tài khoản & đồng ý dữ liệu | Auth + consent + Rules cục bộ + nhiều thiết bị | Có công cụ QA; chưa chạy Emulator |
| Lưu dữ liệu & phục hồi | Thử save → reload → read trong ít nhất Seed/Orion/Pulse/Haven | Chưa nghiệm thu |
| Gợi ý thông minh | Kết quả có căn cứ và fallback offline | CP72 có test offline; chưa nghiệm thu UI thật |
| Tuyển sinh/học bổng | Có thông tin tối thiểu được đối chiếu chính thức | Chưa xác minh đầy đủ |
| Production build | `npm ci` + build với lockfile | BLOCKED môi trường |
| Security Rules | Emulator real test PASS; không chỉ contract static | NOT RUN |
| Mô phỏng 12 màn hình | Browser E2E 1280/390 × 6 module | 0/12 NOT RUN |
| Nghiên cứu/ML | Không suy diễn test synthetic thành chứng cứ khoa học | Chưa kiểm định người thật |

Không tăng số mục đóng nghiệm thu trong checklist 164 khi chưa có bằng chứng mới đúng tiêu chí.
