param(
  [Parameter(Mandatory = $true)] [string] $ProjectRoot,
  [switch] $DryRun
)
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$root = (Resolve-Path -LiteralPath $ProjectRoot).Path
if (-not (Test-Path -LiteralPath (Join-Path $root "package.json"))) {
  throw "No package.json found at ProjectRoot. Nothing changed."
}
$items = @(
  @{ Relative = "src/lib/admissionRules.ts"; OriginalHash = "387F82967FD653BA84138FF46CDBEF2378D1F053FA4DC59EC09EF675DBAEAE0E"; PatchedHash = "AB477DC0A7A2E12D54282C7264A3192616DECB78B8CFA9BD9151277AD4B378DF" },
  @{ Relative = "src/page/atlas/components/AtlasAdmissionEnginePanel.tsx"; OriginalHash = "A9D0E19F03384A021BF315A42003A71C38FF52CEA9FC8FF001AB0C8D79B4A129"; PatchedHash = "FAB6F6EBAA2F3E8120EB21FD689A2E37B5BB8551F3BB25689487CF6AE0042869" }
)

# Preflight every file before writing anything.
foreach ($item in $items) {
  $target = Join-Path $root $item.Relative
  $patch = Join-Path $PSScriptRoot $item.Relative
  if (-not (Test-Path -LiteralPath $target)) {
    throw "Source file missing: $target. No files changed."
  }
  if (-not (Test-Path -LiteralPath $patch)) {
    throw "Patch file missing: $patch. No files changed."
  }
  $actual = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
  if ($actual -ne $item.OriginalHash) {
    throw "Source differs from audited CP37 at $target. Do NOT overwrite; inspect the diff first. No files changed."
  }
  $provided = (Get-FileHash -LiteralPath $patch -Algorithm SHA256).Hash
  if ($provided -ne $item.PatchedHash) {
    throw "Patch file checksum mismatch: $patch. No files changed."
  }
}
$testRelative = 'tests/step03-admission-benchmark.test.mjs'
$testTarget = Join-Path $root $testRelative
$testPatch = Join-Path $PSScriptRoot $testRelative
if (-not (Test-Path -LiteralPath $testPatch)) {
  throw "Regression test missing in patch. Nothing changed."
}
if (Test-Path -LiteralPath $testTarget) {
  throw "Existing test at $testTarget. Refuse overwrite. Nothing changed."
}
if ($DryRun) {
  Write-Host "DRY-RUN PASS: audited CP37 source and patch match. Nothing changed."
  exit 0
}
$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backup = Join-Path $root ".cla-backups/atlas-step03_$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
foreach ($item in $items) {
  $relative = $item.Relative
  $backupFile = Join-Path $backup $relative
  New-Item -ItemType Directory -Force -Path (Split-Path $backupFile -Parent) | Out-Null
  Copy-Item -LiteralPath (Join-Path $root $relative) -Destination $backupFile
}
try {
  foreach ($item in $items) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $item.Relative) -Destination (Join-Path $root $item.Relative)
    $actual = (Get-FileHash -LiteralPath (Join-Path $root $item.Relative) -Algorithm SHA256).Hash
    if ($actual -ne $item.PatchedHash) { throw "Post-copy hash failure at $($item.Relative)" }
  }
  Copy-Item -LiteralPath $testPatch -Destination $testTarget
  Write-Host "STEP03 APPLIED: 2 source files + 1 test." -ForegroundColor Green
  Write-Host "Backup: $backup"
  Write-Host "Next: node --experimental-strip-types --test tests/step03-admission-benchmark.test.mjs"
  Write-Host "Then: npm run build"
} catch {
  foreach ($item in $items) {
    $backupFile = Join-Path $backup $item.Relative
    if (Test-Path -LiteralPath $backupFile) {
      Copy-Item -LiteralPath $backupFile -Destination (Join-Path $root $item.Relative) -Force
    }
  }
  if (Test-Path -LiteralPath $testTarget) { Remove-Item -LiteralPath $testTarget -Force }
  throw "STEP03 FAILED AND FILES RESTORED: $($_.Exception.Message)"
}
