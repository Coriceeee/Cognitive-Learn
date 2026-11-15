# CLA Step 19 — Decision Evidence Studio / Static–Adaptive Shadow Policy

Ngày: 15/11/2026 · Nền: CLA Full Source Dashboard Notification Center 14/11 + HF Benchmark Starter 15/11.

## Đã thực hiện
- Bổ sung `src/lib/journeyShadowPolicy.ts` với hai chính sách rule-based, version `cla-shadow-policy-v1`.
- Static giữ kế hoạch T0; Adaptive chờ dữ liệu đánh giá lại, chỉ gợi ý REPLAN nếu completion <60% hoặc delta điểm <=0; nếu chưa đủ dữ liệu, ABSTAIN. Ngưỡng này là baseline kỹ thuật chưa validation.
- Không ghi Firestore, không thay đổi outcome, không tự áp dụng can thiệp, không thay đổi Firebase Rules.
- Mở ngay trong Lumen → Closed-Loop → Decision Evidence Studio: so sánh nhánh, hiển thị điều kiện kích hoạt, Evidence Capsule dạng JSON, replay kỹ thuật trên snapshot.
- Thêm `tests/step19-decision-evidence-shadow.test.mjs` và `npm run test:shadow`; thêm vào chuỗi `npm test`.

## Đã kiểm thử
- `npm run test:shadow`: 5/5 PASS.
- `npm run test:closed-loop`: 18/18 PASS.
- Full `npm run build` / TS typecheck chưa nghiệm thu vì môi trường hiện tại không có thư mục `node_modules`; cần `npm ci` trên máy có npm registry và chạy lệnh.

## Cảnh báo khoa học
- Shadow Policy chỉ chứng minh sự khác biệt giữa hai quyết định tính trên cùng dữ liệu, **không chứng minh** Adaptive mang lại hiệu quả học tập.
- Snapshot để replay được nhưng chưa có chữ ký mã hóa, kho lưu evidence bất biến hay mã Git commit thực; không gọi đây là research-grade audit.
- Chưa tích hợp kết quả ML Hugging Face vào quyết định của Orion/Lumen. Các công cụ HF trong `research/huggingface/` vẫn phục vụ benchmark độc lập.
- Chưa có nghiên cứu Static-vs-Adaptive có đối chứng và consent, chưa có sai số ML/uncertainty.

## Chạy thử
```powershell
npm ci
npm run test:shadow
npm run test:closed-loop
npm run test:hf:benchmark
npm run build
npm run dev
```
Đăng nhập vai trò học sinh → Orion tạo chu kỳ → Pulse ghi check-in và đánh giá lại → Lumen mở Closed-Loop, xem Decision Evidence Studio.

## Bước tiếp theo
- Snapshot immutable đúng nghĩa và commit hash trong Evidence Record (không thay thế hồ sơ quá khứ).
- Thực hiện data-quality gates cho self-report, freeze policy, tách nghiên cứu/thử nghiệm.
- Mô hình dự báo trên HF EdNet/FoundationalASSIST: kiểm tra giấy phép rồi so sánh baseline/holdout; báo domain-shift.
