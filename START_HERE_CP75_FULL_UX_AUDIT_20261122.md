# CP75 — Full UX audit + priority fixes

**Mục đích:** kiểm tra cấu trúc UX tất cả màn hình dựa trên mã nguồn CP74, kèm năm nhóm sửa lỗi có thể xác minh ngay. Chưa công nhận UX toàn bộ đã hoàn tất hay MVP đã sẵn sàng production.

## Các tệp nên đọc

1. `reports/cp75/CP75_FULL_UX_AUDIT_20261122.md` — báo cáo kiểm toán, lỗi gốc, bản vá, mức ưu tiên.
2. `reports/cp75/CP75_ROUTE_QA_MATRIX.csv` — 47 đường dẫn cần kiểm tra trong ứng dụng React thật (các ca browser hiện CHƯA CHẠY).
3. `reports/cp75/css-control-probe.json` — so sánh nút chuyên dụng trước/sau khi hạ độ ưu tiên CSS (Chromium, HTML riêng; không phải browser E2E React).
4. `reports/cp75/logs/` — test CP62–CP75, Rules, layout, demo synthetic, build và packaging.

## Thay đổi mã nguồn

- `src/styles/49-cla-product-polish.css`: hạ độ ưu tiên selector CSS fallback của nút bằng `:where`, không đè nút chuyên dụng.
- `src/page/seed/StudentProfilePage.tsx`: bổ sung tên truy cập cho ô bảng điểm theo môn, lớp, kỳ, loại điểm.
- `src/components/common/FloatingAdvisorChat.tsx`: thay intro dài bằng lời giới thiệu theo tác vụ.
- `src/components/common/UserMenu.tsx`: trạng thái ARIA, Escape, click ngoài để đóng menu.
- `src/App.tsx`, `src/lib/routeExperience.ts`: 404 thật, không nhầm đường dẫn sai với trang đăng nhập.
- `tests/cp75-ux-audit.test.cjs` và `package.json`: kiểm thử hồi quy mới.

## Chạy kiểm tra

```bash
npm ci
npm run build
npm run test:cp75:ux-audit
npm run test:cp74:product-polish
npm run test:rules:static
npm run check:layout
```

Để nghiệm thu UI thật, cần cấu hình QA local theo `START_HERE_CP73_MVP_QA_20261122.md`, chạy ứng dụng React + Emulator, mở 47 route ở màn hình desktop/mobile, thử keyboard/focus, nhập/lưu/tải lại và đánh dấu kết quả vào CSV. Không sử dụng tài khoản/hồ sơ học sinh thật.

**Tình trạng CP75:** các kiểm thử UX mới/hồi quy chạy riêng PASS; build, Emulator và React E2E chưa đạt bằng chứng. Mode dark chưa bật: `theme.ts` chủ động giữ chế độ sáng vì chưa được kiểm định màu toàn trang.
