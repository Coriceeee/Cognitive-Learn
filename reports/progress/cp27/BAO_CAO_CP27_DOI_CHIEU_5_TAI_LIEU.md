# CP27 — TÁI NGHIỆM THU ĐỐI CHIẾU NĂM TÀI LIỆU GỐC

Ngày 15/11/2026. Đầu vào là full source CP26 (SHA-256: `5e1e286169cb21db63b1c483f6e27fd66ead835febabfd7305887032833024cb`), bảng 164 mã và 5 tệp DOCX của người dùng.

## Phương pháp

1. Giữ nguyên 164 mã, mô tả, điểm kiểm kê và trạng thái. Không mặc định PASS hay nâng 37,20%.
2. D5 (Execution Master V3) là văn bản chứa các điều khoản A–K và R; dò mã mục trực tiếp. Có 76 mục khớp trực tiếp với điều khoản. Các mã còn lại cần reviewer kiểm thủ công (chẳng hạn C25-*).
3. D1–D4 được tìm liên kết ngữ nghĩa qua đoạn/bảng. Các gợi ý này chỉ là **tham chiếu cần kiểm**, không phải khẳng định tài liệu đã có đủ bằng chứng hay đủ yêu cầu.
4. Bổ sung 20 acceptance gates (G01–G20) chiết từ 5 tài liệu. Đây là **điều kiện nghiệm thu giao cắt** chứ không phải cộng thêm 20 công việc vào 164. Reviewer cần map ID thích hợp trước khi đóng gate.
5. Mục được PASS chỉ khi có version/SHA, log đúng loại test, evidence thực, reviewer/owner xác nhận. Static analysis không thay thế emulator; synthetic không thay thế thí nghiệm người học.

## Năm tài liệu chuẩn

| Mã | Tài liệu | Vai trò |
|---|---|---|
| D1 | Lộ trình AI/ML | Thứ tự dữ liệu → formula → ML → Gemini, scholarship intelligence |
| D2 | COGNITIVE LEARN AI | Phạm vi sản phẩm, tuyển sinh, du học, tư vấn, các module |
| D3 | Final Supplement | Closed loop, Evidence Record, điều kiện production, human oversight |
| D4 | Research Validation Master Protocol | Validity, leakage, study design, SCI/MAS/CSL, causal claims |
| D5 | Execution Master V3 | Website A–J, K1–K19, 22 Admin actions, nghiên cứu R1–R10, nghiệm thu có trọng số |

## Khóa chặn trước khi nâng điểm

- Build, TypeScript, deploy, browser E2E và Firebase Emulator phải có log chạy trên source đã khóa SHA.
- SCI/MAS/CSL chưa đạt psychometric validation trên người thật; không chấm như đã đạt.
- CP25 `PASS_DESCRIPTIVE_ONLY` không chứng minh Adaptive > Static trên học sinh thật.
- OULAD có kết quả dự báo trên người học đại học Anh, không chứng minh độ chính xác dự báo THPT Việt Nam.
- G17: tuyển sinh 3 năm và G16: học bổng phải có nguồn chính thức cùng dấu thời gian cập nhật.

## Tệp bàn giao

- `CP27_164_CROSSWALK_5_TAI_LIEU.csv`: 164 công việc kèm nguồn tham chiếu, gate, reviewer, log chưa hoàn thành.
- `CP27_20_GATE_5_TAI_LIEU.csv`: 20 gate kiểm tra thêm, không tăng mẫu số.
- `CP27_5DOC_SUMMARY.json`: số liệu kiểm tra cấu trúc.

## Giới hạn

Đây là hoàn thiện checklist và acceptance policy, **chưa phải tái nghiệm thu thực tế đầy đủ**. Chưa có log npm build/emulator chạy thành công trong lượt này. Không đổi điểm kiểm kê 37,20%.
