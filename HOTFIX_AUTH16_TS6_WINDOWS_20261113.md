# CLA — Hotfix AUTH-16 tương thích TypeScript 6 và Windows

**Ngày:** 13/11/2026  
**Nền:** `CLA_FULL_SOURCE_BUOC07_FIX_ACCOUNT_ROLE_20261113.zip`  
**Phạm vi:** Chỉ sửa `tests/step07-admin-auth-recovery.test.cjs` và thêm báo cáo này. Không thay đổi Firebase Auth, Firestore Rules, quyền Admin, LoginPage, Seed, Atlas hay các engine khác.

## Lỗi nhận từ máy người dùng

`AUTH-16` trong bản trước fail vì hai nguyên nhân độc lập:

1. `ts.ModuleResolutionKind.Node10` kích hoạt lỗi deprecation của **TypeScript 6.0.3**: `moduleResolution=node10 is deprecated`.
2. Test tạo file `.ts` ảo chỉ qua `CompilerHost` và so sánh đường dẫn bằng chuỗi nguyên dạng. Trên Windows với đường dẫn `C:\Gạo\Cognitive-Learn`, TypeScript chuẩn hóa đường dẫn, khiến `File .../__cla_login_typecheck__.ts not found`.

Lỗi phát sinh trong **test harness**, không chứng minh `LoginPage` thực thi sai.

## Cách sửa

- Test vẫn đọc **hàm `verifyAndRedirect` thật** từ `src/page/auth/LoginPage.tsx` qua TypeScript AST.
- Tạo một tệp `.ts` tạm có tên riêng ngẫu nhiên trong `tests/`, không dùng file ảo.
- Typecheck với `strict: true`, `noEmit: true`, `module: ESNext`, `moduleResolution: Bundler`. Đây cũng là chế độ module resolution đang dùng trong `tsconfig.json` và `tsconfig.api.json` của CLA.
- Xóa file tạm trong `finally`, cả khi test fail.
- Không bỏ qua diagnostics, không hạ strict, không xóa bài test, không thay đổi logic bảo mật.

## Kiểm thử thực sự chạy trong môi trường tạo bản vá

| Kiểm tra | Kết quả |
|---|---|
| `NODE_PATH="$(npm root -g)" node --test tests/step07-admin-auth-recovery.test.cjs` | 16/16 PASS |
| `NODE_PATH="$(npm root -g)" npm test` | PASS — toàn bộ chuỗi kiểm thử |
| `NODE_PATH="$(npm root -g)" npm run test:rules:static` | 15/15 PASS (chỉ kiểm tra tĩnh) |
| `NODE_PATH="$(npm root -g)" npm run check:layout` | PASS |
| `node --check tests/step07-admin-auth-recovery.test.cjs` | PASS |
| Không còn file `__cla_login_typecheck_*` sau test | PASS |

**Giới hạn:** Môi trường đóng gói có TypeScript **5.8.3**, không có TypeScript 6.0.3 và không phải Windows. Vì vậy **chưa thể tuyên bố TS6.0.3/Windows PASS** cho đến khi chạy lại trên máy người dùng. Phương án mới loại bỏ cả hai cấu hình gây lỗi mà log người dùng đã chỉ ra. Chưa chạy build đầy đủ vì môi trường đóng gói không có dependencies React/Firebase. Chưa xác nhận Firebase production/Emulator.

## Cài đặt và kiểm tra trên Windows

1. Sao lưu `C:\Gạo\Cognitive-Learn` và giữ nguyên `.env`, `.env.local`, `node_modules` đang chạy tốt.
2. Giải nén FULL SOURCE ZIP này, chép nội dung bên trong vào đúng thư mục dự án. Thực tế chỉ cần ghi đè file test và thêm tài liệu mới.
3. Chạy PowerShell:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:admin-recovery
npm test
npm run build
```

Không chạy `npm ci` lại nếu dependencies đã cài thành công. Nếu bài kiểm thử vẫn lỗi, giữ nguyên log mới để phân tích tiếp.

## Tiến độ

- Số bước đã có bản vá nguồn: **6/28 = 21,4%** (02–07); hotfix không cộng bước mới.
- **164 checklist** vẫn phải nghiệm thu theo bằng chứng. Không cộng tiến độ sản phẩm dựa trên việc sửa test.
- Firestore Emulator, đăng nhập Admin thực tế, consent cho học sinh vị thành niên và nghiên cứu khoa học vẫn là các hạng mục chưa được xác nhận.
