# V4 CP39 + CP41.02 — longitudinal predictive ML & Bayesian feedback shadow

Base: `CLA_FULL_SOURCE_CP37_38_DYNAMIC_TEMPORAL_20261118.zip`. Không sửa/chạy deploy Rules, không sửa chính sách thích ứng CP36, không tạo collection, không gửi dữ liệu học sinh tới Gemini/LLM. Không xóa file cũ.

## Phương pháp CP39
- Target: GPA kỳ tiếp theo (0–10, cùng phương pháp chấm), horizon 60–180 ngày. Một hàng/participant pseudonym; không dùng Firebase UID. T0 GPA, số giờ học và tỷ lệ hoàn thành tự báo cáo trong 7 ngày trước T0. Không impute; số 0 hợp lệ. `feature_available_at` phải là thời điểm muộn nhất trong các feature, không sau T0. Owner phải kiểm chứng thời điểm, nguồn, tính độc lập, quyền và tính tương đương phép đo trước khi tạo manifest; kiểm tra schema/hash không chứng thực dữ liệu.
- Cutoff đóng băng trước phân tích: huấn luyện T0 và outcome trước `calibration_start`; calibration T0 từ `calibration_start`, outcome trước `test_start`; test T0 từ `test_start`, outcome trước `observation_end`. Loại hàng cắt qua cutoff, báo số lượng; từ chối trùng pseudonym (kể cả hàng bị loại). Ngưỡng kỹ thuật 60/30/30 không phải power analysis. Giữ protocol/SAP gốc, đây là thiết kế V4 đề xuất cần review trước final analysis.
- 9 cấu hình: last-GPA; Ridge, Random Forest, XGBoost, ensemble trung bình 3 model, từng loại với academic-only và academic+behavior. Hyperparameter cố định, chưa thực hiện tuning. Chuẩn hóa Ridge chỉ fit train. Mọi điểm dự báo clip 0–10. Split conformal 90%, calibration riêng; empirical coverage, width, MAE, RMSE; chênh lệch MAE và bootstrap 95% theo participant, drift histogram train/test và tỷ lệ vượt phạm vi train. Temporal non-exchangeability có thể làm interval mất coverage, bootstrap không xử lý clustering theo trường nếu source có cluster. Chưa có SCI/MAS/CSL ablation vì chưa có dữ liệu tương ứng, không tự suy ra.
- Chỉ xuất aggregate trong raw_private; không xuất model, prediction cá nhân, csv hoặc tự hiển thị metrics lên UI. Không tự chọn model từ test. Không tái sử dụng holdout để tuning. Không coi real data của quốc gia khác là validation THPT VN. Chưa có dữ liệu hợp lệ trong ZIP.

## Chạy local
```powershell
npm ci
npm run test:cp39-41:bayes
python -m pip install -r research/requirements-cp39.txt
npm run test:cp39:longitudinal
npm run demo:final
npm test
npm run build
npm run dev
```

Chỉ sau khi người phụ trách đã duyệt nguồn nghiên cứu hợp pháp và cohort có sẵn, chuẩn bị `research/data/raw_private/longitudinal_v4/cohort.csv` với header chính xác:
```csv
participant_id,data_scope,research_allowed,t0_time,feature_available_at,t1_time,gpa_t0,study_hours_week,completion_rate,gpa_t1
```
Đặt `manifest.json` cùng thư mục; kiểu dữ liệu UTC ISO seconds (`YYYY-MM-DDTHH:mm:ssZ`), `completion_rate` 0–1, giờ 0–168, GPA 0–10, `data_scope=research`, `research_allowed=true`. Không tự sửa nhãn demo/synthetic thành research. Manifest phải có các trường dưới đây, thay toàn bộ placeholder bằng dữ liệu THỰC đã duyệt. Không đưa PII, Firebase UID, consent cá nhân, key vào thư mục public hoặc vào chat.
```json
{
  "schema": "cla.longitudinal.adaptive-ml.v1",
  "source_sha256": "<SHA256 của CSV thực>",
  "approved_use": "RESEARCH_ONLY",
  "data_scope": "APPROVED_OBSERVATIONAL_ONLY",
  "dataset_version": "<version đã freeze>",
  "permission_ref": "<tham chiếu duyệt quyền; lưu bản gốc nơi có quyền>",
  "instrument_ref": "<tham chiếu phương pháp chấm cùng thang>",
  "protocol_ref": "<protocol/SAP frozen>",
  "feature_contract": "T0_GPA_AND_PRE_T0_7D_SELF_REPORT_V1",
  "outcome_contract": "NEXT_TERM_GPA_0_10_SAME_INSTRUMENT_V1",
  "calibration_start": "<UTC seconds>",
  "test_start": "<UTC seconds>",
  "observation_end": "<UTC seconds>"
}
```
Chạy `npm run research:cp39:longitudinal -- --acknowledge-reviewed-source` chỉ khi quyền sử dụng và chất lượng dữ liệu thực đã được kiểm tra độc lập. Lệnh không tự xác minh quyền hay nguồn. Aggregate cần review độc lập; giữ raw và aggregate private. Nếu đã xem kết quả test rồi, không chỉnh cutoff/model để làm đẹp kết quả.

## CP41.02 Bayesian shadow
- Beta-Bernoulli thử nghiệm: một tuần tự báo cáo đạt >=60% nhiệm vụ = 1, nếu không = 0; ít nhất 3 tuần liên tiếp, báo cáo trong tuần gắn nhãn, cách 5–9 ngày. Chỉ chu kỳ reviewed gần nhất, owner đúng, server-confirmed, EvidenceRecord khớp. Không trộn nhiều chu kỳ/policy. Giả định tham số ổn định và các tuần độc lập chưa được xác nhận; không dùng task như các mẫu độc lập, không xem thiếu tuần là thất bại.
- Posterior Beta(a+k,b+n-k), khoảng credible 95% tính bằng CDF beta nguyên và bisection; prior sensitivity Beta(1,1), (2,2), (1,2). Engine trả `SHADOW_ONLY`, `prediction=null`, `policyEffect=null`. Không đưa posterior vào điểm/risk/recommendation hoặc gửi LLM. Orion chỉ hiện số tuần ghi nhận đạt ngưỡng và trạng thái. Không sửa quyết định, không xuất PII.
- Các prior/ngưỡng/cửa sổ là lựa chọn thiết kế thử nghiệm, không phải xác suất thành công đã hiệu chỉnh; 3 tuần chỉ là gate kỹ thuật. Không tuyên bố self-learning policy đã được chứng minh. Contextual bandits/RL vẫn offline/sandbox trong tương lai.

## Bằng chứng và hạn chế
Xem `reports/verification/cp39_41_local/`. Fixture của unit test được xây dựng trong bộ kiểm thử, không lưu thành dữ liệu thực hoặc báo cáo khoa học. Nghiệm thu CP36 production và các gate thực nghiệm vẫn mở. Không tự tăng tỷ lệ nghiệm thu.

Kết quả chạy ngày 18/11/2026: `npm test` exit 0 (1.036/1.036 TAP, 63 nhóm kết quả), 8/8 Bayesian (nằm trong npm test), Python CP39 11/11, tsc strict engine Bayesian ES2020 exit 0, demo offline 11/11 + backup verify, Atlas Lookup 848/848, Knowledge Retrieval 120/120, Rules static 15/15. Fingerprint 373 file. Full build exit 1 (React/Firebase dependencies thiếu); chưa xác minh typecheck UI tổng thể, Firebase Emulator/Browser E2E hoặc AI live. Real data CLI exit 2 (không có cohort/manifest được duyệt). Không có MAE/coverage thật. Không có model deployment. Các test bao gồm fixture do đội phát triển tạo, không phải đánh giá khoa học độc lập.
