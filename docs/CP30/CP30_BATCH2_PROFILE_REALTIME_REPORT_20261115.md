# CLA CP30 Batch 2 — Realtime Profile & Cognitive History

**Ngày:** 2026-11-15. **Nền source:** `CLA_FULL_SOURCE_CP30_BATCH1_REALTIME_SEED_20261115.zip`.

## Mục tiêu và phạm vi

CP30 Batch 1 bảo vệ bảng điểm realtime và trang kiểm tra lưu trữ. Batch 2 bảo vệ nguồn hồ sơ cho Dashboard / Lumen — trước đó `useStudentProfile()` chỉ dùng `getDoc` một lần nên không tự cập nhật sau khi hồ sơ đổi ở tab khác.

### Code thay đổi

1. `src/page/seed/hooks/useStudentProfile.ts`: sử dụng `onSnapshot(..., {includeMetadataChanges:true})` với `isServerConfirmedSnapshot`; không chuyển dữ liệu `fromCache=true`/`hasPendingWrites=true` thành hồ sơ xác minh. Có `sessionEpoch` (A→B→A) và `snapshotEpoch` (nhiều cập nhật cùng UID) để loại callback và kết quả lịch sử tới trễ. Ràng buộc UID, bỏ dữ liệu khi thiếu quyền hoặc đăng xuất.
2. `src/engines/history/cognitiveHistoryRepository.ts`: thêm `getVerifiedCognitiveHistory()` bằng `getDocsFromServer()`. Lịch sử Cognitive cache không được diễn giải như phép đo mới; lỗi lịch sử hiển thị giới hạn nhưng không xóa hồ sơ đã xác minh.
3. `src/page/seed/StudentPage.tsx`: trạng thái chờ xác minh rõ ràng; không mời tạo hồ sơ khi dữ liệu chưa xác thực; tách lỗi hồ sơ và cảnh báo lịch sử; thông báo thành công sau lưu vẫn hiển thị khi hồ sơ đã xác minh.
4. `src/page/lumen/LumenPage.tsx`: từ chối dùng hồ sơ cache, có thông báo đang xác minh lịch sử trước khi kết luận Growth.
5. `tests/cp30-profile-realtime.test.cjs`: 12 ca `CP30-P01…P12` bao phủ realtime, pending writes, offline cache, A→B→A, đổi snapshot cùng UID, ghi đè lịch sử đến trễ, sai chủ sở hữu, thiếu quyền, đăng xuất và lỗi mạng.
6. `package.json`: thêm `test:cp30:profile`, `verify:cp30:batch2`, gắn kiểm thử mới vào `npm test`.

## Kết quả chạy ngay trong môi trường đóng gói

- `npm run test:cp30:profile`: **12/12 PASS**.
- `npm run verify:cp30:batch2`: **PASS (exit 0)** — bao gồm CP30 Batch 1, regression CP29 Batch 4, Rules tĩnh, và layout.
- 4 file TypeScript / TSX được sửa: **0 lỗi cú pháp theo TypeScript transpileModule** (không thay thế `tsc -b`).
- `npm test`: **FAIL do môi trường**, tại `CONTRACT-01` của `step11-prediction-semantics.test.cjs`, thiếu các `@types` cho React/Node/d3 trong `node_modules` dùng chung. Các test CP30 mới không thất bại. Không được tính toàn bộ suite là PASS.
- `npm run build`, Firestore Emulator (83 ca), browser E2E: **chưa chạy/không xác nhận trong môi trường này**.
- Không sửa Firebase Rules ứng viên, production Rules, file cấu hình deploy hoặc Functions.

## Nghiệm thu Windows

Trước khi ghi đè, sao lưu các file trùng tên. Bản vá áp dụng **lên source CP30 Batch 1**, hoặc dùng full source Batch 2 thay thế.

```powershell
npm run test:cp30:profile
npm run verify:cp30:batch2
npm test
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

**Cổng E2E vẫn cần:** Hai tab cùng UID thay đổi mục tiêu/GPA; offline → online; từ cache sang server; A→B→A; Student thu hồi consent khi Dashboard/Lumen đang mở; dữ liệu Cognitive lịch sử đọc thất bại; kiểm tra không hiển thị dữ liệu tài khoản khác. Test unit sử dụng mock không thay thế Firebase SDK/Emulator thực.

## Giới hạn khoa học / dữ liệu

- Realtime profile không phải bằng chứng tác động giáo dục, hay đo lường thực nghiệm trên học sinh.
- `gpaSummary` vẫn lấy từ hồ sơ được lưu cùng transcript trong transaction CP29; Batch 2 **chưa** xây cơ chế kiểm tra tính nhất quán liên collection độc lập hoặc migration dữ liệu legacy.
- `getVerifiedCognitiveHistory` bảo vệ nguồn tải từ cache, nhưng chưa có xác nhận dữ liệu outcome độc lập từ nhà trường.
- Các module khác ngoài Dashboard/Lumen/Atlas có thể vẫn sử dụng nguồn đọc cũ; cần kiểm toán những điểm này ở các batch sau.
- Không tuyên bố CP30 hoàn thành/được reviewer phê duyệt vì chưa có E2E và toàn bộ 12 tiêu chí của nhóm.
