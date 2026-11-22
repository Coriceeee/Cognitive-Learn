# CLA CP61 — Legacy draft listener generation safety

**Ngày:** 21/11/2026  
**Nền:** `Cognitive-Learn-CP60-20261121.zip` (CRC verified; 1,292 entries)  
**Phạm vi:** sửa lỗi callback legacy của bản nháp Orion/Pulse/Haven đến muộn sau khi primary canonical đã được xác minh. Không thay đổi schema, Rules candidate, hoặc triển khai production.

## Nguyên nhân gốc

Khi `orion_drafts`, `pulse_drafts`, hoặc `haven_drafts` chưa tồn tại, `useModuleDraft` đọc tạm từ `module_drafts`. Sau khi canonical xuất hiện hoặc snapshot trở thành cache/unverified, `unsubscribe` được gọi nhưng callback legacy đã được hàng đợi scheduler ghi nhận vẫn có thể thực thi. Guard cũ chỉ xác nhận UID/epoch phiên auth, **không phân biệt các đời listener legacy trong cùng phiên**. Điều này có thể làm bản nháp cũ ghi đè dữ liệu mới trên UI hoặc một error cũ làm giao diện báo sai.

## Sửa chữa đã thực hiện

- Thêm `legacyEpoch` độc lập với observer/auth epoch và generation ghi bản nháp.
- Gom thao tác đóng listener vào `stopLegacyListener()`, tăng epoch khi canonical xuất hiện, cache/pending, lỗi, auth đổi hoặc component unmount.
- Cả callback dữ liệu và callback lỗi của `module_drafts` chỉ được chạy khi `capturedLegacyEpoch === legacyEpoch` và UID/observer epoch còn khớp.
- Giữ nguyên tối ưu đã có: nhiều metadata snapshot xác nhận primary vẫn missing không tái tạo listener legacy.
- Bổ sung 6 bài kiểm thử hành vi sử dụng mock callback, được tích hợp vào `npm test` và CI.

## Kết quả kiểm chứng trong môi trường hiện tại

| Cổng | Kết quả | Bằng chứng |
|---|---|---|
| Test CP61 mới | PASS 6/6 | `legacy-callbacks.log` |
| `npm test` toàn bộ | **PASS 1,244 TAP `ok`, 0 `not ok`, exit 0** | `npm-test.log`, `npm-test.exit` |
| Rules static | PASS 15/15 | `rules-static.log` |
| Layout | PASS | `layout.log` |
| Demo offline | PASS 11/11 (synthetic) | `demo-final.log` |
| Packaging unit | PASS 3/3 | `packaging-tests.log` |
| Dependency readiness | **BLOCKED (19 thiếu dependency/executable)** | `dependencies.log` |
| `npm run build` | **FAIL trong môi trường này do thiếu React/Firebase/JSX types** | `build.log` |
| Firestore Emulator | **BLOCKED, NOT RUN** | `emulator.log` |
| Browser QA preflight | **BLOCKED, thiếu Firebase QA project ID** | `browser.log` |
| Production deploy, multi-browser E2E | **NOT RUN** | Chưa có môi trường xác thực |

`npm ping` tới npm registry trả `EAI_AGAIN` (`npm-registry.log`). Các lỗi build vì không có các gói nên **không chứng minh mã nguồn độc lập build PASS hoặc FAIL**.

## Giới hạn và quyết định

- Test callback là giả lập theo thứ tự có chủ đích, không phải Firebase Emulator hoặc E2E thật.
- Chưa có số liệu thực nghiệm tác động học tập; demo sử dụng nguồn synthetic.
- Checklist 164 mục chưa có gate tích hợp mới được đóng nghiệm thu; CP61 là bằng chứng chất lượng cục bộ.
- Không triển khai Firestore candidate rules hay thay đổi production.
- **Quyết định:** có thể bàn giao mã nguồn CP61 và chạy lại khi có môi trường đủ dependency; chưa production-accepted.

## Các lệnh xác minh trên máy có kết nối registry và Firebase QA

```bash
npm ci --no-audit --no-fund
npm run check:dependencies
npm run test:cp61:legacy-drafts
npm test
npm run build
npm run test:rules:emulator
# Cung cấp Firebase QA project ID và credentials an toàn trước khi chạy browser E2E
npm run qa:cp31:preflight
```
