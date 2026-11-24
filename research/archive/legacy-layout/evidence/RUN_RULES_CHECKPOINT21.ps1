
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$project = 'demo-cla-cp21-security'
New-Item -ItemType Directory -Force -Path 'evidence' | Out-Null
Write-Host "CLA Checkpoint 21 | project: $project | Firestore Emulator only" -ForegroundColor Cyan
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
  throw 'Chưa có Firebase CLI. Cài đặt: npm install -g firebase-tools'
}
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
  throw 'Chưa có Java. Cài Java 21 và kiểm tra: java -version'
}
if (-not (Test-Path 'node_modules/@firebase/rules-unit-testing')) {
  throw 'Thiếu @firebase/rules-unit-testing. Chạy: npm install -D @firebase/rules-unit-testing@6.0.0'
}
if (-not (Test-Path 'firestore.rules.CANDIDATE_CP21')) {
  throw 'Thiếu firestore.rules.CANDIDATE_CP21 tại thư mục gốc'
}
if (-not (Test-Path 'firebase.emulator.cp21.json')) {
  throw 'Thiếu firebase.emulator.cp21.json tại thư mục gốc'
}
if (-not (Test-Path 'tests/firestore.rules.cp21.test.mjs')) {
  throw 'Thiếu tests/firestore.rules.cp21.test.mjs'
}
Write-Host 'Running static contract checks (not security authorization checks)...'
& npm run test:rules:static
if ($LASTEXITCODE -ne 0) { throw 'Static checks FAIL. STOP.' }
Write-Host 'Running authenticated/unauthenticated allow-deny tests in Firestore Emulator...'
& firebase emulators:exec --project $project --config 'firebase.emulator.cp21.json' --only firestore 'npm run test:rules' 2>&1 |
  Tee-Object -FilePath 'evidence/firestore_rules_cp21_emulator.log'
$code = $LASTEXITCODE
if ($code -ne 0) { throw "Firestore Emulator tests failed (exit $code); DO NOT DEPLOY RULES" }
Write-Host 'Emulator suite exited successfully. Inspect test count and logs before sign-off.' -ForegroundColor Green
Write-Host 'Evidence: evidence/firestore_rules_cp21_emulator.log'
