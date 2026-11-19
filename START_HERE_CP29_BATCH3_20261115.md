# CLA CP29 — Batch 3: Login Recovery & Privileged Account Operations

Bản này tiếp tục trực tiếp trên **CP29 Batch 2 (Academic Lock)**. Không bao gồm triển khai Firebase production.

## Phạm vi

- **B1:** Bổ sung quên mật khẩu qua Firebase Auth. Nội dung phản hồi không xác nhận email có tồn tại hay không. Các vai trò hiện tại (student/teacher/parent/admin) vẫn do server profile quyết định.
- **B3:** Giữ cơ chế khôi phục Admin ngoài ứng dụng; không có đăng ký Admin tự phục hồi hoặc tự nâng quyền từ client. Hướng dẫn trong `docs/CP29/`.
- **B4:** Admin Demo vẫn chỉ thuộc UID của Admin, có nhãn `dataScope=demo`; role preview không phải impersonation. Đã bổ sung kiểm thử hợp đồng, không sửa quyền dữ liệu.
- **K15:** Thêm trang `/admin/diagnostics?view=accounts` (hiển thị mặc định **DISABLED**) và backend Firebase callable riêng biệt. Backend chỉ thực hiện tra cứu UID hoặc thay đổi `active`/role *không phải Admin*, có giao dịch audit. Nó **KHÔNG tự vô hiệu hóa Firebase Auth**, không xóa hồ sơ và không deploy tự động.

## Cách cập nhật

1. Sao lưu source hiện tại; nếu dùng bản vá, giải nén file ZIP từ thư mục gốc `C:\Gạo\Cognitive-Learn` để giữ đường dẫn tương đối.
2. Kiểm tra không có thay đổi cấu hình production; file `firebase.admin-optional.json` không được Firebase mặc định sử dụng.
3. Chạy PowerShell:

```powershell
npm run test:cp29:accounts
npm run verify:cp29:batch3
npm run test:rules:emulator
npm run verify:cp37
"VERIFY_EXIT_CODE=$LASTEXITCODE"
```

**Tiêu chí:** Các lệnh exit 0. Emulator dự kiến giữ **83 ca** từ CP29 Batch 2 (không đổi Rules); phải đọc JSON/report thay vì chỉ nhìn cuối log. Build cần ghi dòng `built` và exit code 0. Chưa có xác nhận kết quả Windows Batch 3.

## Lưu ý bảo mật

- Hệ thống backend mới **mặc định tắt** cả phía client và server. Đừng bật trên production chỉ để kiểm tra giao diện.
- Không cấp `claOperator` hoặc sửa `users/{uid}.role=admin` qua trình duyệt. Việc cấp operator/MFA phải được project owner phê duyệt riêng và ghi nhật ký.
- Chỉ kiểm thử backend trong staging/Emulator, sau đó xét duyệt IAM, rate limiting/App Check, MFA và kiểm soát hoạt động trước deploy.
- PASS unit/contract không thay thế bài kiểm thử Firebase Functions thực và browser E2E.

Xem `docs/CP29/CP29_BATCH3_ADMIN_SECURITY_REPORT_20261115.md` để biết điều kiện nghiệm thu còn thiếu.
