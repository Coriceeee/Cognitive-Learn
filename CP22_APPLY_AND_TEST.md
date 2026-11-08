# Chèn bản cập nhật CP22 vào CLA6 (05/11/2026)

**Chọn một trong hai cách.** Nếu không chắc repo hiện tại có thay đổi gì, dùng patch để xem diff trước. Bản ZIP đầy đủ chỉ là bản tham chiếu sạch; KHÔNG chứa `.env` hoặc dữ liệu khóa riêng.

## Cách 1 — dùng overlay nhỏ

1. Trong VS Code, tạo commit sao lưu: `git status --short; git add -A; git commit -m "backup before CP22"` (không commit `.env`, secret hoặc node_modules).
2. Giải nén `CLA_CP22_ONLY_CHANGED.zip`. Chép các file trong `CLA/` tới đúng đường dẫn tương ứng trong thư mục gốc `Cognitive-Learn/` (không tạo `Cognitive-Learn/CLA/CLA`).
3. Nếu có file bạn đã sửa riêng, so sánh diff trước khi chép đè.
4. **Không áp dụng `firestore.rules.CANDIDATE_CP21` lên production** khi chưa qua Emulator.

## Cách 2 — dùng patch

Trong thư mục project:

```powershell
git apply --check .\CLA_CP22_CHANGES.patch
git apply .\CLA_CP22_CHANGES.patch
```

Patch là hướng dẫn để Git áp dụng; nếu `--check` báo lỗi thì base source của bạn đã khác CLA6, cần so sánh và merge thủ công, không ép áp dụng.

## Kiểm thử tại máy Windows

```powershell
npm install
npm test
npm run check:layout
npm run test:rules:static
npm run typecheck:api
npm run build
npm audit --omit=dev
npm audit
npm run test:rules:emulator
```

**Lưu ý:** `package-lock.json` trong bản gốc chưa được đồng bộ `@firebase/rules-unit-testing`. Đừng dùng `npm ci` trước khi `npm install` thành công và file lockfile mới đã được commit. Đảm bảo Firebase CLI (firebase-tools) và Java có sẵn trước lệnh Emulator. Chạy trong project demo; không publish Rules.

Thử thêm bằng trình duyệt, với và không có dữ liệu hợp lệ:
- `/orion#orion-scenarios`, `/orion#orion-roadmap`
- `/pulse#pulse-report`, `/pulse#pulse-risk`
- `/haven#haven-scholarships`, `/haven#haven-support-roles`
- `/atlas#atlas-engine`, `/atlas#atlas-programs`

Mỗi anchor phải cuộn đúng mục, hoặc hiển thị trạng thái thiếu dữ liệu, không tạo chỉ số giả. Bằng chứng E2E vẫn chưa có trong gói.
