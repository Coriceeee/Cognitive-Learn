# Cognitive Learn AI — CP60 | 21/11/2026

**Cơ sở mã nguồn:** `Cognitive-Learn-CP59-20261121.zip` (1.268 entries, CRC verified).
**Phạm vi:** ổn định listener fallback của Seed Transcript, giữ nguyên kiến trúc sáu module học sinh, không triển khai production.

## Vấn đề kỹ thuật được tái hiện

`useStudentTranscript.ts` trước CP60 gọi `stopLegacy()` ngay đầu mọi callback primary `student_transcripts`, kể cả sự kiện metadata đã xác nhận **không tồn tại tài liệu**. Những sự kiện `onSnapshot` lặp lại khi primary vẫn thiếu khiến `learning_profiles` bị unsubscribe/resubscribe, trạng thái `loading` nhấp nháy và phải đọc lại dữ liệu. Trong kịch bản vừa hiển thị bảng điểm từ legacy, callback primary cùng trạng thái thiếu không nên xóa kết quả đã được xác minh.

## Thay đổi

- `src/page/seed/hooks/useStudentTranscript.ts`: giữ listener legacy hiện có nếu primary vẫn thiếu và snapshot đã được máy chủ xác minh; ngừng legacy khi có primary chính thức, khi cache/pending hoặc khi chuyển tài khoản. Tiếp tục từ chối dữ liệu cached/unverified.
- `tests/cp60-seed-listener-stability.test.cjs`: 4 kiểm thử hành vi mới dùng mock callback Firestore: không resubscribe khi missing lặp lại; không làm mất verified fallback; canonical thắng callback legacy muộn; cache làm mất hiệu lực fallback rồi chỉ mở lại khi có xác minh server.
- `package.json`, `.github/workflows/cla-cp21-verify.yml`: bổ sung test CP60 trong `npm test` và CI.
- `src/lib/nexusEvidenceBaseline.ts` và synthetic demo output: đồng bộ source fingerprint, **không** coi nguồn synthetic là dữ liệu học sinh thực.

## Kiểm thử đã thực thi

| Gate | Kết quả thực tế | Log |
|---|---|---|
| 4 test CP60 mới | PASS 4/4 | `seed-listener.log` |
| Hồi quy bảng điểm Seed CP30 | PASS 10/10 | `seed-regression.log` |
| Toàn bộ `npm test` liền mạch | **PASS 1.238 TAP ok / 0 not ok, exit 0** | `npm-test.log` |
| Rules tĩnh | PASS 15/15 | `rules-static.log` |
| Layout | PASS; 22 required files | `layout.log` |
| Demo offline + fingerprint | PASS 11/11, synthetic | `demo-final.log` |
| Packaging security unit tests | PASS 3/3 | `packaging-tests.log` |
| Dependency readiness | **BLOCKED: 19 dependency/executable issues** | `dependency-preflight.log` |
| TypeScript/Vite production build | **FAIL, missing installed React/Firebase/type dependencies**; không thể suy ra build source độc lập | `build-preflight.log` |
| Firestore Emulator | **BLOCKED, NOT RUN** | `emulator-preflight.log` |
| Two-browser E2E / deployed production | **NOT RUN** | không có môi trường được kết nối |

## Giới hạn

1. Unit/contract test với mocked Firestore callbacks **không** xác nhận được trạng thái realtime trên hai trình duyệt hoặc quyền Firestore.
2. Không thêm nguồn trường/học bổng mới và không tuyên bố nghiên cứu đã được xác nhận thực nghiệm.
3. Chưa đóng thêm hạng mục nghiệm thu tích hợp nào trong checklist 164 mục; thay đổi là bằng chứng kỹ thuật một phần cho liên thông Seed và reliability.
4. Không xuất bản `firestore.rules.CANDIDATE_CP21` lên production nếu Emulator chưa đạt.

## Cách xác nhận trên môi trường đủ dependency

```bash
npm ci --no-audit --no-fund
npm run check:dependencies
npm run test:cp60:seed-listener
npm test
npm run build
npm run test:rules:emulator
npm run test:cp31:browser
```

**Quyết định:** Bàn giao mã nguồn CP60 để tiếp tục phát triển; chưa đạt production acceptance.
