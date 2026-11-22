# CP77 · Thay thông điệp trang đăng nhập (22/11/2026)

**Nền:** full source CP76. **Phạm vi:** khối giới thiệu bên trái trang đăng nhập `src/page/auth/LoginPage.tsx`, không đổi quy trình xác thực hoặc chức năng học sinh.

## Thông điệp đã chốt

> Mỗi con người là một tiềm năng chưa có giới hạn.  
> Mỗi tương lai là một hành trình chưa được viết nên.

*CLA — Nơi dữ liệu trở thành sự thấu hiểu, nhận thức mở ra lựa chọn và mỗi học sinh tìm thấy con đường của chính mình.*

## Các vị trí sửa

- `src/page/auth/LoginPage.tsx`: thay nguyên văn heading/subtitle; dùng class `cla-login-manifesto` và `cla-login-manifesto-caption`.
- `src/styles/01-auth.css`, `src/styles/99-responsive.css`: cỡ chữ thích ứng và khoảng dòng riêng cho thông điệp dài; không thay CSS nút, thẻ minh họa hay form.
- `tests/cp77-login-manifesto.test.cjs`, `package.json`: bốn contract test và lệnh `npm run test:cp77:login-copy`.
- `src/lib/nexusEvidenceBaseline.ts`: đồng bộ fingerprint mã nguồn; không phải bằng chứng production.

## Kiểm tra thực hiện

| Kiểm tra | Kết quả |
|---|---|
| Test CP77 | **4/4 PASS** |
| Test CP76 tên module | **9/9 PASS** |
| Test CP71 thanh điều hướng | **6/6 PASS** |
| Test CP74 giao diện | **8/8 PASS** |
| Test CP75 kiểm toán UX | **6/6 PASS** |
| Kiểm thử integrity CP53 | **5/5 PASS** |
| Layout | **PASS** |
| Synthetic demo offline | **11/11 PASS** |
| Test đóng gói | **3/3 PASS** |
| Chromium isolated CSS probe | **5/5 viewport PASS**, không tràn ngang hoặc chồng nội dung |
| TSX parse | **PASS** |
| Real React build / Firebase / Auth browser E2E | **CHƯA NGHIỆM THU**: môi trường thiếu node_modules |

Hình ảnh `reports/cp77/hero-qa-*.png` chỉ là Chromium render **DOM giới thiệu tĩnh + CSS thật của dự án**, không phải ảnh screenshot React app đang đăng nhập, và không chứng minh API/Firebase hoạt động.
