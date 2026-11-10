# CLA CP33 — Kế hoạch 24 giờ cuối trước khi viết báo cáo

## Mục tiêu

Đóng một MVP kỹ thuật có thể cài đặt, build, chạy được một hành trình demo lặp lại, có quyền truy cập đúng và evidence kiểm thử. Không mở rộng thêm tính năng lớn trước khi các gate này PASS.

## P0 — Phải làm ngay

### 1. Cài dependency và build sạch

Tại thư mục gốc có `package.json` và `package-lock.json`:

```powershell
Get-Location
Test-Path .\package.json
node -v
npm ci
npm test
npm run test:rules:static
npm run check:layout
npm run typecheck:api
npm run build
```

Nếu `npm ci` chưa kết thúc exit code 0, không chạy `npm run dev` để kết luận website đã sẵn sàng. Kiểm tra `Test-Path .\node_modules\.bin\vite.cmd`. Node v24.18 có thể dùng với Vite 8 theo yêu cầu engine; không cài package rời hoặc xoá lockfile để chữa lỗi.

### 2. Browser smoke / E2E

Kiểm tra ít nhất desktop và mobile, refresh deep-link, console/network, loading/error/empty states:

- `/student`
- `/student/profile`
- `/student/transcript`
- `/lumen`
- `/orion`
- `/atlas` và `/atlas/study-abroad`
- `/haven`
- `/pulse`
- `/teacher`, `/parent`, `/admin` theo đúng tài khoản vai trò

### 3. Firestore Emulator và phân quyền

- Student chỉ đọc/ghi UID của mình.
- Teacher/Parent chỉ xem phần học sinh đã chia sẻ.
- Admin demo chỉ dùng dữ liệu demo trong UID Admin.
- Cross-UID read/write phải DENY.
- Kiểm tra khóa bốn môn lựa chọn và đường ngoại lệ có audit.

Không Publish `firestore.rules.CANDIDATE*` và không deploy production nếu Emulator chưa PASS.

### 4. Chạy demo một hồ sơ xuyên suốt

1. Đăng nhập tài khoản Admin demo.
2. Vào Seed Profile, nạp preset demo 3 năm, xác nhận rõ đây là synthetic, sau đó chủ động lưu.
3. Mở bảng điểm, kiểm tra 6 học kỳ, 9 môn; điểm tạm tính và điểm chính thức phải khác nhau.
4. Mở Lumen: kiểm tra chiều có/thiếu dữ liệu; Gemini chỉ giải thích, không tự tính lại điểm.
5. Mở Orion: nhập mục tiêu, số tuần và điểm đích; xem ba chiến lược.
6. Mở Atlas: trình bày nguồn chính thức; cutoff chart chỉ là PTIT BVH 2024–2025, không nói điểm chuẩn 2026 đã xác minh.
7. Mở Haven: nhập áp lực và nhu cầu; xem Pressure Topology; không gọi fit score là xác suất nhận học bổng.
8. Mở Pulse: xem Orbit 6 chiều; Admin chạy kiểm tra liên thông và Evidence Circuit.
9. Lưu ảnh màn hình, log test, timestamp và kết quả PASS/FAIL.

## P1 — Chốt phạm vi, không cố làm giả trong một ngày

- Học bổng: C25-14 hiện 0%; chỉ hiển thị hồ sơ học bổng khi có URL chính thức, năm tuyển, điều kiện, chứng chỉ, hạn nộp và ngày kiểm tra. Nếu chưa có thì giữ empty state rõ ràng.
- Tuyển sinh: dữ liệu cutoff đã biểu đồ hóa là subset PTIT BVH 2024–2025; mở rộng toàn quốc cần nguồn/đề án theo từng trường-ngành-phương thức-năm.
- Dataset: UCI HF mirror chưa tải/hash trong bản hiện tại; VNHSGE license variant vẫn HOLD. Không tạo metric ML từ dữ liệu synthetic.
- LLM: 120 case là manifest; cần chạy Gemini thật và human gold review mới có điểm groundedness.
- Psychometrics: SCI/MAS/CSL tiếp tục ghi nhãn exploratory/proxy; chưa có độ tin cậy/validity.
- Adaptive: replay hiện tại là synthetic; không kết luận CLA cải thiện điểm hay gây ra thay đổi.

## Chia thời gian đề xuất

| Khung | Việc | Đầu ra cần lưu |
|---|---|---|
| 0–2 giờ | `npm ci`, tests, typecheck, build | Log cài đặt và build |
| 2–5 giờ | Browser smoke/E2E, route, mobile | Checklist route + ảnh + console |
| 5–7 giờ | Firebase Emulator, role/UID | Ma trận allow/deny |
| 7–9 giờ | Demo xuyên suốt một hồ sơ | Video/ảnh + Evidence Record |
| 9–10 giờ | Sửa blocker P0 còn lại | Commit và test lại |
| 10–12 giờ | Freeze source, report evidence | Release note + claim/evidence matrix |

Nếu môi trường Firebase hoặc npm không khả dụng, ghi BLOCKED/NOT RUN trong báo cáo; không chuyển thành PASS để kịp hạn.
