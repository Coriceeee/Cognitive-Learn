CLA CP23 — FIX LAYOUT AND FIRESTORE ASCII (08-11-2026)

Lý do:
1. Vite watcher EBUSY ở protocol/data/evidence/CLAIM_EVIDENCE_DAY1.md.
2. npm run check:layout còn phát hiện file evidence/CLAIM_EVIDENCE_DAY1.md sai vị trí.
3. Firestore Emulator trong C:\Gạo gặp lỗi Unicode; PowerShell hiện tại không tìm thấy java trên PATH.

Cách áp dụng:
- Sao lưu/commit dự án trước.
- Giải nén ZIP này vào thư mục gốc C:\Gạo\Cognitive-Learn, giữ tools/ ở đúng cấp.
- Mở terminal mới tại thư mục đó. Dừng npm run dev khi sửa bố cục.

Lệnh:
  node tools/fix-cla-layout.cjs             # XEM TRƯỚC, không sửa
  node tools/fix-cla-layout.cjs --apply     # sửa, lưu bản khác nội dung vào docs/archive/legacy-layout/
  npm run check:layout
  npm test
  npm run test:rules:static
  node tools/run-firestore-ascii.cjs --prepare-only
  node tools/run-firestore-ascii.cjs

Node runner tự nhận JDK21 trong C:\Program Files\Eclipse Adoptium\ (nếu đã cài) và
chạy Firebase demo-cla-cp21-security tại %LOCALAPPDATA%\CLA-Firestore-ASCII.
Không cần thay ExecutionPolicy, không chạy PowerShell .ps1, không gửi dữ liệu thật.

Nếu máy có đường dẫn %LOCALAPPDATA% chứa ký tự không ASCII:
  node tools/run-firestore-ascii.cjs --workspace C:\CLA-Firestore-ASCII

Nếu Firestore Emulator vẫn lỗi, đọc:
  Get-Content "$env:LOCALAPPDATA\CLA-Firestore-ASCII\firestore-debug.log" -Tail 100

KHÔNG chạy firebase deploy. Chỉ công nhận Firestore khi báo các test 33/33 PASS.

Giới hạn kiểm tra: đã thử cú pháp Node, thao tác với fixture giả lập, xác nhận
không xóa bản khác nội dung, và chuẩn bị đúng 5 file trong workspace.
Chưa thực thi Firestore Emulator trên máy người dùng; chưa có 33/33 PASS.
