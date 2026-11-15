# CLA Daily Companion V2 — Web Push/PWA transport (14/11/2026)

## Trạng thái trung thực

- **Có code, đã chạy unit tests:** opt-in/opt-out trên web, service worker nhận `push`, Firestore rules ứng viên cho subscription, lịch phía máy chủ trong Firebase Cloud Functions v2, tính múi giờ IANA, quiet hours, suppression sau check-in và event ledger chống gửi trùng.
- **Chưa triển khai:** Firestore Rules mới, Cloud Functions, VAPID trên hosting, Web Push trên thiết bị, trình duyệt iOS/Android, app Capacitor và push native.
- **Tắt mặc định:** `VITE_CLA_STUDENT_CONSENT_GATE` tắt → không đăng ký; VAPID chưa cung cấp → nút nhắc nền bị khóa; `CLA_PUSH_ENABLED=false` → Functions không gửi, ngay cả nếu vô tình triển khai.

Đây là Web Push tiêu chuẩn của trình duyệt/PWA, **không dùng Firebase Cloud Messaging SDK trên client** và chưa cung cấp native FCM/APNs. Web PWA thông báo khi không mở tab tùy thuộc hệ điều hành, thiết bị, quyền, kết nối, power management và hạn chế của từng trình duyệt; không bảo đảm đúng phút. Với iPhone, người dùng phải cài ứng dụng web lên màn hình chính trên hệ thống hỗ trợ Web Push.

## Kiến trúc và sở hữu dữ liệu

1. Học sinh đăng nhập, đồng ý product consent (`student_consents/{uid}`), bật và lưu lịch ở `daily_companion/{uid}`.
2. Người dùng **bấm riêng** "Bật nhắc nền trên thiết bị". Client sử dụng Push API + VAPID **public** để đăng ký, lưu một subscription tại `companion_push_devices/{uid}/subscriptions/{deviceId}` (có timezone của thiết bị).
3. Cloud Function `claCompanionPushTick`, khi được bật sau rà soát, chạy mỗi 5 phút, quét có giới hạn 1.500 hồ sơ, chỉ xét account `student` đang active và product consent đang valid. Với tối đa bốn thiết bị đã đăng ký mỗi hồ sơ, xét lịch/quiet time/ngày check-in theo IANA timezone.
4. Trước khi gửi, giao dịch Firestore ghi khóa `companion_push_delivery/{uid}/sent/{YYYY-MM-DD_kind_deviceId}` chống gửi lặp (at-most-once attempt). Gửi payload **chỉ chứa `type` và `kind`**. Không gửi điểm, tên, trạng thái tâm lý, ngành, thông tin định danh hay đường dẫn ngoài.
5. Service worker mở trang `/student/companion` trên cùng origin; không cache trang hoặc API chứa dữ liệu riêng tư. Học sinh có thể tắt thông báo, đăng xuất, thay đổi thiết bị hoặc rút consent. Server kiểm tra lại consent mỗi tick, không tin cache browser.

Subscription (endpoint và khóa công khai cho mã hóa push) là thông tin định danh thiết bị nhạy cảm, phải được bảo vệ và xóa khi người dùng rút quyền. Chỉ học sinh sở hữu đọc/ghi/hủy subscription của mình, không thể `list`. Nhật ký gửi chỉ Server Admin SDK có quyền đọc/ghi.

## Triển khai thủ công theo gate — KHÔNG tự kích hoạt

Trước khi triển khai, cần đồng ý với chính sách thông báo, xác minh người giám hộ cho học sinh vị thành niên theo quy trình dự án, retention/xóa dữ liệu, app-check/anti-abuse, Firebase Emulator và kiểm thử thiết bị.

**Gate A — Kiểm thử:**

```powershell
npm run test:companion-push
npm run test:daily-companion
npm test
npm run test:rules:static
npm run test:rules:emulator
npm run build
```

Bộ Emulator cần Java + Firebase CLI + @firebase/rules-unit-testing và chỉ chạy với project demo/localhost; test unit/static không thay cho Emulator. Chạy build/test trên Windows thật vì source ZIP không chứa `node_modules`.

**Gate B — Cấu hình Web Push (sau khi Gate A đạt):**

- Cài dependencies `cd functions; npm install` ở môi trường kiểm soát, tạo cặp VAPID với `npx web-push generate-vapid-keys` (không commit khóa). Cần xác minh phiên bản web-push/Firebase Functions và lockfile trước khi triển khai production.
- Khóa **public** vào `.env.local` hoặc môi trường Vite build: `VITE_CLA_WEB_PUSH_VAPID_PUBLIC_KEY=...`.
- Public key giống hệt ở môi trường Cloud Functions `functions/.env.<PROJECT_ID>`: `CLA_WEB_PUSH_VAPID_PUBLIC_KEY=...`, `CLA_WEB_PUSH_CONTACT=mailto:<technical-contact>`, `CLA_PUSH_ENABLED=false`.
- Khóa **private** chỉ đưa vào Firebase Secret Manager: `firebase functions:secrets:set CLA_WEB_PUSH_VAPID_PRIVATE_KEY --project <PROJECT_ID>`; tuyệt đối không đưa private key vào source, `.env.local` của client hay ZIP.
- Bản Rules mới chỉ nằm trong `firestore.rules.CANDIDATE_CP21`; `firebase.json` thông thường không triển khai Rules này. Sau khi qua Emulator và phê duyệt, Rules mới có thể được triển khai có chủ đích bằng `firebase.rules.candidate.json`. Đọc và so sánh toàn bộ Rules trước khi deploy, vì file ứng viên chứa nhiều quyền nghiệp vụ khác chứ không chỉ Web Push.
- File `firebase.push.json` chứa **chỉ** cấu hình Cloud Functions, dùng khi chủ động triển khai: `firebase deploy --only functions --config firebase.push.json --project <PROJECT_ID>`. Đây là thao tác làm thay đổi Firebase thực tế, chỉ thực hiện sau phê duyệt và đánh giá chi phí.
- Chỉ sau khi Rules, chính sách đồng ý và test thiết bị đạt: bật `VITE_CLA_STUDENT_CONSENT_GATE=true` ở web build; cuối cùng đổi server `CLA_PUSH_ENABLED=true` và triển khai lại Functions. Bật lần lượt, không bật hàng loạt.

**Gate C — Nghiệm thu thiết bị:** Đăng nhập học sinh được phép → bật lịch → nhấn cấp quyền Web Push → đóng tab/khóa màn hình → kiểm tra nhắc nhận được; thử quiet hours, check-in, đổi timezone, thiết bị thứ hai, tắt nhắc, đăng xuất/chuyển tài khoản, rút consent, trạng thái offline, iOS PWA Add to Home Screen, browser permission bị từ chối.

## Ranh giới và giới hạn hiện tại

- Web Push V2 là **best effort**: scheduler mỗi 5 phút có cửa sổ 5 phút; nếu Cloud Scheduler gián đoạn vượt cửa sổ sẽ không gửi bù. Delivery ledger là at-most-once *attempt*; lỗi mạng khi gửi có thể dẫn tới mất nhắc. Chưa xây hàng đợi retry có bảo đảm.
- Function tối đa 1.500 tài khoản và tối đa 4 thiết bị/tài khoản mỗi tick, không phù hợp quy mô lớn nếu chưa nâng cấp kiến trúc và kiểm soát chi phí. Token cũ hơn 30 ngày bị bỏ qua cho đến khi học sinh đăng ký lại. Ledger nên cấu hình Firestore TTL cho `expireAt`.
- Firestore Emulator **chưa được chạy trên source này** ở môi trường đóng gói. Không coi Rules đã an toàn hoặc đã triển khai.
- Không có Android APK, iOS IPA; native notifications cần cấu hình ứng dụng, certificate, permission và backend riêng. Không dùng Web Push service worker như một thay thế cho native push trong Capacitor.
- Sau logout/chuyển tài khoản client cố unsubscribe ngay trên browser; có thể còn bản ghi cloud nếu lúc đó mất mạng. Server chỉ gửi generic, có TTL, xóa khi endpoint 404/410. Quy trình xóa toàn bộ subscription theo yêu cầu còn cần triển khai đầy đủ.
- Firestore write của thiết bị có thể thất bại do Rules chưa deploy, khi đó nút hiển thị lỗi; không khuyến nghị mở Rules rộng.

## Tệp chính

- `src/lib/companionWebPush.ts`, `src/page/companion/DailyCompanionPage.tsx`, `src/main.tsx`
- `public/cla-companion-sw.js`
- `functions/src/pushPolicy.mjs` (pure policy), `functions/index.mjs` (scheduled sender), `functions/package.json`
- `firestore.rules.CANDIDATE_CP21`, `firebase.push.json`, `firebase.rules.candidate.json`
- `tests/step15-companion-web-push.test.mjs`, `tests/firestore.rules.cp21.test.mjs` (6 Emulator cases)
