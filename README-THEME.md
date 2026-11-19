# CLA – Cognitive Observatory (sáng + tối) – bản vá GỐC RỄ

## Nguyên nhân gốc
Màu được quyết định tại từng dòng CSS bằng hex/rgba viết cứng (2.900+ chỗ, 1.300+ màu khác nhau, 334 `!important`),
không có lớp token ngữ nghĩa. Mỗi đợt "đổi giao diện" (CP28 → CP42) chồng thêm một lớp ghi đè → không có nguồn sự thật duy nhất,
nên dark mode không thể làm bằng cách sửa nhẹ.

## Cách giải quyết tận gốc
1. `scripts/tokenize-colors.cjs` (chạy 1 lần, đã chạy): thay mọi màu theo-theme trong **38 file CSS + 6 file TSX** bằng token
   `rgb(var(--tc-<vai trò>-<hex>))`. Light mode giữ **nguyên từng giá trị** (đã kiểm chứng: 11.654 khai báo, 0 sai khác).
   Giá trị light/dark của mọi token nằm ở **một file**: `src/styles/00a-theme-tokens.css` (nạp đầu tiên).
2. `src/styles/37-cla-orbital-theme.css`: token thiết kế mới (nền, chữ, viền, 7 màu module), nền lưới + ánh sáng, panel, form, vòng quỹ đạo, nút theme.
   Biến cũ (`--ink`, `--blue`, `--cla-*`) được trỏ về token mới.
3. Chống tái phát:
   - `node scripts/check-colors.cjs` → báo mọi màu viết cứng sẽ sai ở dark. Gắn vào CI / pre-commit.
   - `node scripts/audit-contrast.cjs` → kiểm tương phản chữ/nền ở cả hai theme.
   - File TSX luôn tối ở cả hai theme: thêm dòng `// theme-neutral-file: lý do` (đã dùng cho StudentDecisionCanvas.tsx).

## Thành phần mới
`src/lib/theme.ts`, `src/components/common/ThemeToggle.tsx`, `src/components/common/OrbitHero.tsx`; sửa `index.html`, `src/App.tsx`, `src/page/main/RolePage.tsx`, `src/styles.css`.

## Tinh chỉnh
- Đổi màu dark của một vai trò: sửa giá trị trong khối `:root[data-theme="dark"]` của `00a-theme-tokens.css`.
- Màu thương hiệu & module: khối `:root` / `:root[data-theme="dark"]` đầu `37-cla-orbital-theme.css`.
- CSS mới: dùng `var(--t-ink)`, `var(--t-line)`, `var(--t-surface)`, `var(--t-accent)`..., đừng viết #hex.

## Chưa kiểm chứng
Chưa chạy app thật (Vite không build được trong môi trường này); đã kiểm bằng tsc, kết xuất trang vai trò ở Chromium và các script trên.
