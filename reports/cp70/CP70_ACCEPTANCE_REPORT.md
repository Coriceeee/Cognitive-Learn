# CP70 — Student journey continuity & verified Firestore snapshot gate

**Ngày:** 22/11/2026 · **Kế thừa:** CP69 · **Mục tiêu:** luồng MVP Seed → Orion → Pulse → Lumen với Atlas/Haven truy cập song song, không mở thêm tính năng dự báo chưa kiểm định.

## Thay đổi cụ thể

| Thành phần | Thực hiện | Giới hạn |
|---|---|---|
| `src/lib/journeySnapshotGate.ts` | Ranh giới chung: chờ Firestore nếu cache/pending; từ chối toàn bộ batch nếu sai UID hoặc document ID; chỉ xuất chu kỳ khi server-confirmed | Server-confirmed là xác nhận bản ghi, không phải xác minh lời tự báo cáo |
| `src/lib/useClosedLoopJourney.ts` | Thêm `syncing`, ẩn chu kỳ khi chưa xác minh; chặn thao tác ghi; transaction kiểm tra UID và document ID khi cập nhật | Không thay thế Rules hoặc Emulator |
| `src/components/journey/ClosedLoopPanel.tsx` | Hiển thị trạng thái chờ xác minh; vô hiệu hóa nút tạo/check-in/tổng kết cho đến khi snapshot được xác nhận | UX cần browser E2E |
| `src/lib/studentJourneyBridge.ts` | Chính sách điều hướng từ trạng thái chu kỳ: chưa có hồ sơ → Seed; chưa có chu kỳ → Orion; ACTIVE → Pulse; REVIEWED → Lumen | Không giả lập điểm số hay trạng thái hoàn thành sáu module |
| `src/page/seed/components/StudentJourneyBridge.tsx` + CSS | Dải sáu module và nút hành động kế tiếp ngay trên trang chính, có mobile/dark/reduced motion | Chưa chụp từ React thật |
| `tests/cp70-student-journey-integration.test.mjs` | 19 test mới: cache/pending, UID/doc ID, data corruption, account switch, hành động theo trạng thái, link sáu module | Kiểm thử domain và source contract; không thay thế Emulator |
| Hồi quy CP31/CP34/CL | Cập nhật các bài kiểm thử giám sát ranh giới sau khi chuyển sang hàm chung | Giữ nguyên/siết chặt điều kiện cũ |

## Kết quả kiểm thử và giới hạn

| Gate | Trạng thái | Bằng chứng |
|---|---|---|
| CP70 mới | **19/19 PASS** | `cp70-new-tests.log` |
| Closed loop domain | **19/19 PASS** | `closed-loop.log` |
| Journey reliability | **15/15 PASS** | `journey-reliability.log` |
| Rules tĩnh | **15/15 PASS** | `rules-static.log` |
| Layout contract | **PASS** | `layout.log` |
| Two pure TypeScript helpers typecheck | **PASS** | `typescript-core-check.log` |
| Demo offline synthetic | **11/11 PASS** | `demo-final.log` |
| `npm test` toàn bộ | **PASS** – exit code 0, 1.295 dòng TAP `ok`, 0 `not ok` | `full-npm-test.log`, `.exit` |
| Release packaging tests | **3/3 PASS** | `packaging-tests.log` |
| Dependency preflight | **BLOCKED** – 19 package/executable thiếu | `dependency-preflight.log` |
| Production build | **BLOCKED** – thiếu React, JSX types và dependency | `build.log` |
| Firestore Emulator | **NOT RUN** – thiếu môi trường chạy | Không tuyên bố PASS |
| Browser E2E / QA 12 ca | **NOT RUN** – React build blocked | Không dùng ảnh QA mô phỏng làm bằng chứng website |
| Empirical scientific validation | **NOT RUN** | Không phải phạm vi CP70 |

## Điều kiện trước MVP

1. Khôi phục dependency bằng `npm ci` tại máy có mạng, chạy production `npm run build`.
2. Firebase Emulator xác minh Rules/transactions, đặc biệt nhiều tab, chuyển UID, consent, conflict và server-pending state.
3. Browser QA thực tế sáu module, cả desktop/mobile, với dữ liệu QA tổng hợp và screenshot thật.
4. Đối chiếu dữ liệu ngành/trường chính thức, trạng thái học bổng và nguồn tham khảo trước khi khẳng định có khuyến nghị cá nhân hóa thật.
5. Kết hợp luồng AI fallback có minh bạch nguồn, không tự tính điểm/xác suất khi chưa có mô hình được hiệu chỉnh.

**Kết luận:** CP70 là mốc triển khai tích hợp/UX, **chưa phải MVP được nghiệm thu** và chưa đóng thêm gate trong checklist 164 mục theo tiêu chí kiểm chứng thực tế. Các phiên CP71–CP73 là mục tiêu quy hoạch, không cam kết kết quả nếu thiếu QA.
