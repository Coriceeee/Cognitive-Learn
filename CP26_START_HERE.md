# CP26 — Bắt đầu

1. Giải nén vào thư mục riêng, không ghi đè dữ liệu nghiên cứu hiện có trong `C:\Gạo\Cognitive-Learn`.
2. Từ thư mục gốc, chạy `python tools/rebaseline_cp26.py` để tái tạo toàn bộ 164 mục.
3. Mở `reports/progress/cp26/CP26_REBASELINE_164_EVIDENCE.csv` hoặc file Excel đi kèm để kiểm tra từng dòng.
4. Kiểm thử nghiên cứu: `npm run test:adaptive:study`, `npm run test:cognitive:validation`, `npm run test:oulad`, `npm run test:hf:benchmark`.
5. Tiếp tục CP27 bằng `npm ci`, `npm run build`, `npm run test:rules:emulator` trên máy Windows cấu hình đúng; lưu kết quả PASS/FAIL, không tự đánh dấu nghiệm thu nếu chưa chạy.

Giữ nguyên các dữ liệu OULAD của bạn tại `research/oulad/data` và `research/oulad/work`: chúng **không có** trong source ZIP này.
