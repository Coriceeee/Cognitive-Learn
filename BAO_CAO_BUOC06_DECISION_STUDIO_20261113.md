# COGNITIVE LEARN AI — BÁO CÁO BƯỚC 06
**Checkpoint:** 2026-11-13 · **Nền:** FULL SOURCE 05B + Atlas Quy chế 2026 · **Phạm vi:** Chuẩn điểm số và Decision Studio tại Atlas

## 1. Tóm tắt
Bước 06 sửa lỗi ngữ nghĩa điểm ở Score Conversion Engine và cải thiện trình bày tương tác. Chỉ tổ hợp đủ **đúng ba môn của tổ hợp đó** được đưa vào bảng xếp hạng học thuật. `0` là điểm hợp lệ; ô trống/điểm ngoài thang là thiếu hoặc không hợp lệ, không tự chuyển thành điểm 0 hợp lệ. Không so sánh SAT/HSA/IELTS với điểm ba môn theo kiểu tự quy đổi không chính thức.

Atlas Decision Studio cập nhật theo điểm do người dùng tự nhập: 3 chặng quan sát → so sánh → đối chiếu, thẻ tổ hợp có thanh tỷ lệ, bấm chọn để xem phép cộng và các môn còn thiếu; có thu gọn/xem đủ 9 tổ hợp, hỗ trợ màn nhỏ và giảm chuyển động.

### Bảo vệ tính đúng của khuyến nghị
- Điểm thi thử và học bạ **chỉ dùng để xem tổng điểm tổ hợp tham khảo**, không tự so với điểm chuẩn THPT.
- Chỉ mở việc phân nhóm nguyện vọng khi người dùng chọn **điểm THPT 2026 chính thức do người dùng tự khai**, đã nhập ít nhất một tổ hợp hoàn chỉnh, không có điểm bất thường và không nhập điểm ưu tiên chưa kiểm chứng. Ngay cả lúc đó vẫn yêu cầu mốc THPT 2026 có chương trình, phương thức và nguồn được đánh dấu duyệt.
- Việc chọn loại điểm **không xác minh danh tính hoặc độ thật của điểm**; không được xem kết quả là kết luận xét tuyển chính thức.
- GDKT & Pháp luật, Tin học, Công nghệ đã xuất hiện trong form. Hiện vẫn chỉ có **9 tổ hợp hỗ trợ**, không được tuyên bố đã hỗ trợ toàn bộ tổ hợp tuyển sinh theo chương trình mới.

## 2. File sửa/thêm
| File | Kiểu | Nội dung |
|---|---|---|
| `src/lib/scoreConversionEngine.ts` | sửa | `parseSubjectScore`, giữ 0, bỏ tổ hợp thiếu khỏi `bestOption`, không xếp điểm ngoài phương thức chung |
| `src/lib/admissionRules.ts` | sửa | điểm tổ hợp 0 đủ môn vẫn được nhận diện là có điểm |
| `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx` | sửa | ScoreBasis, kiểm tra điểm, 11 môn, studio trực quan, chặn đối chiếu sai loại điểm/năm |
| `src/styles/07-atlas.css` | sửa | bố cục Decision Studio tương tác, responsive, accessible |
| `tests/step06-subject-score-contract.test.cjs` | thêm | 13 trường hợp kiểm thử mới |
| `package.json` | sửa | thêm kiểm thử bước 06 và Atlas Policy 2026 vào `npm test`; bổ sung `npm run test:step06` |
| `tests/cp35-p0-p1-contract.test.cjs` | cập nhật | bỏ assertion cũ bắt nhập tất cả tám môn; thay bằng quy tắc tổ hợp hoàn chỉnh |
| `tests/cp30-chat-readability.test.cjs` | cập nhật | kiểm tra thứ tự CSS tương đối, không buộc file CP36 phải là file cuối |

Không xóa hoặc chỉnh sửa Seed, Orion, Lumen, Pulse, Haven, Gemini API hay thông tin quy chế 2026.

## 3. Kết quả kiểm thử thực tế tại checkpoint
| Phạm vi | Kết quả |
|---|---|
| `npm test` toàn bộ script trong `package.json` | **129/129 PASS** (13 nhóm liên tiếp; bao gồm 13 test mới + 14 test Atlas Policy 2026) |
| `node --test tests/step06-subject-score-contract.test.cjs` | **13/13 PASS** (có trong 129 bài của `npm test`) |
| Atlas policy 2026 | **14/14 PASS** (có trong 129 bài của `npm test`) |
| Atlas bridge + benchmark bước 03–04 | **18/18 PASS** |
| Firestore rules contract tĩnh | **15/15 PASS** |
| `node tools/check-cla-layout.cjs` | **PASS** |
| TS/TSX transpile syntax 3 file cập nhật | **PASS** |
| `npm run build` trong sandbox | **CHƯA PASS**: ZIP không kèm `node_modules`; TypeScript báo thiếu React/JSX type dependencies trên nhiều file trong dự án (không xác nhận là lỗi bản vá) |
| Firebase Emulator, browser E2E, kiểm tra tay tại Windows | **CHƯA CHẠY/CHƯA NGHIỆM THU** |

Không coi kiểm thử tĩnh là bằng chứng khoa học hoặc nghiệm thu production.

## 4. Phần trăm tiến độ — định nghĩa minh bạch
**17,9% theo số bước đã có bản vá source:** bước 02, 03, 04, 05, 06 = 5/28 bước. 05A và 05B được gộp là một bước 05, Atlas Quy chế 2026 thuộc chuỗi bản sửa Atlas. Đây là **độ phủ các bước đã được chạm tới bằng code**, KHÔNG phải % hoàn thành chức năng toàn bộ dự án.

**0/164 mục được cộng PASS nghiệm thu cuối:** giữ nguyên vì chưa có xác nhận build + E2E + các gate khoa học trên môi trường thực tế. Không có cơ sở trung thực để suy từ 5/28 thành tỷ lệ sản phẩm hoàn thiện. Bước 01 backup còn chưa được xác nhận. Các bước 07–28: 22 bước chưa triển khai theo kế hoạch.

**7/7 module chính có khung route/code**, nhưng không đồng nghĩa 100% hoàn thiện sản phẩm. Mức độ sẵn sàng nghiên cứu/production cần audit và chứng cứ riêng.

## 5. Những phần CHƯA làm (không được báo là đã đồng bộ hoàn toàn)
1. Chưa tự tải điểm từ Seed vào Atlas; vẫn nhập tại panel Atlas. Cần chuẩn hóa dữ liệu loại điểm, học kỳ và môn rồi viết adapter, không tự gán GPA thành điểm THPT.
2. Subject Optimizer chưa chọn **hai môn thi tự chọn** theo môn đã học, mục tiêu ngành, điều kiện quy chế và giá trị giữ lựa chọn tương lai.
3. Chưa có registry tổ hợp đầy đủ theo trường/ngành/năm/phương thức; vẫn chỉ có chín tổ hợp thử nghiệm.
4. CareerFit hiện chưa hoàn thiện dựa trên học lực từng môn; chưa truyền kết quả tổ hợp thực sang gợi ý ngành/trường.
5. Gemini Official Source Reader đã có nhưng chưa tự đưa mọi kết quả qua quy trình xác nhận để ra khuyến nghị.
6. Closed-loop thực tế Orion → Pulse → đo lại chưa đủ chứng cứ nghiệm thu.
7. Chưa build production / chạy browser E2E trên bản ZIP này; không thể bảo đảm không có lỗi runtime trước khi thử trên máy người dùng.

## 6. Trình diễn hấp dẫn — lộ trình 4 cảnh (không làm giả AI)
**Cảnh 1, 'Cognitive Snapshot' (Seed → Lumen):** người dùng nhập điểm và trạng thái học tập → hiển thị radar/heatmap theo môn và timeline, ghi 'chỉ số thử nghiệm' khi cần.

**Cảnh 2, 'Decision Lab' (Atlas, bắt đầu tại bước 06):** điểm thay đổi làm các thẻ tổ hợp đổi theo; bấm thẻ để giải thích phép tính và cảnh báo dữ liệu thiếu. Đường dẫn nguồn chính thức mở từ trường/ngành khi có dữ liệu duyệt.

**Cảnh 3, 'What-if to Action' (Orion):** hai kịch bản cạnh nhau; người học chọn hành động 7/14 ngày, check-in; hệ thống không hứa một thay đổi điểm mang tính nhân quả.

**Cảnh 4, 'Growth Timeline + Evidence Drawer' (Pulse):** hiển thị trước/sau và dữ liệu đo thực, bằng chứng, phiên bản công thức, giới hạn; phần 'kết quả đo' tách biệt với 'kết quả mô phỏng'.

Nguyên tắc thiết kế: có một điểm gây tò mò và một hành động tương tác có ý nghĩa trên mỗi màn hình; không dùng hoạt ảnh làm mất khả năng đọc, ưu tiên accessibility và chế độ giảm chuyển động; không dùng demo synthetic làm chứng minh nghiên cứu.

## 7. Áp dụng ZIP và lệnh kiểm tra trên Windows
1. Sao lưu `C:\Gạo\Cognitive-Learn` đang có.
2. Giải nén FULL SOURCE ZIP, chép **nội dung bên trong** vào `C:\Gạo\Cognitive-Learn`. Không xóa `.env` hoặc `node_modules`. Nếu source Windows có commit mới hơn, cần đối chiếu thay vì chép đè mù.
3. Chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm test
node --test tests/step06-subject-score-contract.test.cjs
npm run build
npm run dev
```

4. Mở Atlas tại `/atlas/vietnam` (nếu nút tìm đúng trang vào `/atlas`), tìm 'Khám phá điểm mạnh theo tổ hợp'. Thử Toán 8, Văn 7, Anh 9 → D01 24/30; xóa Văn → D01 phải báo thiếu, không được xếp; nhập Văn 0 → D01 17/30; thử giá trị 12 → cảnh báo; thử loại điểm Học bạ → không xếp nhóm theo mốc THPT.

**Next checkpoint:** Seed → Atlas ScoreObservation adapter và Subject Optimizer theo môn thi/tổ hợp của chương trình mới, không viết lại tất cả module cùng lúc.
