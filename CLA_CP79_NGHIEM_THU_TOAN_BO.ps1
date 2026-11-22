<#
CLA CP79 - Bo lenh nghiem thu tren Windows PowerShell 5.1 / PowerShell 7
- Chi chay trong ma nguon CP79 da giai nen.
- Khong deploy, khong chinh production, khong tao tai khoan hoac tai dataset rieng tu.
- Ghi log tung buoc; FAIL khong lam bo qua cac buoc con lai.
- Ket qua PASS ky thuat KHONG dong nghia nghiem thu khoa hoc/production.

Vi du:
  .\CLA_CP79_NGHIEM_THU_TOAN_BO.ps1
  .\CLA_CP79_NGHIEM_THU_TOAN_BO.ps1 -AllTests -WithEmulator
  .\CLA_CP79_NGHIEM_THU_TOAN_BO.ps1 -SkipInstall -WithBrowser
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$AllTests,
    [switch]$WithEmulator,
    [switch]$WithBrowser,
    [switch]$WithResearchDemos,
    [switch]$WithDependencyAudit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path -LiteralPath (Join-Path $root 'package.json'))) {
    $nested = Join-Path $root 'Cognitive-Learn'
    if (Test-Path -LiteralPath (Join-Path $nested 'package.json')) { $root = $nested }
}
if (-not (Test-Path -LiteralPath (Join-Path $root 'package.json'))) {
    throw 'Khong tim thay package.json. Dat script trong thu muc Cognitive-Learn cua CP79.'
}
Set-Location -LiteralPath $root
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportDir = Join-Path $root ("reports/acceptance/CP79-$stamp")
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$script:results = New-Object System.Collections.Generic.List[object]
$npm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }

function Invoke-Check {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][string[]]$Command
    )
    $safeName = $Name -replace '[^a-zA-Z0-9_.-]', '_'
    $log = Join-Path $reportDir ("$safeName.log")
    $exe = $Command[0]
    $arguments = @()
    if ($Command.Count -gt 1) { $arguments = @($Command[1..($Command.Count - 1)]) }
    Write-Host ("[RUN] {0} :: {1} {2}" -f $Name, $exe, ($arguments -join ' ')) -ForegroundColor Cyan
    if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) {
        "Missing command: $exe" | Set-Content -LiteralPath $log -Encoding UTF8
        $script:results.Add([pscustomobject]@{ Gate=$Name; Status='BLOCKED'; ExitCode=$null; Log=$log })
        Write-Host "[BLOCKED] $Name (chua co $exe)" -ForegroundColor Yellow
        return
    }
    $exitCode = 1
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $exe @arguments 2>&1 | Out-File -LiteralPath $log -Encoding UTF8
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }
    }
    catch {
        ("EXCEPTION: " + $_.Exception.Message) | Add-Content -LiteralPath $log -Encoding UTF8
        $exitCode = 1
    }
    finally { $ErrorActionPreference = $previousPreference }
    $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $script:results.Add([pscustomobject]@{ Gate=$Name; Status=$status; ExitCode=$exitCode; Log=$log })
    $color = if ($status -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host "[$status] $Name" -ForegroundColor $color
    if ($exitCode -ne 0) {
        Get-Content -LiteralPath $log -Tail 9 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
    }
}

function Run-Npm {
    param([string]$Name,[string]$Script)
    Invoke-Check -Name $Name -Command @($npm,'run',$Script)
}

Write-Host 'CLA CP79 - NGHIEM THU KY THUAT (khong deploy)' -ForegroundColor Green
Write-Host "Thu muc: $root"
Write-Host "Log: $reportDir"

# A. Environment and dependency gates
Invoke-Check -Name 'A01_node_version' -Command @('node','--version')
Invoke-Check -Name 'A02_npm_version' -Command @($npm,'--version')
Invoke-Check -Name 'A03_python_version' -Command @('python','--version')
Invoke-Check -Name 'A04_java_version' -Command @('java','-version')
if (-not $SkipInstall) {
    Invoke-Check -Name 'A05_npm_ci' -Command @($npm,'ci','--no-audit','--no-fund')
}
Run-Npm -Name 'A06_dependencies' -Script 'check:dependencies'
Run-Npm -Name 'A07_layout' -Script 'check:layout'
if ($WithDependencyAudit) {
    Invoke-Check -Name 'A08_npm_audit' -Command @($npm,'audit','--omit=dev','--audit-level=high')
}

# B. Core security + source + compilation
Run-Npm -Name 'B01_rules_static' -Script 'test:rules:static'
Run-Npm -Name 'B02_rules_v5_static' -Script 'test:rules:v5:static'
Run-Npm -Name 'B03_rules_gate_unit' -Script 'test:rules:gate-unit'
Run-Npm -Name 'B04_api_typecheck' -Script 'typecheck:api'
Run-Npm -Name 'B05_production_build' -Script 'build'

# C. Whole-app tests AND independent regression gates (npm test is short-circuiting)
Invoke-Check -Name 'C01_full_npm_test' -Command @($npm,'test')
foreach ($item in @(
    @('C02_theme_CP79','test:cp79:theme'),
    @('C03_names_CP76','test:cp76:names'),
    @('C04_ux_CP78','test:cp78:clarity'),
    @('C05_UX_audit_CP75','test:cp75:ux-audit'),
    @('C06_student_only_CP40','test:cp40:student-only'),
    @('C07_student_journey_CP70','test:cp70:journey'),
    @('C08_unified_nav_CP71','test:cp71:unified-nav'),
    @('C09_lumen_fallback_CP72','test:cp72:lumen-fallback'),
    @('C10_mvp_gate_contract_CP73','test:cp73:mvp'),
    @('C11_multidevice_CP52','test:cp52:multidevice'),
    @('C12_draft_integrity_CP53','test:cp53:integrity'),
    @('C13_navigation_CP56','test:cp56:navigation'),
    @('C14_navigation_integration_CP56','test:cp56:navigation:integration'),
    @('C15_fireb_integration_CP69','test:cp69:firebase-integration'),
    @('C16_orion_autosave_CP47','test:cp47:orion-autosave'),
    @('C17_release_qa_CP68','test:cp68:qa-gate')
)) {
    Run-Npm -Name $item[0] -Script $item[1]
}

# D. Independent offline demo and technical research test suites
Run-Npm -Name 'D01_offline_demo_gate' -Script 'demo:gate'
Run-Npm -Name 'D02_HF_benchmark_tests' -Script 'test:hf:benchmark'
Invoke-Check -Name 'D03_oulad_tests' -Command @('python','-m','unittest','discover','-s','research/oulad/tests','-v')
Invoke-Check -Name 'D04_cognitive_tests' -Command @('python','-m','unittest','discover','-s','research/cognitive_validation/tests','-v')
Invoke-Check -Name 'D05_adaptive_tests' -Command @('python','-m','unittest','discover','-s','research/adaptive_study/tests','-v')
Invoke-Check -Name 'D06_external_data_tests' -Command @('python','-m','unittest','discover','-s','research/tests','-v')
Invoke-Check -Name 'D07_research_scope_test' -Command @('python','-m','unittest','discover','-s','tests','-p','test_research_scope.py','-v')
Invoke-Check -Name 'D08_packaging_test' -Command @('python','-m','unittest','discover','-s','tests','-p','test_cp53_safe_packaging.py','-v')
Invoke-Check -Name 'D09_validate_benchmark' -Command @('python','research/src/validate_benchmark.py')

if ($WithResearchDemos) {
    # Synthetic/offline demonstrations ONLY - do not treat as real scientific efficacy.
    foreach ($item in @(
        @('D10_golden_path_generate','research:golden-path'),
        @('D11_golden_path_verify','research:golden-path:verify'),
        @('D12_multi_cycle_generate','research:multi-cycle'),
        @('D13_multi_cycle_verify','research:multi-cycle:verify'),
        @('D14_measurement_generate','research:measurement'),
        @('D15_measurement_verify','research:measurement:verify'),
        @('D16_policy_verify','research:cp41:policy:verify')
    )) { Run-Npm -Name $item[0] -Script $item[1] }
}

# E. Optionally run EVERY registered test: script, except tests requiring browser/emulator.
# Duplicates core suite but helps locate failures after short-circuiting npm test.
if ($AllTests) {
    $package = Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
    $scriptNames = @($package.scripts.PSObject.Properties.Name | Where-Object {
        $_ -like 'test:*' -and $_ -notmatch '(browser|emulator|rules)'
    } | Sort-Object)
    $index = 0
    foreach ($scriptName in $scriptNames) {
        $index += 1
        Run-Npm -Name ('E{0:d3}_{1}' -f $index, $scriptName) -Script $scriptName
    }
}

# F. Emulator authorization tests: local only; requires Java 21+ and firebase-tools CLI.
if ($WithEmulator) {
    Invoke-Check -Name 'F01_firebase_version' -Command @('firebase','--version')
    Run-Npm -Name 'F02_real_firestore_emulator_gate' -Script 'test:rules:emulator'
}

# G. Real Chromium browser QA: safe LOCAL synthetic credentials ONLY.
# Start firebase emulators and npm dev in separate shells, and explicitly supply QA credentials.
if ($WithBrowser) {
    Run-Npm -Name 'G01_browser_preflight' -Script 'qa:cp73:mvp:preflight'
    Run-Npm -Name 'G02_browser_12_checks' -Script 'qa:cp73:mvp'
}

$csv = Join-Path $reportDir 'status.csv'
$json = Join-Path $reportDir 'status.json'
$script:results | Export-Csv -LiteralPath $csv -Encoding UTF8 -NoTypeInformation
$script:results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $json -Encoding UTF8
$pass = @($script:results | Where-Object Status -eq 'PASS').Count
$fail = @($script:results | Where-Object Status -eq 'FAIL').Count
$blocked = @($script:results | Where-Object Status -eq 'BLOCKED').Count
Write-Host ''
Write-Host ("KET QUA KY THUAT: PASS={0}, FAIL={1}, BLOCKED={2}" -f $pass,$fail,$blocked) -ForegroundColor Cyan
Write-Host "Bang tong hop: $csv"
Write-Host "JSON: $json"
Write-Host 'CHUA CO QUYEN KET LUAN website/research 100/100 chi tu cac lenh nay.' -ForegroundColor Yellow
if ($fail -gt 0) { exit 1 }
if ($blocked -gt 0) { exit 2 }
exit 0
