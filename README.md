> **Kiến trúc module cập nhật (08/11/2026):** [7 module lớn → phân hệ nhỏ, Du học trong Atlas, học bổng/tài chính trong Haven](docs/specifications/CLA_MODULE_HIERARCHY_V4_20261108.md).

> **CP25 (08/11/2026):** Có thêm chatbot nổi, Atlas tra tuyển sinh 2024–2026 và lộ trình du học; xem [hướng dẫn CP25](docs/CP25_ADMISSIONS_CHAT_RELEASE_NOTES.md) và [checklist 145 mục](docs/CP25_CHECKLIST_GAPS_20261108.md). Chưa nghiệm thu API Gemini live, E2E/production hoặc nghiên cứu thực chứng.

# COGNITIVE LEARN AI (CLA) — mã nguồn chuẩn hóa CLA(7)

**Trạng thái 08/11/2026:** bản nguồn đã sửa vị trí tệp và loại artifacts/secret khỏi ZIP bàn giao. **Chưa triển khai production.** Quyền Firestore, E2E, kiểm định khoa học chưa được nghiệm thu hoàn chỉnh.

## Cấu trúc

- `src/`: React, TypeScript, Vite; 7 module Seed, Nexus, Lumen, Atlas, Orion, Pulse, Haven.
- `api/`: API server-side Lumen/Atlas và Health.
- `tests/`: Node test, Firestore Rules (static và runtime), nghiên cứu kỹ thuật.
- `research/`: `registry/`, `protocol/`, `data/synthetic_demo/`, `src/`, `benchmarks/`, `evidence/`.
- `tools/`: kiểm tra cấu trúc; sửa layout local Windows; chạy Emulator qua đường dẫn ASCII.
- `docs/`: báo cáo, tracker, tài liệu bàn giao, bản lưu `archive/`, đặc tả `specifications/`.
- `firestore.rules.CANDIDATE_CP21`: **chỉ là Rules ứng viên**, không Publish khi chưa chạy 33 ca Emulator và đối chiếu Rules đang chạy.

## Chạy trên máy Windows

```powershell
npm ci
npm test
npm run check:layout
npm run test:rules:static
npm run typecheck:api
npm run build
```

Bộ Firestore Emulator trên Windows có thể không đọc được thư mục Unicode `C:\Gạo\...` (log bản CLA7: Java thấy `C:\G?o\...`). Không cần đổi tên dự án chính; để chạy test chỉ với Rules và dữ liệu demo tại đường dẫn không dấu:

```powershell
.\tools\RUN_FIRESTORE_ASCII.ps1
```

Script tạo workspace tạm chỉ chứa cấu hình, Rules, test và package metadata; **không copy `.env`, `.git` hoặc dữ liệu học sinh**. Phải có Java 21 và Firebase CLI, sau đó script tự chạy `npm ci` và `firebase emulators:exec` trong đường dẫn ASCII.

## Khắc phục bố cục ở workspace Windows cũ (không áp dụng với ZIP sạch)

```powershell
.\tools\FIX_CLA7_LAYOUT.ps1 -WhatIf
.\tools\FIX_CLA7_LAYOUT.ps1
npm run check:layout
```

File khác nội dung không bị ghi đè; script đưa bản cũ vào `docs/archive/legacy-layout/` nếu có xung đột.

## Biến môi trường và thông tin cá nhân

`.env` và `.env.local` **không** có trong ZIP vì có thể chứa bí mật. Tham khảo `.env.example` và thiết lập từ nguồn riêng an toàn. Không đưa `.env`, `.git`, `node_modules`, log Emulator hoặc private research data vào gói công khai. Nếu khóa từng bị commit, kiểm tra lịch sử và thay khóa liên quan.

## Nghiên cứu và tỷ lệ nghiệm thu

Dữ liệu demo/synthetic chỉ dùng cho kiểm thử kỹ thuật. Bộ 120 LLM case là bản nháp chưa đánh giá mô hình. Xem `docs/BAO_CAO_TOAN_DIEN_CLA7_20261108.md` và `docs/TRACKER_145_STATUS_AS_OF_CLA7.csv`.

## CP24 — Evidence Record (08/11/2026)

Pulse có thể kiểm tra trạng thái 4 nguồn theo UID và lưu bản ghi metadata vào Firestore
`pipeline_evidence/{uid}/checks/{autoId}` (append-only, server timestamp),
không lưu tên/điểm/nội dung nháp trong document body. Đây chỉ là nhật ký nguồn,
không phải đo lường kết quả giáo dục. Xem `docs/CP24_PROGRESS_20261108.md`.

Trước khi thử nghiệm, chạy `npm ci && npm run verify:cp24`. Các Rules mới
**chưa được nghiệm thu Emulator** tại thời điểm đóng gói CP24; KHÔNG deploy
production cho đến khi 42 bài kiểm thử Emulator đều PASS.

## CLA Daily Companion — nhánh phát triển Web → Mobile

Hướng khai thác sản phẩm: **Web CLA để phân tích/lập kế hoạch; CLA Mobile để nhắc việc và check-in hằng ngày**, dùng chung Firebase và engine, không viết lại website. Xem trang `/student/companion` (preview mặc định), file `START_HERE_DAILY_COMPANION_20261113.md` và `docs/mobile/CLA_MOBILE_EXPANSION_ROADMAP.md`. Đây **chưa phải APK/iOS app** và **chưa có background push**; các Rules mới phải qua Emulator trước khi bật đồng bộ.

## Nhánh mobile/web companion — Web Push V2 (14/11/2026)

Source hiện có `/student/companion` và mã nguồn Web Push nền **opt-in**, nhưng gửi nền chỉ hoạt động sau khi hoàn thành cấu hình VAPID, Security Rules, consent và Cloud Functions. Tính năng **tắt mặc định**, không tự triển khai lên production. Chạy `npm run test:companion-push` để kiểm tra policy; hướng dẫn: `START_HERE_MOBILE_WEB_PUSH_20261114.md` và `docs/mobile/CLA_WEB_PUSH_PWA_V2_IMPLEMENTATION.md`.

## Bản bổ sung 14/11/2026 — Lịch thi của tôi
Dashboard học sinh `/student` có bảng chọn kỳ thi và đếm ngược tới hạn đăng ký/ngày thi. Xem `START_HERE_EXAM_CALENDAR_20261114.md` và `docs/atlas/CLA_EXAM_CALENDAR_V1_ARCHITECTURE.md`. Lịch thi V1 do học sinh nhập, chỉ lưu trên trình duyệt theo UID, chưa tự đồng bộ và chưa có push nền.


## Research addon — Hugging Face VNHSGE (2026-11-15)

The full-source release includes `research/huggingface/vnhsge_benchmark/` for offline Vietnamese exam QA auditing and evaluation. See [`research/huggingface/README.md`](research/huggingface/README.md). It does not modify any existing web module, Firebase Rules, routes, or production model. License status for the upstream MCQ dataset remains **HOLD**. Synthetic fixture output is not scientific evidence.
