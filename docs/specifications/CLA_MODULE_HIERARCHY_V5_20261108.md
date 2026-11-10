# CLA — PHÂN CẤP 7 MODULE CHÍNH → 32 PHÂN HỆ NHỎ (V5)

**Ngày:** 08/11/2026. **Nguồn:** Quyết định mới nhất của chủ dự án trong Project NCKH. Kế thừa đầy đủ V4 và 5 tài liệu đặc tả, không thêm module chính mới.  **Trạng thái:** phân cấp giao diện & dẫn hướng đã cập nhật trong mã nguồn; chưa phải nghiệm thu tất cả nghiệp vụ.

## 1. Nguyên tắc giao diện
- Chỉ có **7 module chính**. Học sinh nhìn thấy 6 module; Nexus dành riêng cho Admin.
- Chọn module lớn → hiện **3 phân hệ nhỏ ưu tiên** và **Xem thêm** để mở các phần khác; tránh hiện toàn bộ 32 phân hệ cùng một lúc.
- Các trang nghiệp vụ Atlas, Lumen, Orion, Pulse, Haven có cùng một menu phân hệ nhỏ tại đầu trang, dẫn đến vùng chức năng cụ thể; Seed có các trang Profile / Transcript / Storage riêng; Nexus dùng danh mục nhỏ theo module được chọn.
- **Admin Console** hiện ba phân hệ nghiệp vụ trước; 22 thao tác kiểm thử kỹ thuật được giữ ở `<details>` riêng, không xóa checklist nghiệm thu.
- Mục chưa có UI/engine tương ứng không được đặt nút hoạt động; trạng thái “Đang phát triển” là bắt buộc.
- Danh mục nằm trong `src/data/moduleSubmodules.ts`; các giao diện cùng đọc danh mục này. Không tạo bản đồ tên/đường dẫn trùng nhau ở nhiều màn hình.
- Quyền Teacher/Parent: đưa về trang đúng vai trò; không mở đường dẫn chỉ dành cho Student, không dùng Admin Preview để cấp thêm quyền.

## 2. Danh mục phân hệ nhỏ (32 mục)

| Module lớn | Các module nhỏ (tên hiển thị) | Phạm vi |
|---|---|---|
| **Nexus Core (4)** | Bảng điều khiển; Chẩn đoán hệ thống; Kiểm thử vai trò; Quản lý tài khoản* | Chỉ Admin, kiểm tra quyền và nguồn |
| **Seed Profile (4)** | Tổng quan học sinh; Hồ sơ & mục tiêu; Bảng điểm & GPA; Kho dữ liệu & đồng bộ | Dữ liệu học sinh, 9 môn, khóa 4 môn, null khác 0 |
| **Lumen Intelligence (5)** | Chỉ số SCI/MAS/CSL; Lịch sử & biến động; Phân tích & giải thích; Diễn giải Gemini; Sẵn sàng dữ liệu ML* | Phân tích và diễn giải, không chẩn đoán, không tự nhận validated |
| **Atlas Admission (6)** | Tuyển sinh Việt Nam; Du học toàn cầu; Liên kết quốc tế tại Việt Nam; Gợi ý ngành & trường; Kho tuyển sinh & nguồn; Công cụ đọc đề án | Tuyển sinh, điều kiện/chứng chỉ **đầu vào**, nguyện vọng, nguồn trường |
| **Orion Strategy (4)** | Dữ liệu & mục tiêu; Mô phỏng 3 chiến lược; Lộ trình theo tuần; Check-in & thích ứng* | Rule/predictive scenario có giới hạn, kế hoạch & can thiệp |
| **Pulse Monitor (4)** | Kiểm tra dữ liệu liên thông; Chỉ số & tiến độ; Báo cáo theo vai trò; Việc cần làm tiếp theo | Tình trạng và đo lường / Evidence Record |
| **Haven Support (5)** | Học bổng & điều kiện; Ngân sách & chi phí; Hỗ trợ phụ huynh & giáo viên; Kế hoạch hỗ trợ; Khoảng cách cơ hội* | Học bổng, **chứng chỉ học bổng**, tài chính và hỗ trợ |

`*` Chưa có luồng UI tương ứng đủ để mở, phải hiển thị “Đang phát triển”. Các mục khác phần lớn ở trạng thái `partial`: có UI/đường dẫn nhưng nghiệp vụ, nguồn dữ liệu hoặc nghiệm thu còn thiếu.

## 3. Quyền sở hữu chức năng đã khóa

- **Du học tại tất cả quốc gia/vùng lãnh thổ** → `Atlas > Du học toàn cầu` (canonical `/atlas/study-abroad`). Danh mục ISO 249 quốc gia/vùng lãnh thổ là bộ lọc, **không có nghĩa 249 điểm đến đã có thông tin trường và học bổng xác minh**.
- **Tuyển sinh Việt Nam** → `Atlas > Tuyển sinh Việt Nam`; yêu cầu 2024–2026 toàn bộ trường/ngành vẫn là gap dữ liệu.
- **Liên kết quốc tế tuyển sinh tại Việt Nam** → `Atlas > Liên kết quốc tế tại Việt Nam`.
- **Học bổng trong nước và quốc tế / hỗ trợ chi phí** → `Haven > Học bổng & điều kiện`; học phí, ngân sách, chi phí sinh hoạt → `Haven > Ngân sách & chi phí`.
- **Chatbot nổi** chỉ hướng dẫn và điều hướng đúng phân hệ, không cung cấp điểm chuẩn, điều kiện xét tuyển hay deadline cụ thể.
- **Nexus** là điều phối/kiểm thử, không ôm các engine Atlas/Haven/Orion/Seed.

## 4. Những hạng mục chưa PASS dù có nút điều hướng

1. Nguồn tuyển sinh từng trường/ngành/phương thức toàn Việt Nam cho 2024–2026.
2. Dữ liệu trường, chứng chỉ và điều kiện chính xác cho tất cả quốc gia; hệ thống phải `abstain` khi chưa xác minh.
3. Kho học bổng có nguồn, điều kiện, thời hạn, bộ lọc năng lực và tiêu chuẩn nguồn cập nhật.
4. Đo/check-in/adaptation đầy đủ và evidence nghiên cứu có outcome thật.
5. Teacher/Parent share consent, security Rules Emulator, E2E, CI, build production và deploy thực.
6. Research protocol, ML validation/psychometric/Static-vs-Adaptive và 165 đầu việc phải được chấm độc lập theo bằng chứng.

## 5. Các file đổi tên/tách chức năng

- `src/data/moduleSubmodules.ts` — registry duy nhất, 7 nhóm chính và 32 chức năng nhỏ.
- `src/components/common/ModuleClusterGrid.tsx` — menu module chính đọc registry thay vì nội dung hard-coded theo role; phân quyền Parent/Teacher an toàn.
- `src/components/common/ModuleSectionNav.tsx`, `src/styles/19-module-subnav.css` — menu chức năng nhỏ gọn dùng chung trong trang nghiệp vụ, 3 mục đầu + Xem thêm.
- `src/page/nexus/AdminPage.tsx` — module nhỏ là luồng chính; 22 công cụ kiểm thử cũ chuyển về mục mở rộng riêng.
- `src/page/atlas/AtlasPage.tsx`, `haven/HavenPage.tsx`, `lumen/LumenPage.tsx`, `orion/OrionPage.tsx`, `pulse/PulsePage.tsx` — thêm điều hướng nhỏ và anchor đến vùng chức năng đúng.
- `src/data/moduleClusters.ts` — chỉnh phần mô tả/hành động cũ cho đúng ownership.
- `tests/module-hierarchy.test.cjs` và `tests/admissions-and-chat.test.mjs` — static contract theo registry mới.

**Lưu ý:** V5 là một bản nâng cấp cấu trúc code và UX. Các submodule hiện tại dẫn tới trang hoặc phần UI có sẵn; chưa phải đã tách từng engine thành microservice độc lập, cũng không phải mọi màn hình đã có dữ liệu đầy đủ. Không chấm mục nào PASS production nếu chưa có E2E.

## 6. Điều chỉnh hiển thị riêng cho vai trò học sinh

- Đường dẫn `/student/modules` hiện tiêu đề **Cognitive Path cá nhân**; thẻ tiêu đề cho biết **6 module / 28 chức năng**.
- Sáu thẻ bên trái giữ nhãn thân thiện tiếng Việt, phần tiêu đề khối chi tiết dùng tên engine chính thức (Seed Profile, Lumen Intelligence, Atlas Admission, Orion Strategy, Pulse Monitor, Haven Support).
- Các trang con có liên kết trở lại **Các module của học sinh**; không hiển thị nhầm số **7** trong giao diện học sinh (Nexus chỉ thuộc Admin).
- Chỉ ba chức năng con ưu tiên hiển thị mặc định; mục chưa có giao diện thật phải giữ **Đang phát triển** thay vì điều hướng giả.
