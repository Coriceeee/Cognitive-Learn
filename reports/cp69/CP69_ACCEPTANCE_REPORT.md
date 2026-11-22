# CP69 — Firebase data consistency hardening / MVP bridge

**Ngày báo cáo:** 22/11/2026 · **Nguồn:** CP68 nguyên bản · **Phạm vi:** Atlas workspace, Daily Companion, Rules ứng viên; không thay đổi thuật toán AI/ML.

## Đã thay đổi trong mã nguồn

1. **Atlas full-workspace compare-and-swap:** `useAtlasKnowledge` dùng `runTransaction` thay cho `setDoc` ghi đè. Phiên bản `revision` chỉ được tăng 1 sau khi kiểm tra bản gốc đã xác minh; `atlasWorkspaceRevision.ts` đối chiếu nội dung cả ba danh sách `universities`, `sources`, `programs`, và nhận diện dữ liệu legacy chưa có revision.
2. **Firestore Rules hai bản ứng viên:** `atlas_workspaces/{uid}` bắt buộc `revision == 1` khi tạo và `revision == resource.data.get('revision', 0) + 1` khi cập nhật. Không nới quyền; get chỉ chủ sở hữu học sinh hoặc demo admin, list/delete bị chặn. **Lưu ý:** Đây là các tệp Rules candidate, chưa được kiểm chứng bằng Emulator hoặc triển khai production.
3. **Atlas snapshot verification:** thêm `includeMetadataChanges`, chỉ chuyển `storageStatus` sang `ready` và lấy baseline nếu `fromCache=false` và `hasPendingWrites=false`. Kiểm tra UID và dạng tài liệu; callback muộn sau đổi tài khoản không thể ghi đè state.
4. **Atlas localStorage migration policy:** không còn nhập bản ghi trình duyệt thiếu `userId` hoặc thuộc tài khoản khác; dữ liệu legacy cũ **được giữ nguyên trong browser**, không xóa hoặc tự chuyển. Cần phương án sao lưu/xác minh chủ sở hữu nếu thực tế cần di trú các bản dữ liệu vô danh.
5. **Daily Companion:** listener xin metadata và không xuất lịch cache/pending như đã xác minh; consent phải nhận metadata xác nhận server; transaction đọc `student_consents/{uid}` và xác nhận consent *trước* khi cập nhật `daily_companion/{uid}`; vô hiệu hóa callback của phiên cũ khi UID thay đổi. Trong trường hợp mất kết nối, lưu thất bại an toàn.
6. **QA + CI:** 14 bài CP69, sửa một bài hồi quy consent, bổ sung bài test M05 Firestore Emulator cho Atlas revision (chưa chạy), đăng ký vào `npm test` và CI.

## Kết quả có thể kiểm chứng tại môi trường này

| Hạng mục | Kết quả | Tệp bằng chứng |
|---|---|---|
| CP69 tests mới | **14/14 PASS** | `cp69-new-tests.log` |
| `npm test` nối toàn bộ | **Exit code 0**, 1.276 dòng TAP `ok`, 0 `not ok` | `full-npm-test.log`, `.exit` |
| Bài hồi quy Daily Companion | **20/20 PASS** | `companion-regression.log` |
| Firestore Rules tĩnh | **15/15 PASS** | `rules-static.log` |
| Layout | **PASS** | `layout.log` |
| Kiểm thử ZIP an toàn | **3/3 PASS** | `packaging-tests.log` |
| Demo offline *synthetic* | **11/11 PASS** | `demo-final.log` |
| Transpile cú pháp 4 tệp sửa | **PASS** | `tsx-syntax-check.log` |
| Dependency preflight | **BLOCKED**, 19 package/executable | `dependency-preflight.log` |
| Production build | **BLOCKED**, thiếu React/Firebase/JSX types | `build.log` |
| Firebase Emulator live CAS | **NOT RUN** | thiếu dependencies/Emulator |
| Browser QA (React + Firebase QA) | **NOT RUN** | 0/12 ca QA CP68 |
| Production | **NOT DEPLOYED** | không có triển khai |

`npm test` không bao gồm Firebase Emulator và không phải kiểm định hiệu quả khoa học hoặc bảo mật production.

## Cổng QA bắt buộc trước khi triển khai Rules

- Sử dụng **Firebase project QA độc lập**, tài khoản thử tổng hợp, không truy cập production hoặc dữ liệu học sinh thật.
- Trên máy đủ quyền truy cập npm: `npm ci --no-audit --no-fund` → `npm run check:dependencies` → `npm run build` → `npm run test:rules:emulator`.
- Xác minh M05: tạo Atlas revision=1, cập nhật revision=2 thành công; ghi phiên bản 2 lần nữa hoặc ghi không có revision bị từ chối; chặn UID khác. Test Atlas hook phải bảo toàn dữ liệu khi xung đột.
- Cần kiểm tra thao tác nhập legacy khi có `userId`, trường hợp `userId` không khớp, đồng bộ realtime ở 2 trình duyệt, thu hồi consent giữa các lần lưu Companion.
- **Không triển khai Rules candidate độc lập vào production:** client Atlas cũ không mang `revision` sẽ bị từ chối cập nhật. Phải kiểm thử và nâng cấp client đồng bộ; lập rollback rõ ràng.
- Hoàn tất 12/12 trường hợp browser QA CP68 để có ảnh React thật phục vụ báo cáo.

## MVP và tiến độ

Đây là một mốc kỹ thuật CP69 đã hoàn thành trong phạm vi mã nguồn/test offline, **không phải MVP**. CP70 dự kiến tích hợp luồng học sinh sáu module, CP71–73 hướng đến MVP với kiểm thử ứng dụng thật. Checklist 164 hạng mục chưa tái nghiệm thu, không tự giảm.
