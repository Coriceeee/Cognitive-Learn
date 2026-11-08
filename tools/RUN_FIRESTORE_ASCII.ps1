# Runs a minimal Firestore Emulator test workspace at an ASCII-only absolute path.
# This avoids Java FileNotFoundException when source is under C:\Gạo\...
[CmdletBinding()]
param(
  [string]$ProjectRoot = (Join-Path $PSScriptRoot '..'),
  [string]$AsciiRoot = (Join-Path $env:LOCALAPPDATA 'CLA-Firestore-ASCII'),
  [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path -LiteralPath $ProjectRoot).Path
if ($AsciiRoot -match '[^\x00-\x7F]') { throw "Emulator path must be ASCII-only: $AsciiRoot. Pass -AsciiRoot 'C:\CLA-Firestore-ASCII'" }
if ($AsciiRoot.TrimEnd('\') -eq $source.TrimEnd('\')) { throw 'Use a separate directory so your project is not overwritten.' }
$files = @('package.json','package-lock.json','firebase.emulator.cp21.json',
  'firestore.rules.CANDIDATE_CP21','tests/firestore.rules.cp21.test.mjs')
New-Item -ItemType Directory -Force -Path $AsciiRoot | Out-Null
foreach ($relative in $files) {
  $from = Join-Path $source $relative
  $to = Join-Path $AsciiRoot $relative
  if (-not (Test-Path -LiteralPath $from -PathType Leaf)) { throw "Missing source file: $relative" }
  New-Item -ItemType Directory -Force -Path (Split-Path $to -Parent) | Out-Null
  Copy-Item -LiteralPath $from -Destination $to -Force
}
Write-Host "ASCII-only emulator test workspace ready: $AsciiRoot" -ForegroundColor Cyan
Write-Host 'Copied only package metadata, candidate Rules, emulator config and test file; no .env, Git or real student data.'
if ($PrepareOnly) { return }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java not on PATH. Use the working JDK 21 terminal.' }
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) { throw 'Firebase CLI not found. Install firebase-tools or add firebase to PATH.' }
Push-Location $AsciiRoot
try {
  & npm ci
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed in ASCII workspace.' }
  & firebase emulators:exec --project demo-cla-cp21-security --config firebase.emulator.cp21.json --only firestore 'npm run test:rules'
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Inspect $AsciiRoot\firestore-debug.log for the actual emulator error."
    throw 'Firestore runtime tests did not pass. Do not deploy candidate Rules.'
  }
  Write-Host 'FIRESTORE EMULATOR TESTS PASS — review total count in output before deployment.' -ForegroundColor Green
}
finally { Pop-Location }
