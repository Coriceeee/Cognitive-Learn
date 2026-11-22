# Cognitive Learn AI · CP64 UX-FIRST

**Phạm vi:** tạo dải tín hiệu hoàn thiện đầu vào cho Orion, Pulse, Haven và nâng cấp kiểm soát phiên bản CSS; không thay đổi thuật toán AI/ML.

## Bắt đầu ở đâu

- `reports/cp64/CP64_ACCEPTANCE_REPORT.md`: nghiệm thu kỹ thuật và giới hạn.
- `reports/cp64/CP64_UX_REPORT_WRITING_KIT.md`: mô tả và chú thích hình dùng viết NCKH.
- `reports/cp64/preview-desktop-light.png`, `preview-desktop-dark.png`, `preview-mobile-light.png`: ảnh kiểm tra bố cục từ TSX/CSS với dữ liệu minh họa, **không phải ảnh website React chạy thật**.
- `npm run test:cp64:input-ux`: kiểm tra hợp đồng trạng thái nhập dữ liệu và giao diện.
- `npm run demo:final`: cổng demo synthetic/offline, không thay thế Firebase/kiểm định.

## Lưu ý an toàn

- Các báo cáo đã chặn mọi việc sử dụng dữ liệu còn trống như điểm quan sát 0.
- Đừng dùng biểu đồ mức độ điền biểu mẫu như bằng chứng đánh giá năng lực.
- Không chứa dữ liệu học sinh riêng hoặc các file `.env` thật.
