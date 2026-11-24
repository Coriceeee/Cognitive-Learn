# CLA CP92 — HF02: Full build test CP87 / domain redirect

## Scope
- The CP87 structural navigation test no longer falsely requires the whole CP92 checkout to exactly match the CP89 immutable snapshot. It now invokes the actual CP92 source snapshot verifier.
- Still checks that original CP87 circuit and frozen CP86 historical evidence files are unchanged.
- CP92_SOURCE_MANIFEST.json updated for this single changed test. No app UI, Firebase Rules, Auth, Gemini backend, CSS or dependencies changed.
- Assumes CP92 + HF01 is already copied to project root. Overlay files are rooted at the same project root.

## Install and run (PowerShell)

```powershell
Set-Location 'C:\Gạo\Cognitive-Learn'
$zip=Join-Path $env:USERPROFILE 'Downloads\CLA_CP92_BUILD_HF02_CP87_OVERLAY_20261123.zip'
Expand-Archive -LiteralPath $zip -DestinationPath (Get-Location).Path -Force
node tools/verify-cp92-snapshot.cjs
if ($LASTEXITCODE -ne 0) { throw 'SOURCE CHECK FAIL' }
node --test tests/cp87-navigation-priority.test.cjs
if ($LASTEXITCODE -ne 0) { throw 'CP87 TEST FAIL' }
.\BUILD_TOAN_BO_CLA_CP92.cmd
```

If script stops, inspect `.build-reports/06-all-tests.log` or `.build-reports/08-build.log` based on the failed step. The offline tests do not confirm a browser test, production deployment, or Gemini API success.

## Domain routing: independent problem
`https://cognitivelearn.ai.vn/` was observed returning HTTP 301 with `Location: https://cognitivelearn.ai.vn/`, a self-redirect. `https://cognitive-learn-ai.web.app/` returns 200. In Firebase Console > Hosting, inspect the custom-domain entry and remove the `Redirect all requests` behavior targeting itself. The apex domain should **serve content**; optionally redirect `www` to apex (not apex to apex). Keep DNS A/TXT intact unless Firebase's setup wizard explicitly instructs changes. Reattaching a domain can temporarily interrupt SSL/service.

This package neither changes Firebase Console nor deploys the website.
