# CLA Security Gate: local demo Firestore Emulator only. Never deploys rules.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
& node 'tools/firestoreSecurityGate.cjs'
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  throw "CLA Firestore security gate is NOT PASS (exit $exitCode). Inspect reports/security/firestore_emulator_gate.json"
}
Write-Host 'CLA Firestore Emulator security gate PASS. Production rules remain unverified.' -ForegroundColor Green
