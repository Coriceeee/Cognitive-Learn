# COGNITIVE LEARN AI — Kiến trúc 7 module và phân hệ nhỏ (V4)

**Ngày chốt:** 08/11/2026  
**Trạng thái:** Quyết định sản phẩm cập nhật mới nhất; ưu tiên hơn cách chia Atlas/Haven trong `ROUND_SCHOOL_PATCH_CP25_20261108.md` và các ghi chú CP25 trước đó.  
**Mục tiêu giao diện:** Giữ đúng 7 module cấp cao. Mỗi module chứa các chức năng con theo nhóm, hiện tối đa 3 hành động trước; nút **Xem thêm** để mở những mục còn lại. Không biến chức năng con thành module chính thứ tám.

## 1. Quy tắc ownership đã khóa

- **Atlas Admission = toàn bộ định hướng và tra cứu tuyển sinh:** Việt Nam; du học quốc tế ở mọi quốc gia/vùng lãnh thổ; chương trình liên kết tuyển sinh tại Việt Nam; ngành/trường, điều kiện nhập học, chứng chỉ, phương thức, điểm chuẩn, lộ trình nguyện vọng. Tất cả dữ liệu chi tiết phải có nguồn chính thức, năm áp dụng và giới hạn.
- **Haven Support = học bổng, khả năng chi trả và mạng lưới hỗ trợ:** học bổng trong nước/quốc tế, học phí/chi phí và ngân sách, khoảng cách tài chính, hướng hỗ trợ cho gia đình và giáo viên. Haven có thể liên kết sang Atlas để tra trường, **không sở hữu trang Du học**.
- **Chatbot nổi** chỉ giúp sử dụng website và mở đúng phân hệ; không tự đưa điểm chuẩn, điều kiện tuyển sinh, học bổng, deadline hoặc xác suất.
- **Chứng chỉ cần để vào trường** do Atlas trình bày theo trường/chương trình. **Chứng chỉ cần cho học bổng** do Haven đối chiếu theo học bổng. Hai nơi liên kết nhưng không tạo ra hai bộ dữ liệu nguồn mâu thuẫn.
- Danh mục toàn cầu là **249 mã ISO quốc gia/vùng lãnh thổ**, không đồng nghĩa 249 bộ dữ liệu nhập học đã xác minh. Điểm đến chưa có nguồn phải hiển thị `CHƯA CÓ DỮ LIỆU CHI TIẾT`, không suy đoán.

## 2. Phân hệ nhỏ trong 7 module

| Module chính | Phân hệ nhỏ được chia | Đường dẫn hiện có | Ghi chú nghiệm thu |
|---|---|---|---|
| **1. Nexus Core** (Admin) | Tổng quan hệ thống; quản lý quyền; kiểm thử 22 thao tác; audit dữ liệu/hệ thống | `/admin`, `/admin/diagnostics` | Admin only, các tính năng chưa nghiệm thu vẫn phải ghi rõ trạng thái |
| **2. Seed Profile** | Hồ sơ cá nhân; bảng điểm 9 môn; GPA và lịch sử; đồng bộ/kho dữ liệu | `/student/profile`, `/student/transcript`, `/student/storage`, `/student` | Khóa 4 môn, null khác điểm 0, sync Firestore cần E2E |
| **3. Lumen Intelligence** | SCI/MAS/CSL; phân tích học tập; yếu tố và giới hạn; dữ liệu sẵn sàng ML | `/lumen` | Không tự nhận chỉ số tâm lý đã validated; phân hệ chi tiết có thể còn đang phát triển |
| **4. Atlas Admission** | **(A)** Tuyển sinh Việt Nam 2024–2026; **(B)** Du học toàn cầu; **(C)** Liên kết quốc tế tại Việt Nam; **(D)** Gợi ý ngành/trường/nguyện vọng; **(E)** Kho dữ liệu nguồn | `/atlas#atlas-official-admissions`, **`/atlas/study-abroad`**, `/atlas#atlas-joint-programs`, `/atlas#atlas-engine`, `/atlas#atlas-programs` | Đây là nhóm lớn nhất nên chỉ hiện 3 mục đầu + “Xem thêm”. Tuyển sinh 2024–2026 và 249 điểm đến không đồng nghĩa đã đủ thông tin mọi ngành/trường |
| **5. Orion Strategy** | Mô phỏng 3 kịch bản; lịch học; can thiệp; check-in và thích ứng | `/orion` | Một số phân hệ chưa có route riêng; không coi chỉ có nút dẫn trang là hoàn thiện |
| **6. Pulse Monitor** | Tổng quan tiến trình; lịch sử thời gian; outcome/tái đo; báo cáo và cảnh báo | `/pulse` | Không nói “đã tiến bộ” khi thiếu outcome và tối thiểu hai thời điểm |
| **7. Haven Support** | **(A)** Học bổng/điều kiện; **(B)** Phân tích học phí, ngân sách và khả năng chi trả; **(C)** Hỗ trợ phụ huynh, giáo viên; **(D)** Khoảng cách tài chính | `/haven#haven-scholarships`, `/haven#haven-financial`, `/haven#haven-support-roles` | Không tự nói xác suất đạt học bổng; trường/điều kiện du học ở Atlas |

## 3. Trải nghiệm menu không rối

1. Menu `Các module` chỉ hiện module cấp cao phù hợp quyền Student / Parent / Teacher / Admin. Một module được chọn mới hiện chức năng con của nó.
2. Tối đa **ba chức năng con được hiển thị trước**; nếu nhiều hơn có **Xem thêm / Thu gọn**. Không dồn 20–30 ô chức năng lên màn hình đầu.
3. Trang Atlas có thanh điều hướng theo 5 nhóm và trang Du học riêng; trang Haven chỉ giữ học bổng, chi phí và hỗ trợ.
4. Liên kết các chức năng chưa hoàn thiện phải giữ nhãn/disabled thực tế. Đường dẫn có link không được xem là bằng chứng đã hoàn thành chức năng.
5. Trên di động mỗi nhóm có thể xếp dọc. Nút và liên kết phải có nhãn rõ, hoạt động bằng bàn phím.

## 4. Phân luồng người dùng

- “Điểm chuẩn CNTT 2026?” → Chatbot đưa sang `Atlas > Tuyển sinh Việt Nam`.
- “Muốn du học Canada?” → Chatbot đưa sang `Atlas > Du học quốc tế` (`/atlas/study-abroad`).
- “IELTS của chương trình tại Nhật?” → `Atlas > Du học quốc tế > Nhật Bản > Điều kiện & chứng chỉ`, hiển thị nguồn nếu có; nếu chưa có, nói rõ thiếu dữ liệu.
- “Học bổng cho Canada?” → `Haven > Học bổng` (không trả trực tiếp deadline từ chatbot).
- “Gia đình có đủ ngân sách?” → `Haven > Tài chính`.
- “Chương trình liên kết tại Việt Nam?” → `Atlas > Liên kết quốc tế tại Việt Nam`.

## 5. Tương thích và thay đổi code

- Đường dẫn **canonical:** `/atlas/study-abroad`.
- Liên kết cũ `/study-abroad` và `/haven/study-abroad` tiếp tục hoạt động qua SPA rồi chuẩn hóa URL trên client; chưa tuyên bố đã kiểm thử refresh trên production.
- Source thay đổi: `src/App.tsx`, `vercel.json`, `src/page/study-abroad/StudyAbroadPage.tsx`, `src/page/atlas/AtlasPage.tsx`, `src/page/haven/HavenPage.tsx`, `src/components/common/ModuleClusterGrid.tsx`, `src/data/moduleClusters.ts`, `src/lib/advisorChatPolicy.ts`, `src/components/common/FloatingAdvisorChat.tsx`, test liên quan.
- **Không đổi phương pháp khoa học hoặc tuyên bố hoàn thành:** 7 module chính vẫn là những hệ chịu trách nhiệm; 165 là số dòng checklist quản lý, có mục trùng và chưa phải số tính năng độc lập.

## 6. Checkpoint ưu tiên cho vòng trường

1. Kiểm thử chính xác ownership Atlas/Haven, route mới và link cũ; kiểm tra chatbot routing và giới hạn giải đáp.
2. Giao diện menu 7 module → các phân hệ nhỏ, mặc định gọn, và mobile.
3. Chạy test tự động, build khi có đủ dependency; xem lại Firebase Auth/Rules và browser E2E ở staging.
4. Chỉ mở rộng dữ liệu từng nước/đề án/học bổng khi có nguồn rõ ràng. Dữ liệu thiếu được công bố trung thực.

**Tài liệu này thay thế quyết định tạm thời “du học thuộc Haven” ở các bản ghi trước đó.**
