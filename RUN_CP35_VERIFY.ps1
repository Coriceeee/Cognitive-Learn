$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== CLA CP35: clean dependency install ===" -ForegroundColor Cyan
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed. Stop; do not treat later gates as PASS." }

Write-Host "`n=== CLA CP35: static tests, rules and layout ===" -ForegroundColor Cyan
npm run verify:cp35:static
if ($LASTEXITCODE -ne 0) { throw "CP35 static verification failed." }

Write-Host "`n=== CLA CP35: production build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "CP35 production build failed." }

Write-Host "`nCP35 verification completed. Browser E2E, Firebase Emulator and staging must still be run separately." -ForegroundColor Green
