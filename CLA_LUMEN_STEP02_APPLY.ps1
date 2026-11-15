param(
  [string]$ProjectRoot = 'C:\Gạo\Cognitive-Learn'
)
$ErrorActionPreference = 'Stop'

$relative = 'src\styles\24-cla-subpages-ui.css'
$target = Join-Path $ProjectRoot $relative
$patched = Join-Path $PSScriptRoot $relative
$expectedOriginalHash = '0A1A110EEFD9C4A9F7FA6865E88D491727260BB021B5932609EDC63AE41B125B'
$expectedPatchedHash  = 'DA62FEA7BF3301E7A8DF0A2C7128A60DA9602D829E2E0B18CBEC77A0BAFC9AE0'

if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
  throw "Cannot find target: $target. Nothing was changed."
}
if (-not (Test-Path -LiteralPath $patched -PathType Leaf)) {
  throw "Cannot find patch file: $patched. Nothing was changed."
}
$actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
if ($actual -eq $expectedPatchedHash) {
  Write-Host 'Lumen Step 02 already applied. Nothing changed.' -ForegroundColor Yellow
  exit 0
}
if ($actual -ne $expectedOriginalHash) {
  throw "Current CSS differs from audited CP37 (SHA256 $actual). Nothing changed. Check the diff manually; do not overwrite your edits."
}
$payloadHash = (Get-FileHash -LiteralPath $patched -Algorithm SHA256).Hash
if ($payloadHash -ne $expectedPatchedHash) {
  throw "Patch file hash mismatch; nothing changed."
}
$backup = "$target.pre-lumen-step02-$(Get-Date -Format 'yyyyMMdd-HHmmss').bak"
Copy-Item -LiteralPath $target -Destination $backup -ErrorAction Stop
Copy-Item -LiteralPath $patched -Destination $target -Force -ErrorAction Stop
$newHash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
if ($newHash -ne $expectedPatchedHash) {
  Copy-Item -LiteralPath $backup -Destination $target -Force
  throw "Verification failed; original CSS restored from $backup."
}
Write-Host "Applied ONLY: $relative" -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Cyan
Write-Host 'Now run npm run build, npm run dev, then inspect /lumen and its four subpages.'
