# COGNITIVE LEARN AI — CP33 START HERE

## 1. Bản này có gì mới?

CP33 kế thừa source CP32 Scientific MVP và bổ sung ba visual chuyên biệt:

- **Haven Pressure Topology:** tọa độ song song bốn tín hiệu áp lực tự khai báo, vòng Support Readiness và danh sách hành động.
- **Pulse Metric Orbit:** sáu vòng đồng tâm lấy trực tiếp từ sáu chỉ số Pulse, đặt cạnh giá trị thực/mục tiêu.
- **Pulse Evidence Circuit (Admin-only):** mạch Seed → Lumen → Orion → Pulse dựa trên trạng thái metadata Firestore theo UID, không tuyên bố E2E.

Các visual khác được kế thừa: Seed trajectory/heatmap; Lumen radar/coverage/delta/lineage; Orion strategy trade-off; Atlas PTIT BVH 2024–2025 slopegraph.

## 2. Cài và chạy trên Windows PowerShell

Giải nén vào thư mục mới, ví dụ `C:\Gạo\CLA-CP33`. Mở PowerShell tại thư mục có `package.json`:

```powershell
Get-Location
Test-Path .\package.json
node -v
npm ci
npm run dev
```

Nếu `npm ci` chưa hoàn tất thành công, Vite sẽ chưa có trong `node_modules`; không chạy `npm run dev` cho đến khi cài dependency thành công.

## 3. Lệnh test và build

```powershell
npm test
npm run test:rules:static
npm run check:layout
npm run typecheck:api
npm run build
```

Chỉ công nhận build khi lệnh `npm run build` kết thúc exit code 0. Static Rules không thay Emulator.

## 4. Hướng dẫn demo

1. Đăng nhập tài khoản Admin demo đã được cấp trong môi trường của bạn.
2. Seed Profile → `Nạp hồ sơ demo 3 năm` → xác nhận → xem trước → chủ động lưu.
3. Transcript → kiểm tra 6 học kỳ, 9 môn.
4. Lumen → kiểm tra chỉ số và độ bao phủ dữ liệu.
5. Orion → nhập mục tiêu và chạy 3 chiến lược.
6. Atlas → tra nguồn chính thức và xem cutoff PTIT BVH 2024–2025.
7. Haven → nhập 4 tín hiệu áp lực và xem Pressure Topology.
8. Pulse → nhập dữ liệu mô phỏng, xem Metric Orbit; Admin chạy kiểm tra liên thông để xem Evidence Circuit.

Không có tài khoản demo/password được đóng gói trong ZIP. Dùng tài khoản được tạo/cấp an toàn trong Firebase project của bạn.

## 5. Test status lúc đóng gói

- `npm test`: PASS; 102 checks/subtests tổng hợp, gồm 11 contract tests cho scientific visuals.
- `npm run test:rules:static`: 15/15 PASS.
- `npm run check:layout`: PASS.
- UCI baseline guard: 4/4 PASS.
- 5 file TSX thay đổi được transpile cú pháp; 3 component mới strict-typechecked độc lập với JSX shim.
- `npm ci` trong runner đóng gói bị TIMEOUT; API typecheck và full production build còn BLOCKED do dependency types thiếu.
- Browser E2E, Firebase Emulator, staging/production chưa chạy.

Chi tiết: `docs/CP33_UPDATED_PROGRESS_20261110.md`, `docs/CP33_ONE_DAY_ACTION_PLAN_20261110.md`, `docs/CP33_SCIENTIFIC_PRESENTATION_RELEASE_20261110.md`.

## 6. Giới hạn không được vượt qua

- Synthetic/demo không phải dữ liệu nghiên cứu.
- SCI/MAS/CSL là exploratory/proxy, chưa được xác nhận tâm trắc.
- Orion gain/readiness là heuristic, không phải xác suất tuyển sinh.
- Haven fit/readiness không phải xác suất nhận học bổng.
- Gemini cần benchmark/gold review trước khi tuyên bố groundedness.
- Không có outcome longitudinal đủ điều kiện thì không tuyên bố CLA tạo ra tiến bộ hoặc tác động nhân quả.
- Không deploy production khi build, Emulator và E2E chưa PASS.
