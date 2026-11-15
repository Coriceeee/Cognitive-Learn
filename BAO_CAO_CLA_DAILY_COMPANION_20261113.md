# COGNITIVE LEARN AI — BÁO CÁO BỔ SUNG DAILY COMPANION (WEB → MOBILE)

**Ngày:** 13/11/2026  
**Yêu cầu:** Bổ sung hướng khai thác website CLA thành ứng dụng đồng hành hằng ngày, không viết lại source, gồm nhắc học, check-in và cùng một hệ thống dữ liệu.  
**Nền source thực tế:** `/mnt/data/CLA_STEP12_JOURNEY_RELIABILITY_WORK_20261113` (cây mã nguồn Step12 đã sửa dở/trong quá trình kiểm thử). Bản **FULL SOURCE gần nhất đã bàn giao trước đó** là Closed-Loop Orion–Pulse–Lumen. Gói mới này tích hợp cả công việc Step12 vốn chưa được bàn giao độc lập. Không phải nhánh mã nguồn khác.

## 1. Phạm vi hiện thực V1

| Thành phần | Trạng thái | Nơi hiện thực |
|---|---|---|
| Hành trình web Daily Companion | CODE + TEST | `src/page/companion/DailyCompanionPage.tsx`, route `/student/companion` |
| Liên kết Seed → Daily Companion | CODE + TEST | `StudentPage.tsx`, `StudentHeader.tsx` |
| Hiển thị tình trạng chu kỳ Orion–Pulse–Lumen | CODE; đang đọc chu kỳ thực | `useClosedLoopJourney.ts` (sẵn có) và trang Companion |
| Lịch ba lần nhắc: xem kế hoạch / học / check-in | CODE + TEST | `dailyCompanion.ts` |
| Giờ yên lặng qua nửa đêm | CODE + TEST | `isQuietTime` |
| Ghi nhận ngày đã học, tối đa 14 ngày gần nhất | CODE + TEST | Firestore `daily_companion/{uid}` |
| Đồng bộ sở hữu tài khoản, ghi transaction | CODE; chưa nghiệm thu server thật | `useDailyCompanion.ts` |
| Tắt nhắc khi product consent rút / chỉ dùng server-verified consent | CODE + TEST | `useDailyCompanion.ts` |
| Manifest, icon 192/512, service worker hiển thị thông báo | CODE; cần browser test | `public/` |
| Giới hạn thông báo trong web foreground | Được ghi rõ; chưa có backend push | `DailyCompanionPage.tsx` |
| Firestore Rules cho daily companion | **CANDIDATE**, chưa deploy | `firestore.rules.CANDIDATE_CP21` |
| Android APK/AAB, iOS IPA | **CHƯA CÓ** | roadmap |
| FCM/APNs gửi khi ứng dụng đóng | **CHƯA CÓ** | roadmap |
| Guardian verification và dùng với học sinh thật | **CHƯA NGHIỆM THU** | P0 độc lập |

## 2. Kiến trúc và bảo mật

- Web vẫn là nguồn chung của React/TypeScript/Vite. Firebase Auth và Firestore lưu cùng tài khoản; không viết engine hoặc database thứ hai.
- `daily_companion/{uid}` chỉ có lịch, thời gian yên lặng và khóa ngày đã check-in; không ghi điểm, thông tin nhận thức, nội dung môn yếu, vị trí, token push.
- Rules ứng viên: `allow get: if studentOwns(uid)`, `allow create, update: if validDailyCompanion(uid)` với `studentMayPersist(uid)`, cấm list/delete, giới hạn schema và 14 ngày.
- Để tránh tự động mở luồng học sinh trước khi an toàn, `VITE_CLA_STUDENT_CONSENT_GATE` mặc định **tắt** → trang mở chế độ `preview`; không chạy nhắc và không ghi dữ liệu. Bật sau khi Rules đã qua Emulator + duyệt triển khai; không deploy từ mã nguồn này.
- Khi đã bật, hook theo dõi consent thay đổi real-time, không coi cache offline là bằng chứng đồng ý; rút đồng ý → dừng nhắc và khóa ghi.
- Quyền thông báo hệ thống chỉ được yêu cầu khi người dùng chủ động bấm nút, có HTTPS/localhost, không tự yêu cầu khi load trang.
- Thông báo generic trên màn hình khóa, không có nội dung cá nhân. Trang không gửi background push, không cache nội dung riêng tư bằng service worker.
- Check-in là **dữ liệu tự báo cáo** và không là bằng chứng tiến bộ hoặc hiệu quả nhân quả.

## 3. Kiểm thử được thực thi trong môi trường tạo source

| Hạng mục | Kết quả |
|---|---|
| `npm run test:daily-companion` | **20/20 PASS** |
| `npm test` toàn dự án (bao gồm suite Companion) | **PASS** |
| `npm run test:rules:static` | **15/15 PASS** |
| `npm run check:layout` | **PASS** |
| Strict TypeScript riêng `src/lib/dailyCompanion.ts` | **PASS** với TypeScript 5.8.3 |
| TS/TSX transpile syntax | **PASS** (không phải typecheck toàn app) |
| `node --check public/cla-companion-sw.js` | **PASS** |
| PWA icon 192x192 và 512x512 | **PASS** xác nhận kích thước file |
| Firestore Rules Emulator | **BLOCKED**, chưa chạy 68 ca (bao gồm 5 ca mới) |
| `npm run build` toàn bộ source | **CHƯA PASS**: môi trường đóng gói thiếu `node_modules` React/Firebase/types |
| Windows/Android/iPhone browser E2E | **CHƯA CHẠY** |
| Firebase production Rules, web hosting, push | **CHƯA KIỂM CHỨNG / CHƯA TRIỂN KHAI** |

`npm run test:rules:preflight` trả `BLOCKED` đúng thiết kế, ghi rõ thiếu Firebase CLI và thư viện Emulator trong môi trường này. Đây **không phải một kết quả FAIL của Rules**, nhưng vẫn là **chưa có bằng chứng nghiệm thu**.

## 4. Ranh giới V1 và các việc còn lại

- Giao diện có nhắc khi tab Companion đang mở. Khi đóng tab, máy ngủ hoặc trình duyệt giới hạn timer, không cam kết nhắc đúng phút. Đây **không phải thông báo nền chuẩn của một app mobile**.
- Manifest và service worker được thêm để tạo điểm khởi đầu PWA; chưa có kiểm thử installability thực tế hoặc offline caching.
- Chưa thêm Capacitor/Android Studio/iOS Xcode vào `package.json`; không tạo APK giả, không đổi lockfile hoặc dependency hiện hành.
- Chưa tích hợp tự động một danh sách nhiệm vụ hằng ngày từ Orion; V1 hiển thị chu kỳ đang chạy và dẫn tới Pulse để ghi dữ liệu chi tiết.
- Đồng bộ Firestore chỉ chạy được khi ứng viên Rules tương ứng đã được kiểm thử và được triển khai, Consent Gate bật đúng cách, tài khoản là học sinh đã đồng ý.
- Thiết kế push nền, token, scheduler theo timezone và chống trùng gửi, màn hình đồng ý người giám hộ, data deletion cần hoàn thiện trước khi sử dụng rộng.

## 5. Tiến độ

**Không tự tăng phần trăm dự án:** cách đếm roadmap trước đó vẫn **6/28 bước có bản vá = 21,4%**. Nhánh Daily Companion là bổ sung kiến trúc ngoài cách đếm 28 bước, có code và test nhưng chưa nghiệm thu website/Firestore. Không thể xác nhận mốc 80%.

## 6. Tài liệu và hướng dẫn

- `START_HERE_DAILY_COMPANION_20261113.md`
- `docs/mobile/CLA_MOBILE_EXPANSION_ROADMAP.md`
- `/student/companion`

**Kết luận kỹ thuật:** Đã tích hợp thực sự phần **web companion V1** và ghi chính thức kế hoạch mở rộng mobile; **chưa phát hành ứng dụng Android/iOS hay thông báo nền**.
