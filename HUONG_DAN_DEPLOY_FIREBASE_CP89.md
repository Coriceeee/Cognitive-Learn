# Deploy Cognitive Learn AI CP89 lên Firebase Hosting

**Mục tiêu:** website mặc định của Firebase project `cognitive-learn-ai`, thường là `https://cognitive-learn-ai.web.app`. Đây là Firebase Hosting, KHÔNG phải Firestore. Không deploy Rules/Auth/Functions.

## 1. An toàn và điều kiện

- Thực hiện từ `C:\Gạo\Cognitive-Learn` đã xác minh CP89. Đóng gói này KHÔNG chứa tài khoản, API key, dữ liệu học sinh hoặc `.env`.
- Sao chép 3 tệp trong ZIP vào thư mục gốc dự án (tệp `.cjs` vào `tools`).
- Máy đã đăng nhập Firebase CLI bằng tài khoản có quyền Hosting trên project (`firebase login`).
- Có tệp `.env.live.local` với cấu hình **Web App Firebase thật**; không dùng `.env.local` đang trỏ QA/demo, không dùng `--mode development` để build.
- Giữ `VITE_USE_FIREBASE_EMULATORS=false`, `VITE_FIREBASE_PROJECT_ID=cognitive-learn-ai`, `VITE_CLA_STUDENT_CONSENT_GATE=true`. Nếu cổng đồng thuận thật đang lỗi trên production, **không deploy site cho học sinh** cho tới khi quyền Firestore thật được xác minh. Không nới Security Rules tùy tiện.
- Nếu cần Gemini, đặt `VITE_API_BASE_URL=https://<your-actual-vercel-api-origin>` vào `.env.live.local` (không có `/api` cuối URL). Vercel phải có server env `GEMINI_API_KEY`, `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID=cognitive-learn-ai` và `CORS_ALLOWED_ORIGINS=https://cognitive-learn-ai.web.app,https://cognitive-learn-ai.firebaseapp.com`. Không bao giờ đặt `GEMINI_API_KEY` dưới tiền tố `VITE_` hoặc trong bundle dist. Sau deploy vẫn phải kiểm thử Gemini với token Firebase đúng.
- Chỉ muốn xem UI trên Firebase, không cam kết Gemini: dùng tham số `-FrontendOnly`; cần giải thích rõ với người thử nghiệm rằng Gemini chưa được xác minh.
- Preview Firebase có một origin khác domain live. Muốn thử Gemini ngay trên Preview cần bổ sung chính xác URL Preview vào `CORS_ALLOWED_ORIGINS` của Vercel và triển khai lại API, rồi xóa origin đó sau khi nghiệm thu. Không dùng `*` để mở CORS.
- Nếu hiện đang dùng `VITE_CLA_STUDENT_CONSENT_GATE=false` để workaround đăng nhập, gate sẽ BLOCKED. Kiểm tra và sửa quyền hồ sơ/consent trên Firebase production đúng cách trước khi phát hành, không bật/tắt cờ để ép PASS.

## 2. Chạy PowerShell

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
# Deploy Preview 7 ngày (không ghi đè website chính)
.\CHAY_DEPLOY_FIREBASE_HOSTING_CP89.ps1

# CHỈ sau khi xem link Preview, thử đăng nhập/6 phân hệ, xác nhận đủ backend Gemini và đọc/ghi Firestore
.\CHAY_DEPLOY_FIREBASE_HOSTING_CP89.ps1 -Live
```

Nếu PowerShell không cho chạy script từ Internet, chỉ dùng chính sách trong phiên hiện tại theo quản trị máy, không tắt kiểm soát bảo mật toàn hệ thống.

**Script trước khi deploy sẽ chạy Snapshot → Layout → LUMEN test → toàn bộ `npm test` → Firestore Emulator → production build (`--mode live`).** Nếu bất cứ bước nào FAIL, không xuất bản website.

## 3. Kiểm tra sau khi deploy

1. Hosting site và refresh URL `/student` không 404.
2. Đăng nhập hai tài khoản ban đầu với Firebase chính thức, không phải Auth Emulator; hồ sơ `users/{uid}` và quyền đồng thuận đọc được. Không gửi mật khẩu/tokens.
3. Giữ nguyên quy trình quyền dữ liệu, không bỏ Consent Gate hoặc hạ cấp Rules chỉ để demo.
4. Sáu phân hệ SEED, LUMEN, ATLAS, ORION, PULSE, HAVEN hoạt động và lưu/đọc đúng dữ liệu.
5. Gemini: chatbot, Lumen, admission reader trả JSON thật sau authenticated request; không nhầm 404 HTML thành API. Kiểm tra hạn mức, CORS và secret của Vercel. `HOSTING PREFLIGHT PASS` chỉ kiểm tra API routing/CORS, không chứng minh GEMINI_API_KEY hợp lệ.
6. Giữ bản deploy trước để rollback nếu phát hiện lỗi; đừng công bố sẵn sàng production chỉ dựa vào npm test.

## 4. Khi gate BLOCKED

Không thay `firebase.json` thành rewrite mọi `/api` về `index.html` và giả là Gemini đã chạy. `firebase deploy --only hosting` chỉ triển khai frontend. Nếu muốn Gemini cùng tên miền Firebase thì cần backend Cloud Functions hoặc Cloud Run được triển khai và rewrite riêng `/api/**` trước SPA; việc này là một nhiệm vụ khác, cần kiểm thử an toàn/chi phí.
