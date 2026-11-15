# CLA Mobile Expansion — Daily Companion

**Ngày:** 13/11/2026  
**Quyết định kiến trúc:** Website là nền tảng phân tích/lập kế hoạch; Android/iOS là kênh đồng hành mỗi ngày. **Không viết lại hệ thống**, không tạo cơ sở dữ liệu riêng, không chuyển các engine của CLA sang nền tảng tách biệt.

## 1. Phạm vi sản phẩm

- **Web CLA:** Seed hồ sơ, điểm; Atlas hướng nghiệp/tuyển sinh; Orion chiến lược; Pulse hành động; Lumen diễn tiến; Haven hỗ trợ.
- **CLA Daily Companion:** nhắc xem kế hoạch, giờ học, check-in; cho phép cài đặt lịch và giờ yên lặng; ghi nhận một ngày đã học (tự báo cáo); truy cập nhanh Orion → Pulse → Lumen.
- **Dữ liệu dùng chung:** Firebase Authentication và Firestore. Cùng một tài khoản mở được trên web và, sau khi phát triển native, Android/iOS.
- **AI dùng chung:** Gemini/LLM vẫn qua các cổng ứng dụng hiện có; không lưu API key nhà cung cấp trong mobile.

## 2. Hạng mục được viết ở V1 (mốc hiện tại)

| Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|
| Trang `/student/companion` và liên kết từ Seed | CODE + TEST | `DailyCompanionPage.tsx`, `App.tsx` |
| Engine thời gian, yên lặng, ngăn nhắc sau check-in | CODE + TEST | `dailyCompanion.ts` |
| Firestore owner-only schedule và check-in ngày | CANDIDATE RULES; chưa deploy | `useDailyCompanion.ts`, `firestore.rules.CANDIDATE_CP21` |
| Theo dõi consent để dừng nhắc khi rút đồng ý | CODE + TEST | `useDailyCompanion.ts` |
| Web Manifest và icon 192/512, service worker chỉ hiển thị thông báo | CODE; cần nghiệm thu trình duyệt | `public/` |
| Push khi ứng dụng đóng | CHƯA | cần backend và push transport |
| APK/AAB, iOS IPA, App Store/Play Store | CHƯA | cần Capacitor + native build |
| Offline học tập và đồng bộ xung đột | CHƯA | cần thiết kế trước khi bật cache dữ liệu học sinh |

## 3. Firestore contract V1

`daily_companion/{uid}`:

```
{
  userId: uid,
  schemaVersion: 1,
  enabled: false,
  schedule: { morning: '07:00', study: '19:30', checkIn: '21:00' },
  quietStart: '22:00',
  quietEnd: '06:30',
  completedDays: ['YYYY-MM-DD'], // tối đa 14 ngày gần nhất được check-in, không có điểm số
  updatedAt: serverTimestamp()
}
```

- Chỉ học sinh là chủ sở hữu được đọc; chỉ học sinh có product consent hiện hành mới được ghi.
- Không lưu device token, dữ liệu điểm, môn yếu, vị trí hay thông tin giám hộ trong document này.
- `completedDays` là **học sinh tự báo cáo**, không thay thế check-in theo tuần hoặc kết quả đánh giá lại của Pulse.
- Dữ liệu thời gian được hiểu theo **múi giờ hiện tại của thiết bị** trong V1. Khi có push server cần lưu `IANA timezone`, xử lý DST và du lịch.
- `updatedAt` được ghi bởi máy chủ; ghi cấu hình/check-in dùng Firestore transaction để tránh ghi đè giữa thiết bị.
- Consent Gate mặc định tắt: chương trình ở chế độ xem trước và không âm thầm lưu dữ liệu trên production.

## 4. Lộ trình phát triển mobile (mốc cho roadmap chính)

**M1 — Web daily companion (đã có code, chưa nghiệm thu):** giao diện responsive, schema riêng, test engine, thông báo trong trang khi trang đang mở, thông báo thiết bị trên trình duyệt có HTTPS và người dùng cho phép. Kiểm thử Rules Emulator trước khi bật.

**M2 — PWA thử nghiệm (chưa nghiệm thu):** kiểm tra manifest/icons/service worker trên Android Chrome và iOS Safari; thử Add to Home Screen; đảm bảo không cache tài khoản/điểm; kiểm thử đăng nhập/deep link; kiểm tra thông báo trên thiết bị khi app mở. Hiện chỉ có manifest và service worker tối thiểu, chưa xây chế độ offline.

**M3 — Android ứng dụng (chưa triển khai):** bổ sung `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` theo một phiên bản tương thích và lockfile; thêm cấu hình với `webDir=dist`; chạy `npx cap add android`, `npm run build`, `npx cap sync android`; rà Auth persistence, deep link, permission Android; phát triển local notifications. Xuất APK thử nghiệm qua Android Studio và test thiết bị thật trước khi tạo AAB.

**M4 — iOS (chưa triển khai):** bổ sung `@capacitor/ios`, máy macOS/Xcode, cấu hình bundle id, signing, Associated Domains, auth, quyền thông báo, kiểm thử iPhone; kiểm tra các chính sách App Store.

**M5 — Push nền đồng bộ (chưa triển khai):** Firebase Cloud Messaging/Apple Push Notification service và cơ chế gửi phía server với lịch đặt theo IANA timezone; xác nhận người dùng riêng cho notifications; quản lý token trên từng thiết bị; thu hồi token khi tắt thông báo/đăng xuất; chống gửi lặp qua event id; retry và rate limiting. Không bao giờ đưa điểm, tình trạng sức khỏe, hồ sơ nhận thức hay ngành chọn vào thông báo khóa màn hình. Dịch vụ scheduler phải được test theo điều kiện DST, thiếu consent, offline và thay đổi thiết bị.

**M6 — Nghiệm thu:** E2E Android/iPhone (đăng nhập, quyền, lịch, chuyển tài khoản, thu hồi đồng ý, xóa lịch, đổi múi giờ); kiểm chứng Firestore Rules trên Emulator rồi production; rà soát quy trình người giám hộ và dữ liệu vị thành niên. Không công bố dùng thật trước khi đạt gate.

## 5. Nguyên tắc sử dụng lâu dài

1. **Người dùng điều khiển:** lịch nhắc tắt mặc định; cho phép thay giờ/tần suất; giờ yên lặng, tắt thông báo; không gamification gây áp lực.
2. **Phân biệt nguồn:** check-in/ngày học tự báo cáo không được biến thành hiệu quả can thiệp hoặc xác suất tiến bộ.
3. **Không thay thế web:** bản app dành cho nhắc và thao tác nhanh; nghiên cứu phân tích vẫn dùng các engine CLA chung.
4. **Không đẩy production ngay:** Firestore rules trong repo là bản `CANDIDATE_CP21`; kết quả unit/static không thay cho emulator/deployment.
5. **Tính tỷ lệ:** nhánh Mobile Companion là bổ sung ngoài 28 bước roadmap hiện tại, **không tự tăng phần trăm** vì chỉ có code.

## 6. Tài liệu kỹ thuật bên ngoài

- Capacitor existing web app: https://capacitorjs.com/docs/getting-started
- Web Notifications/gesture/HTTPS/service workers: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API
- Apple Web Push: https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers

## Bản cập nhật ngày 14/11/2026 — Mobile/Web Push V2

Nhánh M5 đã có **code thí điểm Web Push tiêu chuẩn** và scheduler Firebase Cloud Functions tách riêng, nhưng chưa deploy/chưa test thiết bị thật. Không tương đương đã hoàn tất M5 hay đã phát hành mobile native. Hướng dẫn đầy đủ: `docs/mobile/CLA_WEB_PUSH_PWA_V2_IMPLEMENTATION.md`. Thứ tự bảo mật: Emulator và consent/guardian → Rules review/deploy → VAPID + HTTPS + Functions disabled → test thiết bị → bật server gửi nhắc. Tránh lấy tỷ lệ số file làm % hoàn thành roadmap.
