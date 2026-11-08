# KIỂM TOÁN CẤU TRÚC & TIẾN ĐỘ COGNITIVE LEARN AI — CLA(7)

**Ngày kiểm tra:** 08/11/2026. **Đầu vào:** tệp `CLA(7).zip` được người dùng cung cấp, tài liệu Execution Master V3, log PowerShell trong hội thoại. **Không có kết nối vào production hay tài khoản Firebase thực.**

## 1. Tóm tắt quản trị

**Mức độ triển khai theo hạng mục có bằng chứng: 27/145 (18,6%).** Trong đó Website 22/76 (28,9%) và Nghiên cứu 5/69 (7,2%). Đây **không phải phần trăm sản phẩm đã hoàn thành**: các trạng thái này đều là `IN_PROGRESS`. **Số hạng mục đạt chuẩn nghiệm thu đầy đủ: 0/145 (0%)** vì chưa có bộ bằng chứng end-to-end tương ứng. 118 mục còn `NOT_STARTED` theo kiểm toán thận trọng. Hai hệ chấm Website /100 và Nghiên cứu /100 **chưa thể chốt** vì checklist chưa có bằng chứng đủ điều kiện cộng điểm.

**So với tracker CLA6:** 19 → 27 hạng mục `IN_PROGRESS`; tám mục bổ sung `A2`, `C6`, `H2`, `I1`, `K12`, `K13`, `K14`, `K16` được đánh dấu có bắt đầu **chỉ nhờ bằng chứng mã nguồn/test**, không nâng bất kỳ mục nào lên PASS.

## 2. Phát hiện trong ZIP gốc và thay đổi đã thực hiện

- ZIP gốc chứa **46.561 entry** (bao gồm thư mục và cache phụ thuộc). Đã loại khỏi bản bàn giao các file trong `.git/`, `node_modules/`, `dist/`, `.vercel/`, `.firebase/` và các tệp `.env`, `.env.local`, `firestore-debug.log`, `tsconfig.tsbuildinfo`. Bản sạch không chứa cấu hình bí mật local.
- Đã xác thực **12 trường hợp file trùng nội dung byte-for-byte**, dọn file thừa; **14 tệp được chuyển về đường dẫn chuẩn** (bao gồm Word đặc tả về `docs/specifications/`). Không phát sinh xung đột nội dung không thể xử lý trong bản ZIP này.
- Đường dẫn chuẩn: Python → `research/src/`; bản 120 LLM → `research/benchmarks/`; nghiên cứu phạm vi → `research/protocol/`; bằng chứng → `research/evidence/`. Script Firebase chính duy nhất ở gốc, bản PowerShell legacy khác nội dung lưu trong `docs/archive/` để không mất dữ liệu.
- Không xóa `src/styles.full.backup.css`: `tools/split-css.cjs` vẫn sử dụng tệp này. Bỏ nó sẽ làm hỏng công cụ; **đây là ngoại lệ có chủ đích**.
- `firestore.rules.CANDIDATE` (cũ) được lưu trong `docs/archive/`; chỉ `firestore.rules.CANDIDATE_CP21` còn ở gốc dùng cho Emulator. File `firebase.emulator.checkpoint.json` cũ cũng lưu `docs/archive/`.
- Bổ sung `tools/FIX_CLA7_LAYOUT.ps1` để sửa workspace Windows an toàn, `tools/RUN_FIRESTORE_ASCII.ps1` để chạy test ở đường dẫn ASCII; bổ sung chặn log Emulator trong `.gitignore`.

Chi tiết đích di chuyển và mã SHA-256 có trong `docs/CLA7_SOURCE_MANIFEST.csv`, `docs/CLA7_FILE_MOVES.csv` và `CLA7_STRUCTURE_AUDIT.json` ở cấp thư mục bàn giao.

## 3. Các kiểm thử chạy trực tiếp trong lần kiểm toán này

| Cổng kiểm thử | Kết quả | Ý nghĩa và giới hạn |
|---|---|---|
| Kiểm tra layout | **PASS**: 22 đường dẫn bắt buộc, 11 vị trí legacy vắng mặt | Kiểm tra tĩnh thư mục, chưa kiểm tra ứng dụng trên browser |
| Academic engine | **14/14 PASS** | Định dạng điểm, 9 môn, tính hợp lệ |
| Cognitive observation | **4/4 PASS** | Phân biệt thiếu dữ liệu (`null`) và số 0 thật, provenance |
| Nexus/điều hướng (static) | **8/8 PASS** | Đường dẫn/anchor hiện trong source; **không** phải E2E |
| Rules contract (static) | **12/12 PASS** | Kiểm tra cấu trúc Rules, **không** thay cho Emulator |
| Research scope tests | **4/4 PASS** | Chặn dữ liệu synthetic, thiếu cột/quyền |
| 120 LLM draft cases | **PASS kiểm tra manifest** | 120 ID, 7 nhóm; **chưa chạy mô hình, chưa có gold review** |
| TypeScript + Vite build | **PASS theo log Windows người dùng** trước khi chuẩn hóa | Chưa build lại từ bản ZIP này do dependency/runtime cục bộ không được tái cài trong container |
| `npm audit` | **0 vulnerabilities theo log Windows ngày 08/11** | Không phải kiểm định lỗ hổng của chính mã nguồn hoặc bằng chứng CI mới |
| Firestore Emulator 33 cases | **NOT RUN** | Java khởi động thất bại trước khi nạp test; không được công bố là 33/33 PASS |
| Browser E2E / Vercel Preview / production | **NOT RUN** | Chưa có xác nhận luồng 4 vai trò hoặc 22 Admin cards |
| CI GitHub / `npm ci` trong clean runner | **NOT RUN** | Có file workflow, chưa có log CI thành công |

## 4. Lỗi Firestore Emulator — đã xác định nguyên nhân chính từ log

`CLA(7).zip` chứa `firestore-debug.log` nguyên bản, trong đó ghi:

```text
java.io.FileNotFoundException: C:\G?o\Cognitive-Learn\firestore.rules.CANDIDATE_CP21
```

Máy Windows đang dùng thư mục `C:\Gạo\Cognitive-Learn`, nhưng đường dẫn vào Java bị thay ký tự tiếng Việt bằng `?`. Điều này khiến Firestore Emulator không thể nạp Rules và thoát code 1 **trước khi chạy bất kỳ bài test nào**. Log còn báo `NoClassDefFoundError: ...LegacySystemExit` khi xử lý exception, nên sau khi khắc phục đường dẫn, nếu Emulator vẫn lỗi phải kiểm tra lại log mới; không mặc định đã chữa tất cả lỗi Java.

Đã bổ sung **script tạo workspace kiểm thử riêng chỉ dùng ASCII**. Script không dùng production, không thay đổi Firebase Rules đang deploy. Điều kiện PASS cần **33/33 bài Emulator thực chạy** và đối chiếu Rules candidate với version production trước khi Publish.

## 5. Tình trạng theo hai nhánh

| Nhánh | Tổng task | Đang triển khai có bằng chứng | Đã nghiệm thu đầy đủ | Chưa có bằng chứng triển khai | Tỷ lệ có triển khai |
|---|---:|---:|---:|---:|---:|
| Website | 76 | 22 | 0 | 54 | 28,9% |
| Nghiên cứu | 69 | 5 | 0 | 64 | 7,2% |
| **Tổng** | **145** | **27** | **0** | **118** | **18,6%** |

**Cách tính:** tỷ lệ có triển khai = `IN_PROGRESS / total`. Vì đầu việc có khối lượng khác nhau và chưa được đo effort thực tế, **không thể suy ra % kỹ thuật đã hoàn thiện** bằng phép chia này. Tỷ lệ nghiệm thu đủ hồ sơ = `PASS / total = 0%`. 0% nghiệm thu không có nghĩa mã nguồn CLA đang rỗng; có nhiều engine/module và bài test đã xây. Các target dự thi KHKT là mục tiêu chứ không phải xác suất thực nghiệm.

## 6. Những phần quan trọng chưa thể ký nghiệm thu

1. **Firestore Security:** 33 ca runtime, ma trận role/UID, khoá môn, báo cáo chia sẻ và lưu giao dịch thực tế.
2. **Authentication & application:** Student/Teacher/Parent/Admin E2E, lỗi token, Vercel deep-link, Nexus 22 card, chế độ demo, mobile/a11y.
3. **Backend & chất lượng:** Gemini Lumen/Atlas đầu-cuối, giới hạn chi phí ở production, quyền admin backend, log/monitoring.
4. **CI & phát hành:** `npm ci` từ bản mới, PR checks, secrets scanner, preview deploy, xác thực không lộ key trong lịch sử Git.
5. **Nghiên cứu:** nguồn được cấp phép và versioned, chuẩn nhãn outcome thật, psychometric/ML validation, báo cáo uncertainty, benchmark LLM với gold/eval, claim–evidence ledger. Synthetic/demo **không** được dùng để tuyên bố hiệu quả.

## 7. Cách áp dụng lên workspace Windows hiện tại

**Sao lưu/commit trước, không chép đè toàn bộ dự án cũ nếu đang có thay đổi chưa lưu.** Có hai phương án:

**A. Dùng ZIP nguồn sạch:** Giải nén vào một thư mục mới, ví dụ `C:\CLA-TEST` (không có dấu), chạy `npm ci`, cấu hình `.env` local riêng khi cần, rồi `npm test`, `npm run check:layout`, `npm run test:rules:static`, `npm run build` và `npm run test:rules:emulator`.

**B. Sửa workspace hiện có:** Chép `tools/FIX_CLA7_LAYOUT.ps1` và `tools/RUN_FIRESTORE_ASCII.ps1` từ gói overlay vào `C:\Gạo\Cognitive-Learn\tools\`, rồi chạy:

```powershell
cd 'C:\Gạo\Cognitive-Learn'
.\tools\FIX_CLA7_LAYOUT.ps1 -WhatIf
.\tools\FIX_CLA7_LAYOUT.ps1
npm run check:layout
npm run test:rules:static
.\tools\RUN_FIRESTORE_ASCII.ps1
```

Script layout lưu file có xung đột vào `docs/archive/legacy-layout/` thay vì mất nội dung. Script Emulator **chạy `npm ci` trong workspace ASCII mới** và dùng Firebase CLI + Java có sẵn; nó **không chạy deploy**. Nếu vẫn lỗi, gửi `firestore-debug.log` tạo ở workspace ASCII, không cần cung cấp token hay `.env`.

## 8. Kết luận và cổng tiếp theo

- **Đã đạt:** cấu trúc mã nguồn chuẩn, loại bản trùng có bằng chứng SHA, loại dữ liệu bí mật khỏi gói, unit/static/research gates nêu ở mục 3.
- **Chưa đạt:** Firestore runtime, browser E2E, CI/production, kiểm định nghiên cứu. **Không đánh dấu PASS thêm bất cứ hạng mục nào của 145 task.**
- **Bước tiếp:** chạy 33 ca Emulator trên đường dẫn ASCII, xử lý test FAIL theo chứng cứ; sau đó CI, frontend E2E, và tiếp tục Website/Nghiên cứu theo 145 hạng mục gốc — không cắt scope.
