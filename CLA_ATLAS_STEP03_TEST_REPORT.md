# CLA · Bước 03 — Ngăn xếp nhóm nguyện vọng khi thiếu căn cứ

Ngày: 12/11/2026. Nguồn nền: `CLA_CP37_OPERATING_GUIDE_FULL_SOURCE_20261111.zip`.

## Phạm vi bản vá

**2 file source thay đổi, 1 file regression test mới:**

- `src/lib/admissionRules.ts`: bỏ fallback 82/68 khi không có benchmark; chặn phân loại nếu chương trình chưa xác minh, mốc không hợp lệ, thiếu xác minh mốc/năm/phương thức, hoặc chỉ có điểm ngoài phương thức THPT mà chưa có bảng quy đổi.
- `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx`: sửa nhãn sẵn sàng và thông báo trạng thái khi chưa nối nguồn điểm chuẩn; không khuyên học sinh “tăng điểm mô phỏng” để khắc phục thiếu nguồn.
- `tests/step03-admission-benchmark.test.mjs`: 7 bài kiểm thử trực tiếp và source-level cho trường hợp có/thiếu/không hợp lệ mốc tham chiếu.

**Không thay** Firestore, dữ liệu ngành/trường, Lumen, CSS, routing, mô hình ML, hàm quy đổi điểm hay thứ tự thực thi của các module khác. Bản vá riêng; không đóng gói lại toàn bộ source.

## Trạng thái sau sửa

- Nếu học sinh có điểm cao nhưng KHÔNG có điểm chuẩn: `valid=false`, `riskLevel=INVALID`, không đủ điều kiện để xuất nguyện vọng.
- Chương trình chưa được xác minh: không xếp nhóm kể cả khi có số điểm chuẩn.
- Điểm chuẩn sai thang 0–30/0–100, thiếu xác minh mốc, sai năm hoặc sai phương thức: không xếp nhóm.
- Điểm SAT/HSA/... không được đem so sánh trực tiếp với điểm chuẩn THPT theo phép chia thang 0–100.
- Khi tất cả điều kiện được xác minh trong một phép thử đơn vị, quy tắc chênh lệch điểm hiện tại có thể phân nhóm **mang tính mô tả**. Chưa phải xác suất trúng tuyển hay ngưỡng đã được hiệu chuẩn.

**Giới hạn có chủ đích:** Adapter `toAdmissionPrograms()` của CP37 chưa nối `AtlasProgram.benchmark` đến engine; hiện nó truyền `benchmarkScore: undefined`. Bản vá này **không** tự nối nguồn, vì trước tiên cần xác minh đúng nguồn, năm và phương thức. Vì vậy không được nói Atlas đã gợi ý trường hoàn chỉnh sau bước 03. Việc nối điểm chuẩn có chứng cứ là bước tiếp theo riêng.

## Bằng chứng kiểm thử trong môi trường tác giả

| Gate | Kết quả | Giới hạn |
|---|---|---|
| `node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs` | **PASS 7/7** | Unit + contract checks; không có Firebase/browser |
| Regression contracts CP35, CP36, CP37, module hierarchy | **PASS 18/18** | Không chạy toàn bộ npm test |
| TypeScript transpile syntax 2 tệp sửa | **PASS 2/2** | Không thay thế full `tsc -b` |
| SHA256 và diff từ CP37 | **PASS** | 2 file source có thay đổi; không phát hiện xóa/tạo source khác |
| `npm ci`, `npm run build`, browser E2E, Firebase Emulator | **NOT RUN** | Cần nghiệm thu trên source Windows đang chạy |

## Áp dụng bản vá có kiểm tra và sao lưu

Giải nén ZIP vào thư mục tạm (không đè lên dự án). Mở PowerShell và chạy:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\duong-dan\CLA_ATLAS_STEP03_APPLY.ps1" -ProjectRoot "C:\Gạo\Cognitive-Learn" -DryRun
```

Nếu DryRun PASS, bỏ `-DryRun` để áp dụng. Script từ chối khi hai file trên máy khác SHA256 CP37 đã kiểm toán. Nếu khác thì **không tự ý ghi đè**, kiểm tra diff thủ công.

```powershell
powershell -ExecutionPolicy Bypass -File "C:\duong-dan\CLA_ATLAS_STEP03_APPLY.ps1" -ProjectRoot "C:\Gạo\Cognitive-Learn"
cd "C:\Gạo\Cognitive-Learn"
node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs
npm run build
npm run dev
```

Kiểm tra ở `/atlas/recommendations`: nhập đủ điểm nhưng khi thiếu dữ liệu chuẩn, không xuất nhóm trường hay thứ tự nguyện vọng giả. Mốc điểm chưa xác minh phải có cảnh báo. Browser nghiệm thu vẫn cần chủ dự án xác nhận.

**Rollback:** script tạo bản sao lưu tại `.cla-backups/atlas-step03_<timestamp>/` cho 2 file source; copy 2 file sao lưu về vị trí cũ và xóa file test mới nếu muốn khôi phục nguyên trạng.
