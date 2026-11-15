# COGNITIVE LEARN AI — BÁO CÁO WEB PUSH PWA V2

**Ngày:** 14/11/2026  
**Bản nguồn kế thừa:** `CLA_FULL_SOURCE_DAILY_COMPANION_WEB_TO_MOBILE_20261113.zip` (448 file)  
**Mục tiêu:** Từ website CLA phát triển kênh đồng hành mobile với nhắc học khi tab đóng, không viết lại các engine học tập. Bản này làm **Web Push tiêu chuẩn cho PWA**; chưa có Android/iOS native build.

## A. Kết quả đã viết vào FULL SOURCE

1. **Đăng ký thiết bị tự nguyện:** `src/lib/companionWebPush.ts` dùng Push API + public VAPID, yêu cầu học sinh có product consent được xác minh và lịch đã bật. Người dùng phải bấm nút riêng mới được yêu cầu quyền notification; có nút tắt theo thiết bị. Subscription chứa khóa push mã hóa và timezone, nằm riêng tại `companion_push_devices/{uid}/subscriptions/{deviceId}`.
2. **Bảo vệ tài khoản trên trình duyệt dùng chung:** `src/main.tsx` dừng subscription còn sót khi đăng xuất/chuyển UID. Khi rút đồng ý tại màn Companion, client chủ động hủy subscription; backend kiểm tra lại consent mỗi lần xử lý.
3. **Service worker nhận push nền:** `public/cla-companion-sw.js` xử lý `push` với chỉ `type` và `kind` hợp lệ. Notification luôn có thông điệp chung, điều hướng cố định về `/student/companion`, không nhận URL tùy ý và không cache trang/data đã đăng nhập.
4. **Backend điều phối có điều kiện:** `functions/src/pushPolicy.mjs` kiểm tra múi giờ IANA, lịch 3 mốc/ngày, giờ yên lặng, ngày đã check-in và DST. `functions/index.mjs` chạy Cloud Functions v2 scheduler mỗi 5 phút, kiểm tra active student + server-side consent, giới hạn 1.500 hồ sơ/lượt, tối đa 4 thiết bị/học sinh, kiểm tra tuổi subscription tối đa 30 ngày, gửi không chứa PII, nhật ký giao dịch chống gửi trùng. Backend **tắt mặc định** nếu `CLA_PUSH_ENABLED` khác `true`.
5. **Rules ứng viên và kiểm thử:** `firestore.rules.CANDIDATE_CP21` bổ sung quyền owner-only cho subscription và chỉ server đọc/ghi delivery ledger; kiểm tra endpoint có tên miền push hợp lệ để giảm SSRF. `tests/firestore.rules.cp21.test.mjs` thêm 6 ca Emulator WP-E01…WP-E06. Rules **không tự deploy**.
6. **Triển khai riêng:** `firebase.push.json` chứa functions-only, `firebase.rules.candidate.json` chứa rules-only, không sửa `firebase.json` đang phục vụ Hosting. `functions/.env.example` không chứa khóa bí mật. Có hướng dẫn giữ private VAPID trong Secret Manager và đánh giá chi phí Cloud Scheduler.
7. **Kiến trúc:** Giữ nguyên Seed–Atlas–Orion–Pulse–Lumen, Firebase Auth/Firestore, hành trình Closed Loop, Consent Gate và giao diện web trước đó; chỉ mở rộng Daily Companion.

## B. Kết quả kiểm thử thực tế trong môi trường tạo bản vá

| Kiểm thử | Kết quả và bằng chứng |
|---|---|
| `npm run test:companion-push` | **PASS 18/18**, Node 22, pure scheduler policy + kiểm tra tích hợp |
| `npm run test:daily-companion` | **PASS 20/20**, không phá chức năng V1 |
| `npm test` toàn dự án | **PASS**; script hiện chạy thêm Web Push V2 |
| `npm run test:rules:static` | **PASS 15/15** (chỉ tĩnh) |
| `npm run check:layout` | **PASS** (22 file bắt buộc / 19 vị trí cũ bị cấm) |
| `node --check` | **PASS**: Service worker, server sender và pure policy |
| TS/TSX transpile syntax | **PASS**: 3 file thay đổi, TS 5.8.3 global (chưa phải type-check toàn dự án) |
| `npm run test:rules:preflight` | **BLOCKED** vì thiếu Firebase CLI/Emulator; không phải PASS Rules |
| `npm run test:rules:emulator` | **CHƯA CHẠY** bộ 74 ca, gồm 6 ca mới |
| `npm run build` | **CHƯA PASS** tại môi trường đóng gói: thiếu dependencies React/Firebase; `npm ci --offline` trả `ENOTCACHED` do thiếu gói cache; cần kiểm thử trên Windows đã cài dependencies |
| Firebase production / PWA Android / PWA iPhone | **CHƯA KIỂM CHỨNG** |
| Cloud Function thực sự gửi web push | **CHƯA TRIỂN KHAI / CHƯA CÓ BẰNG CHỨNG GỬI NHẬN** |

## C. Cửa kiểm soát an toàn

- Web: `VITE_CLA_STUDENT_CONSENT_GATE` mặc định tắt. `VITE_CLA_WEB_PUSH_VAPID_PUBLIC_KEY` chưa được cấp trong ZIP, nên nút nhắc nền không khả dụng và hiển thị nguyên nhân.
- Server: `CLA_PUSH_ENABLED` mặc định tắt. **Không** đưa khóa VAPID private vào frontend, ZIP hay Firestore. Khi triển khai cần Cloud Functions Secret Manager.
- Firestore Rules: chỉ là `CANDIDATE`, chưa đủ điều kiện bật cho học sinh thật trước khi chạy Emulator PASS, kiểm tra sản phẩm/guardian consent và phê duyệt vận hành.
- Hiệu quả/giới hạn: scheduled push là **best effort**, không bảo đảm đúng giờ nếu hệ thống hạn chế nền hoặc mất mạng; chỉ chống lặp theo *attempt* không có đảm bảo giao hàng. Cần giám sát, vận hành, retry policy và retention/TTL ledger khi mở rộng.
- Học sinh vị thành niên: xác minh người giám hộ và quy trình rút/xóa dữ liệu vẫn là P0 chưa hoàn thành.

## D. Không đổi tỷ lệ tiến độ cũ

Theo quy ước cũ, 6/28 bước roadmap có bản vá = **21,4%**, không phản ánh tỷ lệ hoàn thiện sản phẩm. Nhánh Web Push là bản vá bổ sung chưa nghiệm thu thiết bị/production, **không tính tăng 80%** hay đánh dấu toàn hệ thống sẵn sàng dùng thật.

## E. Hướng dẫn tiếp theo

- `START_HERE_MOBILE_WEB_PUSH_20261114.md` — sao lưu/cài đè, test Windows.
- `docs/mobile/CLA_WEB_PUSH_PWA_V2_IMPLEMENTATION.md` — contract, consent, Web Push/VAPID, Cloud Functions, Firebase Rules deployment gates, chi phí và rollback.

**Kết luận:** Có code Web Push PWA V2 và bộ kiểm thử policy đạt. Chưa có minh chứng push nền thực sự hoạt động trên mobile, chưa có APK/AAB hay IPA. Khi chép FULL SOURCE, production Firebase của bạn không bị tự thay đổi.
