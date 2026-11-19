> Cập nhật phạm vi 18/11/2026: lộ trình 70 đầu việc CP37–44 giữ nguyên, nhưng toàn bộ trải nghiệm sản phẩm chỉ dành cho học sinh; Nexus riêng cho quản trị kỹ thuật. Xem `docs/CLA_STUDENT_ONLY_SCOPE_V5_20261118.md`.

# CLA Adaptive Intelligence V4 — bổ sung sau CP36 Decision Lineage

Đây là lộ trình mở rộng đã được chốt trong trao đổi, không thay thế Execution Master V3 (164 tiêu chí rebaseline / 100 đầu việc CP28–36). Tên CP37–44 dưới đây thuộc **V4**, không sửa các script CP37/CP33 lịch sử đã có trong repo. Không khẳng định CP36 đã nghiệm thu. Mọi gate production, dữ liệu thực, LLM live và kiểm định khoa học còn nguyên.

Trạng thái: `LOCAL_IMPL` = có triển khai kỹ thuật và test mục tiêu, không phải nghiệm thu production; `PARTIAL` = có nền nhưng chưa hoàn tất yêu cầu; `OPEN` = chưa triển khai ở V4/cần chứng cứ. Các điểm nghiệm thu gốc không tự tăng.

| ID | Hạng mục | Trạng thái V4 |
|---|---|---|
| 37.01 | Dynamic Student Profile | LOCAL_IMPL — view từ Seed server-confirmed |
| 37.02 | Cognitive State Vector | LOCAL_IMPL — SCI/MAS/CSL từ phép đo lưu sẵn, null nếu thiếu |
| 37.03 | Behavioral State Vector | LOCAL_IMPL — 4 trường quan sát |
| 37.04 | Academic State Vector | LOCAL_IMPL — GPA đã lưu, không suy diễn GPA bị thiếu |
| 37.05 | Goal State Vector | LOCAL_IMPL — mục tiêu ngành/trường do học sinh khai báo |
| 37.06 | Financial State Vector | LOCAL_IMPL — hai trường tùy chọn, không gửi LLM |
| 37.07 | Snapshot History | PARTIAL — tái sử dụng cognitive_history, không lưu lịch sử vector mục tiêu/tài chính đầy đủ |
| 37.08 | State Confidence | PARTIAL — độ phủ 15 trường; không có confidence hiệu chuẩn |
| 38.01 | Time-series Analysis | LOCAL_IMPL — 6 trục, cửa sổ 10 snapshot |
| 38.02 | EMA | LOCAL_IMPL — bán rã 7 ngày, dùng khoảng thời gian thực |
| 38.03 | Trend Detection | LOCAL_IMPL — Theil–Sen theo thời gian thực, ngưỡng mô tả; chưa kiểm định |
| 38.04 | Change Point Detection | LOCAL_IMPL — điểm chia ứng viên L1 hai đoạn, ≥3 điểm và ≥7 ngày mỗi phía; chưa kiểm định |
| 38.05 | Behavioral Anomaly Detection | LOCAL_IMPL — lần cuối so với median/MAD của các lần trước; ngưỡng mô tả, không phát hiện bệnh lý |
| 38.06 | Longitudinal Analysis | PARTIAL — tự báo cáo, không phải phép đo độc lập |
| 38.07 | Temporal Uncertainty | PARTIAL — abstain theo thiếu dữ liệu, chưa có khoảng bất định hiệu chỉnh |
| 39.01 | Random Forest | PARTIAL — longitudinal cohort pipeline + test, thiếu dữ liệu thực |
| 39.02 | XGBoost | PARTIAL — offline cố định, đã test kỹ thuật |
| 39.03 | Ridge Regression | PARTIAL — longitudinal cohort pipeline |
| 39.04 | Ensemble Learning | PARTIAL — trung bình 3 model, chưa chọn/deploy |
| 39.05 | Feature Engineering | PARTIAL — T0 GPA + 2 biến hành vi trước T0; gate thời gian |
| 39.06 | Hyperparameter Optimization | OPEN |
| 39.07 | Ablation Study | PARTIAL — chưa có kết quả thật |
| 39.08 | Prediction Interval | PARTIAL — pipeline nghiên cứu |
| 39.09 | Model Calibration | PARTIAL — chưa có kết quả thật |
| 39.10 | Data Drift Detection | PARTIAL — descriptive train/test drift, chưa có drift threshold live |
| 40.01 | Pareto Optimization | LOCAL_IMPL — CP40 scenarioDecision, 3 mục tiêu, phân loại đúng Pareto; heuristic |
| 40.02 | Academic Optimization | PARTIAL — tối ưu phân bổ theo khoảng cách điểm, chưa có utility thực nghiệm |
| 40.03 | Time Allocation | LOCAL_IMPL — CP40 studyTimeAllocation, kiểm thử vét cạn mục tiêu lõm rời rạc |
| 40.04 | Workload Optimization | PARTIAL — giới hạn giờ, giảm/giữ tải; thiếu kiểm định thực tế |
| 40.05 | Financial Constraints | PARTIAL |
| 40.06 | Risk-aware Optimization | LOCAL_IMPL — lọc ràng buộc giờ và risk heuristic; không phải xác suất |
| 40.07 | Scenario Ranking | PARTIAL — Pareto + so sánh phương án, không có xếp hạng utility đã hiệu chỉnh |
| 40.08 | Student Preference Modeling | PARTIAL |
| 41.01 | Feedback Learning | PARTIAL — lineage và Bayesian shadow, bandit synthetic; không tự học live |
| 41.02 | Bayesian Updating | LOCAL_IMPL — shadow Beta-Bernoulli theo tuần; không điều chỉnh policy, chưa kiểm định |
| 41.03 | Adaptive Policy Versioning | PARTIAL — sandbox có policy ID cố định, chưa có registry triển khai |
| 41.04 | Contextual Bandits | LOCAL_IMPL — contextual mean-reward sandbox, 3 bối cảnh, logged propensities synthetic |
| 41.05 | Reinforcement Learning | OPEN — sandbox only |
| 41.06 | Reward Function Design | LOCAL_IMPL — reward synthetic hai thành phần; kiểm tra 3 trọng số, chưa validated |
| 41.07 | Offline Policy Evaluation | LOCAL_IMPL — IPS/SNIPS/ESS + paired bootstrap trên synthetic holdout; real NOT EVALUABLE |
| 41.08 | Policy Safety Constraints | PARTIAL — action mask synthetic, no increase, fallback khi thiếu support; chưa safety audit live |
| 41.09 | Human Override | PARTIAL |
| 41.10 | Policy Rollback | PARTIAL — không có export/deploy path, policy live không đổi; chưa rollback runtime |
| 42.01 | Academic Adaptation | PARTIAL |
| 42.02 | Cognitive Adaptation | PARTIAL |
| 42.03 | Behavioral Adaptation | PARTIAL |
| 42.04 | Strategic Adaptation | PARTIAL |
| 42.05 | Career Adaptation | PARTIAL |
| 42.06 | University Adaptation | PARTIAL |
| 42.07 | Admission Adaptation | PARTIAL |
| 42.08 | Scholarship Adaptation | PARTIAL — đưa rà soát học bổng theo ưu tiên vào lộ trình; chưa tự đối chiếu thay đổi điều kiện |
| 42.09 | Study Abroad Adaptation | PARTIAL — bước rà soát du học theo ưu tiên; chưa thích ứng dữ liệu trường/quốc gia |
| 42.10 | Financial Adaptation | PARTIAL — kịch bản ngân sách năm VND, hỗ trợ xác nhận/có điều kiện và stress test; chưa tự đồng bộ chi phí |
| 42.11 | Personal Goal Adaptation | PARTIAL — mục tiêu Seed và lựa chọn xem lại mục tiêu trong lộ trình; chưa lưu lịch sử thay đổi |
| 42.12 | Dynamic Roadmap Generation | PARTIAL — sinh agenda 1–104 tuần, liên kết các module; chưa lịch thực thi, tracking hoặc tự đổi kế hoạch |
| 43.01 | Reliability Testing | PARTIAL |
| 43.02 | Construct Validity | OPEN |
| 43.03 | Sensitivity Analysis | PARTIAL |
| 43.04 | Static vs Adaptive Comparison | PARTIAL — pipeline, chưa thực nghiệm |
| 43.05 | Baseline Evaluation | PARTIAL |
| 43.06 | Effect Size | PARTIAL — pipeline, chưa thực nghiệm |
| 43.07 | Confidence Interval | PARTIAL |
| 43.08 | Domain Shift Analysis | OPEN |
| 43.09 | Bias & Safety Audit | PARTIAL |
| 43.10 | Reproducibility | PARTIAL |
| 44.01 | Production E2E | OPEN |
| 44.02 | Performance Optimization | OPEN |
| 44.03 | Research Report | PARTIAL |
| 44.04 | Defense Package | PARTIAL |
| 44.05 | Final Release | OPEN |

Ưu tiên tiếp: CP40 tối ưu đa mục tiêu, temporal validation và policy evaluation offline; không đưa mô hình chưa validated vào quyết định live; change-point, drift và calibration phải có thiết kế phù hợp. Không dùng RL/Bandits trực tiếp trên học sinh. Không thêm khảo sát mới ngoài phạm vi đã khóa; nếu thiếu dữ liệu phù hợp, ghi NOT EVALUABLE thay vì thay bằng synthetic.

Cập nhật CP41 sandbox: `tools/cla_policy_sandbox.mjs`, `tests/cp41-contextual-policy.test.mjs`, `reports/evidence/cla_contextual_policy_SYNTHETIC.json`. Sandbox chỉ dùng dữ liệu sinh giả lập; không có đường nối policy vào ứng dụng.

Cập nhật CP42 National Pathways: 42.06/42.07 có thêm triển khai cục bộ đối chiếu tổ hợp theo toàn bộ danh mục hiện có, biểu đồ độ phủ, sổ tay nguyện vọng đa trường và 170 danh sách tổ hợp từ nguồn CTU/AGU. Chưa coi là bao phủ toàn quốc, không thay đổi điểm nghiệm thu, không có nguồn live mới hay kết quả học sinh. Xem `START_HERE_CP42_NATIONAL_PATHWAYS_20261118.md`.

Cập nhật CP42 Robust Decision Intelligence: 40.07/40.08 có thêm triển khai cục bộ phân tích utility theo ưu tiên học sinh, độ nhạy trọng số và minimax regret chính xác; 42.04 có thêm liên kết ràng buộc lựa chọn với chu kỳ hiện có. Không thay đổi trạng thái nghiệm thu hoặc tự học live. Xem START_HERE_CP42_ROBUST_DECISION_20261118.md. Không tái chấm target hoặc mức nghiệm thu khi chưa có căn cứ độc lập.

Cập nhật CP42 Holistic Temporal: ba cơ chế mô tả thuộc CP38 đạt triển khai kỹ thuật cục bộ (không kiểm định). Agenda liên module, kịch bản tài chính, ưu tiên học bổng/du học có thêm nền tảng nhưng vẫn PARTIAL. Không thay đổi quyền, dữ liệu production hoặc điểm target. Xem START_HERE_CP42_HOLISTIC_TEMPORAL_20261118.md.
