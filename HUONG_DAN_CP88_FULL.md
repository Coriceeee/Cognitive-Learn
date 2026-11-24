# CLA CP88 FULL — giao diện CP87 + khôi phục cấu hình đăng nhập + chẩn đoán CP88

## Nội dung
- Toàn bộ mã nguồn CP87, bao gồm vòng tròn sáu phân hệ ở đầu dashboard; không đổi tên/số lượng phân hệ.
- `KHOI_PHUC_2_TAI_KHOAN_CLA_CP88.ps1`: đã sửa mặc định `ProjectRoot` dùng chính thư mục chứa script, lưu UTF-8 BOM để PowerShell 5.1 không đọc sai `C:\Gạo`.
- `CHAY_CHAN_DOAN_DANG_NHAP_CP88.cmd` + `CLA_CP88_KIEM_TRA_DANG_NHAP.py`: chỉ đọc, kiểm tra API Auth + Firestore không dùng email/mật khẩu.
- `CP88_SOURCE_MANIFEST.json` và `tools/verify-cp88-snapshot.cjs` kiểm tra SHA-256 toàn vẹn mã nguồn; không sửa bất kỳ bằng chứng CP31.

## Chạy trong thư mục gốc hiện tại
Giải nén nội dung thư mục `Cognitive-Learn/` của ZIP vào gốc `C:\Gạo\Cognitive-Learn` hoặc giải nén ra thư mục mới và sao chép cấu hình riêng của mình nếu cần. Không ghi đè `.env.*` bằng cấu hình demo. ZIP không chứa `.env.local`, `.env.live.local`, khóa server, mật khẩu, database người dùng hoặc `node_modules`.

Kiểm tra mã nguồn:
```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
node tools/verify-cp88-snapshot.cjs
npm run check:layout
```

### Giữ nguyên hai tài khoản Firebase cũ
Giữ chế độ QA trên `http://127.0.0.1:5173` và chạy riêng localhost live `http://127.0.0.1:5174`. **Không chạy E2E hoặc nhập dữ liệu giả lập trên live.**

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
& '.\KHOI_PHUC_2_TAI_KHOAN_CLA_CP88.ps1' -ProjectRoot (Get-Location).Path -CheckOnly
# Neu kiem tra PASS, chay:
& '.\KHOI_PHUC_2_TAI_KHOAN_CLA_CP88.ps1' -ProjectRoot (Get-Location).Path
```

Nếu API key, App ID hoặc rules trên Firebase thật chưa được cấu hình đúng, các script **không thể tự sửa Firebase production**. Không bỏ qua kiểm tra `users/{uid}` hoặc nới Firestore Security Rules để ép đăng nhập. Dừng và chạy chẩn đoán chỉ đọc:

```powershell
.\CHAY_CHAN_DOAN_DANG_NHAP_CP88.cmd
```

Gửi `DIAGNOSIS`, `auth_endpoint`, `user_document`, `consent_document` (không gửi email, UID, API key, token hoặc mật khẩu).

## Trạng thái bằng chứng
- CP86: lần nghiệm thu trên Windows của người dùng trước đó là `PASS=15 FAIL=0 BLOCKED=0`.
- CP87: đã thay đổi vị trí vòng tròn sáu phân hệ.
- CP88: công cụ chẩn đoán + sửa launcher đường dẫn UTF-8; **chưa xác minh đăng nhập hai tài khoản cũ trên Firebase production**; không tuyên bố fix Firestore permission hay Auth network.
- Browser E2E chưa vượt qua; nghiệm thu nghiên cứu khoa học độc lập chưa hoàn tất.
