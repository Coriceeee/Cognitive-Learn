# Cognitive Learn AI CP68 — Bắt đầu mốc MVP

**Đầu vào:** kế thừa CP67, tập trung đóng điều kiện thực thi UX trước MVP CP71–CP73.

### Những thay đổi quan trọng

- Fix SPA Back/Forward: khôi phục focus nội dung khi đổi phân hệ mà không làm hỏng vị trí cuộn. Query-only filter giữ nguyên focus và scroll.
- Tạo công cụ QA thực tế cho **6 phân hệ × 2 kích thước màn hình**, fail-closed khi thiếu dependency, cấu hình Firebase QA hoặc tài khoản tổng hợp.
- 8 unit tests mới, 17 CP67 regressions, toàn bộ npm test PASS; demo offline 11/11 PASS. Build/Emulator/React E2E chưa nghiệm thu.

### Kiểm tra nhanh

```sh
npm run test:cp68:qa-gate
npm run test:cp67:route-experience
npm run check:dependencies
npm run build
```

**Không yêu cầu gửi tài khoản Firebase thật.** Khi có Firebase QA riêng, xem lệnh setup tại `reports/cp68/CP68_ACCEPTANCE_REPORT.md`.

Bằng chứng và giới hạn nằm trong `reports/cp68/`; số lượng 1.365 dòng TAP ok không có nghĩa 1.365 chức năng đã nghiệm thu sản phẩm. Ảnh HTML isolated không được dùng như screenshot chạy React.
