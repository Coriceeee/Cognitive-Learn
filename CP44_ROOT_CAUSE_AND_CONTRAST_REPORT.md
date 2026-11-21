# CLA CP44 — Root Cause & Contrast Contract

**Nguồn gốc:** `CLA_CP43_DAYLIGHT_SOURCE_20261120.zip` do người dùng cung cấp. CP44 chỉ thay đổi lớp trình bày, chế độ sáng và phép thử; không sửa công thức SCI/MAS/CSL, suy luận tâm lý, Firebase, dữ liệu tuyển sinh hay quyền truy cập.

## 1. Tại sao CP43 sáng nhưng khó đọc?

**Không phải do “màu xanh chưa đẹp”, mà do hệ thống không định nghĩa màu chữ *theo bề mặt*.** Bộ CSS hiện hữu chuyển dần từ dark hero sang light workspace, nhưng phần chữ vẫn có nhiều màu cũ. Vì vậy cùng một `#fff` có thể mang text xanh nhạt, xám nhạt, trắng, hoặc tối dựa vào lớp CSS tải sau.

Bằng chứng trực tiếp từ source:

- `src/styles.css` nạp đồng thời `21-cla-design-system.css`, `33-cla-analytical-workspace.css`, `34-student-observatory.css`, `35-cla-spectral-observatory.css`, `37-cla-orbital-theme.css`, rồi `38-cla-daylight-studio.css`. Các file này cùng quyết định màu, nền, header, card và canvas.
- `21-cla-design-system.css` gán `--cla-hero` cho `.profile-head`, `.nexus-hero`, `.student-intelligence-hero`, `.student-panel.dark`, trong khi `38-cla-daylight-studio.css` thay `--cla-hero` thành gradient rất sáng. Nhưng tại CSS gốc, `.profile-head h1`, `.nexus-hero h1`, `.student-intelligence-hero h2` vẫn **white/near-white**. Tính kế thừa không cứu được vì selector của con ghi đè `color` cụ thể.
- Chú thích 10–12 px tại CP43 được tô `#8092a7` (≈3,19:1 trên trắng), `#77889c` (≈3,63:1), `#63819a` (≈4,09:1). Đây là các trường hợp thấp hơn yêu cầu WCAG 2.2 AA 4,5:1 cho văn bản thông thường.
- Chữ màu sắc được in trong `StudentDecisionCanvas.tsx`, ví dụ SCI `#138f86` (≈3,96:1) và CSL `#bd7738` (≈3,58:1) so với trắng. Không thể sửa bằng một biến CSS cho tất cả khi JSX còn hardcode màu trực tiếp.
- `index.html`, `src/lib/theme.ts`, và `38-cla-daylight-studio.css` vẫn để dark mode tùy chọn. CSS dark chỉ đổi vài bề mặt; nhiều panel lại ép nền trắng, gây trạng thái nửa sáng nửa tối.

Các tỷ lệ được tính bằng luminance tương đối sRGB. Tỷ lệ đạt 4,5:1 không đồng nghĩa mọi người dùng đều đọc tốt như nhau hoặc mọi trang đã qua kiểm định accessibility.

## 2. First principles: một thiết kế hiển thị thực sự được định nghĩa bởi gì?

- **Một chữ chỉ tồn tại trong mối quan hệ với bề mặt phía sau.** Yêu cầu đầu tiên là đọc được, yêu cầu tiếp là thể hiện thứ bậc, và cuối cùng mới là cá tính thị giác. Đổi một palette mà không có cặp nền–chữ là tối ưu sai biến.
- **Đồ thị là bằng chứng, không phải vật trang trí.** Màu đường/mốc có thể độc đáo, nhưng nhãn dữ liệu phải tự đứng vững khi đường đồ thị bị ẩn, khi in trắng đen, hoặc khi không có dữ liệu.
- **Đồng bộ không có nghĩa toàn hệ chỉ có một màu.** 7 module có thể dùng accent định danh nhưng phải cùng typography, tương phản, container, độ sâu, mật độ thông tin và mô hình điều hướng.
- **Bất kỳ giao diện đa theme nào cũng là tổ hợp trạng thái.** `component × light/dark × selected/hover/disabled × desktop/mobile × complete/missing data` phải kiểm tra. Một dark theme chưa kiểm thử toàn phần không phải một tính năng hoàn thành.
- **Không nên đánh đồng kiểm thử mã với trải nghiệm.** Test regex cho mã nguồn chỉ bắt phần tử bị thay, không chứng minh mắt người đọc thấy hợp lý. Cần browser computed-style audit, screenshot và người dùng thật.

## 3. Điều đã sửa trong CP44

1. Bỏ nạp và loại khỏi source hai stylesheet 34/35 mang bản sắc Observatory đã bị từ chối. Chuyển các quy tắc hình học tối thiểu của canvas vào `38-cla-daylight-studio.css`. Giữ hệ biểu đồ và trạng thái dữ liệu thiếu.
2. Tạo **semantic role tokens** cho ba loại bề mặt (`page`, `canvas`, `subtle`) và bảy vai trò chữ: primary, secondary, muted, link, teal, violet, amber. Kiểm thử tự động **21 phép kết hợp**; tất cả `≥4,5:1` theo WCAG 2.2 AA.
3. Sửa các họ hero vốn có nền sáng nhưng chữ trắng: profile, nexus, student intelligence, student panel, login showcase, Seed hero, About/Contact, Module detail, và Cognitive Growth. Sửa nhãn vai trò trong user menu và các chú thích nhỏ trên Seed dashboard.
4. Sửa màu 3 series của biểu đồ trong TSX: `#17685f`, `#5264c9`, `#8f561e`. Đường và nhãn dùng cùng màu có độ tương phản phù hợp trên trắng.
5. Tạm dừng hỗ trợ Dark Mode chưa được kiểm chứng: bootstrap HTML và theme facade luôn áp dụng light, không render ThemeToggle. **Đây là thay đổi chức năng giao diện có chủ đích**, không xóa dữ liệu người dùng.
6. Bổ sung test CP44 cho độ tương phản, nguồn CSS, trạng thái thiếu dữ liệu, dark mode và sửa những kỳ vọng CP43 không còn đúng.

## 4. Phản biện đề xuất ban đầu (chuyên gia phản biện độc lập)

1. **Chỉ thay màu chữ đậm hơn là chưa đủ.** `#526a81` giúp một số chữ pass, nhưng không sửa được các card có ảnh/gradient trong thực tế. Giải pháp: dùng bộ kiểm thử DOM và sample pixel/canvas cho hero nền ảnh.
2. **Chỉ kiểm tra AA 4,5:1 vẫn có thể khó đọc.** Chữ 10 px, tracking lớn và dòng dài có thể gây mỏi mắt dù contrast pass. Giải pháp: thêm tiêu chuẩn font-size, line-height, số ký tự mỗi dòng, thử nghiệm thị giác trên mobile và màn hình ngoài trời.
3. **Bỏ hai CSS cũ chưa làm toàn hệ thống sạch xung đột.** Các lớp `21`, `33`, `37` vẫn sở hữu nhiều phần phong cách. Giải pháp: refactor kế tiếp thành design tokens + component-owned styles + cascade layers (`@layer`); tránh tiếp tục tạo file `39`, `40` như lớp ghi đè.
4. **Đóng dark mode là hạn chế khả năng cá nhân hóa.** Mặc dù phù hợp mong muốn light hiện tại, đây không phải tối ưu lâu dài. Giải pháp: sau khi light đạt tiêu chí, xây dark-mode từ các cặp semantic surface/text và chạy toàn bộ ma trận test, rồi mới mở lại.
5. **Browser fixture không phải ứng dụng sản xuất.** Test hiện tại không đăng nhập Firestore, không có tất cả 7 module, không thử dữ liệu thực và không thực hiện Lighthouse. Giải pháp: kiểm tra từng route ở `complete/empty/loading/error`, đo sự tương phản từ computed styles, test screen sizes và UI regression trước khi merge.
6. **Điểm AI/ML có thể gây hiểu nhầm dù UI đẹp.** Chỉ số học tập được trình bày bằng dial có thể bị diễn giải như một công cụ đo chuẩn hóa. Giải pháp: giữ cảnh báo chỉ báo thử nghiệm, có nhãn dữ liệu đo được, nguồn và trạng thái chưa đủ dữ liệu; không hiển thị phần trăm dự đoán thiếu hiệu chuẩn.
7. **Cấm mọi màu nhạt sẽ làm mất hệ phân cấp.** Tất cả chữ một màu đen gây nặng và giảm khả năng quét thông tin. Giải pháp: dùng role chính/phụ/chú thích có độ tương phản tối thiểu nhưng khác rõ trọng lượng và khoảng cách, không dựa độc nhất vào độ nhạt.

## 5. Chiến lược cải tiến bền vững (sau CP44)

- **P0 — Contrast CI:** chạy test token + audit computed styles trên những trang có thể dựng độc lập, tự động báo lỗi nếu chữ thường <4,5:1, nhãn điều khiển/non-text trọng yếu <3:1, có ngoại lệ được kiểm duyệt.
- **P1 — Component ownership:** chuyển từng nhóm CSS `21/33/37` về một nguồn style cho component; token thay cho hardcode màu; giới hạn override `!important` và selector theo trang.
- **P2 — Visual regression:** snapshot desktop 1440, laptop 1024, mobile 390 cho Seed/Lumen/Atlas/Orion/Pulse/Haven/Nexus ở các trạng thái rỗng, đầy đủ, loading, lỗi. Khóa tiêu chí không tràn ngang và độ tương phản; so sánh screenshot trong pull request.
- **P3 — Perceived performance:** đo thời gian điều hướng theo route, long task và interaction latency, tránh dùng animation che thời gian đợi. CP44 **không thay đổi logic SPA của CP43**; nếu còn lag phải đo và tối ưu độc lập.
- **P4 — Scientific UX review:** kiểm tra nhãn SCI/MAS/CSL, chất lượng dữ liệu, giải thích nguồn và thông báo bất định với học sinh thực. Không xác nhận hiệu quả giáo dục khi chưa có dữ liệu kiểm chứng.

## 6. Kiểm thử và giới hạn

- 21/21 cặp token role×surface: pass AA 4,5:1 (kiểm thử toán học).
- 21 nhãn/vùng tiêu biểu trong fixture HTML: computed colors được đọc bằng Chromium; điều kiện background gradient được xấp xỉ bằng lớp nền gần nhất, **không** là bằng chứng đánh giá toàn bộ visual trên site.
- 56/56 regression tests chọn lọc: PASS. TypeScript transpile cho ba file được sửa: 0 diagnostic trong phép kiểm cú pháp.
- **Chưa full-build**: bản ZIP không bao gồm `node_modules`, môi trường hiện tại không có đầy đủ React/Firebase dependencies. `tsc --noEmit` toàn dự án vì vậy thiếu module/type declarations, không thể coi là chứng nhận production.
- **Chưa có kiểm thử e2e trên tài khoản người dùng**. GitHub connector chỉ có Read nên chưa push branch/PR; bàn giao qua source ZIP và patch.

### Tài liệu chuẩn

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- SC 1.4.3 contrast: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- SC 1.4.11 non-text contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- DTCG semantic color token format: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
