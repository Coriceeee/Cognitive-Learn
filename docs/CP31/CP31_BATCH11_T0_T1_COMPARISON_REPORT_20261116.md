# CP31 Batch 11 — T0/T1 Descriptive Comparison & Missing-Data Gate

**16/11/2026 | Baseline:** CP31 Batch 10 T0 Freeze | **Phạm vi:** đọc và phát lại evidence, không triển khai production.

## Nguyên nhân gốc

Batch 10 chốt được snapshot T0 nhưng thiếu phép đối chiếu rõ ràng giữa môn đã chốt tại T0, môn có giá trị T1, và mức hoàn thành kế hoạch theo nhật ký tự khai. Dùng trung bình toàn bộ môn T0 để so với trung bình các môn chỉ có T1 có thể tạo sai lệch do thay đổi thành phần môn; dùng T1 để đánh giá “dự báo” khi T0 có `forecastStatus=NOT_ESTIMATED` là sai về mặt khoa học.

## Công việc đã triển khai

1. `src/lib/journeyT0T1Comparison.ts` (mới): read-only `compareJourneyT0T1(unknown)` và `replayJourneyT0T1Comparison(cycle, report)`. Chỉ trả `DESCRIPTIVE_ONLY` nếu `isJourneyCycle`, `auditJourneyT0Snapshot=FROZEN_CONSISTENT` và `auditJourneyEvidence=CONSISTENT` đều đạt. Nếu thiếu T0/evidence, chưa REVIEWED hoặc dữ liệu hỏng, fail closed.
2. Mỗi môn được liệt kê với điểm T0, điểm T1 nếu có, delta hoặc `null` nếu thiếu T1. `matchedSubjectCount` là mẫu số duy nhất cho thay đổi trung bình; không lấp thiếu bằng số 0. Điểm 0 quan sát vẫn hợp lệ. Chỉ số thời lượng và hoàn thành được gắn nhãn *student self-report*.
3. `forecastError=null`, `calibratedProbability=null`, `causalEffect=null`, `treatmentAssignment=NOT_PERFORMED` cố định; không bán chênh lệch T0/T1 thành độ chính xác ML hay tác động nhân quả.
4. `ClosedLoopPanel.tsx` trên Orion/Pulse/Lumen: hiển thị đối chiếu sau REVIEWED và thông báo giới hạn; bản ghi legacy hoặc không có evidence không được trình bày như dữ liệu đủ đánh giá.
5. `tools/cla_golden_path_offline.mjs`: Golden Path **7 bước** dùng module mới, xuất `comparison` và phát lại deterministically từ fixture synthetic. Giữ `SYNTHETIC_ONLY` và không có dự báo/claim thực nghiệm.
6. `tests/cp31-batch11-t0-t1-comparison.test.mjs`: 36 test, gồm thiếu T1, điểm 0, negative delta, legacy, sửa timestamp/evidence, báo cáo tự chèn reviewer, đảo thứ tự keys, UI và Golden Path.
7. `package.json`: `test:cp31:batch11`, `verify:cp31:batch11`; thêm test mới vào `npm test`. Fingerprint source được đồng bộ lại sau thay đổi.

## Kết quả kiểm thử tại đây

- `npm run test:cp31:batch11`: **36/36 PASS**.
- `npm run verify:cp31:batch11`: **PASS (exit 0)**, gồm test các Batch trước, Closed Loop/reliability, Golden Path và layout.
- `tsc --noEmit --strict ...` cho domain modules: **PASS**.
- Golden Path synthetic generate + verify: **PASS**, không chứng minh kết quả trên học sinh thật.
- Production build: **NOT RUN** do gói source không có `node_modules` tại môi trường này; cần chạy trên Windows.
- Firebase Emulator (đặc biệt Rules ứng viên Batch 10), Browser E2E 72 ca, production deploy, kết quả THPT: **NOT RUN** / thiếu bằng chứng.

## Khẳng định được và không được

**Được phép:** với bản ghi có T0 và evidence record khớp *công thức*, tính và trình bày chênh lệch T0/T1 có môn trùng nhau ở mức dữ liệu **tự báo cáo**, đúng trường hợp thiếu dữ liệu.

**Không được phép:** báo cáo accuracy/MAE của một mô hình T0 chưa tồn tại; khẳng định nâng điểm do CLA; ước lượng confidence/probability; cho rằng self-report đã xác minh; kết luận đóng đủ R6.3/R7.1/R7.7/R9.6. Việc phát lại nhất quán không chống được kẻ có quyền giả mạo cả nguồn và kết quả.

## Checklist 164

Cập nhật evidence refs/giới hạn cho `R6.3`, `R7.1`, `R7.7`, `R9.6`. **Không đổi phân loại**: 21 đạt kỹ thuật cục bộ, 126 một phần, 17 chưa đủ bằng chứng, 0 nghiệm thu độc lập. Các điều kiện ngoài phạm vi vẫn chưa đóng.

## Chạy trên Windows (sau khi sao lưu và áp PATCH B11 lên B10)

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch11
if ($LASTEXITCODE -ne 0) { throw 'B11 TEST FAILED' }
npm run verify:cp31:batch11
if ($LASTEXITCODE -ne 0) { throw 'B11 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
'CP31_BATCH11_LOCAL_PASS'
```

QA trên Firebase project riêng vẫn là hard gate trước nghiệm thu và phát hành; không dùng Firebase production để thử tài khoản QA.
