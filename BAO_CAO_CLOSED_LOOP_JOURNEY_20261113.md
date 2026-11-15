# CLA — BÁO CÁO ĐỢT CLOSED-LOOP COGNITIVE JOURNEY V1

**Ngày:** 13/11/2026  
**Nền:** `CLA_FULL_SOURCE_P0_PREDICTION_ORION_SEMANTICS_20261113.zip`  
**Đầu ra:** FULL SOURCE ZIP + báo cáo + hướng dẫn; không triển khai production.

## 1. Kết quả đã có source

1. **Orion → kế hoạch:** học sinh chọn một trong 3 kịch bản; lưu snapshot điểm hiện tại, mục tiêu, ngành mục tiêu, số tuần, số giờ học dự kiến, ID và timestamp của chu kỳ. Mốc ban đầu không bị cập nhật khi sửa dữ liệu Orion về sau.
2. **Pulse → hành động:** học sinh ghi check-in một lần/tuần (giờ thực học, nhiệm vụ hoàn thành, ghi chú), có ID và timestamp; tối đa 12 check-in trên một chu kỳ.
3. **Pulse → đo lại:** sau ít nhất một check-in, học sinh tự nhập điểm bài đánh giá mới cho ít nhất một môn. Điểm `0` hợp lệ, thiếu dữ liệu không biến thành `0`. Chu kỳ được đánh dấu `REVIEWED` và chỉ đọc.
4. **Lumen → tổng kết:** xem mốc ban đầu, nhật ký, thay đổi điểm trước–sau ở các môn đã đo lại và lời nhắc điều chỉnh quy tắc. Không gắn hiệu quả nhân quả hoặc xác suất thành công.
5. **Đồng bộ:** đọc tối đa 8 chu kỳ mới nhất từ `learning_journeys/{uid}/cycles`; ghi bằng Firestore theo tài khoản; `runTransaction` khi cập nhật để giảm nguy cơ mất check-in khi ghi đồng thời.
6. **Rules ứng viên:** chỉ học sinh chủ sở hữu được đọc, chỉ học sinh đã có product consent được ghi; giữ bất biến mốc plan và lịch sử check-in; từ chối ghi tiếp sau `REVIEWED` và từ chối delete bằng client.

**Khác biệt với replay tổng hợp đang có:** v1 tạo và lưu chu kỳ do học sinh chủ động nhập. Tuy nhiên kết quả vẫn chỉ là **self-report**, chưa phải outcome đo/kiểm chứng độc lập.

## 2. File thay đổi (đối chiếu byte với ZIP nền)

**Sửa 6 file:**
- `package.json` (thêm `npm run test:closed-loop` vào `npm test`)
- `src/page/orion/OrionPage.tsx`
- `src/page/pulse/PulsePage.tsx`
- `src/page/lumen/LumenPage.tsx`
- `firestore.rules.CANDIDATE_CP21`
- `tests/firestore.rules.cp21.test.mjs` (+5 trường hợp J01–J05)

**Thêm 8 file:**
- `src/lib/closedLoopJourney.ts`
- `src/lib/useClosedLoopJourney.ts`
- `src/components/journey/ClosedLoopPanel.tsx`
- `src/components/journey/closed-loop.css`
- `tests/step12-closed-loop-journey.test.mjs`
- `docs/CLA_CLOSED_LOOP_JOURNEY_V1_CONTRACT.md`
- `START_HERE_CLOSED_LOOP_JOURNEY_20261113.md`
- `BAO_CAO_CLOSED_LOOP_JOURNEY_20261113.md` (báo cáo này)

**Không xóa file trước.** Không sửa Seed transcript, Atlas, Gemini, Admin Auth, hay dữ liệu nghiên cứu. Không thay đổi `.env` và không chạy deploy.

## 3. Bằng chứng kiểm thử

| Kiểm tra | Kết quả tại môi trường đóng gói | Giới hạn |
|---|---|---|
| Test engine/hợp đồng Closed-Loop | **18/18 PASS** | các ca logic và kiểm tra liên kết source; không phải browser E2E |
| `npm test` toàn dự án | **PASS (exit 0)** | Node.js 22.16.0 |
| `npm run test:rules:static` | **15/15 PASS** | Kiểm tra tĩnh, không phải thực thi Firestore Security Rules |
| `npm run check:layout` | **PASS** | Kiểm tra cấu trúc file |
| TypeScript strict của engine thuần | **PASS** | TypeScript 5.8.3, không kiểm toàn dự án |
| Cú pháp 5 file TS/TSX liên quan | **PASS** | Kiểm tra transpile, chưa kiểm type React/Firebase |
| Firebase Emulator, 55 test (bao gồm J01–J05) | **NOT RUN** | Thiếu Firebase CLI và `node_modules` trong môi trường đóng gói |
| Production build trên Windows / TypeScript 6 | **NOT RUN** | Cần chạy trên máy người dùng |
| Browser E2E / Firebase production | **NOT RUN** | Chưa xác nhận Rules ứng viên đã được deploy |

**Không tuyên bố P0 Rules production PASS chỉ dựa trên unit test.** Firebase CLI chưa có, Rules mới chưa qua Emulator, nên phần lưu chu kỳ có thể bị `permission-denied` ở website đang sử dụng Rules cũ.

## 4. Điều kiện sử dụng và những hạn chế phải giữ

- Dữ liệu outcome hiện chỉ là tự báo cáo. Không có xác minh độc lập, phân nhóm đối chứng, đồng ý nghiên cứu, hay hiệu lực khoa học để kết luận can thiệp có tác dụng.
- Quy trình xác minh người giám hộ, lưu trữ/xóa/xuất dữ liệu, và lịch sử quá 8 chu kỳ trong UI chưa hoàn chỉnh.
- Có thể phát sinh hai chu kỳ `ACTIVE` đồng thời khi hai thiết bị tạo cùng lúc; cần backend lock trong bước sau. Giao diện chỉ ngăn khi nhìn thấy chu kỳ active.
- Các chỉ số của Orion vẫn là mô phỏng theo quy tắc, không được gọi là xác suất thành công.
- **Rules phải qua 55 test Emulator, được duyệt, triển khai có kiểm soát và nghiệm thu E2E trước khi dùng dữ liệu học sinh thật.**

## 5. Nghiệm thu trên Windows

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:closed-loop
npm test
npm run test:rules:static
npm run build
npm run test:rules:emulator
npm run dev
```

Khi Rules đã triển khai chính xác và đã có product consent hợp lệ: Orion → chọn kịch bản → tạo chu kỳ → Pulse check-in tuần 1 → nhập điểm đánh giá lại (có thể là 0) → chốt → Lumen xem lịch sử và chỉ dẫn. Thử chuyển UID, rút consent, ghi vào chu kỳ đã `REVIEWED` và không thấy quyền vượt vai trò.

## 6. Tiến độ CLA và mốc 80%

- Theo quy ước đã dùng: **6/28 bước có bản vá = 21,4%**, không phải tỷ lệ hoàn thiện thực tế.
- Closed-Loop v1 là **một đợt mở rộng tính năng có code và test**, chưa đếm thành bước roadmap đã hoàn tất vì thiếu build, Firebase E2E và kiểm soát chất lượng dữ liệu.
- Checklist 164 mục: **chưa có mục nghiệm thu cuối nào được xác nhận mới trong lượt này**.
- **Không có cơ sở xác nhận 80% vào ngày 13/11/2026**. Tiếp theo cần Emulator, consent/guardian, nghiệm thu chiều dọc Orion–Pulse–Lumen, evidence protocol và thử nghiệm nghiên cứu có người giám sát.
