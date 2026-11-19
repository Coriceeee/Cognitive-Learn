# START HERE — CP31 Batch 9

Base chính xác: **CP31 Batch 8 FULL SOURCE**; chỉ áp dụng PATCH Batch 9 lên source Batch 8. Sao lưu dự án Windows trước khi giải nén PATCH.

```powershell
cd 'C:\Gạo\Cognitive-Learn'
npm run test:cp31:batch9
if ($LASTEXITCODE -ne 0) { throw 'BATCH9 TEST FAILED' }
npm run verify:cp31:batch9
if ($LASTEXITCODE -ne 0) { throw 'BATCH9 VERIFY FAILED' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'BUILD FAILED' }
'CP31_BATCH9_LOCAL_PASS'
```

Lưu ý: Fingerprint thay đổi có chủ đích vì đã sửa source. Nếu đã tự sửa file, kiểm tra diff trước, không thay baseline để ép PASS. Browser E2E/QA và dữ liệu nghiên cứu thực chưa có bằng chứng mới từ Batch 9.
