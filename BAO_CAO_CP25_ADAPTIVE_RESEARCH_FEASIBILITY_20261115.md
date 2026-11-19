# CLA CP25 — Adaptive Research Feasibility

**Ngày:** 15/11/2026. **Nền:** CLA full source CP24.

## Đã triển khai
- Module độc lập `research/adaptive_study/study.py`, chỉ Python standard library; không thay đổi website, Firebase, Shadow Policy.
- CSV event & outcome prospective study schema: học viên mã hóa, arm được gán, phương pháp phân nhóm, thời điểm baseline/gán nhánh/exposure/outcome, version chính sách, đề xuất, human approval, consent status, kiểm chứng kết quả.
- Chặn trùng `(participant, cycle)`, chuyển đổi nhánh giữa các chu kỳ, thiếu consent, outcome chưa xác minh, đảo thứ tự thời gian, thiếu recommendation/policy version, thiếu kết quả, điểm ngoài thang 0–10, thang outcome không tương thích.
- Báo cáo hai nhóm Static vs Adaptive và chênh lệch **mô tả** mean-change, mã nguồn SHA-256, cảnh báo observational/crossover/mixed assignment. Không xuất dữ liệu dòng người học vào `public/`.
- 12/12 kiểm thử mới trên dữ liệu tổng hợp; dữ liệu ví dụ `fixture_SYNTHETIC.csv` gồm 12 người giả lập và **không phải chứng cứ học sinh thật**.

## Giới hạn phải bảo vệ trước hội đồng
- Việc chạy lệnh và `PASS_DESCRIPTIVE_ONLY` không chứng minh tác động nhân quả, không chứng minh CLA Adaptive vượt Static, không phải randomized controlled trial.
- `assignment_method=randomized` là self-reported metadata; chưa kiểm định ngẫu nhiên hoặc che giấu phân bổ.
- Mọi outcome thiếu đều làm gate FAIL; một nghiên cứu thật phải thêm báo cáo attrition, ITT, preregistration, power và ethics/guardian consent.
- SCI/MAS/CSL chưa qua psychometric validation.

## Thực thi
```
npm run test:adaptive:study
npm run research:adaptive:sample
```
Output synthetic nằm tại `research/adaptive_study/sample/output/`, không đưa vào Research Dashboard công khai.

## Sau CP25
Bắt đầu CP26 — đối chiếu 164 đầu việc, chứng cứ nghiệm thu; *không* đánh dấu 'effect proven' hoặc 'psychometric validated' là hoàn thành.
