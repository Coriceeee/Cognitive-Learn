# CP71 — Một thanh điều hướng thống nhất trên sáu phân hệ

## Bạn nhận được gì

- Giữ toàn bộ nội dung và các chức năng sẵn có từ CP70.
- Dùng một kiểu thanh điều hướng xuyên suốt Seed, Lumen, Atlas, Orion, Pulse và Haven; bỏ khung giới thiệu điều hướng chồng tầng và thanh tab Atlas du học bị lặp.
- Mục đang chọn nổi bật, các mục còn lại nằm trong **Mục khác**. Chuyển module bằng menu **Phân hệ**.
- Sửa màu chữ bị chìm trên bản đồ chức năng khi nền chuyển sáng và chuẩn hoá màu tab sáng/tối.
- Bổ sung ảnh QA độc lập và test CP71.

## Chạy local (khi có môi trường cài dependencies)

```bash
npm ci
npm run check:dependencies
npm run dev
npm run build
npm run test:cp71:unified-nav
npm run qa:cp71:visual
```

Chỉ dùng Firebase QA và tài khoản tổng hợp khi làm browser E2E; không dùng dữ liệu học sinh thật.

## Chứng cứ đã kiểm tra

Xem `reports/cp71/CP71_ACCEPTANCE_REPORT.md` và `reports/cp71/visual-qa.log`. Preview HTML/PNG chỉ phục vụ kiểm tra CSS, **không phải ảnh chụp React đang chạy**.
