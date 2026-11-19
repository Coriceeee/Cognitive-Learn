# CP31 Batch 5 — Governance read-only diagnostics

Ngày 15/11/2026. Nền chính xác: `CLA_FULL_SOURCE_CP31_BATCH4_EVIDENCE_CONSOLE_20261115.zip`.

## Triển khai

Bổ sung `src/lib/nexusGovernanceAudits.ts` và sáu view Admin-only tại `/admin/diagnostics?view=`:

1. `atlas-approve` — thẩm tra metadata quyết định duyệt theo năm, URL, fingerprint và người duyệt độc lập; không phê duyệt/xuất bản nguồn thực.
2. `orion-policy` — kiểm tra version/trigger/dose/stop rule/human review trong **shadow mode**; không bật can thiệp.
3. `orion-scenarios` — so sánh replay simulation có policy/engine/horizon cùng phiên bản; không trộn observed outcome.
4. `pulse-evidence` — đối chiếu snapshot, provenance, phiên bản mô hình, thiếu ước lượng uncertainty và limitations.
5. `pulse-trends` — phân biệt điểm 0 thật với missing, kiểm tra T0/T1/T2, thời gian đo và giới hạn kết luận.
6. `haven-finance` — định dạng chi phí, nguồn học phí, FX, kỳ hạn và học bổng chưa xác minh; không quyết định tài chính.

Tất cả đều chạy trong browser với JSON chọn tại máy; `readOwn()` xác minh tài khoản Admin hiện hành qua Firestore server trước khi kiểm toán; giới hạn JSON 256 KiB, callback cũ bị vô hiệu sau đổi account/đổi file. Không có hàm ghi Firestore trong trang. JSON gắn `syntheticExampleOnly=true` chỉ trả **NOT TESTED**. Mỗi phép kiểm có thể PASS cấu trúc nhưng luôn còn dòng **NOT TESTED** về xác minh thực tế. Không thu thập PII, thông tin xác thực hoặc row-level student records.

## Bằng chứng và giới hạn

- 22/22 tác vụ Nexus nay có tuyến chẩn đoán `limited`; **0/22 được tự động chấp thuận reviewer PASS**.
- Các tác vụ chủ yếu vẫn **không hoàn thiện nghiệp vụ**: `atlas-approve` chưa có workflow phê duyệt có audit server; `orion-policy` chưa chứng minh an toàn/hiệu quả; `pulse-evidence` chưa chứng minh immutability; `haven-finance` chưa kiểm chứng thị trường.
- Browser suite config: 7 nhóm, 22 nhiệm vụ, 22 diagnostics, **72 case dự kiến** (chưa chạy Chromium QA).
- 86 ca Rules Emulator từ CP30 B4 vẫn phải chạy lại trên Windows.
- Production build và deploy chưa chạy tại đây khi thiếu node_modules.
- Báo cáo CP31 B4 release/rules/model vẫn ghi các phần CI/deploy/backup/rollback/holdout external validation là NOT TESTED nếu không nhập chứng cứ.

## Các lệnh nghiệm thu

```powershell
npm ci
npm run test:cp31:batch5
npm run verify:cp31:batch5
npm run test:rules:emulator
npm run verify:cp37
"EXIT_CODE=$LASTEXITCODE"
```

Tài liệu định dạng: `docs/CP31/CP31_BATCH5_INPUT_GUIDE_20261115.md`.
