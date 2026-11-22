# CP74 — UX sửa theo ảnh thực tế ngày 22/11/2026

**Nền:** CP73. **Phạm vi:** giao diện và điều hướng. **Không thay đổi** thuật toán AI/ML, cơ chế xác thực Firebase hay cấu trúc dữ liệu.

## Sửa các lỗi có bằng chứng

1. Bỏ hẳn `Phân hệ` khỏi `src/components/common/ModuleSectionNav.tsx`. Hành trình giữa sáu phân hệ đã có trên Seed (`LearningCircuit`), vì vậy dropdown là điều hướng trùng lặp. Vẫn giữ `Mục khác` để các trang đã triển khai không bị mất.
2. Viết lại `src/styles/48-cla-unified-navigation.css`: tabs bớt lớp nền; nhãn có phân cấp rõ; tab hiện tại dùng nền nhẹ + vạch dưới; 44px target; desktop cuộn tab nếu thiếu diện tích; mobile <=640px hiển thị đủ 4 tab thành lưới 2 cột.
3. Tạo `src/styles/49-cla-product-polish.css`: hệ action button sử dụng chung, trạng thái lỗi có cặp màu chữ–nền, khắc phục lỗi nút UA mặc định. Áp dụng trực tiếp ở Seed Profile, bảng điểm và bộ lọc danh mục.
4. Viết lại `src/page/main/AboutPage.tsx`: nội dung dành cho học sinh, sáu phân hệ, chu kỳ học, giới hạn gợi ý và tính minh bạch dữ liệu. Không dùng khẳng định dự đoán đã kiểm định.
5. Viết lại `src/page/main/ContactPage.tsx`: chọn chủ đề thật; gửi yêu cầu qua email client bằng `mailto:` từ `src/lib/supportMailto.ts`. Không có backend thu thập dữ liệu hoặc trạng thái gửi thành công giả. Giữ địa chỉ email đã tồn tại trong mã nguồn CP73.
6. Cập nhật QA điều hướng trong `tools/cp68_student_ux_e2e.py`: test theo link **hiển thị thực** trong LearningCircuit trên Seed, không dựa vào nút `Phân hệ` đã xóa. Chưa chạy browser E2E thật.

## Kiểm tra nhanh

```bash
npm run test:cp74:product-polish
npm run test:cp71:unified-nav
npm run test:cp73:mvp
npm run test:rules:static
python tools/cp74_visual_smoke.py
npm run check:layout
```

Bộ `cp74_visual_smoke.py` render mẫu HTML độc lập với **CSS đang được import từ mã nguồn**, để kiểm tra responsive, menu, tương phản. Các ảnh trong `reports/cp74/css-qa-*.png` **không phải** screenshot website React đang chạy.

## Hạn chế nghiệm thu

- Full `npm test` có **1.326 dòng `ok`, 0 `not ok` trước khi bị giới hạn thời gian**, không có exit code hoàn chỉnh; CP73 và CP74 đã PASS khi chạy riêng.
- `npm run build` **BLOCKED** do môi trường thiếu React/types và các package; không đủ căn cứ khẳng định production build PASS.
- Firebase Emulator, login/storage E2E, ảnh website React thực tế: **chưa chạy**.
- Liên hệ dùng ứng dụng email ngoài. Chưa có hệ thống ticket/email server; không tự nhận đã gửi thư.

## Trình bày báo cáo nghiên cứu

Có thể mô tả việc **thiết kế và triển khai** hệ điều hướng nhất quán, khả năng tiếp cận, trạng thái lỗi và thông tin giới thiệu; các hình QA độc lập chỉ minh họa thiết kế. Để minh chứng website vận hành phải chụp screenshot trên build React thật sau khi vượt các gate chặn.
