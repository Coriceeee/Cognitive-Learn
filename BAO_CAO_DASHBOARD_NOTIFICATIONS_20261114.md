# CLA — Báo cáo chỉnh Dashboard & Trung tâm thông báo
**Ngày:** 14/11/2026  
**Nền:** `CLA_FULL_SOURCE_EXAM_CALENDAR_COUNTDOWN_20261114.zip` (giữ nguyên Seed, Atlas, Orion, Pulse, Lumen, Web Push V2, Admin hotfix).

## 1. Hoàn thành trong source
- Chuyển `ExamReminderBoard` xuống dưới Hero và cụm `Việc nên làm tiếp theo / Mức độ sẵn sàng`, đúng bố cục ảnh người dùng gửi. Vẫn giữ anchor `#cla-exam-reminders`.
- Thêm chuông `Thông báo` trong UserMenu, bảng lịch sử trong phiên và toast nổi dưới navbar trên mọi route đã được AccessGate xác thực. Tối đa 3 toast đồng thời, tự đóng (6,5s hoặc 9s cho lỗi), đóng thủ công, responsive, screen-reader.
- Nối sự kiện **thực**: Gemini Lumen trả giải thích; Gemini Atlas trích xuất/saving; Seed Firestore commit; lỗi lưu/tra cứu; mất/khôi phục Internet; mốc thi đã lưu <=14 ngày.
- Thông báo nhắc thi không trùng cùng mốc/ngày trong một tab; lưu Seed xong chuyển trang vẫn thấy popup.
- Không gọi thành công khi Gemini chưa có kết quả, Firestore chưa commit hoặc mô hình thử nghiệm chưa hiệu chuẩn.

## 2. Thay đổi source/test
- Mới: `src/lib/appNotices.ts`, `src/components/common/AppNotificationCenter.tsx`, `src/styles/31-notification-center.css`, `tests/step18-notification-center.test.mjs`, `docs/ux/CLA_NOTIFICATION_CENTER_V1_20261114.md`.
- Sửa: `src/App.tsx`, `src/components/common/UserMenu.tsx`, `src/page/seed/StudentPage.tsx`, `src/page/seed/StudentProfilePage.tsx`, `src/components/student/ExamReminderBoard.tsx`, `src/page/lumen/hooks/useLumenIntelligence.ts`, `src/page/atlas/components/AtlasGeminiReaderPanel.tsx`, `src/styles.css`, `package.json`, `tests/step17-exam-reminders.test.mjs` (EX23 cập nhật yêu cầu vị trí).

## 3. Kết quả kiểm thử (không suy diễn production)
- `npm run test:exam-calendar`: **30/30 PASS**, bao gồm vị trí mới EX23.
- `npm run test:notifications`: **13/13 PASS**.
- `npm test` **PASS** trên toàn dự án.
- `npm run test:rules:static`: **15/15 PASS**, đây **không** phải Emulator.
- `npm run check:layout`: **PASS**.
- Transpile / cú pháp TypeScript/TSX thay đổi: **PASS** với TS 5.8.3.
- Đã thử `npm run build` tại môi trường đóng gói: **chưa qua** vì thiếu `node_modules` (React/Firebase/JSX types). Không kết luận đây là lỗi source; cần chạy trên Windows có `npm ci` thành công. Browser E2E, Firebase Emulator và push native: **CHƯA NGHIỆM THU**.

## 4. Ranh giới thông báo
- Popup mới chỉ là **in-app toast**, không tương đương Web Push V2 (hệ thống backend push đang tắt mặc định).
- Thông báo mạng dựa trên online/offline của trình duyệt; **không chứng minh Firebase/Gemini hoạt động**. Lỗi backend vẫn được báo riêng khi thực hiện thao tác.
- Lịch thi lấy từ dữ liệu tự nhập trên đúng thiết bị; **không nhận ngày thi tự suy ra từ Gemini**.
- Không có quyền cá nhân được mở rộng hay schema mới.

## 5. Tiến độ
- Không đổi điểm kiểm kê bảo thủ **37,2% theo 164 mục**; mới có code + test, cần người dùng kiểm tra trực tiếp.
- Mốc 80% trong ngày 14/11 là mục tiêu, **không thể tuyên bố đã đạt** nếu chưa đủ bằng chứng.
