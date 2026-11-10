param(
  [switch]$StartDev
)

$ErrorActionPreference = "Stop"

function Invoke-ExternalCheck {
  param(
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  Write-Host "`n===== $Label =====" -ForegroundColor Cyan
  & $Executable @Arguments
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode. Stop here; do not treat later gates as PASS."
  }
  Write-Host "PASS: $Label" -ForegroundColor Green
}

if (-not (Test-Path -LiteralPath ".\package.json")) {
  throw "Run this script from the Cognitive Learn project root (the folder containing package.json)."
}
if (-not (Test-Path -LiteralPath ".\package-lock.json")) {
  throw "package-lock.json is missing. Do not recreate it casually; restore the matching release lockfile first."
}

Write-Host "CLA CP34 verification" -ForegroundColor Cyan
Write-Host (Get-Location)
node -v
npm -v

Invoke-ExternalCheck -Label "Clean dependency install" -Executable "npm" -Arguments @("ci")
if (-not (Test-Path -LiteralPath ".\node_modules\.bin\vite.cmd")) {
  throw "Vite executable is missing after npm ci. Check npm registry/network before continuing."
}

Invoke-ExternalCheck -Label "Application and scientific visual tests" -Executable "npm" -Arguments @("test")
Invoke-ExternalCheck -Label "Firestore Rules static contracts" -Executable "npm" -Arguments @("run", "test:rules:static")
Invoke-ExternalCheck -Label "CLA layout contracts" -Executable "npm" -Arguments @("run", "check:layout")
Invoke-ExternalCheck -Label "Research baseline guard tests" -Executable "python" -Arguments @("-m", "unittest", "research.tests.test_uci_baseline", "-v")
Invoke-ExternalCheck -Label "API TypeScript typecheck" -Executable "npm" -Arguments @("run", "typecheck:api")
Invoke-ExternalCheck -Label "Production build" -Executable "npm" -Arguments @("run", "build")

Write-Host "`nCP34 LOCAL VERIFICATION: ALL AVAILABLE GATES PASSED" -ForegroundColor Green
Write-Host "Browser E2E, Firebase Emulator, staging and production still require separate execution."

if ($StartDev) {
  Write-Host "`nStarting Vite development server..." -ForegroundColor Cyan
  & npm run dev
  exit $LASTEXITCODE
}
