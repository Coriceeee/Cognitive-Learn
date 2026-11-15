# COGNITIVE LEARN AI — HOTFIX ĐĂNG NHẬP ADMIN
Ngày: 13/11/2026 · Nền source: FULL SOURCE bước 06 Decision Studio

## 1. Hiện tượng và phạm vi
Màn hình đăng nhập báo “Hệ thống dữ liệu hiện chưa phản hồi”; source phát thông báo này khi Firestore trả `unavailable`. Dựa trên ảnh và source không thể khẳng định nguyên nhân hạ tầng thực tế đã được xử lý.

Đăng nhập bằng Firebase Authentication có thể thành công nhưng truy vấn hồ sơ `users/{uid}` thất bại, nên mã cũ kết thúc mà không có đường tiếp tục xác minh quyền. Tab Học sinh trong login gây hiểu nhầm vì tài khoản Admin được xác định theo hồ sơ server, không theo tab.

## 2. Đã sửa
- `src/lib/accountVerification.ts` (mới): xác nhận vai trò có thực từ hồ sơ, chỉ chấp nhận `active === true`; chặn vai trò không hợp lệ; thử lại lỗi Firestore tạm thời tối đa 3 lần (350ms, 800ms), không retry/bỏ qua `permission-denied`.
- `src/page/auth/LoginPage.tsx`: đọc vai trò bằng `getDocFromServer`, giữ phiên Firebase Auth nếu việc xác minh Firestore không thành công và cho phép “Thử lại xác minh quyền” không nhập lại mật khẩu. Ẩn bộ chọn vai trò khi đăng nhập (chỉ sử dụng lúc đăng ký). Chuyển `/admin` CHỈ khi server trả `role: admin` và `active: true`.
- `src/components/common/AccessGate.tsx`: dùng cùng quy tắc xác minh và retry ở cổng bảo vệ route; không tin role từ cache/local UI.
- `src/styles/21-cla-design-system.css`: trình bày thông tin nhận diện vai trò khi đăng nhập.
- `tests/step07-admin-auth-recovery.test.cjs` (mới): 15 bài kiểm tra tính hợp lệ, cấm bypass, retry, xử lý đăng nhập với mock Firebase.
- `package.json`: đăng ký test mới vào `npm test` và lệnh riêng `npm run test:admin-recovery`.

## 3. Kết quả đã thực sự kiểm tra
- 15/15 bài kiểm thử Auth hotfix: PASS (Firebase mock, KHÔNG phải Firebase production).
- `npm test` toàn dự án: PASS (exit code 0, có bao gồm 15 bài test mới).
- `npm run test:rules:static`: 15/15 PASS (phân tích tĩnh, KHÔNG chứng minh Rules đang deploy).
- `npm run check:layout`: PASS.
- Cú pháp TS/TSX của 3 file chính: PASS (TypeScript transpile).
- Build: CHƯA XÁC NHẬN. `npm ci --offline` không hoàn tất vì npm cache thiếu `yargs-parser-21.1.1.tgz`; không thể kết luận code lỗi build.
- Browser E2E và kết nối Cloud Firestore production: CHƯA CHẠY tại môi trường này.
- Firestore Emulator: CHƯA CHẠY.

## 4. Điều kiện để đăng nhập Admin thành công
1. Firebase Authentication có tài khoản hợp lệ, không bị khóa.
2. Firebase Project trong `.env`/`.env.local` là dự án chứa tài khoản và Firestore đang sử dụng.
3. Trong Firestore collection `users`, document ID đúng **UID từ Firebase Authentication**, chứa `role: "admin"` và `active: true` (được cấp bởi Admin/trusted backend). Không cấp Admin bằng email hoặc từ client.
4. Firestore Database đang hoạt động và Firestore Rules đang triển khai cho phép chính chủ UID `get` vào `users/{uid}`.
5. Kết nối mạng tới Firestore hoạt động. Nếu backend trả `unavailable` liên tục, cần khắc phục Firestore/mạng/cấu hình ngoài mã nguồn — không được bypass bảo mật.

## 5. Hướng dẫn triển khai Windows
Sao lưu bản hiện tại. Giải nén FULL SOURCE ZIP và copy **nội dung bên trong** vào `C:\Gạo\Cognitive-Learn`, giữ lại `.env`/`.env.local` và `node_modules` hiện có. Không xóa file cấu hình bí mật. Sau đó:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:admin-recovery
npm test
npm run build
npm run dev
```

Kiểm tra trường hợp 1: tài khoản `users/{uid}` có `role: admin, active: true` → chuyển `/admin`. Trường hợp 2: ngắt kết nối Firestore tạm thời → thấy lời giải thích cụ thể và nút **Thử lại xác minh quyền**. Trường hợp 3: quyền sai/hồ sơ thiếu → không được vào Admin.

Nếu chưa thành công, gửi mã lỗi Firebase từ F12 Console (không gửi mật khẩu, API secret hoặc mã token), kèm tình trạng Firestore Database/Project ID để phân biệt lỗi máy chủ và frontend.

## 6. Tiến độ dự án
- Lộ trình quản lý: 28 bước, checklist 164 đầu việc.
- Trước hotfix: bước 02–06 đã có bản vá source (5/28 = **17,9% theo số bước có bản vá**, KHÔNG phải % hoàn thiện sản phẩm).
- Lượt này: thêm **01 hotfix P0 đăng nhập**, không tính một bước 07 hoàn chỉnh; không tự tăng % tổng vì browser/Firebase chưa nghiệm thu.
- PASS nghiệm thu cuối mới: 0 mục được nâng trạng thái trong checklist 164.
- Chưa xác nhận: backup bước 01, build trên máy người dùng, Firebase production/Emulator, browser E2E.

**Lưu ý an toàn:** Mật khẩu đã xuất hiện trong ảnh chụp màn hình ở hội thoại. Chủ tài khoản nên đổi mật khẩu đó trong Firebase Authentication, không chia sẻ lại dưới dạng văn bản/ảnh.
