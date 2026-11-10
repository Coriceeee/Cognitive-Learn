# CP25 V5 — Kiểm tra phân cấp module (08/11/2026)

## Phạm vi thay đổi
- 7 module cấp cao; 32 phân hệ nhỏ, ba mục ưu tiên trước + Xem thêm.
- Admin Console có phân hệ nghiệp vụ riêng; 22 thao tác kiểm thử trước đây được giữ trong mục mở rộng, không đánh dấu đã PASS.
- Atlas sở hữu toàn bộ tuyển sinh VN, liên kết quốc tế tại VN, du học toàn cầu.
- Haven sở hữu học bổng, chi phí, tài chính và hỗ trợ phụ huynh/giáo viên.
- Mọi điều hướng con nằm trong `src/data/moduleSubmodules.ts` thay vì nhân bản trong từng trang.

## Kiểm tra đã chạy thực tế

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| `npm test` | EXIT 0, trong đó admissions/chat 24/24 PASS | Bộ test hiện có + registry/anchor contract của V5 |
| `node tests/module-hierarchy.test.cjs` | PASS | 7 module, sở hữu Atlas/Haven, anchor nội bộ và nav |
| `npm run test:rules:static` | 15/15 PASS | Chỉ là hợp đồng phân tích tĩnh Firestore Rules |
| `npm run check:layout` | PASS | 22 file bắt buộc & 19 vị trí cũ được kiểm tra |
| TypeScript transpile syntax check (9 file thay đổi) | PASS | Chỉ kiểm tra cú pháp TS/TSX, chưa typecheck full |
| `tsc -b` | BLOCKED | Thiếu React/Firebase và type packages trong môi trường |
| `npm ci --offline --ignore-scripts` | FAILED `ENOTCACHED` | Không có tarball yargs-parser trong npm cache; chưa có đủ dependencies |

**Chưa thực hiện/không tuyên bố PASS:** production build, browser E2E responsive, Firebase Emulator, real API Gemini, staging/production deploy và nghiệm thu nội dung tuyển sinh/học bổng. Các phân hệ `partial` / `planned` chưa phải kết luận về mức hoàn thiện kỹ thuật hay khoa học.

## Kiểm thử bắt buộc ở máy phát triển có mạng

```bash
npm ci
npm run build
npm test
npm run test:rules:static
npm run test:rules:emulator
npm run check:layout
```

Kiểm tra thủ công trên staging: `/student/modules`, `/admin?cluster=atlas`, `/atlas`, `/atlas/study-abroad`, `/haven`, `/lumen`, `/orion`, `/pulse` và các anchor. Kiểm tra Student/Parent/Teacher/Admin riêng, Admin Demo theo chính UID Admin, không xâm phạm hồ sơ thật. Các đường dẫn cũ `/study-abroad`, `/haven/study-abroad` vẫn giữ tương thích trong `App.tsx`.
