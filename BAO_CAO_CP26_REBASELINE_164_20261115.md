# COGNITIVE LEARN AI — CP26 Rebaseline checklist 164 công việc

**Ngày:** 15/11/2026. **Nền:** CP25 full source. **Bản chuẩn:** `CLA_REBASELINE_164_NOTIFICATIONS_20261114.csv` (164 mã riêng biệt). Đây là **audit bằng chứng kỹ thuật lần đầu**, không phải nghiệm thu sản phẩm cuối.

## 1. Kết quả có thể xác nhận

| Nhóm | Số mục | Điểm kiểm kê 14/11 | Mục có bằng chứng CP19–25 liên quan |
|---|---:|---:|---:|
| Website MVP | 76 | 48,68% | 18 |
| Nghiên cứu | 69 | 24,28% | 33 |
| Tuyển sinh/Chat | 18 | 36,11% | 2 |
| UI/mascot | 1 | 75% | 0 |
| **Tổng** | **164** | **37,20%** | **53** |

53 là số **mục được ánh xạ tới dấu vết code**, không phải số hạng mục đã PASS. Tất cả 164 mục được giữ lại trong backlog cho đến khi nghiệm thu trên điều kiện chính xác của từng mục; CP26 chưa tăng điểm tự động.

## 2. Kiểm thử thực sự đã chạy khi đóng gói CP26

- `research/adaptive_study/tests`: **12/12 PASS**.
- `research/cognitive_validation/tests`: **9/9 PASS**.
- `research/oulad/tests`: **13/13 PASS**.
- `research/huggingface/vnhsge_benchmark/tests`: **4/4 PASS**.

**Tổng 38/38 kiểm thử Python PASS.** Kiểm thử mô phỏng, thuật toán và schema không chứng minh hiệu quả nhân quả, độ giá trị tâm trắc hay việc website đã hoạt động E2E. Không có dữ liệu OULAD trên máy của người dùng trong ZIP, vì vậy kết quả ML được ghi nhận từ log người dùng, chưa tái chạy thật trong bản đóng gói.

## 3. Những mục cần nghiệm thu trước (đề xuất CP27–CP29)

1. **CP27 — Build, bảo mật, sản phẩm chạy được:** A2, A3, C3, I3, I4, K16, K17, C25-18. Cần `npm ci`, typecheck/build, Firestore Emulator Rules, test cross-UID và E2E các vai trò.
2. **CP28 — Evidence và nghiên cứu:** R5.2, R5.6, R9.3, R9.5, K10, E3, H2. Cần chạy `research:oulad:audit` trên dữ liệu thực của người dùng, lưu khoảng tin cậy và xuất evidence ra Lumen rồi thử UI.
3. **CP29 — An toàn tuyên bố khoa học:** R4.1, R4.6, R7.3, R7.5, R7.7, R7.8, H3. Cần đóng băng định nghĩa MAS (không đánh đồng Meaning Alignment Score và motivation/action stability), nghiệm thu guardrail, và có dữ liệu can thiệp thực trước khi kết luận tác động.
4. **CP30 trở đi — 164 backlog remainder:** tiếp tục các mục tuyển sinh chính thức 2024–2026, Haven/Atlas, export/delete/retention, UX mobile, tài liệu demo phản biện và giám sát vận hành.

## 4. Tiêu chí đổi trạng thái một mục sang PASS

- Có link/đường dẫn source **đúng yêu cầu mục đó**.
- Có test chạy và log có thể tái lập; với mục browser/security phải kiểm trên môi trường phù hợp, không dùng test synthetic thay thế.
- Có reviewer/owner xác nhận kết quả, ngày và phiên bản code.
- Không có giới hạn chưa được giải quyết cản trở mục tiêu gốc.

Sau khi đủ bốn điều kiện mới chuyển `CHỜ NGHIỆM THU` sang `PASS` và loại khỏi backlog tiếp tục. Không sửa 164 mục gốc hoặc gộp mục nghiên cứu và website để tăng điểm.

## 5. File kết quả

- `reports/progress/cp26/CP26_REBASELINE_164_EVIDENCE.csv`: đủ 164 mã, điểm gốc, chứng cứ được nối và điều kiện nghiệm thu.
- `reports/progress/cp26/CP26_BACKLOG_PRIORITIZED.csv`: backlog sắp theo P0/P1 và dấu vết hiện hữu.
- `reports/progress/cp26/CP26_SUMMARY.json`: tổng hợp máy đọc được, source SHA-256.
- `tools/rebaseline_cp26.py`: tái lập việc ánh xạ mà không tự thổi điểm.

## 6. Giới hạn

- Không khẳng định CP25 đã thực nghiệm Adaptive trên học sinh thật.
- Không khẳng định SCI/MAS/CSL đã được thẩm định tâm trắc.
- Không khẳng định browser E2E, Firebase Emulator hay production build PASS tại CP26.
- Điểm 37,2% là **điểm kiểm kê nền**; chưa phải đánh giá mới sau nghiệm thu CP26.
