# Cognitive Learn AI — Bản tinh gọn hướng nghiệp và tuyển sinh

Nguồn: CLA(1).zip do chủ dự án cung cấp. Bản bàn giao mã nguồn, chưa deploy.

## Thay đổi
- Giữ nguyên sơ đồ sáu phân hệ, bố cục, theme, route, engine Cognitive, ML/XAI nghiên cứu và cấu hình Firebase. Sơ đồ gốc giữ nguyên SHA256. Nút trên dashboard dẫn thẳng đến hồ sơ/phân tích và tổ hợp.
- Ưu tiên các tab thao tác chính ở Lumen, Atlas và Orion; Pulse/Haven giảm còn hai tab nổi bật; các route bổ trợ vẫn có trong mục Mở rộng, không xóa logic hoặc dữ liệu.
- Lumen: điều hướng phân tích 7 chỉ số → dự báo; hiển thị kịch bản GPA từ engine hiện có chỉ khi GPA được đối soát và Cognitive đủ dữ liệu. Chi tiết mô hình nằm trong phần mở rộng.
- Atlas: ước lượng cơ sở từ hai bài thi thử từng môn (trung bình, phiên bản mock-mean-v1), kiểm tra thiếu/sai dữ liệu, không biến điểm thiếu thành 0. Khi áp dụng, loại điểm riêng `projection`, không dùng như điểm thi THPT chính thức, không mở gate xếp nhóm trúng tuyển. Kết quả dùng để khám phá tổ hợp và ngành/trường có nguồn, nối đến sổ nguyện vọng và Orion. Đây là baseline thử nghiệm, chưa phải dự báo ML đã kiểm định.
- Nút hỏi trợ lý tuyển sinh mở chatbot hiện tại; không tự gửi câu hỏi hoặc thay đổi Gemini backend.
- Giữ nguyên CP93_SOURCE_MANIFEST.json lịch sử. FOCUSED_RELEASE_MANIFEST.json khóa các file thay đổi và các file CP93 liên quan. Dùng BUILD_CLA_FOCUSED.cmd thay cho script build snapshot CP93 lịch sử.

## Chạy trên Windows PowerShell

Sao lưu thư mục dự án đang dùng. Giải nén vào thư mục riêng. Dùng bản sao cấu hình `.env*` thực tế hiện có của chính bạn (không gửi key qua chat); không thay bằng cấu hình mẫu nếu đang dùng production. Sau đó trong thư mục có package.json:

```powershell
npm ci
npm run verify:focused
npm run dev
```

Để kiểm thử đầy đủ và build:

```powershell
.\BUILD_CLA_FOCUSED.cmd
```

Script không deploy. Không chạy deploy khi build chưa đạt. Không publish Rules từ bản candidate.

## Kiểm tra trong môi trường tạo ZIP

- Kiểm tra cú pháp/transpile: 10 file TS/TSX đã chỉnh, 0 chẩn đoán cú pháp; không thay thế typecheck đầy đủ.
- Focused tests: 4/4; UX/navigation: 57/57; Atlas/Seed/UX: 38/38; Firestore static: 15/15; CP87/CP93: 9/9. Tổng các lượt test mục tiêu: 123 test pass (không phải 123 test E2E hay nghiên cứu thực nghiệm).
- Manifest: 37 file đã xác minh SHA256.
- `npm ci --offline`: bị chặn vì cache không có yargs-parser. Full typecheck/Vite build, browser E2E, Firebase Emulator và production: NOT RUN. Không khẳng định sửa lỗi Auth/Gemini hoặc model khoa học đã được xác thực.
- Không có `.env` thật, `.git`, node_modules, dist, cache deployment, dữ liệu OULAD thô, dữ liệu nghiên cứu riêng tư, logs vận hành cục bộ hoặc ZIP dist cũ trong gói. Giữ file cấu hình mẫu, mã nguồn, test, tài liệu và bằng chứng nghiên cứu không bị loại theo quy tắc này. Dữ liệu ngoài tải lại từ nguồn được phép nếu cần cho research.
