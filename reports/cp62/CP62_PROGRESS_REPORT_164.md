# COGNITIVE LEARN AI — Báo cáo tồn đọng và thứ tự đẩy nhanh tiến độ (CP62)

**Ngày:** 21/11/2026  
**Căn cứ số lượng:** `CLA_BACKLOG_164_DAU_VIEC_CP48.csv` (bản chốt checklist CP48; đây là trạng thái nghiệm thu, không phải số chức năng chưa viết).  
**Căn cứ thiết kế mục tiêu:** `lộ trình (1).docx`, `COGNITIVE_LEARN_FINAL_SUPPLEMENT_SPEC.docx`, `COGNITIVE_LEARN_RESEARCH_VALIDATION_MASTER_PROTOCOL.docx`, `CLA_EXECUTION_MASTER_V3_WEBSITE_RESEARCH_HF.docx`.  
**Căn cứ mã nguồn hiện hành:** CP61 source + bản vá CP62 tại `src/page/seed/`, `src/lib/studentSignalRail.ts`, CSS CP62.

## 1. Số lượng còn lại — nói rõ ý nghĩa

| Nhóm | Tổng | Mục OPEN theo CP48 | P0 |
|---|---:|---:|---:|
| Website MVP | 76 | 76 | 11 |
| Nghiên cứu | 69 | 69 | 0 |
| Tuyển sinh/Chat | 18 | 18 | 3 |
| UI/mascot | 1 | 1 | 0 |
| **Tổng** | **164** | **164** | **14** |

Phân loại bằng chứng tại CP48: **21** đạt kỹ thuật cục bộ, **126** mới đạt một phần, **17** thiếu bằng chứng. Cột `Kết quả nghiệm thu độc lập` của 164 dòng đều là `CHƯA NGHIỆM THU`. Những sửa lỗi từ CP49 đến CP62 nâng chất lượng mã nguồn/test, **không tự động đóng những gate tích hợp**. Chưa có cơ sở để báo phần trăm sản phẩm hoàn thiện tổng thể.

## 2. Các nút thắt ưu tiên cần đóng trước

- **Nguồn/build/release:** A2, A3, A4, gồm bí mật, compile/build với `npm ci`, route/deep link; nghiệm thu cần pipeline thực sự chạy.
- **Quyền & dữ liệu:** B2, C3, C4, D3, I3, K15; Firebase Emulator thật, khóa môn lựa chọn từ server, quyền Admin/UID, quy trình audit.
- **Trải nghiệm trình duyệt:** I4; QA mobile/desktop, chuyển trang, refresh deep links, cờ chặn rời bản nháp, console/network.
- **Closed loop:** H1; replay synthetic không thể thay runtime có dữ liệu người dùng được phép.
- **Tuyển sinh/học bổng:** C25-06, C25-14; coverage quốc gia 2024–2026, yêu cầu/chứng chỉ/deadline và nguồn chính thức có lineage.
- **Staging nghiệm thu:** C25-18; không thể tuyên bố đã nghiệm thu nếu chưa triển khai, chạy smoke và được xác nhận.

## 3. Lộ trình tăng tốc theo nhóm gate, không chạy theo số CP

| Ưu tiên | Luồng làm việc | Kết quả cần kiểm chứng |
|---|---|---|
| 1 | Build/QA/Emulator | `npm ci` + `npm run build` thành công trên môi trường chuẩn; Emulator Rules + browser E2E có log và môi trường tách biệt |
| 2 | Dashboard & module UX | Chuyển trang SPA thật, giao diện chart-first, tab nhiệm vụ, mobile/dark/contrast; kiểm tra người dùng với dữ liệu mock/được phép |
| 3 | Atlas tuyển sinh | Độ bao phủ cơ sở đào tạo và phương thức, 3 năm gần nhất có tài liệu chính thức; không coi thiếu nguồn là 0 |
| 4 | Haven/du học & Gemini | Học bổng, yêu cầu chứng chỉ, deadline, truy xuất nguồn; không cam kết học bổng dựa trên chỉ số fit |
| 5 | Khóa Seed ↔ các module | Dữ liệu chính chủ đã xác minh máy chủ, phân quyền và phiên bản bản nháp |
| 6 | Nghiên cứu / hội đồng | Dữ liệu thật có quyền, đo lường/psychometrics, SAP, benchmark và báo cáo claim–evidence |

Đây là **6 nhóm thực thi** để quản lý, không phải 6 đầu việc duy nhất còn thiếu. Chỉ đóng một đầu việc trong 164 mục khi đạt đúng acceptance criterion nguyên gốc, có log/bằng chứng và kiểm tra độc lập.

## 4. UI thay đổi từ CP62 và UI còn lại

**Đã sửa CP62:**
- Thay hai ô `student-dash-focus` (hành động) và `student-dash-status` (trạng thái) thành `StudentActionSignalRail`: luồng ba hành động, biểu đồ trạng thái ba nguồn, nhãn chỉ rõ dữ liệu thiếu.
- Không tăng/đoán SCI/MAS/CSL từ số nguồn; có đúng ba cờ khả dụng, không phải điểm 0–100.
- Giữ lịch thi `ExamHorizon` trên trang chính, giữ `StudentDecisionCanvas` chart-first, tiếp đến action rail và `LearningCircuit` sáu module.
- Bố cục responsive dưới 860px/600px, theme tối tách biệt, bàn phím focus, giảm chuyển động khi được yêu cầu.

**UI chưa hoàn tất / còn kiểm chứng:**
- Kiểm thử trên React/Vite chạy thật, thay vì chỉ ảnh preview CSS độc lập.
- Phát hiện/khắc phục các cặp chữ–nền bị lệch tương phản trên **toàn bộ** Atlas, Orion, Pulse, Haven, Lumen và các trạng thái loading/error/empty.
- Điều hướng thực tế hai thiết bị, Back/Forward URL, hiển thị thông báo lưu/xung đột trên Firebase QA.
- Tách dashboard phụ của module theo nhiệm vụ; giảm bố cục card dày đặc trong các màn so sánh tuyển sinh/học bổng.
- Hiển thị nguồn dữ liệu/hạn cập nhật và cách tính khi vẽ biểu đồ, giữ số liệu thiếu là thiếu.

## 5. Kiểm chứng CP62

- `npm run test:cp62:student-rail`: **9/9 PASS**.
- `npm test`: **exit 0**, 1.245 dòng TAP gốc `ok`, 0 dòng `not ok` (có thêm 9 ca con CP62).
- `npm run test:rules:static`: **15/15 PASS**, chỉ test tĩnh.
- `npm run check:layout`: PASS.
- `python -m unittest discover -s tests -p 'test_cp53_safe_packaging.py' -v`: **3/3 PASS**.
- `npm run demo:final`: **11/11 synthetic/offline PASS**.
- CSS qua PostCSS parse; TypeScript/TSX transpile syntax ba tệp liên quan không có diagnostic lỗi.
- Chromium **isolated CSS preview** sáng/tối/mobile không tràn ngang; đây **không phải React browser E2E của website**.
- 19 dependency/executable còn thiếu, `npm run check:dependencies` báo BLOCKED. Không xác nhận production build/Emulator/deploy.

**Kết luận:** Đã có thay đổi UX cụ thể và kiểm chứng cục bộ CP62; số gate chốt trong 164 mục vẫn là 0 theo tiêu chí nghiệm thu độc lập. Không dùng trạng thái test synthetic để tuyên bố kết quả học tập được xác nhận.
