# CP68 — MVP readiness / Student UX Browser Gate

Ngày: 21/11/2026 · kế thừa toàn bộ CP67 · đối tượng: học sinh.

## Kết quả đã triển khai thực sự

1. **Sửa trải nghiệm Back/Forward trong SPA** (`src/lib/routeExperience.ts`): khi lịch sử chuyển sang một trang khác, giữ khả năng khôi phục vị trí cuộn của trình duyệt **và** đặt tiêu điểm bàn phím vào nội dung mới. Nếu lịch sử chỉ đổi query bộ lọc trong cùng trang thì không tự đổi focus/scroll; URL fragment hợp lệ vẫn ưu tiên cuộn tới anchor. Không thay đổi Firestore hay các phép tính AI.
2. **Xây dựng cổng QA trình duyệt thật** (`tools/cp68_student_ux_e2e.py`): chuẩn bị 12 phép kiểm tra (6 module × 2 viewport 1280px/390px) bằng Playwright, kiểm tra DOM thực, link SPA, giữ tài liệu không reload, tiêu điểm, nhãn tab và không tràn ngang. Chỉ cho phép địa chỉ loopback, project Firebase QA được xác minh và tài khoản thử tổng hợp có xác nhận. Screenshot là lựa chọn riêng; mặc định không chụp.
3. **Thêm 8 kiểm thử CP68** (`tests/cp68-qa-gate.test.mjs`), cập nhật CP67 regression và npm/CI. Cổng browser không tự báo PASS khi chưa chạy.

## Bằng chứng kiểm thử

| Mục | Kết quả | Đối chứng |
|---|---|---|
| CP68 tests | 8/8 PASS | `cp68-qa-gate-tests.log` |
| Hồi quy CP67 | 17/17 PASS | `cp67-navigation-regression.log` |
| `npm test` (toàn dự án) | Exit code **0**, 1.365 dòng TAP `ok`, 0 `not ok` | `full-npm-test.log`, `full-npm-test.exit` |
| Firestore Rules tĩnh | 15/15 PASS | `rules-static.log` |
| Layout | PASS | `layout.log` |
| Safe packaging tests | 3/3 PASS | `packaging-tests.log` |
| Demo offline synthetic | 11/11 PASS | `evidence-generation.log` |
| Chromium **cô lập** Back/Forward desktop/mobile | 2/2 PASS | `isolated-pop-qa.log` |
| Dependency gate | **BLOCKED**, thiếu 19 gói/executable | `dependency-preflight.log` |
| Production build | **BLOCKED**, thiếu React/types/Firebase/Vite | `build.log` |
| Browser React + Firebase QA | **NOT RUN**, 0/12 | `react-e2e-status.json` |
| Firebase Emulator / production deployment | **NOT RUN** | Thiếu dependency, không có QA project/credential được xác nhận |

**Điều kiện nghiệm thu CP68 chưa đạt đầy đủ:** chưa có ảnh website React thật, chưa chạy đủ 12 ca browser QA và không thể kết luận dark mode toàn website hay sự sẵn sàng MVP. Một phép kiểm tra Chromium cô lập không thay thế được việc vận hành trên React/Firebase thực tế.

## Việc cần chạy trên máy đã có npm/network + Firebase QA cô lập

```powershell
npm ci --no-audit --no-fund
npm run check:dependencies
npm run build
npm run dev -- --host 127.0.0.1
```

Dùng **project Firebase QA riêng, dữ liệu tổng hợp và tài khoản học sinh QA**, thiết lập cấu hình từ `.env.example` theo hướng dẫn dự án. Trước khi chạy E2E, chỉ định `CLA_E2E_QA_ACK`, `CLA_E2E_STUDENT_EMAIL`, `CLA_E2E_STUDENT_PASSWORD` và project ID **chính xác**; không ghi mật khẩu trong tài liệu và không sử dụng project production.

```powershell
python tools/cp68_student_ux_e2e.py --base-url http://127.0.0.1:5173 --project-id <QA_PROJECT_ID> --preflight
python tools/cp68_student_ux_e2e.py --base-url http://127.0.0.1:5173 --project-id <QA_PROJECT_ID>
```

Sau khi 12/12 ca PASS trên QA, mới chụp ảnh các màn hình phục vụ báo cáo bằng tuỳ chọn `--screenshots` với tài khoản tổng hợp. Với kết quả chưa xác minh, xuất báo cáo cho thấy trạng thái BLOCKED, tuyệt đối không gán nhãn nghiệm thu.

## Mốc tiến độ

- **Đã có:** UX sáu phân hệ, luồng route, biểu đồ đầu vào, trạng thái dữ liệu và mã nguồn test CP68.
- **Vẫn chặn MVP:** build React thực sự; QA Firebase; hoàn thành một luồng học sinh từ đăng nhập tới kết quả/lưu, an toàn ghi và tích hợp AI mức tối thiểu; kiểm thử toàn trình.
- Checklist 164 mục chưa được tái nghiệm thu đầy đủ: không tự giảm số lượng chỉ vì các unit test mới PASS.
