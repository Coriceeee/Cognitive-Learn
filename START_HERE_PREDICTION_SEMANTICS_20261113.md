# CLA · Áp dụng bản P0 Prediction Semantics

1. Sao lưu thư mục `C:\Gạo\Cognitive-Learn`, đặc biệt thay đổi mới trên máy chưa có trong ZIP. Không xóa `.env`, `.env.local` hay `node_modules` đang hoạt động.
2. Giải nén **FULL SOURCE ZIP** vào thư mục dự án (các mục `src/`, `tests/`, `package.json` nằm trực tiếp ở root ZIP).
3. Không cần `npm ci` nếu dependencies vẫn chạy ổn; bản vá chỉ bổ sung script và file test, không thêm gói npm.
4. Chạy trong PowerShell:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm run test:prediction-safety
npm test
npm run test:rules:static
npm run build
npm run dev
```

5. Mở Student Dashboard → Learning Intelligence nâng cao. Kết quả là **chỉ số quy tắc thử nghiệm**, không có probability đã hiệu chuẩn. Thử các kịch bản Orion; kiểm tra không bị báo là hiệu quả quan sát.
6. File formula governance: `docs/CLA_PREDICTION_RULE_SEMANTICS_V2_1.md`; báo cáo: `BAO_CAO_P0_PREDICTION_SEMANTICS_20261113.md`.

**Chưa đạt:** kiểm thử Firebase Emulator/production trên bản này, consent với người giám hộ, dữ liệu thực để hiệu chuẩn mô hình. Không sử dụng kết quả này để khẳng định cơ hội đỗ hoặc hiệu quả can thiệp.
