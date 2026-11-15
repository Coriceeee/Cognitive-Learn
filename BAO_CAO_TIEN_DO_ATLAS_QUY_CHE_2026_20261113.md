# BÁO CÁO TIẾN ĐỘ — CLA / ATLAS / QUY CHẾ NGUYỆN VỌNG 2026

Ngày lập: 13/11/2026. Nền full source: **CP37 đã gộp bước 02–05B**. Loại thay đổi: **1 lỗi nghiệp vụ trong Atlas**, không triển khai Gemini trong lượt này.

## A. Kết quả cụ thể

**Sửa đúng 2 file source**:
- `src/lib/aspirationPlanner.ts`: hằng số quy chế 2026 có link chính thức, giới hạn 15 NV; tuyển sinh đào tạo giáo viên chỉ ở NV01–NV05; không nhét lựa chọn đào tạo giáo viên còn lại xuống NV06–NV15; hỗ trợ tên Giáo dục Tiểu học/Mầm non, mã 71402xx, mã cao đẳng 51140201 và cờ phân loại; không dùng bản ghi năm khác để xếp nguyện vọng 2026; không cho dữ liệu INVALID vào danh sách.
- `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx`: công bố quy tắc và link nguồn trên trang, đánh dấu các lựa chọn đào tạo giáo viên, ưu tiên cảnh báo quan trọng trước cảnh báo khác.

**Thêm 1 test**: `tests/atlas-aspiration-policy-2026.test.cjs`.

Văn bản: Khoản 3 Điều 14 Thông tư 06/2026/TT-BGDĐT, https://vanban.chinhphu.vn/?classid=1&docid=217071&pageid=27160 .

**Bảo toàn:** không sửa `admissionRules.ts`, `atlasBenchmarkBridge.ts`, Seed, Lumen, Firestore, Gemini/API, package.json, Vite config hoặc các dữ liệu chính thức.

## B. Kết quả kiểm thử thực tế

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Test mới quy chế 2026 | **14/14 PASS** | Bao gồm 2 test đi qua `runAdmissionEngine` với dữ liệu tổng hợp |
| Test Atlas bước 03–04 | **18/18 PASS** | Hồi quy benchmark + kiểm tra nguồn |
| Test Seed 05A | **9/9 PASS** | Chạy với `node --experimental-strip-types` |
| Test Seed 05B | **9/9 PASS** | Roundtrip dữ liệu giả lập |
| Test academic | **14/14 PASS** | Công thức và nhập điểm |
| Test cognitive observation | **4/4 PASS** | Missing vs zero |
| Test CP37 Guide | **4/4 PASS** | Cấu trúc hướng dẫn |
| Firestore rules tĩnh | **15/15 PASS** | **Không** thay thế test Firebase Emulator |
| Kiểm tra layout | **PASS** | 22 file và 19 vị trí cũ |
| Parse TypeScript 2 file sửa | **2/2 PASS** | Cú pháp, không phải full typecheck |
| `npm test` đầy đủ | **FAIL tại CP30 (3/4 PASS)** | Assertion cũ đòi `25-...css` ở import cuối dù CP37 có `26-...css`; đã xuất hiện trước bản vá này |
| `npm run build` trong sandbox | **CHƯA PASS** | Source ZIP không có `node_modules`, TypeScript không tìm được `react`, `firebase` và JSX types; phải thử trên máy đã `npm ci` thành công |
| Browser / Firebase Emulator E2E | **CHƯA CHẠY** | Cần nghiệm thu trên môi trường đầy đủ |

Kết luận kiểm thử: **Phạm vi code mới và hồi quy chọn lọc PASS. Chưa có căn cứ gọi production build/E2E PASS.**

## C. Lộ trình 28 bước — tiến độ đến lúc bàn giao

| Hạng mục | Trạng thái |
|---|---|
| 01. Backup/branch/rollback máy người dùng | Chưa được xác nhận |
| 02. Lumen | Có bản sửa, chờ nghiệm thu browser |
| 03. Atlas benchmark guard | Có bản sửa, chờ nghiệm thu browser |
| 04. Atlas benchmark bridge | Có bản sửa, chờ nghiệm thu browser |
| 05A. Seed validation | Có bản sửa và 9 test mới PASS |
| 05B. Seed roundtrip | Có bản sửa và 9 test mới PASS |
| **Atlas 2026: NV1–NV5 / tối đa 15 NV** | **Có bản sửa, 14 test PASS, chờ nghiệm thu browser** |
| 06–28 | **23 bước chưa triển khai** |

**164 mã việc tổng:** chưa cộng thêm mục PASS nghiệm thu trong lượt này (0 mục mới đóng) vì người dùng chưa xác nhận bản vá chạy trên website. Không tự quy đổi tỷ lệ phần trăm hoàn thiện từ số lượng test.

**Đã có tổng cộng 6 gói thay đổi nhỏ trong chuỗi hiện tại:** Lumen 02, Atlas 03, Atlas 04, Seed 05A, Seed 05B và Atlas quy chế 2026. Số này chỉ thể hiện **bản vá đã tạo**, không phải 6 bước đã nghiệm thu hoàn tất trong thang 28 bước.

## D. Còn thiếu — chốt riêng, không sửa gộp

1. Browser E2E xác nhận thông báo quy chế và vị trí NV; quy trình lưu thứ tự chọn tay của học sinh chưa có.
2. Xác minh dữ liệu chương trình đào tạo giáo viên từ ngành/mã xét tuyển/trường cụ thể thay vì chỉ suy từ tên/mã ngành. Không dùng tên trường để kết luận.
3. Triển khai Gemini + Google Search/URL context cho **tra cứu nguồn**, sau đó xây lớp xác minh nguồn có hiệu lực/năm/ngành/phương thức; không nhập trực tiếp nội dung LLM vào KB như dữ liệu được công nhận.
4. Test CP30 lỗi thời cần sửa trong một bước QA riêng; không gộp vào Atlas.
5. Firestore emulator/E2E/baseline research và validation của SCI/ML vẫn chưa đạt gate.

## E. Hướng dẫn kiểm thử trên máy Windows

```powershell
cd "C:\Gạo\Cognitive-Learn"
node --test tests/atlas-aspiration-policy-2026.test.cjs
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs tests/step04-atlas-benchmark-bridge.test.mjs
npm run build
npm run dev
```

Gói full source này **không chứa `node_modules` hoặc `.env`**. Sao lưu Git/file trước khi copy đè nếu đã sửa source mới hơn bản gốc 05B.
