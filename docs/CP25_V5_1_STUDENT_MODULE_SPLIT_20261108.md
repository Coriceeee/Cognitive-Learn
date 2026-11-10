# CP25 V5.1 — Phân rã chức năng trong vai trò học sinh

Ngày 08/11/2026. Nguồn: 6 ảnh giao diện Cognitive Path cá nhân người dùng cung cấp và quyết định về ownership Atlas/Haven.

## Quyết định giao diện
- Học sinh chỉ nhìn thấy 6 module lớn: Seed, Lumen, Atlas, Orion, Pulse, Haven.
- Tổng 28 chức năng nhỏ trong 6 nhóm; mỗi nhóm hiện 3 mục ưu tiên rồi nút “Xem thêm”. Không hiển thị tất cả đồng thời.
- Nexus Core vẫn là module lớn thứ 7 nhưng chỉ thuộc khu vực Admin.
- Thẻ bên trái dùng nhãn tiếng Việt; tiêu đề chi tiết dùng tên engine chính thức để giữ liên hệ nghiên cứu.
- Các module nhỏ có liên kết đến UI hiện có (trang hoặc vùng `#anchor`); chức năng chưa có route/engine thật có nhãn “Đang phát triển”. Có route không có nghĩa nghiệp vụ đã hoàn thiện.

## Ranh giới chức năng
- Atlas: tuyển sinh Việt Nam, du học toàn cầu, liên kết quốc tế tuyển sinh trong nước, gợi ý ngành trường, nguồn/đề án.
- Haven: học bổng, điều kiện học bổng, học phí/chi phí và hỗ trợ tài chính; không sở hữu trang tra cứu du học.
- Floating chat: trợ giúp sử dụng và dẫn sang phân hệ; không trả lời điểm chuẩn và điều kiện tuyển sinh thay Atlas.

## Những thay đổi so với V5
- `/student/modules` dùng tiêu đề “Cognitive Path cá nhân”, đếm 6 module và 28 chức năng.
- Điều hướng ở các trang chức năng và trang Du học ghi “Các module của học sinh”, tránh nói 7 module trong khu vực học sinh.
- Khối chi tiết hiển thị tên module chính thức (Seed Profile, Lumen Intelligence, ...), các chức năng con là các dòng hành động riêng.
- Bổ sung kiểm tra hợp đồng UI học sinh vào `tests/module-hierarchy.test.cjs`.

## Đã chạy trong môi trường này
- `npm test` — PASS (logic academic/cognitive/evidence/admissions/chat, cùng contract phân cấp).
- `npm run test:rules:static` — 15/15 PASS, **chỉ phân tích tĩnh**.
- `npm run check:layout` — PASS.
- `npm run build` — **BLOCKED** do môi trường chưa cài `react`, `firebase`, `@types/react` và phụ thuộc tương ứng; không được coi là lỗi cú pháp đã chứng minh hay build xanh.

## Phải kiểm tra tiếp trên máy dự án
1. `npm ci && npm run build && npm test` trên máy có mạng.
2. `npm run test:rules:emulator` cùng bản Rules sẽ deploy.
3. Browser E2E desktop/mobile: `/student/modules` → 6 module → 28 mục, nút Xem thêm/Thu gọn, link có tồn tại, ấn quay lại.
4. Kiểm tra `#anchor` dẫn đến đúng vùng, kể cả lúc trang đang loading; những mục planned phải disabled.
5. Mức đầy đủ dữ liệu tuyển sinh/học bổng/ML/closed-loop cần nghiệm thu nghiệp vụ riêng, không đạt chỉ nhờ menu.
