# CLA — Hotfix TypeScript `account.role` tại trang đăng nhập

**Ngày:** 13/11/2026  
**Nền:** `CLA_FULL_SOURCE_BUOC07_SEED_ATLAS_20261113.zip` (đã có Seed → Atlas và hotfix Admin trước đó).  
**Phạm vi:** Sửa đúng lỗi TypeScript ở `src/page/auth/LoginPage.tsx`; không sửa Firebase Rules/schema, quyền Admin, engine học tập, dữ liệu tuyển sinh.

## 1. Lỗi được tái hiện

TypeScript `AccountCheck` là union:

- `status: "ready"` có `role`;
- `status: "no-profile" | "inactive" | "invalid-role"` không có `role`.

Ba `if` rời rạc so sánh từng chuỗi trạng thái không loại hết nhánh union thứ hai trong hệ thống kiểu của TypeScript. Vì vậy biểu thức `account.role` báo TS2339: `Property 'role' does not exist on type 'AccountCheck'` dù logic runtime có các nhánh `return`.

## 2. Thay đổi

- `src/page/auth/LoginPage.tsx`: gom các trạng thái không hợp lệ vào cổng `if (account.status !== "ready") { ... return; }` trước `redirectByRole(account.role)`. Giữ nguyên nội dung thông báo và xác minh trên Firestore server.
- `tests/step07-admin-auth-recovery.test.cjs`: bổ sung `AUTH-16`, lấy **chính hàm `verifyAndRedirect` trong source thực tế** và typecheck bằng TypeScript strict, không chỉ transpile hoặc tìm chuỗi. Test không cần chạy Firebase production.

## 3. Kết quả kiểm thử trong môi trường tạo bản vá

| Kiểm tra | Kết quả |
|---|---|
| `NODE_PATH="$(npm root -g)" node --test tests/step07-admin-auth-recovery.test.cjs` | **16/16 PASS** |
| `NODE_PATH="$(npm root -g)" npm test` | **PASS** (toàn bộ command chain) |
| `NODE_PATH="$(npm root -g)" npm run test:rules:static` | **15/15 PASS** — chỉ kiểm tra tĩnh |
| `NODE_PATH="$(npm root -g)" npm run check:layout` | **PASS** |
| Production `npm run build` trên bản mới | **CHƯA CHẠY** trong môi trường gói (không có `node_modules`) |
| Firebase Emulator / đăng nhập Admin thật / browser E2E | **CHƯA NGHIỆM THU** |

Các lệnh `NODE_PATH=...` chỉ để bộ test trong môi trường đóng gói tìm TypeScript cài toàn cục; **trên máy Windows hãy dùng các lệnh npm thông thường**.

## 4. Cài trên Windows

1. Sao lưu thư mục `C:\Gạo\Cognitive-Learn` hiện tại.
2. Giải nén FULL SOURCE ZIP, chép **nội dung bên trong** vào `C:\Gạo\Cognitive-Learn`, ghi đè có kiểm soát; giữ `.env`/`.env.local` và `node_modules` sẵn có.
3. Chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:admin-recovery
npm test
npm run build
npm run dev
```

4. Mở trang đăng nhập, xác nhận VS Code không còn báo lỗi tại `account.role` và thử đăng nhập Admin. Nếu VS Code còn hiển thị chẩn đoán cũ sau khi build xanh, dùng Command Palette → `TypeScript: Restart TS Server`.

## 5. Tiến độ

- Lộ trình quản lý **28 bước**; các bước **02–07 (6/28 = 21,4%)** có bản vá source; bước 01 chưa xác nhận.
- Hotfix này không tự tạo thêm một bước trong lộ trình.
- Checklist quản lý **164 mục**: chưa tăng số mục PASS nghiệm thu thực tế chỉ vì test tĩnh xanh.
- Các yêu cầu P0 (Emulator/consent/nhãn probability) vẫn còn, chưa dùng làm bằng chứng đã sẵn sàng cho học sinh thật.

## 6. Bảo mật

Không cấp Admin theo email, không loại bỏ guard Firestore và không hạ yêu cầu `active: true`.
