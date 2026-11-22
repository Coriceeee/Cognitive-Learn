# Cognitive Learn AI CP66 — Bản UX-first

## Có gì mới

Đã chuẩn hóa ngôn ngữ giao diện của sáu phân hệ. Đặc biệt sửa thông báo "đã lưu" bị lỗi thời sau khi chỉnh sửa tiếp trong Pulse/Haven, cùng xác nhận đúng phiên bản khi có thao tác ghi đồng thời. Giữ nguyên quy tắc dữ liệu xác minh Firestore của CP59–CP65.

## Chạy ở máy có npm registry

```bash
npm ci
npm run build
npm test
npm run test:rules:emulator
npm run dev
```

Dùng cấu hình Firebase riêng của dự án, tuyệt đối không công khai token hoặc nội dung `.env`. Những bước production build, Firebase Emulator và browser E2E chưa được nghiệm thu tại môi trường tạo CP66 vì thiếu package.

## Tài liệu và ảnh QA

- `reports/cp66/CP66_ACCEPTANCE_REPORT.md`
- `reports/cp66/CP66_UX_REPORT_WRITING_KIT.md`
- `reports/cp66/preview-desktop-light.png`, `preview-desktop-dark.png`, `preview-mobile-light.png`, `preview-mobile-dark.png`

Ảnh QA là bản kiểm tra bố cục độc lập (dùng thành phần TSX thật + dữ liệu trạng thái giả lập), không phải website React đang hoạt động.
