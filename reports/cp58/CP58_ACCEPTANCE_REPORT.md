# CP58 — Đồng bộ Seed → Orion/Haven và điều hướng SPA theo URL

Ngày: 21/11/2026 (Asia/Ho_Chi_Minh). Cơ sở: `Cognitive-Learn-CP57-20261121.zip`.

## Vấn đề được tái hiện từ mã nguồn CP57

1. Orion và Haven dùng cờ `seededFromTranscript` kiểu boolean. Sau lần điền ở tài khoản A, việc chuyển tài khoản trong cùng phiên có thể ngăn B nhận dữ liệu đã xác minh từ Seed. Haven còn đánh dấu đã điền kể cả khi bảng điểm chưa chứa GPA năm hay điểm Anh; nếu dữ liệu đến muộn, không có lần thử lại.
2. Prefill dùng hai subscription độc lập (`useStudentTranscript`, `useModuleDraft`) nên trước CP58 chưa kiểm tra UID hai bên khớp nhau tại thời điểm ghép dữ liệu.
3. `App.tsx` chỉ lưu canonical pathname vào React state. Điều hướng giữa URL chỉ khác query, ví dụ `/admin?cluster=nexus-core` → `/admin?cluster=atlas-admission`, có thể đổi thanh địa chỉ nhưng không tạo một lần render mới. Atlas du học giữ `countryCode` ở state và cần đồng bộ khi điều hướng Back/Forward cùng trang.

## Các thay đổi

- `src/lib/transcriptPrefillEligibility.ts`: policy thuần, chỉ cho phép prefill khi bản nháp thuộc UID hiện tại, transcript của cùng UID đã đạt `ready`, bản nháp đang `empty`, có điểm thật phù hợp, chưa prefill cho UID đó, và không có chỉnh sửa cục bộ.
- `src/page/orion/OrionPage.tsx`: cờ prefill theo UID, kiểm tra phiên và khả năng sử dụng điểm; không tự ghi dữ liệu được gợi điền xuống Firestore.
- `src/page/haven/HavenPage.tsx`: cờ theo UID, không tiêu thụ lần điền nếu bảng điểm rỗng; giữ quyền ưu tiên các ô học sinh đã chủ động sửa.
- `src/App.tsx`: lưu snapshot theo canonical pathname và URL đầy đủ, qua React transition; trang Admin Diagnostics được remount theo URL để không hiển thị kết quả chẩn đoán của query trước.
- `src/page/study-abroad/StudyAbroadPage.tsx`: đồng bộ lựa chọn quốc gia khi query thay đổi qua điều hướng SPA/Back; chỉ xóa checklist khi quốc gia thực sự đổi.
- `tests/cp58-transcript-prefill.test.mjs`, `tests/cp45-seamless-navigation.test.cjs`: kiểm thử chính sách, liên thông, query-only navigation và Back.
- `package.json`, GitHub Actions: thêm `test:cp58:integration` vào hồi quy.
- `src/lib/nexusEvidenceBaseline.ts` và các bằng chứng **synthetic**: cập nhật fingerprint cho mã nguồn mới; không tuyên bố nghiên cứu thực chứng.

## Kết quả tại môi trường hiện tại

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| Full `npm test`, một lần liên tục | **PASS, exit 0; 1.226 TAP `ok`, 0 `not ok`** | `reports/cp58/npm-test.log`, `npm-test.exit` |
| CP58 integration (7 guard + 2 route, 12 CP45/CP56) | **PASS** | `reports/cp58/cp58-integration.log`, `npm-test.log` |
| Rules static | **PASS 15/15** | `reports/cp58/rules-static.log` |
| Layout | **PASS** | `reports/cp58/layout.log` |
| Synthetic demo gate | **PASS 11/11** | `reports/cp58/offline-demo.log` |
| Backup synthetic verify | **PASS** | `reports/cp58/demo-backup-verify.log` |
| Packaging safety tests | **PASS** | `reports/cp58/packaging-test.log` |
| TypeScript/TSX parser diagnostics trên 5 file chỉnh | **PASS 0 lỗi cú pháp** | `reports/cp58/typescript-syntax.log` |
| Production `tsc -b`, `vite build` | **BLOCKED / NOT VERIFIED** | `reports/cp58/dependencies.log`: thiếu npm dependencies |
| Firebase Emulator allow/deny | **BLOCKED / NOT RUN** | `reports/cp58/emulator-preflight.log` |
| Hai trình duyệt thật, server Firebase, production deploy | **NOT RUN** | Chưa có môi trường nghiệm thu |

Lệnh trên máy có internet: `npm ci --no-audit --no-fund && npm run build && npm run test:rules:emulator && npm run test:cp58:integration`.

## Bảo đảm nghiên cứu và tiến độ

- Không sử dụng dữ liệu học sinh thật hoặc nguồn chưa được cấp phép. Dữ liệu Golden Path là SYNTHETIC, không xác nhận tăng điểm hay hiệu quả can thiệp.
- Không triển khai Rules/dữ liệu lên Firebase production; không thay quyền truy cập hay schema.
- Bảng 164 đầu việc vẫn là checklist kiểm soát. Đây là bản vá tích hợp có test, **chưa đủ bằng chứng để đóng thêm gate build/Emulator/E2E**.
- Ưu tiên tiếp: chạy build thật, Emulator, 2-browser E2E; sau đó nghiệm thu Seed→Lumen→Orion→Pulse và Atlas/Haven trên tài khoản test.
