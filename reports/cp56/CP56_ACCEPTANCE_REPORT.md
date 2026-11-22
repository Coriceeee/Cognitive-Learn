# CP56 — Bảo vệ chỉnh sửa chưa lưu khi điều hướng & đăng xuất

Ngày: 21/11/2026 (Asia/Ho_Chi_Minh) · Nguồn: ZIP CP55 (giữ nguyên module và dữ liệu).

## Nguyên nhân được xử lý

Orion debounce autosave 700 ms và hủy timer khi trang unmount. Nếu học sinh sửa rồi rời module ngay trước khi save hoàn tất, chỉnh sửa có thể mất. Pulse/Haven có nút lưu thủ công, cũng có thể mất chỉnh sửa nếu chuyển trang trước khi lưu. CP55 xử lý xung đột snapshot, không xử lý trường hợp điều hướng này.

## Bản vá

- `src/lib/draftNavigationGuard.ts`: registry blocker chỉ lưu các hàm trong RAM, không lưu điểm/UID hay dữ liệu vào localStorage. Cho phép chuyển tab trong cùng module.
- `src/lib/clientNavigation.ts`: cùng một blocker được tôn trọng bởi click nội bộ, điều hướng chương trình và browser Back. Khi từ chối Back, tạm khôi phục URL để giữ trang đang nhập. **Cần kiểm thử browser thực**, vì có thể sinh history entry bổ sung.
- `src/lib/useModuleDraft.ts`: khi `editing.current` true, cảnh báo trước khi rời Orion/Pulse/Haven; khi refresh/đóng tab, dùng beforeunload của trình duyệt. Khi server xác nhận lưu đúng phiên chỉnh sửa, guard tự nhả; nếu xung đột/lỗi thì giữ guard.
- `src/components/common/UserMenu.tsx`: logout cũng kiểm tra blocker trước khi đăng xuất; không bỏ qua chỉnh sửa chưa lưu.
- `tests/cp56-unsaved-navigation.test.mjs` và `tests/cp45-seamless-navigation.test.cjs`: test registry, route sub-tab, click, Back, logout và cleanup. CI thực thi test điều hướng với TypeScript dependency sau `npm ci`.

**Cơ chế này cảnh báo và cho phép ở lại, không hứa tự lưu khi rời trang.** Nếu học sinh xác nhận bỏ thay đổi, chỉnh sửa chưa lưu sẽ bị mất theo đúng lựa chọn. Đây là giải pháp fail-safe trong khi chưa có ghi nền đáng tin cậy trên thiết bị thực.

## Kết quả kiểm thử

| Gate | Kết quả | Log |
|---|---|---|
| CP56 navigation/unit | **9/9 PASS** | `reports/cp56/cp56-navigation.log` |
| CP45 + CP56 navigation integration (transpile TS, simulated DOM) | **11/11 PASS** | `reports/cp56/navigation-integration.log` |
| CP55 draft session regression | **5/5 PASS** | `reports/cp56/cp55-regression.log` |
| Rules contract tĩnh | **15/15 PASS** | `reports/cp56/rules-static.log` |
| Layout | **PASS** | `reports/cp56/layout.log` |
| Offline synthetic demo | **11/11 PASS** | `reports/cp56/demo-final.log` |
| Packaging tests | **3/3 PASS** | `reports/cp56/packaging-test.log` |
| `npm test` liền mạch | **TIMEOUT (chưa PASS)** | `reports/cp56/npm-test.log`: 1.185 dòng test `ok`, 0 `not ok` trước khi bị ngắt tại lúc CP55 chuẩn bị chạy |
| `npm ci` / `npm run build` | **BLOCKED / NOT RUN** | `reports/cp56/dependencies.log`: thiếu 19 dependency/bin; không có npm registry khả dụng trong môi trường này |
| Firebase Emulator allow/deny | **BLOCKED / NOT RUN** | `reports/cp56/emulator-preflight.log`: static PASS; thiếu dependency/CLI |
| Browser E2E hai thiết bị / deploy | **NOT RUN** | Chưa có chứng cứ |

Bản `npm test` liền mạch trước khi thêm đường đăng xuất chưa hoàn tất do timeout nên **không công bố toàn bộ test PASS**. Các nhóm CP55, CP56 và navigation integration đã chạy tách riêng sau thay đổi cuối.

## Bằng chứng và giới hạn

- Candidate Firestore Rules giữ nguyên và chưa publish. Test tĩnh không chứng minh quyền server.
- Kiểm thử điều hướng là mô phỏng DOM/route, chưa kiểm thử browser thật, không có đo latency thực.
- Dữ liệu nghiên cứu synthetic chỉ dùng replay kỹ thuật, không dùng chứng minh tác động học tập.
- 164 checklist gate: **chưa đóng thêm mục nghiệm thu tích hợp đầy đủ**.
- CP57: chạy `npm ci && npm run build`, `npm run test:cp56:navigation:integration`, Emulator trên staging, rồi E2E nhanh thay đổi → chuyển trang/Back → save → rời và logout.
