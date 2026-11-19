# CP31 BATCH 8 — ƯU TIÊN SOURCE / GOLDEN PATH OFFLINE

Gói phát hành: chỉ đọc, không đụng dữ liệu Firebase, không thay đổi Rules.

1. Sao lưu thư mục `C:\Gạo\Cognitive-Learn` trước khi sửa.
2. **PATCH** chỉ áp dụng trên **CP31 Batch 7** đã vượt qua cổng local. Hoặc dùng **FULL SOURCE Batch 8** vào thư mục mới, không giải nén chồng vào bản đang phát triển.
3. Dùng lệnh từ `docs/CP31/CP31_BATCH8_GOLDEN_PATH_REPORT_20261116.md`.
4. `npm run research:golden-path` sinh JSON synthetic; `npm run research:golden-path:verify` kiểm tra lại. Đây là technical replay, không phải bằng chứng học sinh tiến bộ.
5. Nếu xuất hiện fingerprint mismatch: so sánh file nguồn đang có với bản phát hành, không sửa baseline bằng tay để ép PASS.

R6.2, R7.1, R7.2 **có thêm bằng chứng kỹ thuật**, nhưng vẫn `MỚI ĐẠT MỘT PHẦN` theo checklist 164, QA browser và clinical/educational validation vẫn mở.
