# CLA CP31 Batch 17 — Hotfix TS2339 / TS2345 — 16/11/2026

## Triệu chứng xác nhận từ Windows

`npm run demo:final` PASS; `npm run build` FAIL tại `src/lib/useClosedLoopJourney.ts`:

- `TS2339`: `JourneyCycle` không có `userId` dù tài liệu Firestore được tạo với `userId`.
- `TS2345`: `record.data()` trả `DocumentData[]`, không phải `JourneyCycle[]`; thiếu bước thu hẹp kiểu trước `setCycles`.

## Thay đổi đúng ba file source

1. `src/lib/closedLoopJourney.ts`: `userId?: string` cho dữ liệu chu kỳ lưu trên Firestore (không bắt fixture synthetic tạo `userId`).
2. `src/lib/useClosedLoopJourney.ts`: sau khi xác minh **toàn bộ** bản ghi qua `isJourneyCycle`, so khớp `item.userId === currentUid` và `record.id === item.id`, chuyển về `JourneyCycle[]` bằng `items.filter(isJourneyCycle)`. Không gỡ kiểm soát quyền sở hữu; không dùng ép kiểu `as JourneyCycle[]` trước khi kiểm tra.
3. `src/lib/nexusEvidenceBaseline.ts`: cập nhật fingerprint cho source mới để demo gate còn kiểm tra được bản vá.

Không sửa Rules, không thay đổi dữ liệu Firestore, không deploy và không ghi đè dữ liệu người học.

## Áp dụng lên Batch 17 trên PowerShell

**Chỉ áp dụng PATCH nếu thư mục hiện tại đang ở FULL SOURCE Batch 17**. Sao lưu source, không giải nén PATCH lên Batch 16/nhánh khác.

```powershell
cd 'C:\Gạo\Cognitive-Learn'
New-Item -ItemType Directory -Force -Path '.\backup-b17-before-build-hotfix' | Out-Null
Copy-Item '.\src\lib\closedLoopJourney.ts' '.\backup-b17-before-build-hotfix\closedLoopJourney.ts' -Force
Copy-Item '.\src\lib\useClosedLoopJourney.ts' '.\backup-b17-before-build-hotfix\useClosedLoopJourney.ts' -Force
Copy-Item '.\src\lib\nexusEvidenceBaseline.ts' '.\backup-b17-before-build-hotfix\nexusEvidenceBaseline.ts' -Force

# Sửa đường dẫn ZIP nếu lưu ở vị trí khác:
Expand-Archive -Path "$env:USERPROFILE\Downloads\CLA_CP31_BATCH17_BUILD_HOTFIX_PATCH_20261116.zip" -DestinationPath '.' -Force

npm run demo:final
if ($LASTEXITCODE -ne 0) { throw 'DEMO GATE FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD STILL FAILED — copy full error output' }
'CLA_BATCH17_BUILD_HOTFIX_PASS'
```

Nếu thư mục đã bị chỉnh khác Batch 17, giải nén FULL SOURCE hotfix vào **một thư mục mới** trước, không làm hỏng nhánh hiện tại.

## Bằng chứng thực chạy trong môi trường đóng gói

- 102/102 test B9/B12/B16: PASS.
- `npm run demo:final`: 11/11 bước offline PASS; backup HTML generate + verify PASS.
- `npm test`: PASS.
- `tsc --noEmit --strict` trên mô hình tối thiểu của pattern lọc `DocumentData[]`: PASS.
- **Full `npm run build`: chưa được xác nhận tại đây do không có `node_modules`**. Chỉ máy Windows có dependencies mới xác minh được build cuối.
- Emulator runtime, 72 Browser E2E, nghiên cứu THPT thực: không được chứng nhận bởi hotfix này.

## Vì sao lỗi lọt qua cổng kiểm thử trước đó?

Các test hiện tại chủ yếu kiểm toán engine bằng Node, kiểm tra chuỗi source và fingerprint. `demo:final` không chạy `tsc -b` hay `vite build`. Vì vậy một lỗi TypeScript trong React hook có thể không được phát hiện dù demo offline PASS. Đối với buổi thi, bắt buộc chạy thêm `npm run build` trước khi kết luận website sẵn sàng.
