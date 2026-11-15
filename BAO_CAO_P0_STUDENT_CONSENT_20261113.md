# CLA — Báo cáo P0 Student Data Consent (13/11/2026)

## Mục tiêu
Tiếp tục trên FULL SOURCE `CLA_FULL_SOURCE_P0_FIRESTORE_SECURITY_GATE_20261113.zip`, bổ sung quyết định sử dụng dữ liệu học sinh theo yêu cầu tài liệu `COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC` §10 và `COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL` §16. Chỉ một phạm vi: **consent cho sử dụng sản phẩm**, không đánh đồng với phép tham gia nghiên cứu. Không thay đổi điểm, Admission Engine, Gemini hay quyền Admin.

## Kết quả code thực sự
- `src/page/seed/StudentConsentPage.tsx`: giao diện 3 bước trực quan (hiểu dữ liệu → quyết định → tiếp tục), cho phép đồng ý, rút đồng ý, hiển thị trạng thái từ Firestore và cảnh báo về dữ liệu cũ/chưa có xác minh người giám hộ.
- `src/lib/studentConsentPolicy.ts`: contract có version `cla-student-privacy-v1`, tách `productAccepted` khỏi `researchConsent` (luôn `false`), kiểm tra đúng UID và trạng thái thiếu/phiên bản cũ.
- `src/lib/studentConsentConfig.ts`: **flag `VITE_CLA_STUDENT_CONSENT_GATE` mặc định OFF** để tránh phá production hiện đang dùng Rules cũ; tắt = màn thông báo chỉ xem trước.
- `src/components/common/AccessGate.tsx`: nếu flag bật và role là student, đọc consent bằng `getDocFromServer` trước khi render các trang student/Atlas/Lumen/Orion/Pulse/Haven; mở đường vào `/student/consent` dù chưa đồng ý.
- `src/App.tsx`: thêm route; chatbot nổi chuyển vào vùng chỉ render sau AccessGate, không gửi chat khi chưa qua cổng.
- `src/page/seed/components/StudentHeader.tsx`, `src/styles/27-student-consent.css`: liên kết quyền dữ liệu và giao diện responsive. Không tạo module thứ tám.
- `firestore.rules.CANDIDATE_CP21`: đề xuất collection `student_consents/{uid}` chỉ cho owner student đọc/ghi, schema hẹp, `researchConsent=false`, timestamp server; học sinh không consent không thể ghi dữ liệu profile/transcript/draft/evidence/share mới qua Rules ứng viên; teacher/parent mất quyền xem report đã chia sẻ sau rút consent. Admin demo owner-only giữ nguyên.
- `tests/firestore.rules.cp21.test.mjs`: thêm 8 kịch bản Emulator (chưa thực thi tại môi trường đóng gói). `tests/step10-student-consent.test.cjs`: 17 test mới (đã chạy).

## Giới hạn chính xác
1. **Chưa kiểm tra Rules mới bằng Emulator** tại môi trường này: Security Gate `overall=BLOCKED` vì thiếu Firebase CLI và các dependency local. Có 50 ca Emulator trong source (42 cũ + 8 mới), **không phải 50 ca đã PASS**.
2. **Chưa xác nhận Rules production** đã deploy và chưa bật consent gate trong source mặc định. Tuyệt đối không gọi website hiện tại là đã thực thi consent trên production.
3. Không có quy trình xác minh người giám hộ, assent có kiểm chứng, SOP xóa/xuất dữ liệu, lưu vết consent bất biến, hoặc nghiên cứu đã được phê duyệt. Vì vậy **P0 consent CHƯA ĐƯỢC NGHIỆM THU ĐỂ DÙNG VỚI HỌC SINH THẬT**.
4. Hệ thống có thể lưu các bản ghi tài khoản xác thực tối thiểu trước màn đồng ý; bản này chưa phải hệ thống privacy/compliance hoàn chỉnh. Withdrawal không tự xóa dữ liệu đã lưu.
5. Khi triển khai Rules mới, phải phối hợp rollout client + Rules, thông báo cho tài khoản đã tồn tại. **Không** triển khai trực tiếp sang production chưa thẩm định.

## Kết quả kiểm thử trên source gói
| Hạng mục | Trạng thái |
|---|---|
| 17 test mới (`npm run test:student-consent`) | PASS 17/17 |
| `npm test` toàn bộ | PASS (exit 0) |
| Firestore static (`npm run test:rules:static`) | PASS 15/15 |
| Layout (`npm run check:layout`) | PASS |
| TypeScript strict — helper `studentConsentPolicy.ts` | PASS |
| Transpile syntax — 6 file TS/TSX liên quan | PASS 6/6 |
| Firestore Emulator — 50 ca gồm 8 ca mới | **BLOCKED, NOT RUN** |
| Build với dependency React/Firebase tại môi trường này | **NOT RUN** |
| Browser E2E và quyền production | **NOT RUN** |

## Đối chiếu FULL SOURCE trước đó
Nguồn ZIP 413 file → bản FULL SOURCE mới 421 file (bao gồm báo cáo bản vá). Sửa 7 file cũ, thêm 8 file mới, xóa 0. Không chạm logic điểm học tập, quy chế nguyện vọng, dữ liệu PTIT, hoặc luồng đăng nhập Admin.

## Tiến độ dự án — không đổi cách đếm
- Master roadmap: 28 bước. Đã có bản vá source ở bước **02–07 = 6/28 = 21,4% theo bước**. Đây KHÔNG phải tỉ lệ hoàn thiện hoặc nghiên cứu được nghiệm thu.
- 164 đầu việc checklist là quy mô quản trị; không được tự suy `PASS` chỉ từ số file và test. Trong lượt này **0 nghiệm thu cuối mới**.
- Đợt P0 Consent thêm 1 nhánh code đang đợi Emulator, browser, production Rules và quy trình người giám hộ, **không cộng trùng thành bước roadmap**.
- Mốc 80% trong ngày chưa có bằng chứng đủ để tuyên bố. Nâng % bằng cách tính code-only sẽ gây hiểu nhầm.

## Thứ tự nghiệm thu tiếp
1. Windows: `npm run test:student-consent && npm test && npm run build`.
2. `npm run test:rules:emulator`, xem `reports/security/firestore_emulator_gate.json` phải có `overall: PASS` và `emulatorAuthorizationTests: PASS` với hash Rules mới.
3. Review/triển khai Rules cho đúng Firebase project bằng thủ tục phê duyệt riêng, staging trước production. Khi Rules và browser tương thích, bật `VITE_CLA_STUDENT_CONSENT_GATE=true` trên staging; nghiệm thu các luồng chấp thuận/rút, chặn write, quyền giáo viên/phụ huynh, Admin demo.
4. Thiết kế xác minh người giám hộ, hồ sơ consent có thể audit, yêu cầu xuất/xóa/retention, và Ethics/SAP riêng trước thu thập dữ liệu nghiên cứu.
5. Tiếp tục chuẩn hóa xác suất của Prediction/Orion, sau đó hoàn thiện trải nghiệm closed-loop.

**Kết luận:** Bản vá consent là một bước kỹ thuật có kiểm thử, chưa đủ điều kiện gọi P0 được nghiệm thu cho học sinh thật.
