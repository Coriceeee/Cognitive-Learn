# CLA CP89 — Sửa cổng kiểm tra Firebase Hosting (v2)

**Phạm vi:** Chỉ cập nhật `tools/claHostingDeployGate.cjs` và cung cấp kiểm thử cho nó. Không sửa CLA frontend, Firebase Authentication, Firestore Rules, dữ liệu học sinh, hay đăng nhập; không deploy tự động.

## Vì sao lượt deploy trước bị chặn?

1. **`VITE_FIREBASE_STORAGE_BUCKET`:** Gate cũ bắt buộc một bucket, mặc dù CP89 không import `firebase/storage` và chỉ ghi bucket trong object khởi tạo Firebase SDK. Gate v2 coi bucket là tùy chọn; nếu đã đặt giá trị demo/placeholder thì vẫn chặn. Nếu sử dụng Storage ở tương lai, lấy đúng giá trị từ Firebase Console > Project settings > Your apps (có thể là `.firebasestorage.app` hoặc `.appspot.com` tùy thời điểm tạo bucket). Không đoán tên bucket.
2. **Consent Gate:** `.env.live.local` đang không có `VITE_CLA_STUDENT_CONSENT_GATE=true`. Gate tiếp tục chặn do thiếu bằng chứng quyền đọc `student_consents/{uid}` trên Firestore production. **Không chỉ đổi cờ thành true để vượt gate**: trước đó localhost từng có `Missing or insufficient permissions`, và Emulator PASS không chứng minh Rules production đã hỗ trợ. Xem lại Firebase Console > Firestore Database > Rules; kiểm tra read/write chỉ với tài khoản thử nghiệm được ủy quyền, đúng quy trình đồng thuận. Không deploy Rules ứng viên bừa bãi.
3. **Backend Gemini:** Chưa có `VITE_API_BASE_URL`. Firebase Hosting chỉ phục vụ frontend/dist, không tự chạy `api/*.ts` (Vercel). Phải có backend thực đã triển khai, ví dụ origin Vercel do bạn quản lý, dùng HTTPS (không có `/api` cuối URL). Ở backend, cần biến riêng `GEMINI_API_KEY`, `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID`; đặt `CORS_ALLOWED_ORIGINS` gồm `https://cognitive-learn-ai.web.app,https://cognitive-learn-ai.firebaseapp.com,https://cognitivelearn.ai.vn` và thêm Preview origin đúng khi kiểm thử Preview. Không để Gemini key trong bất cứ `VITE_...` nào.

## Tên miền cần chú ý

Trong ảnh Firebase Console, `cognitivelearn.ai.vn` được hiển thị là **Redirect -> cognitivelearn.ai.vn**. Đây có thể là cấu hình redirect về chính nó. Trước khi phát hành, vào Firebase Console > Hosting > Custom domains để xác nhận `cognitivelearn.ai.vn` **phục vụ nội dung website** (Custom/Serving), không phải chỉ chuyển hướng về chính tên miền đó. Nếu chỉ muốn redirect `www.cognitivelearn.ai.vn` về domain trần thì cấu hình redirect ở domain `www`, không phải domain trần tự redirect về chính nó. Không thay DNS nếu chưa xem bản ghi được Firebase yêu cầu.

## Dùng trên máy Windows

1. Giải nén ZIP vào thư mục gốc `C:\Gạo\Cognitive-Learn` (tệp trong `tools/` phải ghi đè đúng `tools/claHostingDeployGate.cjs`).
2. Chạy:

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
node --test tests/hosting-gate-optional-storage.test.cjs
node tools/claHostingDeployGate.cjs --frontend-only
```

Lệnh thứ hai **chỉ kiểm tra**, không deploy; không yêu cầu Gemini trong chế độ `--frontend-only`, nhưng vẫn chặn khi consent không an toàn.

3. Mở `.env.live.local` bằng Notepad (không gửi nội dung file lên chat). Lấy các giá trị Web App chính thức từ Firebase Console. Khi đã có backend thật thì đặt `VITE_API_BASE_URL=https://<origin-backend-thuc>`; nếu chỉ muốn xem frontend, sử dụng `-FrontendOnly` sau khi đã xác minh quyền thật.
4. Chỉ sau khi đã xác minh Firestore production/2 tài khoản, tên miền tùy chỉnh, backend, chạy bộ preflight chính `node tools/claHostingDeployGate.cjs`, rồi `./CHAY_DEPLOY_FIREBASE_HOSTING_CP89.ps1` (Preview trước). Kiểm tra Preview kỹ, không dùng tài khoản học sinh thật cho thử nghiệm.
5. Chỉ sau Preview đạt, chạy `./CHAY_DEPLOY_FIREBASE_HOSTING_CP89.ps1 -Live` và xác nhận theo yêu cầu của script. Không tự deploy Rules/Auth/Functions.

**Giới hạn kiểm tra:** Test v2 chỉ chứng minh logic gate hoạt động. Không chứng minh quyền production Firestore, Gemini API key thực sự dùng được, custom domain hoạt động hay người dùng đăng nhập thành công.
