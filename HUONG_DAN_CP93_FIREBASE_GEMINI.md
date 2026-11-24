# CLA CP93 — Sửa lỗi Gemini JSON trên cognitivelearn.ai.vn

## Nguyên nhân

CP92 đã build frontend thành công nhưng `firebase.json` ban đầu chỉ có SPA rewrite `** → index.html`. Khi website Firebase Hosting gọi `/api/gemini-chat`, `/api/gemini-lumen`, `/api/gemini-admission-reader`, Hosting có thể trả HTML (HTTP 200) thay vì JSON. Gemini API key lưu trong `.env.gemini.local` chỉ dùng cho Vite **localhost**, không triển khai lên Hosting.

CP93 bổ sung một Cloud Functions Gen2 codebase độc lập (`functions-gemini`) tái sử dụng ba API đã có, và khai báo Firebase Hosting rewrites trước SPA. Frontend của `cognitivelearn.ai.vn`/`.web.app`/`.firebaseapp.com` gọi **same-origin**. Không sử dụng Vercel cho ba API Gemini này.

## Trước khi triển khai

- Firebase project phải là `cognitive-learn-ai`, hai tài khoản và Firestore Rules được giữ nguyên.
- Cloud Functions Gen2 thường yêu cầu Firebase Blaze billing và các Google Cloud APIs cần thiết; xác nhận chi phí trước khi deploy.
- **Không nhập** `GEMINI_API_KEY` vào `VITE_`, `.env.live.local`, trình duyệt, chat hoặc file nguồn. Không gửi file `.env.gemini.local` ra ngoài.
- Google AI Studio API key và Firebase Web API key là **hai loại key khác nhau**. Firebase Web API key công khai trong cấu hình Web app; Gemini API key là bí mật server-side.
- CP93 không deploy Admin/Push/Privacy Functions, không deploy Firestore Rules, không tạo/xóa tài khoản.

## Bước 1 — Tạo hai Secret trên máy đã login Firebase CLI

Tại `C:\Gạo\Cognitive-Learn` chạy:

```powershell
firebase login
firebase use cognitive-learn-ai
firebase functions:secrets:set GEMINI_API_KEY --project cognitive-learn-ai
firebase functions:secrets:set FIREBASE_WEB_API_KEY --project cognitive-learn-ai
```

CLI sẽ hỏi giá trị tương ứng. Lấy `GEMINI_API_KEY` từ [Google AI Studio](https://aistudio.google.com/api-keys), chọn đúng project có API/quota. Lấy `FIREBASE_WEB_API_KEY` từ `.env.live.local` (`VITE_FIREBASE_API_KEY`) của project thật hoặc Firebase Console → Project settings → Your apps → Web app config. **Không gửi key qua chat.** Hai secret được lưu ở Google Secret Manager, không phải website.

## Bước 2 — Build cả frontend và Gemini backend

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
.\BUILD_CLA_CP93_FIREBASE_GEMINI.cmd
```

Build sẽ kiểm tra CP93 manifest thay vì ép CP92 source snapshot cũ, chạy `npm test`, build Vite live và đóng gói API Vercel TS sang Functions bằng esbuild. Nếu npm thiếu dependency, chạy `npm install --prefix functions-gemini --include=dev`, rồi chạy lại build. **Nếu có `[FAIL]`, không deploy.**

## Bước 3 — Deploy riêng Gemini rồi Hosting

```powershell
.\DEPLOY_CLA_CP93_FIREBASE_GEMINI.cmd
```

CLI yêu cầu xác nhận hai lần: `DEPLOY-GEMINI-CP93` để chỉ deploy codebase Gemini, và `HOSTING-CP93` để cập nhật Hosting. Đường dẫn API chỉ hoạt động trên custom domain **sau** khi cả hai bước deploy thành công.

Chạy lệnh kiểm tra:

```powershell
curl.exe -i https://cognitivelearn.ai.vn/api/cla-gemini-status
curl.exe -i https://cognitivelearn.ai.vn/api/gemini-chat
```

Kỳ vọng: endpoint trạng thái là HTTP `200` `Content-Type: application/json`, trường `backend: Firebase Functions Gen2`, `configured: true`. `GET /api/gemini-chat` phải trả HTTP `405` và JSON, **không được trả HTML**. `configured:true` xác minh cấu hình secret, **không chứng minh Gemini upstream đã phân tích thành công**.

Sau đó đăng nhập tài khoản cũ và thử một câu chatbot/LUMEN. Nếu Gemini trả 400/403/404/429, kiểm tra API key restrictions, model, quota/billing trong Google AI Studio/Google Cloud; không thay Firebase Auth key để sửa lỗi Gemini.

## Cách thu thập kết quả an toàn

Chỉ gửi dòng `HTTP status`, `Content-Type`, `ok/configured/backend` và phần `message` đã loại thông tin cá nhân nếu lỗi. **Không gửi** header `Authorization`, Firebase ID token, Gemini API key hay body dữ liệu học sinh.

## Giới hạn xác nhận

Bản vá có kiểm thử cấu trúc và cú pháp trong môi trường tạo file, nhưng do npm registry bị `EAI_AGAIN` nên **chưa hoàn tất build esbuild tại đây**, **chưa deploy Functions thật và chưa test Gemini thật**. Bản CP92 bạn đã build PASS trước đó không tự chứng minh CP93 hoạt động; cần build mới như trên.

## Bản vá HF01: tách Functions khỏi firebase.json mặc định

- `firebase.json` chỉ khai báo Hosting và rewrites. Lệnh `firebase deploy --only hosting` không đụng Functions.
- `firebase.gemini.json` chỉ chứa Functions codebase `cla-gemini`. Script deploy sử dụng `--config firebase.gemini.json` **chỉ** ở bước Functions.
- Giữ nguyên kiểm thử CS11 (không sửa hoặc vô hiệu hóa).
- Lệnh thủ công tương đương (chỉ dùng sau khi build và thiết lập Secret): `firebase deploy --only functions:cla-gemini --config firebase.gemini.json --project cognitive-learn-ai`.
- Sau khi Functions triển khai, mới chạy `firebase deploy --only hosting --project cognitive-learn-ai` để kích hoạt rewrites.
