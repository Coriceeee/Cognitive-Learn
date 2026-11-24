# CLA CP92 HF01 — Build test fix and custom-domain diagnostics

## Nguồn sửa
- Thay đúng hai kiểm thử CP71 và CP74 dựa trên giả định cũ `49-cla-product-polish.css` phải là import cuối.
- Giữ nguyên `src/styles.css` và toàn bộ CSS thực tế: lớp CP87/89/90 được phép tải sau CP74.
- Đồng bộ 2 SHA-256 của các test trong `CP92_SOURCE_MANIFEST.json` (snapshot 1952 tập tin tiếp tục PASS).
- KHÔNG sửa Firebase/Auth, Firestore, Gemini, DNS hoặc deploy.

## Trên Windows
Trong PowerShell (tại C:\Gạo\Cognitive-Learn):

```powershell
$zip = Join-Path $env:USERPROFILE 'Downloads\CLA_CP92_CSS_TEST_HF01_OVERLAY_20261123.zip'
Expand-Archive -LiteralPath $zip -DestinationPath (Get-Location).Path -Force
node tools/verify-cp92-snapshot.cjs
node --experimental-strip-types --test tests/cp71-unified-navigation.test.mjs tests/cp74-product-polish.test.mjs
.\BUILD_TOAN_BO_CLA_CP92.cmd
```

Không deploy nếu `[PASS] CLA CP92 COMPLETE LOCAL BUILD` chưa xuất hiện. Nếu test khác fail, xem `.build-reports\06-all-tests.log`. Bản vá chỉ xử lý lỗi CP71/74 và KHÔNG đảm bảo 100% test còn lại.

## Tên miền cognitivelearn.ai.vn (độc lập với build)
`curl -IL` đã chứng minh tên miền tự trả HTTP 301 về chính `https://cognitivelearn.ai.vn/` nhiều lần, trong khi `cognitive-learn-ai.web.app` trả 200. Không đổi A/TXT vì DNS đã đến Firebase, và `firebase.json` hiện không có cấu hình `redirects`.

Vào Firebase Console > Hosting > site cognitive-learn-ai > custom domains > cognitivelearn.ai.vn > tùy chọn dấu ba chấm. Nếu có tùy chọn đổi sang Serve content (không redirect), chọn. Nếu không có, sau khi sao lưu trạng thái, gỡ riêng domain này và kết nối lại, KHÔNG chọn "Redirect all requests". Việc tháo nối có thể làm domain tạm gián đoạn/đợi SSL; không xóa project, không thay đổi Firestore Rules, không deploy Functions. Sau đó thử:

```powershell
curl.exe -I https://cognitivelearn.ai.vn/
curl.exe -I https://cognitive-learn-ai.web.app/
```

Trạng thái mong đợi: domain chính trả HTTP 200, không còn `Location` trỏ về chính nó. Nếu vẫn `301`, kiểm tra lại mapping của đúng custom domain thay vì chỉnh DNS mò.

CẢNH BÁO: Website web.app trả 200 chỉ chứng minh Hosting có trang web, không chứng minh đó là CP92 mới nhất. Cần deploy Hosting riêng sau khi build và QA PASS.
