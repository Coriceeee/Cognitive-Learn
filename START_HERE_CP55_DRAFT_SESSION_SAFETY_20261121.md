# CLA CP55 — Tiếp nối CP54

**Mã nguồn mới:** chống callback Firestore từ phiên/UID cũ, và bảo vệ chỉnh sửa diễn ra trong lúc “Tải bản mới nhất” đang chờ máy chủ. Cả Orion, Pulse, Haven dùng cùng hook và được hưởng sửa lỗi này.

- Báo cáo/bằng chứng: `reports/cp55/CP55_ACCEPTANCE_REPORT.md`.
- Kiểm thử: `npm run test:cp55:safety`, `npm test`, `npm run test:rules:static`.
- `npm run demo:final`: chỉ là demo synthetic/offline, không phải nghiên cứu thực chứng.
- Trước deploy: cần `npm ci`, `npm run build`, Firebase Emulator và kiểm thử hai trình duyệt. Chưa có phép thử này trên production.
- ZIP loại bỏ `.env` thật và `node_modules`, giữ bốn `.env.example`.
