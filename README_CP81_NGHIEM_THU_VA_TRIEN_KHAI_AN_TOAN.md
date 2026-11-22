# CLA CP81 — Bản sửa kiểm thử / bảo vệ triển khai, 22/11/2026

## Trạng thái và phạm vi

Bản ZIP này là **mã nguồn đầy đủ** kế thừa CP80, kèm chỉnh sửa nhỏ theo log nghiệm thu. **Không phải chứng nhận website hay nghiên cứu đã đạt 100%**. Các bản đã triển khai trên Vercel/Firebase **không được tự động cập nhật** khi chạy script trong gói này.

### Các sửa đổi thật sự

1. `tests/cp31-batch2-e2e-contract.test.cjs`: kiểm tra 4 vai trò QA từ mã nguồn (`ROLES`, vòng lặp kiểm tra, 4 email riêng biệt) thay vì phụ thuộc câu tiếng Anh đã không còn trong script. Không hạ yêu cầu role.
2. `CLA_CP81_ONECLICK.ps1`: sửa lỗi `Split-Path -Leaf` với đường dẫn log rỗng. Đây là lỗi đóng báo cáo cuối cùng, không phải lỗi giao diện.
3. `tools/check-cp81-deploy-env.cjs`: chặn cấu hình build production vẫn bật Emulator, dùng Firebase project demo hoặc tắt consent gate; không in API key.
4. `tools/verify-cp81-snapshot.cjs` và `CP81_SOURCE_MANIFEST.json`: kiểm chứng mã nguồn ZIP đầy đủ bằng SHA-256, phân biệt CP81 với một thư mục cũ lẫn checkpoint.
5. `CHAY_NGHIEM_THU_CP81.cmd`: chạy bộ kiểm tra kỹ thuật đã có, tạo log độc lập; **không deploy**.

**Không thay đổi tên sáu phân hệ, layout, tính điểm, Firestore Rules production, hay lịch sử bằng chứng CP31.**

## Bắt buộc chạy trong thư mục mới

Log bạn gửi từ `C:\Gạo\Cognitive-Learn` có CP40 FAIL khi kiểm tra các file đã ngừng sử dụng. Nhưng chính test này **7/7 PASS** trên bản ZIP CP80 sạch. Điều này có thể do tệp checkpoint cũ còn sót khi chép đè vào thư mục hiện hữu. **Không chép đè CP81 lên thư mục đó**.

1. Đóng Vite, tất cả Node đang dùng thư mục cũ và PowerShell của dự án.
2. Giải nén ZIP vào thư mục riêng, ví dụ `C:\CLA-CP81` (không chứa dữ liệu/secret production).
3. Mở PowerShell trong `C:\CLA-CP81\Cognitive-Learn`.

```powershell
node tools/verify-cp81-snapshot.cjs
node tools/check-cla-layout.cjs
npm ci --no-audit --no-fund
npm run build
npm test
.\CHAY_NGHIEM_THU_CP81.cmd
```

Nếu `npm ci` báo EPERM, dừng các tiến trình đang giữ binary Vite. **Không xóa dữ liệu cá nhân, không tắt antivirus, không thay `package-lock.json`**.

## Firebase Emulator

- Test tĩnh PASS **không** thay thế kiểm tra phân quyền thực bằng Emulator.
- `npm run test:rules:preflight` chủ ý trả **BLOCKED** khi chưa chạy bài authorization thực; không dùng nó làm dấu PASS.
- Nếu `firebase emulators:start` trả `Firestore Emulator has exited with code: 1`, xem dòng lỗi gốc trong `firestore-debug.log` và báo cáo `reports/security/firestore_emulator_gate.log`. Chưa thể suy luận đó là lỗi Firestore Rules nếu chưa có log này.
- Dùng `npm run test:rules:emulator` với demo project riêng theo security gate. **Không deploy `firestore.rules.CANDIDATE_CP21` production**.

```powershell
java -version
Get-Content .\firestore-debug.log -Tail 80 -ErrorAction SilentlyContinue
Get-Content .\reports\security\firestore_emulator_gate.json -ErrorAction SilentlyContinue
Get-Content .\reports\security\firestore_emulator_gate.log -Tail 80 -ErrorAction SilentlyContinue
```

## Python research

`ModuleNotFoundError: sklearn` nghĩa là Python đang chạy thiếu scikit-learn. `Application Control policy has blocked this file` với pandas/numpy là chặn bởi chính sách Windows: cần cài trên môi trường được phép (liên hệ quản trị máy hoặc môi trường Linux/WSL được phê duyệt). Không nên lách/disable chính sách bảo mật. Sau khi xác nhận môi trường sạch và được phép:

```powershell
python -m pip install -r requirements.txt
python -c "import pandas, numpy, sklearn; print('Research imports OK')"
python -m unittest discover -s research/tests -v
```

OULAD, Cognitive, Adaptive và HF test PASS chỉ chứng minh pipeline có thể chạy; không phải xác nhận CLA tác động đến học sinh thực.

## Bằng chứng CP31

Các lệnh `research:golden-path`, `research:multi-cycle`, `research:measurement` kiểm tra fingerprint từ **phiên bản CP31**. Chúng từ chối CP81 là hành vi chống giả mạo bằng chứng. Không sửa/chuyển SHA cũ để ép PASS; cần thủ tục phát hành bằng chứng mới riêng cho CP81. Bộ nghiệm thu sẽ báo các gate đó là không đạt/không có xác nhận mới.

## Trước khi deploy lên Firebase / Vercel

**Chốt an toàn:** Do trước đó bạn đã sao chép `.env.mvp-qa.example` vào `.env.local`, môi trường đang ở chế độ Emulator. Không dùng cấu hình QA để build production.

```powershell
node tools/check-cp81-deploy-env.cjs
```

Lệnh chỉ kiểm tra public env trên **máy local**; muốn deploy còn phải xác minh biến môi trường thực tế trên Vercel/Firebase, API hoạt động, quyền dữ liệu, browser E2E và build mới. Nếu gate bị BLOCKED, **không deploy**. Chỉ đặt cấu hình production từ nguồn đã được phê duyệt, không đưa API keys/token hay file `.env.local` vào chat.

- Firebase Hosting preview trước đó tải 86 tệp sẵn có trong `dist` sau lệnh build FAIL, nên chưa chứng minh đó là CP80/CP81.
- Vercel live đã được cập nhật trước đó; tiếp tục deploy chỉ sau khi xác nhận sản phẩm QA, tránh đè một bản chưa nghiệm thu.

## PASS thực sự được thực hiện khi đóng gói

- `node --test tests/cp31-batch2-e2e-contract.test.cjs`: 6/6 PASS.
- `node --experimental-strip-types --test tests/cp40-student-only.test.mjs`: 7/7 PASS (bản sạch).
- `node --test tests/cp81-deploy-env.test.cjs`: 5/5 PASS.
- `node tools/check-cla-layout.cjs`: PASS.
- `node tools/verify-cp81-snapshot.cjs`: PASS (sau khi lập manifest).

**Chưa chạy tại môi trường đóng gói**: `npm ci`, build Vite/TypeScript (thiếu node_modules), Firebase Emulator trên Windows, E2E trình duyệt, kết quả khoa học thực chứng và deploy production. Các bước này phải xác minh trên máy của bạn hoặc CI tương ứng.
