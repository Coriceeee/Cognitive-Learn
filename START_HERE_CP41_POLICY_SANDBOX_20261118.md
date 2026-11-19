# CP41 V4 — Contextual policy sandbox + tiến độ 18/11/2026

Base: CP40 Student-only. Không thay đổi trải nghiệm học sinh hoặc vai trò Admin, Rules candidate, live policy hay dữ liệu Firebase. Phần mới là nghiên cứu offline tách khỏi app, không phải chức năng thích ứng live.

## Chạy

```powershell
npm run test:cp41:policy
npm run research:cp41:policy
npm run research:cp41:policy:verify
```

Mở `reports/evidence/cla_policy_dashboard_SYNTHETIC.html` để xem biểu đồ. `npm test` có thêm bộ kiểm thử CP41. Báo cáo JSON là synthetic-only. Không có đường đọc dữ liệu thật, không import từ src/api, không xuất policy triển khai. Không thay đổi policy live hiện tại; đây không phải rollback runtime.

## Thiết kế

Contextual mean-reward bandit offline: 3 context giả lập, 2 hành động giữ/giảm tải, overload chỉ giảm. Logging uniform trên hành động được phép, propensity 1 hoặc 0.5 đã biết từ bộ sinh. 1.800 mẫu train và 1.200 mẫu holdout tách bằng ID và seed cố định. Nếu bất kỳ hành động hợp lệ nào trong context có dưới 40 mẫu train thì dùng baseline an toàn. Reward = w × goal + (1−w) × manageable; cả hai thành phần Bernoulli giả định, không phải GPA. w=0,6 là cấu hình chính do thiết kế chọn; w=0,4/0,8 là sensitivity. Không chọn cấu hình theo test. IPS, SNIPS, ESS, paired bootstrap 400 lần, oracle từ xác suất giả định trong bộ sinh. Khoảng bootstrap mô tả điều kiện mô phỏng, không phải bằng chứng hiệu quả thật. Không có RL dài hạn, reward delayed, real-world overlap/propensity hoặc causal claim. Baseline và candidate đều tuân thủ action mask.

## Tiến độ có căn cứ

Roadmap: `research/protocol/CLA_ADAPTIVE_ROADMAP_V4_20261118.md`. Rà soát theo 70 ID duy nhất, không cộng với checklist 164 và 100 nhiệm vụ cũ vì giao nhau. LOCAL_IMPL chỉ là có triển khai kỹ thuật trong phạm vi nêu rõ + kiểm thử, không có nghĩa nghiệm thu. PARTIAL = có nền. OPEN = chưa có triển khai V4 đủ căn cứ. Từ ledger trước (9/44/17), cập nhật CP40 và CP41 (15/41/14). 56/70 có triển khai hoặc nền, 15/70 đạt mức kỹ thuật cục bộ, 14/70 mở. Không dùng 80% làm phần trăm hoàn thành dự án.

| CP | LOCAL_IMPL | PARTIAL | OPEN | Tổng |
|---|---:|---:|---:|---:|
| 37 | 6 | 2 | 0 | 8 |
| 38 | 2 | 3 | 2 | 7 |
| 39 | 0 | 9 | 1 | 10 |
| 40 | 3 | 5 | 0 | 8 |
| 41 | 4 | 5 | 1 | 10 |
| 42 | 0 | 7 | 5 | 12 |
| 43 | 0 | 8 | 2 | 10 |
| 44 | 0 | 2 | 3 | 5 |
| Tổng | 15 | 41 | 14 | 70 |

Legacy 164: trung bình cột mức bằng chứng 0–75 ở `docs/CP31/CLA_REAUDIT_164_CP31_BATCH17_20261116.csv` là 42,6829. Đây là mốc cũ, không tái nghiệm thu sau CP40/41. Không auto-pass các yêu cầu vai trò đã loại bỏ. Phạm vi mới theo `docs/CLA_STUDENT_ONLY_SCOPE_V5_20261118.md`.

## Kiểm thử và blocker

71 lệnh của npm test được chia thành 6 nhóm, tất cả exit 0; 1.069/1.069 TAP cases PASS, gồm 9 CP41 mới. Các lệnh non-TAP cũng exit 0. 60 Python research tests (24 research + 18 cognitive + 18 adaptive); 27 Python browser contract, không phải Browser E2E. Security static 15/15, demo 11/11, backup verified, Atlas 848/848, knowledge 120/120 dev benchmark. Replay CP41 PASS. Logs `reports/verification/cp41_policy/`. Build fail do thiếu React/Firebase và types; chưa full build, emulators, browser E2E, Gemini live, LLM holdout, khoa học dữ liệu thực. Production chưa thay đổi. Không tuyên bố policy an toàn trên học sinh.

Tiếp theo: CP42 thích ứng mục tiêu, ngành/trường, tài chính, học bổng theo bằng chứng; temporal change detection và validation còn mở; RL chỉ sandbox nếu có thiết kế phù hợp, không tự động đưa vào live. Ưu tiên chạy production gates và thực nghiệm thật khi có dữ liệu và môi trường hợp lệ.
