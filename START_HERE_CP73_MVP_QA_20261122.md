# CP73 — Ứng viên MVP: kết nối Firebase Emulator cục bộ và cổng QA thật

**Trạng thái:** Chưa nghiệm thu MVP. Các bài kiểm thử offline không thay thế production build, Firestore Emulator hoặc browser E2E. Không sử dụng dữ liệu học sinh thật khi thử nghiệm.

## Thay đổi mã nguồn

- `src/lib/localFirebaseEmulators.ts`: cấu hình QA **chỉ khi bật thủ công**, chỉ cho phép Vite development, HTTP loopback và định danh Firebase `demo-cla-mvp` + API key giả. Bật sai cấu hình sẽ ném lỗi rõ ràng, **không fallback về Firebase thật**.
- `src/lib/firebase.ts`: kết nối Firebase Authentication Emulator 127.0.0.1:9099 và Firestore Emulator 127.0.0.1:8080, trước khi khởi tạo các listener.
- `.env.mvp-qa.example`: mẫu cấu hình QA giả, không chứa key riêng. Được đưa vào ZIP; `.env.local` luôn bị loại khỏi ZIP.
- `tools/cp73_mvp_gate.py`: cổng kiểm tra build + Rules Emulator + 12 ca duyệt React thật của CP68; ghi JSON gọn không chứa dữ liệu tài khoản. Nếu thiếu bước nào, báo BLOCKED/FAIL thay vì PASS.
- `tests/cp73-local-firebase-emulators.test.mjs` và `tests/cp73-mvp-gate.test.mjs`: kiểm thử guard và báo cáo.

## Chạy QA trên máy có internet và Firebase CLI

1. Giải nén ZIP. Cài Node 22, Python 3.11+, Java 21, trình duyệt Playwright và Firebase CLI. Chạy `npm ci --no-audit --no-fund`, `python -m pip install playwright`, `python -m playwright install chromium`, `npm install -g firebase-tools`.
2. Sao chép `.env.mvp-qa.example` thành `.env.local`. **Không** nhập API key Firebase thật, không dùng project production. Đây là project demo giả dành cho emulator. Nếu có `.env.development.local`, loại bỏ hoặc bảo đảm không ghi đè QA config.
3. Trong terminal A, từ thư mục dự án, chạy:

   ```bash
   firebase emulators:start --project demo-cla-mvp --config firebase.emulator.cp21.json --only auth,firestore
   ```

4. Trong terminal B, chạy `npm run dev -- --host 127.0.0.1 --port 5173`. Mở `http://127.0.0.1:5173`. Đăng ký tài khoản **tổng hợp** trên Auth Emulator, không dùng email/hồ sơ thật. Vì mẫu bật `VITE_CLA_STUDENT_CONSENT_GATE=true`, hãy xem thông báo và chấp thuận sử dụng **sản phẩm demo** theo bước trên trang trước khi thử sáu phân hệ. Đây **không phải** consent tham gia nghiên cứu.
5. Chạy `npm run qa:cp73:mvp:preflight`. Lệnh kiểm tra định danh/port/SDK/ứng dụng và chỉ trả `PREFLIGHT_PASS_NOT_MVP` khi điều kiện QA đã đủ; chưa kiểm thử dữ liệu.
6. Cung cấp biến môi trường `CLA_E2E_QA_ACK=I_USE_SYNTHETIC_QA_ACCOUNTS`, `CLA_E2E_STUDENT_EMAIL`, `CLA_E2E_STUDENT_PASSWORD` **chỉ trong session cục bộ**, không ghi vào file báo cáo/Git. Chạy `npm run qa:cp73:mvp`. Cổng này chạy `npm run build`, Rules Emulator, rồi kiểm thử React ở desktop 1280 và mobile 390 với sáu phân hệ. Không upload ảnh chụp có dữ liệu tài khoản.

**Quan trọng:** `npm run build` với `.env.local` QA chỉ kiểm tra việc biên dịch; bundle đó không được phát hành. Chạy build release với cấu hình production riêng, tắt `VITE_USE_FIREBASE_EMULATORS`, sau khi được kiểm tra bảo mật độc lập. Không deploy candidate Rules CP69 nếu chưa có kết quả Emulator.

## Đọc kết quả

- `reports/cp73/mvp-gate.json`: `BLOCKED` là thiếu điều kiện; `FAIL` là bài kiểm thử đã chạy và thất bại; `PREFLIGHT_PASS_NOT_MVP` chỉ đạt kiểm tra môi trường. `QA_TECHNICAL_PASS_NOT_MVP` xác nhận build + Rules Emulator + 12 ca điều hướng UI thật đã PASS trong QA, **không phải** nghiệm thu MVP về luồng lưu/học tập hay dữ liệu thực.
- `reports/cp73/react-student-e2e.json`: số ca duyệt thực tế (0/12 cho tới khi có QA đầy đủ).

## Chưa đóng gate

- Dữ liệu thực từ các trường tuyển sinh toàn quốc, chất lượng gợi ý chính xác và AI/ML validation.
- Luồng ghi–đọc hồ sơ, consent và giao dịch hai thiết bị trên trình duyệt thật cần QA thêm; 12 ca hiện có chủ yếu kiểm chứng trang/SPA/keyboard/overflow.
- Nghiệm thu Firebase production, bảo mật triển khai, quyền riêng tư và nghiên cứu trên học sinh thực.
