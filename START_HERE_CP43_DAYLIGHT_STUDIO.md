# CLA — CP43 Daylight Data Studio

**Bản mã nguồn gốc:** `CLA(20261120-160308).zip` (ngày 20/11/2026).

## Những thay đổi đã thực hiện

- **Daylight Data Studio:** một lớp CSS cuối `src/styles/38-cla-daylight-studio.css`, nền trắng/xanh rất nhạt, typography học thuật, khối phân tích sáng và cùng một nhịp thiết kế giữa Seed, Lumen, Atlas, Orion, Pulse và Haven. Mặc định mở ở chế độ sáng; nếu trước đây người dùng đã chọn theme khác, lựa chọn đó vẫn được tôn trọng.
- **Trang chính lấy biểu đồ làm trọng tâm:** giữ biểu đồ ba chỉ số SCI/MAS/CSL, GPA qua ba năm và chuỗi quan sát/EMA; thay chart tối bằng chart sáng dễ đọc. Dữ liệu thiếu vẫn ghi rõ trạng thái, không tự điền điểm, chỉ số hay kết quả nghiên cứu.
- **Ít thẻ hơn:** 6 đường vào module chuyển thành danh sách hai cột gọn dưới không gian phân tích và các việc cần làm, thay cho ma trận card nặng.
- **Tab chuyên biệt:** các trang module tiếp tục render theo route riêng; thanh điều hướng ngang cuộn được trên mobile, hiển thị tab đang mở và mô tả khu vực.
- **Chuyển trang không nạp lại toàn bộ ứng dụng:** `src/lib/clientNavigation.ts` dùng History API cho internal links, giữ native behavior cho link ngoài, download, click tổ hợp phím, anchor cuộn cùng trang và browser back/forward. AccessGate xác minh lại khi đổi phạm vi quyền, không xác minh lại chỉ vì đổi tab cùng phạm vi; vẫn kiểm quyền từng route.
- **Student-only:** loại bỏ ba file role workspace cũ không được dùng trong hệ thống học sinh; Admin vẫn tồn tại trong vai trò quản trị riêng và không được cấp quyền giả mạo học sinh.
- **Khôi phục PWA public files:** bản ZIP gốc không có `public/`; lấy lại service worker, icons, logo, manifest từ chính `dist/` của ZIP gốc để `npm test` và PWA asset paths có nguồn đối chiếu.
- **Dọn vị trí lặp:** các bản Python duplicate `src/*.py` đã có bản gốc tại `research/src/`; một số bản sao evidence trong thư mục sai được bỏ sau khi đối chiếu.

## Chạy trên máy có Node.js và npm

1. Giải nén vào một thư mục **mới**. Không ghi đè repository đang chạy production.
2. Nếu sử dụng Firebase của bạn, thiết lập biến môi trường từ `.env.example` bằng phương thức bảo mật hiện tại. **Không** đưa `.env`, service-account JSON, khóa bí mật vào Git hoặc gói chia sẻ.
3. Cài dependencies trên chính hệ điều hành đang dùng: `npm ci`.
4. Phát triển: `npm run dev`. Kiểm tra build: `npm run build`.
5. Kiểm tra riêng CP43: `node --test tests/cp43-daylight-spa.test.cjs`.
6. Kiểm tra cấu trúc: `npm run check:layout`.

## Kết quả đã xác minh trong môi trường bàn giao

| Gate | Kết quả | Giới hạn |
|---|---|---|
| Frontend TypeScript | PASS | `node node_modules/typescript/bin/tsc -b --pretty false` |
| API TypeScript | PASS | `node node_modules/typescript/bin/tsc -p tsconfig.api.json --pretty false` |
| CP43 contracts | 5/5 PASS | Static/contract; chưa phải browser E2E |
| UX/module hierarchy/role | 8/8 PASS | Node tests |
| CP42 focus/chart/student-only | 24/24 PASS | Node tests |
| Firestore static Rules contract | 15/15 PASS | **Không** thay thế Emulator allow/deny |
| Daily Companion/PWA contract | 20/20 PASS | Node tests, không xác nhận push production |
| Layout source | PASS | 22 required files, 19 legacy misplacements absent |
| CSS parse | PASS | PostCSS parse new style sheet |
| `npm test` tổng | **CHƯA PASS** | Dừng tại CP31-B4-01: checksum nguồn đóng băng của CP31 không khớp mã đã thay đổi, không cập nhật bằng chứng lịch sử |
| Vite bundle | **CHƯA CHẠY ĐƯỢC** | ZIP gốc có native Rolldown bindings dành cho Windows, môi trường kiểm tra là Linux và không truy cập npm registry để cài binding Linux |
| Browser visual QA / Firebase Emulator / Production E2E | **NOT RUN** | Không có chứng cứ để khẳng định đã nghiệm thu |

## Phạm vi khoa học giữ nguyên

- Không sửa engine dự báo, SCI/MAS/CSL scoring, quy tắc tuyển sinh/học bổng, Firestore Rules hay kết quả nghiên cứu.
- Chỉ số nhận thức vẫn là các chỉ báo thử nghiệm; fit score không phải xác suất đỗ; biểu đồ mô phỏng không phải kết quả tác động nhân quả.
- Không suy ra hiệu quả học tập đã được chứng minh chỉ vì UI hoặc E2E kỹ thuật chạy.

## Vấn đề còn cần kiểm chứng trên môi trường máy thật

- Cài mới `npm ci`, build Vite, mở từng route ở desktop và mobile, so sánh thay đổi trang qua click/back/forward.
- Đo thực tế navigation latency và FPS; có thể vẫn còn tác vụ nặng trong module riêng dù đã bỏ hard reload trên links nội bộ.
- Chạy Firebase Emulator với profile demo và test allow/deny; không publish Security Rules nếu chưa PASS.
- Nếu cần green toàn bộ `npm test`, CP31-B4-01 phải được kiểm tra ở đúng source freeze lịch sử; **không sửa SHA CP31 để ép PASS trên CP43**. Thêm một baseline/release manifest CP43 riêng.

**Lưu ý đóng gói:** Bản ZIP nguồn sạch cố ý không kèm `.env`, `.env.local`, `.git`, `node_modules`, `.venv`, `dist`, dataset raw/private hoặc artifacts nhạy cảm. Mã nguồn, cấu hình không bí mật, static PWA assets, tests và tài liệu vận hành được giữ lại. Khi làm việc trên repo có đầy đủ dữ liệu nghiên cứu được cấp phép, giữ nguyên vùng private/data ngoài gói này.
