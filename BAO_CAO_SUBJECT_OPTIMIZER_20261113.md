# CLA — Báo cáo đợt Subject Optimizer (13/11/2026)

**Nền mã nguồn:** `CLA_FULL_SOURCE_BUOC07_AUTH16_TS6_WINDOWS_FIX_20261113.zip` (kế thừa bước 07, Admin hotfix và sửa test AUTH-16).

## 1. Phạm vi đã làm

Đã triển khai **một nhánh chức năng tiếp theo của Atlas**, không thay đổi Firestore schema, API Firebase, công thức GPA hoặc quyền Admin.

- Thêm `src/lib/examChoiceEngine.ts`: bộ đề xuất **hai môn thi tự chọn** theo quy tắc kỳ thi THPT 2026, buộc xác nhận môn thực sự học ở lớp 12. Toán và Ngữ văn là hai môn bắt buộc.
- Phân biệt 10 lựa chọn thuộc danh mục hỗ trợ: Tiếng Anh, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, Giáo dục kinh tế và pháp luật, Tin học, Công nghệ Công nghiệp và Công nghệ Nông nghiệp. **Ngoại ngữ khác tiếng Anh chưa xử lý tự động.** Công nghệ trong bảng điểm Seed không được suy thành bất kỳ định hướng nào.
- Chỉ ghép hai môn do học sinh xác nhận; điểm học bạ/thi thử không được dùng để suy ra môn đã học lớp 12.
- Từ mỗi cặp môn, tính tổ hợp **khả dụng trong 9 mã có sẵn** ở Atlas (không tuyên bố đủ mọi tổ hợp chính thức), chỉ cộng điểm khi có điểm thật của đúng môn; điểm 0 là hợp lệ và thiếu điểm không thành 0.
- Nếu có bản ghi chương trình và nguồn **đã duyệt năm 2026**, hiển thị số chương trình khớp tổ hợp (không gọi đó là đủ điều kiện đậu). Các bản ghi demo `pending` không trở thành khuyến nghị chính thức.
- Thêm giao diện `Hai môn tự chọn, nhiều con đường`: chọn môn học, áp dụng danh sách từ Seed khi **người dùng xác nhận**, thẻ các cặp, so sánh điểm, xem giải thích và mở rộng toàn bộ phương án. Kết quả cập nhật theo dữ liệu trong Atlas.
- Khi chuyển UID, xóa danh sách môn lớp 12 đang xác nhận và cặp đang xem để tránh giữ dữ liệu tài khoản cũ.
- Bổ sung `tests/step08-subject-optimizer.test.cjs` với 19 trường hợp. Đưa file test vào chuỗi `npm test`, thêm `npm run test:subject-optimizer`.

## 2. Nguyên tắc xếp hạng (không phải mô hình xác suất)

1. Số chương trình được duyệt nguồn chính thức có tổ hợp nằm trong danh mục (nếu có).
2. Số tổ hợp có thể hình thành trong danh mục thử nghiệm 9 mã (chỉ là *độ phủ*, không suy ra khả năng trúng tuyển).
3. Tình trạng điểm quan sát đủ cả hai môn; sau đó tổng điểm hai môn (chỉ so sánh khi cùng nguồn điểm đang chọn).
4. Mã cặp môn là khóa sắp xếp ổn định nếu hòa.

Kết quả là **kịch bản khám phá**, không tự nộp đăng ký, không kết luận ngành/trường không được xét tuyển nếu danh mục thiếu dữ liệu.

## 3. Nguồn chính sách

- Văn bản hợp nhất 02/VBHN-BGDĐT (2026) về Quy chế thi tốt nghiệp THPT, Điều 3 và Điều 20, cổng Chính phủ:
  https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-so-02-vbhn-bgddt-quy-che-thi-tot-nghiep-trung-hoc-pho-thong-119260419130804242.htm
- Tài liệu dự án `COGNITIVE LEARN AI`: mục VIII, Subject Optimizer; mục X, gợi ý môn và tổ hợp trước gợi ý ngành/trường.
- **Quan trọng:** ngoại lệ môn Ngoại ngữ khác đang học, quy chế các năm khác, phương thức xét tuyển riêng của từng trường/ngành chưa được engine này bao phủ đầy đủ. Cần mở rộng bằng dữ liệu được duyệt nguồn theo trường–ngành–năm–phương thức.

## 4. Kiểm thử đã thực thi trong môi trường đóng gói (Node 22, TS 5.8.3)

| Hạng mục | Kết quả |
|---|---|
| Test Subject Optimizer mới | **19/19 PASS** |
| `npm test` toàn dự án (đã bao gồm 19 test mới) | **PASS** |
| `npm run test:rules:static` | **15/15 PASS** |
| `npm run check:layout` | **PASS** |
| `tsc --noEmit --strict` với `examChoiceEngine.ts` | **PASS** |
| Kiểm tra cú pháp engine TS và panel TSX | **2/2 PASS** |
| `npm run build` | **CHƯA XÁC NHẬN** tại đây: không có `node_modules`/types React–Firebase, do đó build dừng ở lỗi thiếu dependency; cần chạy trên máy Windows đã cài `npm ci` |
| Browser E2E, Firebase Emulator, thử nghiệm tài khoản thật | **CHƯA NGHIỆM THU** |

Các test dùng dữ liệu tổng hợp và kiểm tra hợp đồng/logic; không thay thế nghiệm thu nghiệp vụ với thí sinh thật.

## 5. File thay đổi

**Mới**: `src/lib/examChoiceEngine.ts`, `tests/step08-subject-optimizer.test.cjs`.

**Sửa**: `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx`, `src/styles/07-atlas.css`, `package.json`.

**Không sửa**: `LoginPage.tsx`, `AccessGate.tsx`, Firestore Rules, Seed schema, nguyện vọng 2026, công thức điểm, hệ thống Gemini.

## 6. Tiến độ chính xác

- Master Roadmap có **28 bước / 164 đầu việc**. Theo cách đếm các đợt đã có bản vá trước đây, **6/28 = 21,4%** là *mức độ đã có patch*, **không phải mức hoàn thiện toàn dự án**.
- Phần Subject Optimizer là **bản bổ sung nhánh Atlas** theo yêu cầu hội thoại. Trong Master Roadmap đã khóa, **bước số 08 là Simulation**, không phải Subject Optimizer. Vì vậy **không tự động đánh dấu bước 08 của roadmap là hoàn thành**, cũng không nâng tỷ lệ 6/28 lên 7/28 bằng cách đánh tráo số bước.
- **Số tiêu chí nghiệm thu cuối được xác nhận tăng trong lượt này: 0**. Kiểm thử và build thực tế trên máy người dùng cần được ghi vào tracker sau khi có log/bằng chứng.
- Còn P0 trước khi dùng dữ liệu học sinh thật: Firestore Emulator quyền chéo, consent/assent/withdrawal, xác suất chưa hiệu chỉnh của Prediction/Orion, E2E cho các vai trò.

## 7. Chỉ dẫn nghiệm thu thủ công

1. Sao lưu thư mục dự án trước khi chép FULL SOURCE (không xóa `.env`, `.env.local`, `node_modules`).
2. Chạy `npm run test:subject-optimizer`, `npm test`, `npm run build`, `npm run dev` trên Windows.
3. Vào Atlas, tới khu **Hai môn tự chọn, nhiều con đường**. Chưa xác nhận hai môn → không có đề xuất.
4. Chọn Tiếng Anh + Vật lý: với danh mục hiện tại phải thấy A01, C01, D01; sửa điểm của hai môn và quan sát kết quả.
5. Chọn Sử + Địa: có C00; chọn Tin học + GDKT&PL: không có mã trong 9 tổ hợp mẫu nhưng **không kết luận hai môn đó không hợp lệ**.
6. Nếu Seed đang có điểm, xác nhận các môn gợi ý từ Seed **chỉ khi đúng môn học lớp 12**; điểm phải giữ nhãn học bạ, không tự thành điểm THPT.
7. Chọn cặp và xem giải thích; khi đổi tài khoản phải không còn danh sách xác nhận của tài khoản cũ.

## 8. Việc kế tiếp

- Bổ sung dữ liệu tuyển sinh có nguồn chính thức theo chương trình–năm–phương thức–tổ hợp và ngoại ngữ khác tiếng Anh; sau đó mới cá nhân hóa theo ngành/trường.
- Song song theo P0: xác thực Firestore rules bằng Emulator và quy trình consent trước dữ liệu học sinh thật.
- Hoàn thiện vòng lặp Orion → Pulse → outcome để dự án không chỉ dừng ở gợi ý.
