# CP31 Batch 8 — Closed-Loop Golden Path, kiểm tra nội bộ chỉ đọc

**Ngày 16/11/2026 · Base:** Full source CP31 Batch 7 · **Không dùng tài khoản Firebase QA**

## Mục tiêu / mã checklist

- `R6.2` (một phần): đóng băng kịch bản synthetic `focused`, điểm T0 = 0 hợp lệ, điều kiện đầu vào và hành động; engine `createJourneyCycle` được gọi thật.
- `R7.1` (một phần): phát lại offline theo chuỗi 7 bước kỹ thuật từ dữ liệu synthetic với các engine Closed-Loop, Pulse assessment và shadow adaptation. **Không** chứng minh observed outcomes học sinh hoặc full browser UI.
- `R7.2` (một phần): kiểm tra `static/adaptive` và ngưỡng kỹ thuật 60%, xác minh trigger/dataScope/limitations đúng cấu trúc, từ chối thay đổi trái phép trong record. **Chưa** hoàn tất intervention taxonomy, human override hay xác thực trên người học.

## Thay đổi source

1. `src/lib/journeyShadowPolicy.ts`: `replayShadowEvidence(unknown)` xác minh lại giới hạn dữ liệu, key duy nhất, zero hợp lệ, trạng thái ABSTAIN, tính toán completion/delta, trigger, evidenceLevel, phiên bản và limitations. Đây là kiểm tra **tính nhất quán**, không phải chữ ký bảo mật.
2. `research/golden_path/fixture_SYNTHETIC.v1.json`: hồ sơ cố định synthetic, không UID, không tên hoặc dữ liệu học sinh thật; bao gồm T0=0, hành động hoàn thành=0, T1/T2 synthetic, có mốc thời gian đúng thứ tự.
3. `tools/cla_golden_path_offline.mjs`: chạy qua engine thật, tạo envelope JSON và xác minh lại bằng phép tính deterministic + SHA-256 + source fingerprint. Report local có thể bị tái tạo bởi người kiểm soát source, **không phải chứng thực bên thứ ba**.
4. `tests/cp31-batch8-golden-path.test.mjs`: 26 ca positive/negative, bao gồm sửa trigger, số liệu, mốc thời gian, claim thực nghiệm và hành vi thời điểm thiếu dữ liệu.
5. `tools/cp31_release_fingerprint.cjs`: gồm fixture synthetic và 3 file tracked mới. **Sau khi áp dụng patch, fingerprint phải khớp bản phát hành mới**.
6. `package.json`: script Batch 8 và lệnh sinh/xác minh evidence.

## Lệnh Windows

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch8
if ($LASTEXITCODE -ne 0) { throw 'BATCH8 TEST FAILED' }
npm run verify:cp31:batch8
if ($LASTEXITCODE -ne 0) { throw 'BATCH8 VERIFY FAILED' }
# Muốn nghiệm thu build thực tế:
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BATCH8 BUILD FAILED' }
'CP31_BATCH8_LOCAL_PASS'
```

Riêng phát lại offline:

```powershell
npm run research:golden-path
npm run research:golden-path:verify
```

File kết quả local: `reports/evidence/cla_golden_path_SYNTHETIC.json` (không nằm trong ZIP release, phải tự sinh). Không nhập học sinh thật vào fixture.

## Cổng chưa khép

- Browser E2E 72 ca: **NOT RUN**, chưa có project Firebase QA riêng, không được sử dụng project production.
- Firestore Emulator 86 ca / production Rules / signed deploy / backup / rollback: **không được kiểm định trong Batch 8**.
- ML, psychometrics, causal effectiveness với học sinh THPT Việt Nam: **NO EMPIRICAL EVIDENCE từ Batch 8**.
- Dự án có bảy module; replay Batch 8 chỉ chạy đường học tập vòng kín, không thay thế kiểm thử Atlas/Haven/Nexus UI.

## Tái chấm 164

Giữ nguyên số liệu 21 đạt kỹ thuật cục bộ / 126 một phần / 17 thiếu bằng chứng, 0 reviewer accepted. Ba mục `R6.2`, `R7.1`, `R7.2` được bổ sung nguồn và test, **chưa được nâng hạng**. Toàn bộ hạng mục nghiên cứu tác động vẫn cần nguồn thực và tiêu chí gốc.
