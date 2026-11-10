# CLA CP33 — Tiến độ sau kiểm tra source và bổ sung visual

**Ngày:** 10/11/2026  
**Nguồn:** `CLA_CP32_FLAT_START_HERE_20261109` + CP32 Scientific Visual Layer + CP33 visual changes.

## 1. Checklist 164 mục

| Nhóm | Số mục | Tiến độ trung bình | 0% | 25% | 50% | 75% | 100% |
|---|---:|---:|---:|---:|---:|---:|---:|
| Website MVP | 76 | 45.4% | 8 | 17 | 32 | 19 | 0 |
| Nghiên cứu | 69 | 23.2% | 26 | 29 | 7 | 7 | 0 |
| Bổ sung CP25 | 18 | 34.7% | 3 | 7 | 6 | 2 | 0 |
| UI/mascot | 1 | 75.0% | 0 | 0 | 0 | 1 | 0 |
| **Tổng** | **164** | **35.1%** | **37** | **53** | **45** | **29** | **0** |

**Cách hiểu:** 164/164 mục vẫn chưa được đóng nghiệm thu ở mức 100%; 37 mục chưa có bằng chứng đáp ứng (0%) và 127 mục đang có một phần code/đặc tả/test nhưng còn thiếu nghiệm thu. Đây không có nghĩa phải viết lại 164 chức năng.

## 2. MVP và nghiên cứu phải tách riêng

- Website MVP theo checklist: **45.4%** trên 76 mục.
- Research: **23.2%** trên 69 mục.
- CP25 admissions/chat/scholarship: **34.7%** trên 18 mục.
- P0 shortlist: vẫn **41.1%** trên 14 mục; 4 mục P0 đang ở 0%.

Không có căn cứ để báo MVP toàn hệ thống đạt 80–90% ở thời điểm này. Mục tiêu 80–90% chỉ có thể dùng cho một **MVP demo scope được giới hạn rõ** sau khi build, browser E2E và Firestore Emulator chạy PASS; không được thay bằng trung bình checklist 164 mục.

## 3. Cập nhật trạng thái B4

B4 tăng từ 25% lên 50% do có preset demo Admin-only, confirmation gate, không ghi Firestore khi mới preview, và gắn `dataScope=demo` khi lưu. Contract test CP32 đã kiểm tra các ràng buộc source. Chưa nâng cao hơn vì chưa chạy Emulator allow/deny và kiểm thử browser theo UID thật.

## 4. Kết quả test trên source CP33

| Kiểm tra | Kết quả | Phạm vi / giới hạn |
|---|---|---|
| `npm test` | **PASS** | Suite kết thúc exit 0; 102 checks/subtests tổng hợp từ test scripts và TAP suites, gồm 11 contract test scientific visuals |
| `npm run test:rules:static` | **15/15 PASS** | Kiểm tra tĩnh; không thay Emulator |
| `npm run check:layout` | **PASS** | 22 file bắt buộc; 19 legacy misplacements absent |
| UCI baseline guard | **4/4 PASS** | Guard tests; chưa có metric trên dataset đã pin |
| Syntax transpile 5 file TSX thay đổi | **5/5 PASS** | Kiểm tra cú pháp, không thay typecheck toàn dự án |
| Strict typecheck 3 component mới | **PASS** | Kiểm tra component độc lập với JSX shim; không thay build toàn app |
| `npm ci` trong runner này | **TIMEOUT** | Không cài đủ dependencies trong giới hạn runner |
| `npm run typecheck:api` | **BLOCKED** | Thiếu `@types/node` trong `node_modules` chưa hoàn tất |
| `npm run build` | **BLOCKED** | Thiếu các type package React/Node/D3; chưa vào bước compile đầy đủ |
| Browser E2E / Firebase Emulator / staging | **NOT RUN** | Cần môi trường dự án và tài khoản/credentials hợp lệ |

## 5. Kết luận

CP33 đã tăng chất lượng trực quan và bổ sung contract tests. Các module học sinh hiện có visual đặc trưng: Seed trajectory/heatmap; Lumen signal atlas; Orion trade-off map; Atlas cutoff slopegraph; Haven pressure topology; Pulse six-dimensional orbit. Admin-only Pulse có thêm evidence circuit.

**Chưa đủ căn cứ tuyên bố MVP nghiệm thu 80–90% hoặc production-ready.** Việc quyết định còn lại trong ngày cuối là khôi phục dependency trên máy dự án, build, chạy E2E + Emulator, sau đó chốt một hành trình demo từ Seed → Lumen → Orion → Atlas/Haven → Pulse.
