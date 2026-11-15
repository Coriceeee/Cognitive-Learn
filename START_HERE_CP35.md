# CLA CP35 — Bắt đầu nhanh

## Phạm vi
CP35 là bản cập nhật P0/P1 dựa trên source CP34 đầy đủ hiện có trong Project. Gói không chứa `.env`, `node_modules`, `.git` hoặc dữ liệu bí mật.

## Cài đặt
1. Sao lưu thư mục dự án hiện tại trước khi thay file.
2. Giải nén CP35 vào một thư mục mới hoặc copy đè sau khi đã sao lưu.
3. Mở PowerShell tại thư mục có `package.json`.
4. Xác nhận:
   ```powershell
   node -e "const p=require('./package.json'); console.log(p.name,p.scripts.dev,p.scripts['verify:cp35'])"
   ```
5. Cài sạch và chạy kiểm thử:
   ```powershell
   npm ci
   npm run verify:cp35:static
   npm run build
   npm run dev
   ```

## Trang chức năng học sinh
- Atlas: `/atlas`
  - `/atlas/vietnam`
  - `/atlas/study-abroad`
  - `/atlas/study-abroad/programs`
  - `/atlas/study-abroad/requirements`
  - `/atlas/study-abroad/sources`
  - `/atlas/joint`
  - `/atlas/recommendations`
  - `/atlas/sources`
- Lumen: `/lumen`, `/lumen/indices`, `/lumen/history`, `/lumen/insights`, `/lumen/assistant`
- Orion: `/orion`, `/orion/inputs`, `/orion/scenarios`, `/orion/roadmap`
- Pulse: `/pulse`, `/pulse/progress`, `/pulse/reports`, `/pulse/actions`
- Haven: `/haven`, `/haven/scholarships`, `/haven/finance`, `/haven/plan`

## Quy tắc dữ liệu
- Không có trường đại học mặc định; PTIT chỉ là ví dụ dữ liệu lịch sử có phạm vi hẹp.
- Không có quốc gia du học mặc định; danh mục lựa chọn gồm 249 quốc gia/vùng lãnh thổ.
- Danh mục quốc gia không đồng nghĩa đã có dữ liệu tuyển sinh/visa/học phí được xác minh tại tất cả điểm đến.
- Điểm đầu vào Atlas để trống; không tự điền điểm mẫu.
- Các nội dung kỹ thuật lưu trữ không hiển thị trong giao diện học sinh.
- Công cụ Admin chỉ nằm trong Nexus Console.

## Trạng thái kiểm thử
Xem `CP35_VERIFICATION_REPORT.md`. Không coi production build, Browser E2E, Firebase Emulator hoặc staging là PASS nếu chưa chạy thành công trên môi trường cài dependencies và Firebase tương ứng.
