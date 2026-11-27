# CP98 — Giữ Firebase Spark, chuyển Gemini sang Vercel

## Mục tiêu

- Firebase tiếp tục giữ Authentication, Firestore và Hosting ở gói Spark.
- Ba API Gemini chạy bằng Vercel Functions trong thư mục `api/`.
- Frontend Firebase gọi Vercel qua HTTPS bằng `VITE_API_BASE_URL`.
- Không triển khai Firebase Functions, Firestore Rules, Authentication, Admin, Privacy hoặc Push trong đợt này.
- Không đưa `GEMINI_API_KEY` vào bất kỳ biến `VITE_*` nào.

## 1. Tạo Vercel project từ GitHub

1. Đăng nhập Vercel bằng tài khoản có quyền truy cập GitHub.
2. Chọn **Add New → Project**, import repository `Coriceeee/Cognitive-Learn`.
3. Chọn branch `main`, Root Directory là repository root.
4. Framework Preset: **Vite**; Build Command: `npm run build`; Output Directory: `dist`.
5. Deploy project. Vercel tự nhận diện các API trong `api/*.ts` thành Serverless Functions.
6. Sao chép Production Deployment URL, ví dụ `https://<project-name>.vercel.app`. Không tự đoán tên domain.

## 2. Environment Variables trên Vercel

Trong **Project → Settings → Environment Variables**, thêm cho **Production**:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Gemini API key riêng tư |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `FIREBASE_WEB_API_KEY` | Firebase Web API key của project hiện tại |
| `FIREBASE_PROJECT_ID` | `cognitive-learn-ai` |
| `CORS_ALLOWED_ORIGINS` | `https://cognitivelearn.ai.vn,https://cognitive-learn-ai.web.app,https://cognitive-learn-ai.firebaseapp.com` |

- Không đặt `GEMINI_API_KEY` dưới tên `VITE_GEMINI_API_KEY`.
- Không dán key vào GitHub, chat, ảnh chụp hoặc ZIP.
- Không dùng wildcard `*` cho CORS.
- Sau khi thêm/sửa biến môi trường, phải redeploy Vercel để Function nhận giá trị mới.

## 3. Kiểm tra backend Vercel

Mở `https://<project-name>.vercel.app/api/cla-gemini-status`.

Kết quả cần có: `ok: true`, `configured: true`, `backend: "Vercel Functions"`, `missing: []`.

Endpoint không trả secret và không gọi Gemini. `configured: true` chưa chứng minh API key còn quota hoặc request thật đã thành công.

## 4. Trỏ Firebase frontend sang Vercel

Mở file hiện có `.env.live.local`. **Giữ nguyên toàn bộ biến Firebase đang hoạt động**, chỉ thêm hoặc cập nhật:

```env
VITE_API_BASE_URL=https://<project-name>.vercel.app
```

Chỉ dùng HTTPS origin, không thêm `/api`, path, query hay dấu cách. Host phải là domain `.vercel.app` hoặc domain API tùy chỉnh `api.cognitivelearn.ai.vn` đã được cấu hình trên Vercel.

Đây là địa chỉ API công khai, không phải secret. Không thay `VITE_FIREBASE_*` và không đưa Gemini key vào file frontend.

## 5. Build và deploy Firebase Hosting an toàn

Dừng Vite đang chạy, sau đó tại PowerShell:

```powershell
Set-Location "C:\Gạo\Cognitive-Learn"
git pull origin main
.\DEPLOY_CLA_SPARK_HOSTING.cmd
```

Script kiểm tra Vercel status JSON và CORS, chạy CP98 tests, build mode `live`, rồi chỉ chạy `firebase deploy --only hosting --project cognitive-learn-ai`. Nó dừng trước deploy nếu Vercel chưa sẵn sàng. Không deploy Functions, Rules hoặc thay đổi Auth/Firestore.

## 6. Kiểm tra thực tế sau deploy

Đăng nhập bằng tài khoản học sinh thử nghiệm đã được cấp quyền và kiểm tra chatbot nổi, Lumen và Atlas. Trong Network, request phải đi đến `https://<project-name>.vercel.app/api/...` và trả `application/json`, không phải HTML.

- 401/403: kiểm tra Firebase ID token, active/role và quyền đọc document tài khoản.
- 429: kiểm tra quota Gemini và rate limit.
- 503: kiểm tra Vercel Environment Variables và redeploy.
- CORS: kiểm tra chính xác origin trong `CORS_ALLOWED_ORIGINS`.

Không dùng status endpoint đơn lẻ để tuyên bố Gemini đã nghiệm thu end-to-end. Chỉ hoàn tất sau request xác thực Firebase và phản hồi Gemini thực tế.

## 7. Lệnh kiểm thử cục bộ

```powershell
npm run test:cp98:spark-vercel
npm test
npm run build -- --mode live
```

Static/integration contracts không thay thế kiểm thử live bằng tài khoản thật. Không dùng dữ liệu học sinh thật trong fixture hoặc CI.
