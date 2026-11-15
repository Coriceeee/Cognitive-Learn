# CLA CP24 — SCI/MAS/CSL Measurement Readiness (15/11/2026)

## Thành quả CP24
- Bắt đầu từ full source CP23, bảo tồn các module website, các lệnh nghiên cứu OULAD/HF và Shadow Policy.
- Tạo pipeline **research/cognitive_validation/** không phụ thuộc pandas/pyarrow để kiểm tra dữ liệu nghiên cứu SCI/MAS/CSL với nguyên tắc missing != 0, tối thiểu số sự kiện, đầy đủ thành phần và không chẩn đoán/risk labels.
- Thực hiện descriptive equal-weight composites (0–100, chỉ khi dữ liệu đầu vào đo trên cùng thang), đảo chiều các tín hiệu tiêu cực; +20%/-20% weight perturbation, leave-one-indicator-out và exploratory repeated-window association.
- Cổng phát biểu luôn ghi **EXPERIMENTAL_PROXY_NOT_VALIDATED**; không tuyên bố đã kiểm định validity/reliability.
- Có bản mô tả instrument fields, giới hạn và fixture 24 dòng **synthetic** để kiểm thử, không phải nghiên cứu trên học sinh thực.

## Vấn đề khoa học được phát hiện
Tên MAS gốc trong `COGNITIVE LEARN AI.docx` là **Meaning Alignment Score**. Phần triển khai proxy hiện hữu trong `src/lib/cognitiveAdapter.ts` lại dùng self-reported motivation và các tài liệu về sau đôi khi gọi motivation/action stability. Ba khái niệm khác nhau; không được diễn giải proxy hiện tại như đo được meaning alignment. Phải đóng băng định nghĩa operational và thu thập phép đo có giá trị nội dung trước khi triển khai khảo sát.

## Verification
- 9/9 CP24 tests PASS trên container.
- Sample end-to-end PASS trên dữ liệu **synthetic**, 24 hàng/12 người giả lập.
- OULAD / HF pipeline, frontend và Firebase không sửa.
- Chưa có cohort SCI/MAS/CSL thực, chưa có reliability CI, criterion/convergent/discriminant validation, chưa kiểm nghiệm hiệu quả can thiệp; việc này CHƯA đạt research gate.
- Full npm build không được thử trong bản CP24 này (không có dependencies npm ở môi trường đóng gói).

## Windows
`npm run test:cognitive:validation`

`npm run research:cognitive:validate`  (chỉ chạy fixture **synthetic**)

Khi có file khảo sát hợp lệ và consent: `python research/cognitive_validation/validate.py --input <path_to_consented_deidentified_csv> --out research/cognitive_validation/work`.

Không sao chép dữ liệu từng học sinh vào `public/`; giữ trong kho nghiên cứu riêng. Không dùng composite prototype cho quyết định tuyển sinh, sức khỏe hoặc can thiệp bắt buộc.

## Gates tiếp theo
1. Nhất quán định nghĩa và item bank của SCI/MAS/CSL, ethics/assent/consent, data dictionary.
2. Thu dữ liệu đo lặp tại thời điểm chuẩn hóa trước khi tính psychometric reliability/validity.
3. CP25: xây event schema, policy assignment log, outcome và analysis gate cho Static vs Adaptive; không giả lập hiệu quả nhân quả.
4. CP26: tái đối chiếu checklist 164 mục và chỉ PASS những mục đủ bằng chứng.
