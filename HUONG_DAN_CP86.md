# CP86 — Tách bạch bằng chứng CP31 và Security Rules hiện hành

Ngày 22/11/2026. Bản vá cho CP85 đạt 14/15 bước và Firestore Emulator PASS.

## Nguyên nhân `npm_test_full FAIL`

Bài `CP31-B4-01` trong `tests/cp31-batch4-evidence.test.mjs` tính SHA-256 của `firestore.rules.CANDIDATE_CP21` (quy tắc **hiện tại đã tối ưu** tại CP85) nhưng so sánh với `cp31RulesCandidateSha256` (mã băm CP31 **lịch sử**). Do CP85 sửa Rules để vượt ngân sách đánh giá trong J21, SHA hiện tại đã thay đổi như mong đợi, và assert cũ trở nên không hợp lệ.

- CP31 lịch sử: `c6d32c530518f247ea85e9b1c4d52fe08eced14f1e048d0f4f19963f5dcf284f`.
- CP85/CP86 candidate: `8fbca0b88aacfb68fb8b48271ce58f00d803214154b01c1ccddad22aa66147ec`.

## Sửa chữa (không sửa dấu vết lịch sử)

1. Bài CP31-B4-01 kiểm tra baseline đóng băng với `firestore.rules.CANDIDATE` và manifest lịch sử CP81, **không** đòi Rules hiện tại phải trùng Rules cũ.
2. Test mới CP86 kiểm tra Rules hiện tại theo manifest bất biến CP86 và từ chối việc dùng báo cáo CP86 để nhận là CP31.
3. Giữ nguyên `src/lib/nexusEvidenceBaseline.ts`, dữ liệu nghiên cứu CP31, Rules hiện tại, và toàn bộ test J01–J23.
4. Thêm Snapshot CP86 và bộ nghiệm thu CP86, chạy từ thư mục gốc dự án. **Không deploy**.

## Dùng bản overlay sau CP85

Giải nén overlay CP86 vào đúng `C:\Gạo\Cognitive-Learn`, ghi đè khi được hỏi, sau khi đã sao lưu `tests/cp31-batch4-evidence.test.mjs`.

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
node tools/verify-cp86-snapshot.cjs
if ($LASTEXITCODE -ne 0) { throw 'CP86 SOURCE FAIL' }
node --experimental-strip-types --test tests/cp31-batch4-evidence.test.mjs tests/cp86-evidence-versioning.test.mjs
if ($LASTEXITCODE -ne 0) { throw 'CP86 EVIDENCE TEST FAIL' }
.\CHAY_NGHIEM_THU_CP86.cmd
```

## Giới hạn

- CP85 Firestore Emulator PASS trên máy người dùng (99 ca ở nhánh CP85). CP86 **không chỉnh** Rules; vẫn phải chạy lại Emulator trong nghiệm thu CP86.
- Kết quả test source không chứng minh production đã triển khai Rules hoặc xác nhận hiệu quả khoa học.
- Không thay đổi sáu phân hệ, LMM không nằm trong phạm vi.
