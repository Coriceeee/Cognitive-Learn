# CP72 — Hướng dẫn kiểm tra bản Lumen có phương án dự phòng

Bắt đầu từ CP71; đây là gói **mã nguồn đầy đủ**, không chứa `.env` riêng hoặc `node_modules`.

## Các điểm mới

- Lumen/Assistant có **Hướng dẫn CLA nội bộ · không cần Gemini**: chỉ lấy chỉ báo proxy được ghi nhận, gợi ý thử một thay đổi nhỏ và theo dõi nhật ký. Không phải sản phẩm ML được kiểm định.
- Gemini vẫn chỉ chạy khi học sinh yêu cầu; lỗi, quota hoặc thiếu cấu hình không xoá hướng dẫn nội bộ.
- Các biểu đồ/nhận xét Lumen không còn dùng điểm 0 chưa được đo hoặc trường metadata kỹ thuật làm tín hiệu.
- API Gemini phải dùng `VITE_API_BASE_URL` khi chạy production, không chuyển token sang domain mặc định hard-code.

## Kiểm tra

```bash
npm ci
npm run check:dependencies
npm run test:cp72:lumen-fallback
npm test
npm run build
npm run test:rules:preflight
```

Thiết lập biến môi trường từ `.env.example`, chạy với Firebase QA riêng, không sử dụng dữ liệu học sinh thật để test. `VITE_API_BASE_URL` phải là HTTPS origin được quản trị, ví dụ URL của backend do nhóm sở hữu, không có path.

Kiểm thử UI: đăng nhập tài khoản giả lập → Seed đủ dữ liệu đã xác minh → Lumen/Assistant → quan sát hướng dẫn nội bộ → thử Gemini khi có cấu hình → mô phỏng ngắt API để quan sát FALLBACK; đăng xuất/đổi tài khoản khi yêu cầu đang chờ. Kiểm tra trường hợp không đủ phép đo để tránh báo điểm 0 kỹ thuật.

Xem `reports/cp72/CP72_ACCEPTANCE_REPORT.md` để biết gate nào PASS, gate nào BLOCKED.
