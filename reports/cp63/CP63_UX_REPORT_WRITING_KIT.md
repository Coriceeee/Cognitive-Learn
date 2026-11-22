# CP63 — Tài liệu mô tả UX phục vụ báo cáo NCKH

**Ngày:** 21/11/2026  
**Phạm vi:** thiết kế tương tác và kiến trúc điều hướng, không thay đổi lõi suy luận, tập dữ liệu tuyển sinh, mô hình ML, quyền dữ liệu hoặc kết quả kiểm định.

## Mô tả có thể dùng trong báo cáo

> Cognitive Learn AI tổ chức trải nghiệm học sinh thành sáu không gian chức năng: Seed (hồ sơ), Lumen (phân tích học tập), Atlas (tuyển sinh/du học), Orion (chiến lược), Pulse (theo dõi tiến độ) và Haven (học bổng/tài chính). Trong phiên bản giao diện CP63, thanh điều hướng chung sử dụng nguyên tắc hiển thị có chọn lọc: bên cạnh Tổng quan, chỉ tối đa ba mục chức năng nổi bật hiển thị trực tiếp. Mục đang mở luôn được giữ ở vùng truy cập nhanh; các chức năng còn lại có thể mở qua phần “Khám phá thêm”. Điều hướng tiếp theo/trước đó và bộ chuyển sáu phân hệ giúp người dùng nhận biết mình đang ở đâu và di chuyển giữa các tác vụ. Trên thiết bị nhỏ, các tab bố trí thành hai cột để tránh cắt mất trạng thái đang chọn. Đây là các tính năng UX đã được triển khai trong mã nguồn và kiểm tra bằng bộ test kỹ thuật; chưa có nghiên cứu người dùng định lượng để kết luận chúng cải thiện hiệu quả học tập.

## Bằng chứng và giới hạn

- **18/18** kiểm thử logic và hợp đồng điều hướng CP63 (sáu phân hệ, deep link Atlas, loại bỏ mục planned, tính đúng của mục active, truy cập bằng bàn phím/CSS, liên thông SPA).
- **Ba ảnh** bên dưới được tạo từ HTML/CSS độc lập, dữ liệu điều hướng lấy từ `studentSubmoduleDirectory` và `planGuidedNavigation`, dựng với Chromium. **KHÔNG ghi chú là ảnh chụp website React/Firebase thực tế.**
- Tương phản dùng bảng màu CSS riêng cho sáng/tối; chưa thay thế kiểm thử trên toàn bộ các trang.
- Không có dữ liệu học sinh, số đo khoa học, xác suất tuyển sinh hay số liệu hiệu quả UX trong ảnh.

## Ảnh minh họa giao diện (QA riêng lẻ)

| Tệp | Chú thích gợi ý trong báo cáo | Điều kiện |
|---|---|---|
| `preview-atlas-light-more.png` | “Bố cục điều hướng phân hệ Atlas, nhóm chức năng phụ được mở trong chế độ sáng (bản kiểm tra CSS độc lập)” | Desktop 1280 px |
| `preview-lumen-dark-journey.png` | “Bộ chuyển sáu phân hệ trong không gian Lumen, chế độ tối (bản kiểm tra CSS độc lập)” | Desktop 1280 px |
| `preview-orion-light-none.png` | “Bố cục hai cột của menu Orion trên thiết bị hẹp, mục đang chọn không bị cắt (bản kiểm tra CSS độc lập)” | Mobile 390 px |

**Chỉ đưa ảnh chụp giao diện thật vào phần KẾT QUẢ TRIỂN KHAI website** sau khi dự án chạy được trên trình duyệt. Các ảnh trên có thể dùng trong phần *quy trình thiết kế và kiểm thử bố cục* với chú thích đúng loại bằng chứng.

## Bộ ảnh thực tế cần chụp sau khi khôi phục build

1. Seed: Dashboard hiển thị lịch thi trên trang chính, biểu đồ và dải hành động.
2. Lumen: trang chỉ số + thông báo trạng thái thiếu dữ liệu, không giả số đo.
3. Atlas: nguồn tuyển sinh có năm/phương thức và màn hình du học.
4. Orion: bộ ba kịch bản, giả định và điều hướng lộ trình.
5. Pulse: nhật ký và báo cáo sau khi có dữ liệu xác minh.
6. Haven: học bổng, chi phí và khoảng cách điều kiện từ nguồn chính thức.
7. Tương tác mobile: chuyển phân hệ, tab phụ, bàn phím/focus, trước/tiếp theo.

## Việc UX vẫn còn mở — không được ghi đã hoàn tất

- Kiểm thử E2E bằng browser trên React build thực với tài khoản thử nghiệm hợp lệ và Firebase Emulator.
- Rà soát tương phản/mật độ thông tin các màn hình đặc thù, không chỉ thanh điều hướng.
- Nghiệm thu UX với học sinh: thời gian tìm tác vụ, tỉ lệ hoàn thành, SUS/SEQ hoặc chỉ số định lượng có thiết kế nghiên cứu.
- Ổn định UI khi mạng chậm, dữ liệu Seed chưa có, lỗi/hết phiên đăng nhập và nhiều kích thước màn hình.
- Đánh giá nội dung chi tiết tuyển sinh, học bổng và độ bao phủ nguồn (thuộc lớp dữ liệu/lõi, không được dùng mẫu giao diện để tuyên bố đã hoàn tất).

## Cách tái tạo ảnh kiểm thử

```bash
node --experimental-strip-types tools/cp63_guided_preview.mjs
python tools/cp63_ux_visual_qa.py
```

Cần cài Python Playwright và Chromium tương thích. `npm run test:cp63:guided-workspaces` không phụ thuộc Playwright.
