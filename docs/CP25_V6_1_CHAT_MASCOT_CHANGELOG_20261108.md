# CLA CP25 V6.1 — Floating Chatbot Mascot Button

**Ngày:** 08/11/2026  
**Cơ sở:** `CLA_CP25_V6_STUDENT_ADMIN_ROLE_SEPARATION_20261108.zip`.  
**Phạm vi:** Chỉ thay nút mở chatbot và thêm kiểm thử giao diện. Giữ nguyên phân quyền, nội dung Gemini, logic chat và chức năng Atlas/Haven.

## Đã thay đổi

1. `src/assets/cla-chat-mascot.webp`: hình mascot CLA hướng sang trái từ ảnh do người dùng chọn, crop phù hợp biểu tượng tròn và nén còn khoảng 34 KB.
2. `src/components/common/FloatingAdvisorChat.tsx`: thay nút dạng viên thuốc có chữ thành nút tròn chứa mascot; dùng `aria-label`, `title`, `aria-expanded`; vẫn mở/đóng panel như trước. Khi mở, có dấu × nhỏ trên góc biểu tượng.
3. `src/styles/18-admissions-chat.css`: vòng tròn 92×92px desktop / 74×74px mobile, viền cyan, bóng sáng, hiệu ứng hover, hỗ trợ reduced motion. Giữ vị trí fixed góc dưới bên phải.
4. `tests/chat-launcher-mascot.test.cjs`: thêm 2 bài test hợp đồng về mascot, trạng thái, accessibility, responsive, vị trí và bo tròn.
5. `package.json`: ghép bộ test mới vào `npm test`.

## Kiểm thử thực tế

- `npm test`: **PASS**, bao gồm 2 bài test mascot mới.
- `npm run test:rules:static`: **PASS 15/15**, chỉ kiểm tra tĩnh, **không thay Firebase Emulator**.
- `npm run check:layout`: **PASS**.
- `npm run build`: **KHÔNG PASS trong môi trường này**, thiếu `node_modules` (React, React types, Firebase, v.v.). Không coi đây là kiểm thử build production đạt.
- Chưa test trên trang web đang deploy / thiết bị thật.

## Kiểm thử khi cài trên máy dự án

```bash
npm ci
npm test
npm run build
npm run dev
```

Mở một trang đã đăng nhập, nhìn góc phải dưới: biểu tượng CLA tròn. Nhấn để mở panel, nhấn lại hoặc × để đóng; thử trên mobile. Nếu đã cài dependencies và muốn nghiệm thu phân quyền, chạy Firebase Emulator theo tài liệu của dự án trước khi deploy.

**Lưu ý:** Chưa triển khai website production. Bản cập nhật chỉ thay code trong ZIP mới và không ghi đè lên kho GitHub/hosting.
