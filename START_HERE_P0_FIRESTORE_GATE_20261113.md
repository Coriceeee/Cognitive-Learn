# CLA — Hướng dẫn chạy P0 Firestore Security Gate (13/11/2026)

**Đây là bản FULL SOURCE kế thừa Atlas Official Pathways.** Không thay đổi dữ liệu tài khoản, công thức điểm, nguyện vọng, giao diện Atlas hay quyền Admin. Bản này sửa quy trình xác minh bảo mật, KHÔNG tự đưa Rules lên Firebase production.

## 1) Cài bản source

1. Sao lưu `C:\Gạo\Cognitive-Learn`, đặc biệt mọi file bạn đã tự chỉnh.
2. Giải nén ZIP. Chép nội dung bên trong vào `C:\Gạo\Cognitive-Learn` (không tạo thêm một thư mục bọc).
3. Giữ nguyên `.env`, `.env.local`, `node_modules` trên máy nếu đang chạy tốt. **Không chạy `npm ci` nếu không cần**; chạy khi thư viện thực sự thiếu.

## 2) Chạy kiểm tra không cần Emulator

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:rules:gate-unit
npm run test:rules:static
npm test
npm run build
```

## 3) Chạy kiểm tra phân quyền thật trên Firestore Emulator

Chạy một lần để kiểm tra điều kiện:

```powershell
java -version
firebase --version
npm run test:rules:preflight
```

`preflight` trả về mã khác 0 khi chưa đánh giá phân quyền thật; điều này là **cố ý**. Nếu còn thiếu Firebase CLI, cài công cụ bằng `npm install -g firebase-tools`. Nếu thiếu `@firebase/rules-unit-testing` và Firebase SDK, hãy chạy `npm ci --include=dev` sau khi đóng mọi phiên `npm run dev` đang giữ khóa file.

Tiếp theo:

```powershell
npm run test:rules:emulator
```

Hoặc chạy `./RUN_RULES_CHECKPOINT21.ps1` nếu PowerShell cho phép chạy script. Công cụ dùng đúng `demo-cla-cp21-security`, đọc `firestore.rules.CANDIDATE_CP21` và chạy các ca allow/deny. Nó **không** chạy `firebase deploy`, không dùng project mặc định trong `.firebaserc` và không kết nối Firestore production.

## 4) Đọc kết quả

File mới được sinh tại:

- `reports/security/firestore_emulator_gate.json`: `preflight`, `staticTests`, `emulatorAuthorizationTests`, `overall`, `rulesSha256`.
- `reports/security/firestore_emulator_gate.log`: đầu ra kiểm thử tĩnh và Emulator.

Chỉ khi `overall: PASS` mới được ghi nhận “bộ test Emulator PASS”. Nếu `BLOCKED` hoặc `FAIL`, **không deploy Rules**. **Ngay cả khi Emulator PASS, quy tắc đang triển khai trên production vẫn chưa được xác minh.** Muốn cho học sinh thật dùng phải kiểm tra Rules production, consent/assent, luồng xóa/xuất dữ liệu và E2E phân quyền.

**Không gửi `.env`, secret, token hoặc dữ liệu học sinh thật trong log.** Chỉ gửi phần kết quả `overall`, status và thông báo lỗi không chứa thông tin nhạy cảm nếu cần phân tích.
