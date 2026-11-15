# CLA — Báo cáo bản mở rộng Atlas: Tổ hợp → ngành có nguồn chính thức
**Ngày:** 13/11/2026  
**Source nền:** `CLA_FULL_SOURCE_BUOC08_SUBJECT_OPTIMIZER_20261113.zip` (405 file)  
**Phạm vi bản này:** đọc dữ liệu đã có nguồn, không thay đổi schema Firestore / Auth / nguyện vọng / ML / Gemini.

## 1. Đã làm thực tế
- Tận dụng `src/data/verifiedAdmissionPrograms.ts` có sẵn: **10 chương trình** của **Học viện Công nghệ Bưu chính Viễn thông, cơ sở Hà Nội BVH**, đề án **2026**, phương thức xét kết quả thi THPT.
- Thêm `src/lib/ptitAdmissionPathways2026.ts`: đối chiếu **hai môn tự chọn mà học sinh xác nhận** với 2 môn bắt buộc Toán–Văn và **5 tổ hợp mà PTIT công bố**: A00, A01, X06, X26, D01. Hai mã **X06 (Toán–Lý–Tin)** và **X26 (Toán–Tin–Anh)** chưa có trong 9 mã tổ hợp khám phá của CLA, nay có trong bộ đối chiếu nguồn **dành riêng PTIT**.
- Không coi tổ hợp trong tập 9 mã thử nghiệm là tổ hợp PTIT chấp nhận nếu nguồn không nêu. Không tự suy ra trường khác nhận X06/X26.
- Chỉ đưa chương trình vào kết quả khi đúng năm 2026, campus BVH, PTIT chính thức, phương thức THPT và mã tổ hợp có trong dữ liệu nguồn. Từ khóa ngành mục tiêu chỉ dùng **đánh dấu tên khớp**, không biến thành fit score/probability.
- Tính **tổng ba điểm tham khảo** nếu đủ dữ liệu thuộc cùng chế độ điểm đang chọn; 0 hợp lệ, thiếu/sai điểm thì trả null. Điểm học bạ/thi thử không bao giờ được gọi là điểm thi THPT chính thức.
- Trong `AtlasAdmissionEnginePanel.tsx`, mỗi cặp môn hiện số **chương trình khớp tại PTIT BVH**. Khi học sinh chọn cặp, khu **Official Pathway Match** mới hiển thị mã ngành, tổ hợp và điểm tham khảo, nhãn mục tiêu, URL đề án gốc. Có cảnh báo rõ không phải kết luận đủ điều kiện/đỗ.
- Thêm nút dẫn **“Khám phá môn thi → chương trình có nguồn”** ngay ở phần giới thiệu Atlas; bổ sung CSS responsive cho các thẻ nguồn.
- Không tự thêm số liệu điểm chuẩn năm 2026, không giả lập chỉ tiêu, tỷ lệ trúng tuyển hay học bổng.

## 2. Đường dẫn nguồn đã kiểm tra
**Đề án PTIT 2026 chính thức:**
https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/

Các tổ hợp thuộc nhóm ngành/chương trình trong nguồn: A00 = Toán/Lý/Hóa; A01 = Toán/Lý/Anh; X06 = Toán/Lý/Tin; X26 = Toán/Tin/Anh; D01 = Toán/Văn/Anh (chỉ ở nhóm được công bố D01). **Ngày đối chiếu nguồn trong dữ liệu CLA: 08/11/2026**. Nguồn được kiểm tra lại trong lượt này. Chính sách/tổ hợp năm 2027 không được tự suy từ 2026.

## 3. Phạm vi chưa hoàn tất
- Đây là **tập mẫu 10 chương trình PTIT BVH**, không phải danh mục toàn quốc; chưa có các cơ sở/chương trình khác được đối chiếu ở cấp mã ngành–tổ hợp.
- Mới có năm 2026 và phương thức thi THPT, không suy diễn sang Học bạ, SAT/ACT/HSA/TSA hoặc ngành ở BVS.
- Chưa kết nối bộ kiểm tra đủ điều kiện chính thức, quy đổi điểm, điểm ưu tiên, điểm chuẩn 2026 hoặc ưu tiên nguyện vọng cho bản ghi này. Tuyệt đối không dùng tổng điểm tham khảo để kết luận trúng tuyển.
- Việc lưu cập nhật nguồn tự động/Gemini có duyệt chưa nằm trong bản vá này.
- Các mục P0: Firestore Rules Emulator, consent/assent/withdrawal, nhãn xác suất chưa hiệu chỉnh, E2E đa vai trò vẫn **chưa nghiệm thu**; không dùng nghiên cứu thật chưa có các kiểm chứng này.

## 4. Thay đổi file
**Tạo mới:**
1. `src/lib/ptitAdmissionPathways2026.ts`
2. `tests/step09-ptit-official-pathways.test.cjs`
3. `BAO_CAO_ATLAS_OFFICIAL_PATHWAYS_20261113.md`
4. `START_HERE_ATLAS_OFFICIAL_PATHWAYS_20261113.md`

**Sửa:**
1. `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx`
2. `src/page/atlas/AtlasPage.tsx`
3. `src/styles/07-atlas.css`
4. `package.json` (test mới trong `npm test`, thêm `npm run test:official-pathways`)

**Không sửa:** `package-lock.json`, Firebase Auth/Rules, Seed schema, hotfix Admin, code Gemini, ML, nguyện vọng 2026, các tính toán chấm điểm trước đây.

## 5. Kiểm thử thực thi trong môi trường đóng gói
| Phép thử | Kết quả |
|---|---|
| `node --test tests/step09-ptit-official-pathways.test.cjs` | **21/21 PASS** (kèm kiểm thử source sai năm/domain/campus/phương thức, X06/X26, thiếu điểm, điểm 0, UI) |
| `npm test` toàn bộ chuỗi | **PASS** (đã bao gồm 21 test mới) |
| `tsc --noEmit --strict ... src/lib/ptitAdmissionPathways2026.ts` | **PASS** |
| Kiểm tra cú pháp TSX panel và TS engine | **PASS** |
| `npm run test:rules:static` | **15/15 PASS** |
| `npm run check:layout` | **PASS** |
| `npm run build` tại môi trường đóng gói | **CHƯA CHẠY** vì không có `node_modules` React/Firebase |
| TypeScript 6 + browser Windows, Firebase Emulator/E2E thực tế | **CHƯA NGHIỆM THU** |

Test chạy Node 22 và TypeScript được cài sẵn trong môi trường đóng gói; không phải kiểm định kết quả tuyển sinh với dữ liệu thí sinh thật.

## 6. Tiến độ quản lý, không đánh tráo thang đo
- Master Roadmap: **28 bước, 164 đầu việc**.
- Theo cách tính từng dùng: **6/28 = 21,4%** bước đã có bản vá source. Bản này là **một đợt mở rộng Atlas**, không tự ghi hoàn thành bước 09 chính thức trong Master Roadmap.
- **Số đầu việc được nghiệm thu cuối thêm trong lượt này: 0**, vì browser/E2E/Emulator chưa có bằng chứng.
- Phần trăm sản phẩm hoàn thiện thực tế: **chưa đủ bằng chứng để công bố một con số đáng tin cậy**. Không lấy số file, bài test hoặc lượng nguồn làm tỷ lệ hoàn thiện sản phẩm.

## 7. Tiếp theo
1. Người dùng chạy `npm run test:official-pathways`, `npm test`, `npm run build`, `npm run dev` trên máy đã cài thư viện; nghiệm thu 3 ví dụ bên dưới.
2. Trước khi mở dùng với học sinh thật, ưu tiên Firestore Emulator và luồng consent/assent (P0); sau đó chuẩn hóa nhãn probability trong Orion/Prediction.
3. Mở rộng nhóm trường theo mã chương trình–năm–phương thức–tổ hợp, review dữ liệu Gemini theo nguồn gốc; nối tiếp ngành/trường/nguyện vọng với quyền lựa chọn của học sinh.
