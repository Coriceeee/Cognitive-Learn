# CLA CP90: Khôi phục chẩn đoán đăng nhập & Gemini localhost

**Tình trạng xác minh:** 8/8 kiểm thử CP90 mã nguồn và 4/4 Deploy Gate đều PASS trong môi trường tạo bản vá; thử nghiệm trực tiếp với Firebase Auth tài khoản cũ, kết nối Google Gemini thực và production deploy CHƯA ĐƯỢC XÁC NHẬN.

CP90 không sửa Firestore Rules, vai trò Admin, mật khẩu hay tài khoản. Tập tin `.env.live.local`, `.env.gemini.local` KHÔNG có trong ZIP; đừng gửi key lên chat.

## Cập nhật lên CP90 từ máy Windows

1. Sao lưu thư mục dự án và GIỮ NGUYÊN các `.env.*.local` chứa cấu hình riêng.
2. Giải nén Full Source CP90, chép **nội dung bên trong thư mục Cognitive-Learn** vào `C:\Gạo\Cognitive-Learn`. Không thay khóa/UID.
3. Dừng Vite cũ bằng Ctrl+C. Mở PowerShell từ thư mục gốc, chạy:

```powershell
npm run dev -- --mode live --host 127.0.0.1 --port 3000 --strictPort
```

4. Mở `http://127.0.0.1:3000/`. Nếu vẫn báo "Không kết nối được Firebase Authentication", bấm **Kiểm tra kết nối Firebase (không gửi mật khẩu)**. Gửi **mã chẩn đoán**, không gửi key hay mật khẩu.
5. Để lấy báo cáo sâu hơn, trong PowerShell **thứ hai** (đã activate `.venv` nếu có) chạy:

```powershell
node tools/verify-cp90-snapshot.cjs
node --experimental-strip-types --test tests/cp90-auth-connection.test.mjs tests/cp90-gemini-local-contract.test.mjs
python CLA_CP88_KIEM_TRA_DANG_NHAP.py --url http://127.0.0.1:3000/
```

**Khi lỗi Auth/network còn xảy ra, không cần khởi động lại Vite nhiều lần.** `WRONG_FIREBASE_TARGET` thường do mode/Emulator, còn `AUTH_NETWORK_BLOCKED` cần kiểm tra chính yêu cầu `identitytoolkit.googleapis.com` trong F12 → Network. Không nên đổi mật khẩu hay Firebase Rules để chữa lỗi kết nối.

## Cấu hình Gemini chạy được trên localhost

**Không thêm `GEMINI_API_KEY` vào `.env.live.local` hoặc bất kỳ `VITE_` nào.** Tạo `.env.gemini.local` RIÊNG trong thư mục gốc với các biến server-side sau (đây là tên biến, không phải giá trị):

```dotenv
GEMINI_API_KEY=<GEMINI_KEY_THAT_LUU_RIENG>
GEMINI_MODEL=gemini-2.5-flash
FIREBASE_WEB_API_KEY=<VITE_FIREBASE_API_KEY_CUA_PROJECT_THAT>
FIREBASE_PROJECT_ID=cognitive-learn-ai
```

`FIREBASE_WEB_API_KEY` có thể đọc từ **Firebase Console → Project settings → Web app config** (cùng Project ID), và `GEMINI_API_KEY` tạo/kiểm tra trong Google AI Studio. Backend phải có quota và API Gemini bật. Không gửi giá trị thực lên chat.

Trong khi Vite đang chạy, mở `http://127.0.0.1:3000/api/cla-gemini-status`. Nếu JSON `configured:true`, điều đó chỉ cho biết biến môi trường và Firebase Project khớp, **chưa** chứng minh Gemini đã trả lời được. Đăng nhập thành công, vào LUMEN/Chatbot thử một lần. Nếu API thất bại, F12 → Network → `gemini-lumen` hoặc `gemini-chat` → xem HTTP status và `message` (không chụp/đăng `Authorization`, body hoặc token).

CP90 tự ưu tiên `/api/gemini-*` same-origin ở **localhost + Vite development mode**, tránh gửi Firebase ID token tới domain backend placeholder đã nhập nhầm trong `.env.live.local`. Production không tự có API: Firebase Hosting vẫn cần backend thật (Vercel/Cloud Functions/Cloud Run). Không deploy live chỉ nhờ `configured:true`.

## Thông số nhận biết

- `WRONG_PROJECT` / `EMULATOR_MODE`: khởi động sai Vite mode hoặc project.
- `AUTH_HTTP_REJECTED`: server trả 4xx; kiểm tra API key/restrictions/API enabled.
- `AUTH_NETWORK_BLOCKED` / `AUTH_TIMEOUT`: DNS, ISP, VPN/proxy, firewall, extension hoặc lỗi mạng giữa trình duyệt và Firebase.
- `AUTH_HOST_REACHABLE`: endpoint project trả được nhưng vẫn cần kiểm tra POST đăng nhập.
- Gemini status `missing`: thiếu cấu hình Node phía server (không in key).
- Gemini `401/403`: session, vai trò hoặc quyền đọc; `429`: quota/rate limit; `502`: upstream; `503`: server chưa cấu hình.

CP89 là snapshot lịch sử và **đương nhiên không còn khớp mã nguồn CP90**. Sử dụng `verify-cp90-snapshot.cjs` cho bản CP90; không chỉnh lại `CP89_SOURCE_MANIFEST.json` để ép PASS.
