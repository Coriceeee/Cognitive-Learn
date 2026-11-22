# CP75 — Kiểm toán UX toàn bộ Cognitive Learn AI (nguồn CP74)

**Ngày:** 22/11/2026  
**Phạm vi:** Toàn bộ thư mục `src` của CP74: 98 TSX, 20 tệp `*Page.tsx` cấp trang, 47 route có nhãn; 50 CSS/17.226 dòng; 123 `button`, 207 liên kết `a`, 111 `input`, 36 `select`, 27 ảnh JSX.  
**Phương pháp:** Mở và kiểm kê toàn bộ TSX/CSS; đọc luồng định tuyến và biểu mẫu của từng nhóm; rà các selector màu; chạy 6 test UX CP75, test hồi quy, Chromium *fixture* CSS và mô phỏng offline. **Không gọi đây là kiểm toán thị giác/khả năng truy cập toàn bộ ứng dụng React.**

## Kết luận nhanh

- **Chưa thể khóa UX cuối cùng/MVP:** 47 route vẫn chưa có bằng chứng duyệt từng màn hình trong React thật; Firebase Emulator và build bị chặn vì thiếu dependency trong môi trường.
- **Gốc rễ thiết kế:** nhiều lớp CSS lịch sử chồng nhau. Có 50 tệp CSS, khoảng 414 lần `!important` và rất nhiều khai báo chữ 9–12px. Cần củng cố design tokens và loại bỏ selector quá bao quát thay vì tiếp tục thêm override cuối file.
- **Điểm tích cực đã xác minh từ mã nguồn:** sáu phân hệ dùng chung `ModuleSectionNav`; các đường dẫn SPA có guard bản nháp; 123/123 `button` đều khai báo `type`; 207/207 liên kết JSX `a` có `href`; 27/27 ảnh JSX `img` có `alt` (không kết luận về ảnh nền/CSS hoặc tên truy cập hữu dụng).
- **UX sáng/tối:** mã nguồn cố tình khóa **chế độ sáng** ở `src/lib/theme.ts` và `index.html`. Các ảnh dark-mode fixture chỉ chứng minh CSS mẫu, không xác nhận dark mode chạy trong website thật.

## Những lỗi đã xác định và sửa trong CP75

| ID | Mức | Vấn đề trước CP75 | Hành động đã thực hiện | Bằng chứng |
|---|---|---|---|---|
| UX-01 | P1 | `src/styles/49-cla-product-polish.css`: selector `.app-root main button:not([class])` ở cuối cascade dễ ghi đè CSS nút trong chatbot, bảng nguồn và trạng thái truy cập | Hạ độ ưu tiên bằng `:where(...)` nhưng giữ fallback cho nút chưa có class | Chromium fixture so sánh CP74/CP75 (`css-control-probe.json`); test CP75 |
| UX-02 | P1 | Trong `StudentProfilePage.tsx`, ô bảng điểm lặp lại không có tên truy cập theo môn, lớp, học kỳ và loại điểm | Bổ sung `aria-label` cho điểm thường xuyên, giữa kỳ, cuối kỳ | test CP75; rà cú pháp TSX |
| UX-03 | P2 | `FloatingAdvisorChat.tsx` mở bằng đoạn dài liệt kê sẵn hàng loạt điểm chuẩn, che tác vụ học sinh trên màn hình nhỏ | Thay bằng giới thiệu ngắn, nêu phạm vi và hạn chế | test CP75; mã nguồn |
| UX-04 | P1 | `App.tsx` hiển thị trang Đăng nhập khi người dùng mở đường dẫn không hợp lệ, gây nhầm lẫn về quyền | Thêm trang “Không tìm thấy trang” và liên kết trở về đúng nhiệm vụ; sửa tiêu đề tab cho route không tồn tại | test CP75; mã nguồn |
| UX-05 | P2 | Nút mở menu tài khoản thiếu `aria-expanded`, thiếu cách đóng bằng Escape/nhấn ngoài | Bổ sung trạng thái mở rộng và thao tác đóng | test CP75; chưa có E2E bàn phím thật |

## Những hạng mục UX còn tồn tại (không ghi là đã sửa)

| ID | Mức | Vị trí / nguyên nhân | Việc cần làm để đóng |
|---|---|---|---|
| UX-06 | P0 | Build React thật bị chặn; không thể xác nhận tương tác cuối cùng, lỗi hiển thị JS, điều hướng hay lưu dữ liệu trên website | Cài dependency bằng lockfile, chạy build + Firebase QA + browser E2E |
| UX-07 | P1 | Hệ CSS có ~414 `!important` và nhiều lớp từ `00-` tới `49-`, dễ gây trùng màu chữ–nền, viền, spacing giữa các module | Rà cascade theo component, hợp nhất token; scan computed contrast trên **toàn bộ React** ở viewport 320/360/390/768/1280 |
| UX-08 | P1 | Nhiều khai báo cỡ chữ `9px`–`12px` ở CSS (không phải tất cả đều hiển thị như vậy vì cascade) | Xác nhận computed font-size tại bảng dữ liệu, nhãn biểu đồ, tooltip, menu và tăng tối thiểu theo ngữ cảnh; test zoom 200% |
| UX-09 | P1 | `ThemeToggle.tsx` còn mã nhưng không được render; theme forced light. Chưa có dark mode toàn website đã nghiệm thu | Giữ light-only cho MVP, hoặc kiểm toán màu toàn site trước khi bật lựa chọn tối |
| UX-10 | P1 | Các trang Atlas/Lumen/Orion/Pulse/Haven có các biểu đồ, bảng và trạng thái dữ liệu phức tạp; chỉ mới có fixture độc lập | Xác minh loading/empty/error/verified, tương phản biểu đồ, text alternatives, nút và bộ lọc từng trang trong React thực tế |
| UX-11 | P1 | Nhiều nội dung dài và nhiều bộ lọc ở Atlas; nguy cơ quá tải nhận thức khi tra cứu thông tin trường và nguồn | Thử nghiệm tác vụ tìm ngành → so sánh → xem nguồn, theo dõi số click, phân lớp thông tin |
| UX-12 | P2 | Liên hệ dùng `mailto:` chứ không có backend tiếp nhận (đã được giải thích rõ trong UI) | Kiểm tra trên thiết bị không có mail app; bổ sung sao chép email nếu cần |
| UX-13 | P1 | Bộ 12 ca QA CP68/CP73 mới là nền; chưa bao phủ toàn bộ 47 route và các trạng thái dữ liệu | Dùng `CP75_ROUTE_QA_MATRIX.csv` để chạy toàn bộ 47 route; ít nhất 2 viewport/route + keyboard + save/reload ở màn quan trọng |
| UX-14 | P1 | Đăng nhập/đăng xuất còn dùng `window.location.href` ở `LoginPage.tsx`, gây full reload ở các ranh giới xác thực | Đo thời gian điều hướng thực tế; chuyển `navigateTo` nếu không tạo race với Auth/AccessGate |

## Rà soát theo phân hệ / tuyến sử dụng

| Nhóm | Thành phần đã thấy trong mã nguồn | Tình trạng UX còn cần nghiệm thu |
|---|---|---|
| Seed | Tổng quan, lịch thi, hồ sơ, bảng điểm, trạng thái đồng bộ, Daily Companion | Bảng điểm nhiều ô; kiểm tra bàn phím, zoom, responsive; lưu → tải lại |
| Lumen | Chỉ báo, trạng thái, lịch sử, diễn giải, hướng dẫn fallback | Độ rõ của căn cứ, thang đo, dữ liệu thiếu; chart labels ở mobile |
| Atlas | Tuyển sinh, điểm chuẩn, gợi ý, nguồn, so sánh, du học | Quá nhiều tiêu chí; cách phát hiện nguồn chính thức và trường không có dữ liệu |
| Orion | Biểu mẫu mục tiêu, thử kịch bản, lộ trình, bảo vệ bản nháp | Kiểm tra trạng thái tự lưu và cảnh báo khi chuyển tab, bằng trình duyệt thật |
| Pulse | Theo dõi, check-in, báo cáo, chu kỳ, phản hồi | Dữ liệu cập nhật theo UID; trục/nhãn biểu đồ và thông báo đã lưu |
| Haven | Tìm học bổng, điều kiện, tài chính, kế hoạch | Thông tin nguồn, chứng chỉ thiếu, dữ liệu giả định và lỗi đồng bộ |
| Công khai/Auth | Đăng nhập, Giới thiệu, Liên hệ, thông báo và menu tài khoản | 404 đã sửa; kiểm thử email app, menu keyboard, status role |
| Nexus Admin | Bảng điều hành, chẩn đoán, audit | Có giao diện riêng vì nhiệm vụ quản trị; cần thử phân quyền/scroll/computed contrast |

## Tiêu chí đóng UX trước khi chụp ảnh báo cáo

1. **Build Vite và Firebase Emulator thực** hoạt động trong QA demo; không dùng tài khoản hoặc học bạ thật.
2. **47/47 route** được mở trên desktop 1280 và mobile 390, không crash/tràn ngang/hỏng tab; các bảng dài phải cuộn được có chỉ dẫn.
3. **Contrast/computed style:** kiểm tra chữ chính ≥ 4,5:1; thành phần UI/đồ họa quan trọng ≥ 3:1 (khi áp dụng); trạng thái focus nhìn thấy.
4. **Bàn phím:** Tab/Shift+Tab/Enter/Escape, Back/Forward, focus sau chuyển trang, dropdown/FAQ và popup không kẹt.
5. **Task smoke:** đăng nhập → Seed → Lumen → Atlas → Orion → Pulse → Haven; nhập/lưu/tải lại; đối chiếu UID; khi thiếu dữ liệu không hiện điểm giả.
6. **Chụp ảnh React thật** cho báo cáo NCKH; các ảnh fixture chỉ dùng kiểm tra CSS.

## Bằng chứng đi kèm

- `CP75_ROUTE_QA_MATRIX.csv`: danh sách 47 route, tất cả browser-test chưa thực hiện được ghi **CHƯA CHẠY** thay vì PASS.
- `css-control-probe.json` và `css-control-smoke.png`: so sánh computed CSS trước/sau với DOM thử nghiệm đúng cấu trúc, **không phải ứng dụng React**.
- `tests/cp75-ux-audit.test.cjs`: kiểm tra trực tiếp năm nhóm lỗi đã sửa và cú pháp tệp thay đổi.
- `CP74_CSS_SMOKE_RESULTS.json` (ở `reports/cp74`) kiểm tra 8 fixture sáng/tối đã có từ CP74; **không** thay thế full-app QA.

**Đánh giá:** CP75 sửa được một số lỗi hệ thống thật, nhưng _chưa đạt điều kiện nghiệm thu UX toàn diện hoặc MVP_. Đừng ghi “UX hoàn thành 100%” trong báo cáo nghiên cứu khi E2E chưa chạy.

## Kết quả chạy CP75 (chốt bàn giao)

| Kiểm tra | Trạng thái | Giới hạn |
|---|---|---|
| UX CP75 mới | **6/6 PASS** | Kiểm tra mã nguồn + cú pháp TS/TSX, không E2E |
| Hồi quy UX CP62–CP75 | **14/14 nhóm PASS** | Chạy các script riêng; không gọi đây là `npm test` toàn bộ |
| Firestore Rules tĩnh | **15/15 PASS** | Không thay thế Emulator |
| Layout contract | **PASS** | 22 tệp bắt buộc, 19 tệp cũ bị cấm không có |
| Demo synthetic | **11/11 PASS** | Không phải thực nghiệm trên học sinh |
| Đóng gói an toàn | **3/3 PASS** | Không xuất secret, có template |
| Browser CSS button probe | **Đã chạy CP74/CP75** | `set_content()` với CSS đầy đủ và DOM mô phỏng, không phải React thật |
| `npm run build` | **BLOCKED** | Thiếu module `react` / `react/jsx-runtime` và dependencies; log ở `logs/build.log` |
| Firebase Emulator + E2E React 47 route | **NOT RUN** | Chưa có môi trường / cấu hình QA có đủ dependency |
| Full `npm test` | **NOT RUN trong lượt CP75** | Chỉ xác nhận 14 nhóm UX, Rules, demo, layout, package |

**Lưu ý:** 74/123 nút không dùng `className` trực tiếp; nhiều nút được định dạng qua bộ chọn cha. Đây là dấu hiệu cần quản lý phạm vi CSS, **không phải 74 nút bị lỗi**. Số `!important` và cỡ chữ nhỏ cũng là chỉ báo nợ thiết kế, không tự chứng minh vi phạm WCAG từng nút.
