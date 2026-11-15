# Cognitive Learn AI — P0 Prediction / Orion semantics safety

**Ngày:** 13/11/2026  
**Nền source:** `CLA_FULL_SOURCE_P0_STUDENT_CONSENT_20261113.zip`  
**Mục tiêu:** không để một số công thức thử nghiệm bị diễn giải thành xác suất thành công hay confidence đã hiệu chuẩn. Tiếp tục roadmap, không viết lại dự án.

## 1. Kết quả thực hiện

- Prediction Result thay `probability` bằng `cognitiveStrengthIndex`; thay `achievementProbability` bằng `goalGapReadinessIndex`; thay `confidence` bằng `stabilityCompletionIndex`.
- Thêm `resultKind: RULE_BASED_SCENARIO`, `calibrationStatus: NOT_CALIBRATED`, `limitations` và version `Prediction Rule Engine v2.1.0-heuristic`.
- Orion Simulation trả `goalGapReadinessIndex` thay `probability`; tiện ích được tính từ `cognitiveStrengthIndex` theo chính công thức cũ, không biến chỉ số nhận thức thành probability.
- Sửa giải thích mang tính nhân quả trong Prediction/Orion (thay “giúp…”, “được cải thiện” bằng mô tả chỉ số giả định).
- Cập nhật giao diện Learning Intelligence tại Seed: hiển thị nhãn “chỉ số khoảng cách mục tiêu” và ghi rõ chưa có ước lượng tin cậy thống kê.
- Thêm 15 kiểm thử mới vào `npm test`, kiểm tra hợp đồng output, giới hạn, phép tính, thứ tự mô phỏng, kiểu dữ liệu TypeScript strict và nội dung UI.
- Thêm tài liệu formula governance `docs/CLA_PREDICTION_RULE_SEMANTICS_V2_1.md`.

## 2. Thay đổi source

**7 file đã sửa:**

1. `package.json`
2. `src/engines/prediction/predictionEngine.ts`
3. `src/engines/prediction/predictionTypes.ts`
4. `src/engines/simulation/orion/simulationEngine.ts`
5. `src/engines/simulation/simulationTypes.ts`
6. `src/engines/simulation/chronos/chronosTypes.ts`
7. `src/page/seed/components/LearningIntelligencePanel.tsx`

**2 file mới:** `tests/step11-prediction-semantics.test.cjs` và `docs/CLA_PREDICTION_RULE_SEMANTICS_V2_1.md`.

Không thay đổi Firebase Rules, schema Firestore, đăng nhập Admin, trang Consent, Seed transcript, Atlas hay dữ liệu tuyển sinh.

## 3. Kiểm thử và giới hạn

| Mục | Trạng thái | Chú thích |
|---|---|---|
| Test mới Prediction/Orion | **15/15 PASS** | có TypeScript strict compile trên các core engine |
| `npm test` toàn dự án | **PASS** | trên Node 22 / TypeScript 5.8.3 của môi trường đóng gói |
| Firestore Rules static | **15/15 PASS** | **không** tương đương Emulator/production |
| `npm run check:layout` | **PASS** | 22 file cấu trúc, 19 legacy locations absent |
| Build React + TypeScript 6 | **CHƯA XÁC NHẬN** | môi trường đóng gói không có đầy đủ `node_modules` |
| Browser E2E, Firebase Emulator và Rules production | **CHƯA XÁC NHẬN** | cần nghiệm thu riêng |
| ML validation, hiệu chỉnh xác suất | **CHƯA CÓ BẰNG CHỨNG** | chưa được claim |

## 4. Một rủi ro quan trọng không được giấu

Đổi tên field **không làm công thức tự trở nên chính xác**. Bản này chỉ thay đổi ngữ nghĩa, cấm kết quả giả mang tên xác suất, giữ nguyên coefficients. `studyHoursPerWeek` vẫn chưa ảnh hưởng trực tiếp `improvement`; Lumen vẫn đặt `targetScore = 9` cố định. Đó là nhiệm vụ nghiệp vụ và validation khác, chưa được tính PASS.

Trình bày điểm 100/100 ở `goalGapReadinessIndex` chỉ có nghĩa *theo công thức kịch bản hiện tại đã chạm mục tiêu*, không có nghĩa xác suất đạt 100%.

## 5. Tiến độ tổng

- Quy ước đếm đã chốt: **6/28 bước có source patch = 21,4%** (các bước 02–07), chưa tính như % hoàn thiện sản phẩm.
- Nhánh P0 Prediction/Orion semantics: **1 patch mới**; không tự cộng thêm bước roadmap.
- Checklist quản lý 164 hạng mục: **không cộng thêm PASS nghiệm thu sản phẩm thực tế** trong lượt này.
- Mốc “80%”: chưa có cơ sở công bố đã đạt. Cần chứng minh browser E2E, bảo mật, consent được bật an toàn và khoa học thực nghiệm.

## 6. Tiếp theo

Hoàn thiện vertical slice **khuyến nghị → học sinh chọn → thực hiện action → ghi outcome → tái đo → điều chỉnh** bằng chứng có timestamp và quyền truy cập, ưu tiên tối thiểu một hành trình thực, rồi nghiệm thu trên trình duyệt. Cùng lúc, xử lý các dependency an toàn P0: Emulator/consent/guardian trước khi dùng dữ liệu học sinh thật.

## 7. Cách nghiệm thu trên Windows

Trong `C:\Gạo\Cognitive-Learn` sau khi sao lưu và áp FULL SOURCE:

```powershell
npm run test:prediction-safety
npm test
npm run test:rules:static
npm run build
npm run dev
```

Mở Student Dashboard → “Learning Intelligence nâng cao” → “Future Prediction”; kiểm tra nhãn, giá trị và ghi chú không phải xác suất. Đăng nhập Admin, Seed, Atlas và Orion phải tiếp tục dùng được. Nếu build/TS6 báo lỗi, gửi nguyên log — không tự đánh dấu nghiệm thu.
