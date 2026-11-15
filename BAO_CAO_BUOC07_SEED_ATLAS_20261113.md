# CLA — BÁO CÁO BƯỚC 07: ĐỒNG BỘ SEED → ATLAS
**Ngày:** 13/11/2026  
**Nền:** `CLA_FULL_SOURCE_BUOC06_ADMIN_LOGIN_HOTFIX_20261113.zip`  
**Phạm vi:** Một chức năng liên thông bảng điểm, không chỉnh quy chế nguyện vọng 2026, không đổi Firestore schema và không viết lại các module khác.

## A. Kết quả đã có code

1. Atlas đọc bảng điểm chính chủ bằng hook `useStudentTranscript`, dùng `student_transcripts/{uid}` hoặc bản lưu legacy `learning_profiles/{uid}`; không dùng điểm của tài khoản vừa đăng xuất.
2. Adapter `seedAtlasScoreAdapter.ts` map tên môn Seed sang `SubjectCode` Atlas với 11 mã đã có, chỉ dùng **điểm trung bình môn của học kỳ đã hoàn tất** (status `COMPLETE`). Điểm 0 được giữ; `PARTIAL` và `MISSING` không bị tự quy thành 0.
3. Một lần import lấy **cùng một học kỳ**. Chế độ tự chọn ưu tiên học kỳ mới nhất có tổ hợp đang được hỗ trợ và đủ dữ liệu. Không ghép Toán kỳ này với Văn/Anh kỳ khác.
4. Trên Atlas có khung **“Seed → Atlas · Dữ liệu có nguồn”**: người học xem học kỳ, số môn đủ dữ liệu, số tổ hợp; có thể chọn học kỳ và chủ động nạp lại.
5. Tự nạp vào biểu mẫu chưa từng được chỉnh sửa khi dữ liệu Seed sẵn sàng; sau khi người dùng sửa tay hoặc xóa điểm, Firestore không tự ghi đè.
6. Mọi điểm do Seed cung cấp đều gắn `school` (học bạ); đổi loại điểm xóa điểm Atlas đang nhập. Không đưa điểm học bạ sang nhánh `official_thpt_2026` để đối chiếu mốc điểm chuẩn THPT.
7. CSS bám theo Atlas Decision Studio, có trạng thái tải/trống/lỗi và thích ứng màn hình nhỏ.

**Không hoàn thành trong lượt này:** engine chọn hai môn thi; mở rộng 9 tổ hợp; tra cứu/chứng thực phương thức tại mọi trường; hồ sơ học bạ chính thức; Gemini source review; quy trình consent; Firebase Emulator; trình duyệt production; mô hình ML đã xác nhận. Đây không phải bản đánh giá khả năng trúng tuyển bằng điểm học bạ.

## B. Các file đã thay đổi

| Loại | File | Ghi chú |
|---|---|---|
| MỚI | `src/lib/seedAtlasScoreAdapter.ts` | Adapter dữ liệu học bạ đầy đủ từ **một** học kỳ |
| SỬA | `src/page/seed/hooks/useStudentTranscript.ts` | Xuất `userId`, khóa callback tài khoản cũ, xử lý lỗi auth |
| SỬA | `src/page/atlas/components/AtlasAdmissionEnginePanel.tsx` | Tự đọc Seed + UI chọn học kỳ/nạp lại + ngăn trộn loại điểm |
| SỬA | `src/styles/07-atlas.css` | Khung UI và responsive |
| MỚI | `tests/step07-seed-atlas-bridge.test.cjs` | 13 test riêng |
| SỬA | `package.json` | Thêm `test:seed-atlas`, nối test vào `npm test` |

Không sửa dữ liệu Firestore, file Auth/Admin hotfix hay công thức GPA.

## C. Kiểm thử thực tế

- `node --test tests/step07-seed-atlas-bridge.test.cjs`: **13/13 PASS** (gồm callback Firestore đến muộn sau đổi tài khoản).
- `npm test` toàn dự án: **PASS**, 157 test case trong các nhóm `node:test`, **0 fail** (còn các script kiểm thử riêng lẻ cũng đã chạy trong chuỗi).
- `npm run test:rules:static`: **15/15 PASS**. Đây chỉ là kiểm tra cấu trúc rules, **không chứng minh phân quyền production**.
- `npm run check:layout`: **PASS** (22 file cần có, 19 vị trí cũ không còn).
- TS/TSX transpile cú pháp các file thay đổi: **PASS**.
- `npm run build`: **CHƯA PASS** tại môi trường đóng gói; TypeScript dừng vì thiếu thư viện/typings React, Firebase và `node_modules` từ bản source. Không đủ căn cứ nhận định build đã thành công trên máy người dùng.
- `firebase emulators`, trình duyệt E2E, liên kết tài khoản Admin và học sinh thật: **CHƯA CHẠY**.

## D. Tiến độ minh bạch

- Lộ trình quản lý: **28 bước**.
- Có bản vá tại các bước **02, 03, 04, 05, 06, 07 = 6/28 = 21,4% theo số bước đã có code**, không phải 21,4% hoàn thiện sản phẩm.
- Bước 01 (backup), bước 08–28 và nghiệm thu thực tế vẫn chưa khép lại. **Còn 22 bước chưa có bản vá/được xác nhận** theo cách đếm này.
- Checklist kế thừa: **164 đầu việc**; **0 mục mới được cộng PASS nghiệm thu production** trong lượt này. P0-5 trong Sổ đăng ký điều chỉnh có code/test, **vẫn cần nghiệm thu Firestore và trình duyệt**.
- Không thể tính một % hoàn thiện toàn sản phẩm đáng tin chỉ từ số file, test hoặc bước. Những tiêu chí P0 về phân quyền thực tế, consent vị thành niên, nhãn probability sai nghĩa vẫn chưa đủ bằng chứng đạt.

## E. Rủi ro và thứ tự kế tiếp

1. **P0 trước khi cho học sinh thật dùng:** thử Firestore rules bằng Emulator, luồng consent/assent và chính sách riêng tư, kiểm soát nhãn xác suất mô phỏng (P0-1 đến P0-4 trong tài liệu người dùng gửi). Không nâng hệ thống thành production nếu chưa đạt các gate này.
2. Kiểm tra trình duyệt: tạo tài khoản học sinh hợp lệ, lưu bảng điểm có Toán 8/Văn 7/Anh 9 trong cùng kỳ, mở Atlas và xác nhận D01 24/30 ở trạng thái học bạ; chuyển sang điểm THPT thì mọi ô phải trống.
3. Sau nghiệm thu: xây engine đề xuất hai môn tự chọn của kỳ thi theo các môn đã học lớp 12; mở rộng tổ hợp có chứng cứ trường/ngành/năm; Gemini chỉ làm công cụ tìm nguồn nháp chờ duyệt.
4. Tồn tại dữ liệu chương trình học theo thời gian: `buildTranscriptView()` đang dùng **danh mục môn hiện tại** để đọc cả sáu kỳ; nếu học sinh thay đổi môn học giữa năm/lớp cần schema thời gian trước khi đưa ra kết luận chính thức.
5. `Score`/`fit`/`eligibility`/`probability` chưa có governance thống nhất toàn bộ 7 module; không claim ML hay hiệu quả nghiên cứu.

## F. Cài đặt

1. Sao lưu toàn bộ `C:\Gạo\Cognitive-Learn` hoặc tạo Git commit trước khi copy.
2. Giải nén full source, copy **nội dung bên trong ZIP** vào `C:\Gạo\Cognitive-Learn`, không chép cả thư mục bọc. Nếu có source mới hơn bản hotfix Admin cần so sánh trước khi ghi đè.
3. Không xóa `.env`, `.env.local`, `node_modules`. Chạy:

```powershell
cd "C:\Gạo\Cognitive-Learn"
npm ci
npm run test:seed-atlas
npm test
npm run build
npm run dev
```

4. Đăng nhập học sinh, nhập điểm tại Seed, mở `/atlas`, tìm **“Dùng bảng điểm học sinh đã lưu”**, xác minh đủ năm kiểm tra: cùng kỳ, số 0, thiếu dữ liệu, đổi loại điểm, đăng xuất/đổi tài khoản.

**Định nghĩa PASS bước 07:** Cần có ảnh/video hoặc log chạy đúng trên máy với dữ liệu học sinh (không dùng dữ liệu thật trong báo cáo công khai), cùng kết quả build và kiểm tra quyền Firestore; hiện trạng **code/test PASS — chờ nghiệm thu**.
