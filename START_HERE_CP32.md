# COGNITIVE LEARN AI — CP32 START HERE

## 1. Vì sao bạn gặp `npm error Missing script: "dev"`?

Trong gói CP31, `package.json` **có** script `dev` (`vite --open`). Lỗi này thường xảy ra khi PowerShell đang đứng ở thư mục cha hoặc đang dùng một `package.json` khác với source CP31.

Gói CP32 này đã được đóng lại với `package.json` nằm ngay ở thư mục gốc của ZIP để tránh lỗi thư mục lồng nhau.

## 2. Cách chạy trên Windows PowerShell

1. Tạo thư mục mới, ví dụ `C:\Gạo\CLA-CP32`.
2. Giải nén toàn bộ ZIP vào thư mục đó.
3. Mở PowerShell tại thư mục vừa giải nén.
4. Xác nhận đang đứng đúng chỗ:

```powershell
Test-Path .\package.json
node -p "require('./package.json').scripts.dev"
```

Kết quả mong đợi: `True` và `vite --open`.

5. Cài dependency theo lockfile:

```powershell
npm ci
```

6. Chạy website:

```powershell
npm run dev
```

## 3. Nếu vẫn báo thiếu script

Chạy và gửi lại nguyên kết quả:

```powershell
Get-Location
Get-ChildItem -Force | Select-Object Name
Get-ChildItem -Recurse -Filter package.json | Select-Object FullName
node -p "JSON.stringify(require('./package.json').scripts, null, 2)"
```

Không tự thêm script vào một `package.json` chưa xác định; trước hết cần chắc chắn đúng source.

## 4. Các lệnh kiểm tra

```powershell
npm test
npm run test:rules:static
npm run check:layout
npm run build
```

- `npm test`: các test tự động không cần Firebase production.
- `test:rules:static`: kiểm tra hợp đồng Rules tĩnh, **không thay thế Firebase Emulator**.
- `check:layout`: kiểm tra cấu trúc module.
- `build`: chỉ được xem là PASS khi dependencies cài đủ và lệnh thoát mã 0.

Nếu cần kiểm thử Rules bằng Emulator, cài Firebase CLI và dùng lệnh trong README dự án. Không chạy deploy hoặc publish Rules chỉ để thử.

## 5. Trạng thái đã xác minh trên CP31

- `npm test`: 87 test case PASS (14 academic + 4 cognitive + 69 TAP subtests).
- `npm run test:rules:static`: 15/15 PASS.
- `npm run check:layout`: PASS (22 file bắt buộc; 19 vị trí legacy không còn).
- Dataset scope gate: 40/40 dòng synthetic/demo bị loại; eligible research n = 0.
- LLM benchmark manifest: 120 ID duy nhất, chia 7 nhóm; chưa chạy model.
- UCI baseline unit tests: 4/4 PASS; dataset thật chưa tải, chưa có metric.
- Closed-loop synthetic replay: 8 stage, 4 test PASS; không phải outcome quan sát.
- Production build: chưa được xác nhận trong môi trường đóng gói vì thiếu dependencies.
- Browser E2E, Firebase Emulator, staging/production smoke: chưa chạy.

## 6. Quy tắc an toàn

- Không chép `.env`, API key, service-account key hoặc dữ liệu học sinh vào ZIP công khai.
- Không dùng dữ liệu synthetic/demo làm kết quả nghiên cứu.
- Không tuyên bố SCI/MAS/CSL đã được kiểm định tâm trắc, ML dự báo hiệu quả, Adaptive cải thiện điểm, hoặc xác suất tuyển sinh khi chưa có dữ liệu và validation tương ứng.
- Giữ nguyên bản source cũ; dùng CP32 trong thư mục mới để tránh ghi đè.
