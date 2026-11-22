<#
CLA CP80 acceptance runner (PowerShell 5.1+).
Run through CHAY_NGHIEM_THU_CP80.cmd to bypass the script-signature warning for this process only.
No production deployment. No student credentials. No protected datasets downloaded.
Known repairs are exact, version-specific and backed up under reports/acceptance/.
#>
[CmdletBinding()]
param(
    [string]$ProjectRoot = '',
    [switch]$RepairKnownIssues,
    [switch]$SkipInstall,
    [switch]$ForceInstall,
    [switch]$AllTests,
    [switch]$WithEmulator,
    [switch]$WithBrowserPreflight,
    [switch]$RunBrowser
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Find-ProjectRoot {
    param([string]$Hint)
    $candidates = New-Object System.Collections.Generic.List[string]
    foreach ($p in @($Hint, $PSScriptRoot, (Get-Location).Path)) {
        if ([string]::IsNullOrWhiteSpace($p)) { continue }
        $cursor = $p
        for ($i = 0; $i -lt 4; $i++) {
            $candidates.Add($cursor)
            $candidates.Add((Join-Path $cursor 'Cognitive-Learn'))
            $parent = Split-Path -Parent $cursor
            if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $cursor) { break }
            $cursor = $parent
        }
    }
    foreach ($item in $candidates) {
        if (Test-Path -LiteralPath (Join-Path $item 'package.json') -PathType Leaf) {
            $pkg = Get-Content -LiteralPath (Join-Path $item 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($pkg.name -eq 'cognitive-learn-ai') { return (Resolve-Path -LiteralPath $item).Path }
        }
    }
    throw 'CLA project root not found. Unzip files into C:\Gao\Cognitive-Learn (the folder containing package.json).'
}

$project = Find-ProjectRoot $ProjectRoot
Set-Location -LiteralPath $project
$script:package = Get-Content -LiteralPath (Join-Path $project 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$report = Join-Path $project ("reports/acceptance/CLA_CP80_$stamp")
$logs = Join-Path $report 'logs'
$backups = Join-Path $report 'backups'
New-Item -Path $logs -ItemType Directory -Force | Out-Null
New-Item -Path $backups -ItemType Directory -Force | Out-Null
$script:Rows = New-Object System.Collections.Generic.List[object]
$script:Fixes = New-Object System.Collections.Generic.List[object]
$script:StepId = 0
$script:NodeReady = $false
$script:Npm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }

function Add-Row {
    param([string]$Group,[string]$Name,[string]$Status,[int]$ExitCode,[string]$Log,[string]$Note,[int]$DurationMs=0)
    $script:Rows.Add([pscustomobject]@{
        Group=$Group; Name=$Name; Status=$Status; ExitCode=$ExitCode;
        DurationMs=$DurationMs; Log=$Log; Note=$Note
    })
}
function Run-Native {
    param([string]$Group,[string]$Name,[string[]]$Command,[switch]$RequireModules)
    $script:StepId++
    $safeName = $Name -replace '[^A-Za-z0-9_.-]', '_'
    $logPath = Join-Path $logs ('{0:d3}_{1}.log' -f $script:StepId, $safeName)
    $display = $Command -join ' '
    if ($RequireModules -and -not $script:NodeReady) {
        'BLOCKED: node_modules dependencies not ready. Resolve npm ci / check:dependencies first.' |
            Set-Content -LiteralPath $logPath -Encoding UTF8
        Add-Row $Group $Name 'BLOCKED' 2 $logPath 'Dependencies unavailable'
        Write-Host ("[BLOCKED] $Name - dependencies") -ForegroundColor Yellow
        return 'BLOCKED'
    }
    if (-not (Get-Command $Command[0] -ErrorAction SilentlyContinue)) {
        "BLOCKED: executable not installed: $($Command[0])" | Set-Content -LiteralPath $logPath -Encoding UTF8
        Add-Row $Group $Name 'BLOCKED' 2 $logPath 'Executable missing'
        Write-Host ("[BLOCKED] $Name - missing $($Command[0])") -ForegroundColor Yellow
        return 'BLOCKED'
    }
    Write-Host ("[RUN] $Group | $Name") -ForegroundColor Cyan
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $exitCode = 1
    $oldError = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $global:LASTEXITCODE = $null
        $exe = $Command[0]
        $commandArgs = @()
        if ($Command.Length -gt 1) { $commandArgs = @($Command[1..($Command.Length - 1)]) }
        & $exe @commandArgs 2>&1 | Out-File -LiteralPath $logPath -Encoding UTF8 -Width 400
        if ($null -ne $LASTEXITCODE) { $exitCode = [int]$LASTEXITCODE }
        else { $exitCode = 0 }
    } catch {
        ("EXCEPTION: " + $_.Exception.Message) | Add-Content -LiteralPath $logPath -Encoding UTF8
        $exitCode = 1
    } finally {
        $ErrorActionPreference = $oldError
        $sw.Stop()
    }
    $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    Add-Row $Group $Name $status $exitCode $logPath $display ([int]$sw.ElapsedMilliseconds)
    if ($status -eq 'PASS') { Write-Host ("[PASS] $Name") -ForegroundColor Green }
    else {
        Write-Host ("[FAIL] $Name - exit $exitCode; log: $logPath") -ForegroundColor Red
        Get-Content -LiteralPath $logPath -Tail 7 -ErrorAction SilentlyContinue |
            ForEach-Object { Write-Host "  $_" }
    }
    return $status
}
function Run-Npm {
    param([string]$Group,[string]$Name,[string]$Script)
    if (@($script:package.scripts.PSObject.Properties.Name) -notcontains $Script) {
        $script:StepId++
        $logPath = Join-Path $logs ('{0:d3}_{1}.log' -f $script:StepId, ($Name -replace '[^A-Za-z0-9_.-]','_'))
        "BLOCKED: missing package.json script: $Script" | Set-Content -LiteralPath $logPath -Encoding UTF8
        Add-Row $Group $Name 'BLOCKED' 2 $logPath 'package.json script missing'
        Write-Host ("[BLOCKED] $Name - script missing") -ForegroundColor Yellow
        return 'BLOCKED'
    }
    return (Run-Native $Group $Name @($script:Npm, 'run', $Script) -RequireModules)
}
function Save-Repair {
    param([string]$Relative,[object[]]$Pairs)
    $dest = Join-Path $project ($Relative.Replace('/', [IO.Path]::DirectorySeparatorChar))
    if (-not (Test-Path -LiteralPath $dest -PathType Leaf)) {
        $script:Fixes.Add([pscustomobject]@{ File=$Relative; Status='BLOCKED'; Note='File missing'; Backup=''; Before=''; After='' })
        return
    }
    $original = [IO.File]::ReadAllText($dest, [Text.Encoding]::UTF8)
    $updated = $original
    $already = $true
    foreach ($pair in $Pairs) {
        $oldText = [string]$pair[0]
        $newText = [string]$pair[1]
        $occurrences = ([regex]::Matches($updated, [regex]::Escape($oldText))).Count
        if ($occurrences -gt 1) {
            $script:Fixes.Add([pscustomobject]@{File=$Relative;Status='BLOCKED';Note="Old text occurs $occurrences times";Backup='';Before='';After=''})
            return
        }
        if ($occurrences -eq 0) {
            if (-not $updated.Contains($newText)) {
                $script:Fixes.Add([pscustomobject]@{File=$Relative;Status='BLOCKED';Note='Unexpected source version; no change';Backup='';Before='';After=''})
                return
            }
        } else {
            $already = $false
            $updated = $updated.Replace($oldText, $newText)
        }
    }
    $beforeHash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash
    if ($already) {
        $script:Fixes.Add([pscustomobject]@{File=$Relative;Status='ALREADY_FIXED';Note='Expected fix already present';Backup='';Before=$beforeHash;After=$beforeHash})
        Write-Host ("[FIX SKIP] $Relative already fixed") -ForegroundColor Green
        return
    }
    $backup = Join-Path $backups ($Relative.Replace('/', [IO.Path]::DirectorySeparatorChar))
    New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
    Copy-Item -LiteralPath $dest -Destination $backup -ErrorAction Stop
    [IO.File]::WriteAllText($dest, $updated, (New-Object System.Text.UTF8Encoding($false)))
    $afterHash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash
    $script:Fixes.Add([pscustomobject]@{File=$Relative;Status='PATCHED';Note='Exact replacements, backup saved';Backup=$backup;Before=$beforeHash;After=$afterHash})
    Write-Host ("[FIXED] $Relative (backup in acceptance report)") -ForegroundColor Green
}
function Write-Reports {
    $csv = Join-Path $report 'status.csv'
    $json = Join-Path $report 'status.json'
    @($script:Rows.ToArray()) | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8
    ConvertTo-Json -InputObject @($script:Rows.ToArray()) -Depth 8 | Set-Content -LiteralPath $json -Encoding UTF8
    ConvertTo-Json -InputObject @($script:Fixes.ToArray()) -Depth 8 | Set-Content -LiteralPath (Join-Path $report 'fixes.json') -Encoding UTF8
    $pass = @($script:Rows | Where-Object Status -eq 'PASS').Count
    $fail = @($script:Rows | Where-Object Status -eq 'FAIL').Count
    $blocked = @($script:Rows | Where-Object Status -eq 'BLOCKED').Count
    $head = @(
        '# CLA CP80 - Acceptance run summary',
        '',
        ('Date: {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')),
        ('Project: {0}' -f $project),
        ('PASS: {0} | FAIL: {1} | BLOCKED: {2}' -f $pass,$fail,$blocked),
        '',
        'This is automated technical evidence ONLY. It is not a website /100 or scientific validation /100 signoff.',
        '',
        '## Technical checks',
        '',
        '| Group | Task | Status | Exit | Log |',
        '|---|---|---|---|---|'
    )
    foreach ($r in $script:Rows) {
        $shortLog = if ([string]::IsNullOrWhiteSpace([string]$r.Log)) { '-' } else { Split-Path -Leaf $r.Log }
        $head += ('| {0} | {1} | {2} | {3} | {4} |' -f $r.Group,$r.Name,$r.Status,$r.ExitCode,$shortLog)
    }
    $head += @('', '## Known-source repairs', '', 'See fixes.json and backups/ for exact changes and SHA-256.', '',
        '## Acceptance limitations', '',
        '- Firebase Emulator test does not prove production Rules or permissions on live data.',
        '- Real-browser E2E requires locally running QA emulators/server and synthetic QA accounts.',
        '- SCI/MAS/CSL psychometric validity: NOT VERIFIED by these tests.',
        '- Predictive generalization/calibration on real eligible THPT outcomes: NOT VERIFIED.',
        '- CLA Static vs Adaptive real-world effect: NOT VERIFIED.',
        '- National coverage and official admission source freshness: manual/real-source audit required.',
        '- Contest prize probability: NOT ESTIMATED.'
    )
    [IO.File]::WriteAllText((Join-Path $report 'SUMMARY.md'), ($head -join "`r`n") + "`r`n", (New-Object System.Text.UTF8Encoding($false)))
    $manual = @'
Category,Gate,Status,RequiredEvidence
Product,Firebase production rights and restore,NOT_VERIFIED,emulator matrix plus controlled staging deploy and rollback
Product,Student account save reload and multi device,NOT_VERIFIED,recorded browser E2E with synthetic QA accounts
Product,All six modules navigation charts and accessibility,NOT_VERIFIED,desktop and mobile browser QA
Product,Full source/official admissions and scholarship freshness,NOT_VERIFIED,dated source registry plus spot check
Product,Real API Gemini failure and security,NOT_VERIFIED,staging API logs with redaction
Research,SCI MAS CSL reliability and validity,NOT_VERIFIED,appropriate participant measurements and intervals
Research,ML out of sample baseline and calibration,NOT_VERIFIED,eligible outcome labelled holdout
Research,Adaptive vs Static comparative efficacy,NOT_VERIFIED,approved design and observed outcomes
Research,Data usage permissions and minor consent,NOT_VERIFIED,legal and research protocol review
Contest,Original contribution and AI usage log,NOT_VERIFIED,authorship logs and defense package
Contest,Poster and defense Q&A,NOT_VERIFIED,poster and rehearsed questions with recorded evidence
'@
    [IO.File]::WriteAllText((Join-Path $report 'manual_scientific_gates.csv'), $manual, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ''
    Write-Host ("SUMMARY: PASS=$pass FAIL=$fail BLOCKED=$blocked") -ForegroundColor Cyan
    Write-Host ("RESULT DIRECTORY: $report") -ForegroundColor Cyan
    Write-Host 'Send status.csv, status.json, SUMMARY.md, fixes.json and relevant FAIL logs (after redacting secrets).' -ForegroundColor Yellow
}

Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host ' CLA CP80 | ONE-CLICK LOCAL ACCEPTANCE | NO PRODUCTION DEPLOY' -ForegroundColor Cyan
Write-Host '==============================================================' -ForegroundColor Cyan
Write-Host "PROJECT: $project"
Write-Host "REPORT: $report"

try {
    $s = Run-Native 'ENV' 'node_version' @('node','--version')
    $s = Run-Native 'ENV' 'npm_version' @($script:Npm,'--version')
    $s = Run-Native 'ENV' 'python_version' @('python','--version')
    $s = Run-Native 'ENV' 'java_version' @('java','-version')
    if (Test-Path -LiteralPath (Join-Path $project '.git')) {
        $s = Run-Native 'ENV' 'git_status' @('git','status','--short')
    } else {
        Add-Row 'ENV' 'git_status' 'BLOCKED' 2 '' 'Project is a ZIP export without Git metadata; cannot verify commit SHA'
        Write-Host '[BLOCKED] git_status - extracted ZIP has no .git metadata' -ForegroundColor Yellow
    }

    if ($RepairKnownIssues) {
        Save-Repair 'src/lib/useDailyCompanion.ts' @(
            @('const current: DailyCompanionData = snapshot.exists()', 'const currentData: DailyCompanionData = snapshot.exists()'),
            @('const next = transform(current);', 'const next = transform(currentData);')
        )
        Save-Repair 'tests/student-role-isolation.test.cjs' @(
            @('assert.match(student,/Du học toàn cầu/);', 'assert.match(student,/Chạm thế giới/);'),
            @('assert.match(student,/Báo cáo của tôi/);', 'assert.match(student,/Bức tranh tiến bộ/);'),
            @('assert.match(student,/Khoảng cách|Điều kiện còn thiếu/);', 'assert.match(student,/Mảnh ghép còn thiếu/);')
        )
    } else {
        Write-Host '[INFO] Audit-only mode: no source edits.' -ForegroundColor Yellow
    }
    $fixBad = @($script:Fixes | Where-Object Status -eq 'BLOCKED').Count
    if ($fixBad -gt 0) {
        Add-Row 'FIX' 'known_patch_checks' 'BLOCKED' 2 (Join-Path $report 'fixes.json') 'One or more source files are different; inspect them, no blind repair'
    }

    # Reuse existing installed deps when the project health check passes.
    # This avoids repeat npm ci hitting EPERM on a Vite/Rolldown binary in use.
    if ($SkipInstall) {
        Write-Host '[INFO] SkipInstall selected.' -ForegroundColor Yellow
        $script:NodeReady = (Test-Path -LiteralPath (Join-Path $project 'node_modules/.bin/tsc.cmd')) -and
            (Test-Path -LiteralPath (Join-Path $project 'node_modules/.bin/vite.cmd'))
    } else {
        $installed = (Test-Path -LiteralPath (Join-Path $project 'node_modules/.bin/tsc.cmd')) -and
            (Test-Path -LiteralPath (Join-Path $project 'node_modules/.bin/vite.cmd'))
        if ($installed -and -not $ForceInstall) {
            $probe = Run-Native 'ENV' 'dependencies_precheck' @($script:Npm,'run','check:dependencies')
            if ($probe -eq 'PASS') { $script:NodeReady = $true; Write-Host '[INFO] Valid dependencies already present. npm ci skipped to avoid EPERM.' -ForegroundColor Green }
        }
        if (-not $script:NodeReady) {
            $ci = Run-Native 'ENV' 'npm_ci' @($script:Npm,'ci','--no-audit','--no-fund')
            if ($ci -eq 'PASS') { $script:NodeReady = $true }
            if ($ci -eq 'FAIL') {
                Write-Host '[NOTICE] npm ci failed. If EPERM, stop Vite/Node sessions, close VS Code terminals and retry.' -ForegroundColor Yellow
                Write-Host '[NOTICE] This runner never deletes node_modules or forces shutdown of other applications.' -ForegroundColor Yellow
            }
        }
    }
    if ($script:NodeReady) {
        $depFinal = Run-Native 'ENV' 'dependencies_final' @($script:Npm,'run','check:dependencies')
        if ($depFinal -ne 'PASS') { $script:NodeReady = $false }
    } else {
        Add-Row 'ENV' 'dependencies_final' 'BLOCKED' 2 '' 'Dependencies not installed, npm ci failed or --SkipInstall has no modules'
    }

    # Build, API, security rules and source integrity.
    $null = Run-Native 'TEST' 'cp80_regression' @('node','--test','tests/cp80-regressions.test.cjs')
    $null = Run-Npm 'BUILD' 'layout' 'check:layout'
    $null = Run-Npm 'BUILD' 'api_typecheck' 'typecheck:api'
    $null = Run-Npm 'BUILD' 'production_build' 'build'
    $null = Run-Npm 'SECURITY' 'rules_static' 'test:rules:static'
    $null = Run-Npm 'SECURITY' 'rules_v5_static' 'test:rules:v5:static'
    $null = Run-Npm 'SECURITY' 'rules_gate_unit' 'test:rules:gate-unit'
    $null = Run-Npm 'SECURITY' 'rules_emulator_preflight' 'test:rules:preflight'

    # Full npm test will stop at the first failure. Keep it AND run each test:* individually.
    $null = Run-Native 'TEST' 'npm_test_full' @($script:Npm,'test') -RequireModules
    if ($AllTests) {
        $testNames = @($script:package.scripts.PSObject.Properties.Name | Where-Object {
            $_ -like 'test:*' -and $_ -ne 'test:rules' -and $_ -notmatch 'browser|emulator'
        } | Sort-Object -Unique)
        Write-Host ("[INFO] Independent npm test groups: $($testNames.Count). They continue after FAIL.") -ForegroundColor Cyan
        foreach ($name in $testNames) { $null = Run-Npm 'UNIT' $name $name }
    }

    # Python and offline/research deterministic gates. No HF downloading and no real student data ingestion.
    foreach ($test in @(
        @('research_oulad', 'research/oulad/tests'),
        @('research_cognitive', 'research/cognitive_validation/tests'),
        @('research_adaptive', 'research/adaptive_study/tests'),
        @('research_general', 'research/tests')
    )) { $null = Run-Native 'RESEARCH' $test[0] @('python','-m','unittest','discover','-s',$test[1],'-v') }
    $null = Run-Native 'RESEARCH' 'research_scope_py' @('python','-m','unittest','discover','-s','tests','-p','test_research_scope.py','-v')
    $null = Run-Native 'RESEARCH' 'safe_package_py' @('python','-m','unittest','discover','-s','tests','-p','test_cp53_safe_packaging.py','-v')
    $null = Run-Npm 'RESEARCH' 'hf_benchmark_unit' 'test:hf:benchmark'
    foreach ($pair in @(
        @('golden_path_generate','research:golden-path'),
        @('golden_path_verify','research:golden-path:verify'),
        @('multi_cycle_generate','research:multi-cycle'),
        @('multi_cycle_verify','research:multi-cycle:verify'),
        @('measurement_generate','research:measurement'),
        @('measurement_verify','research:measurement:verify'),
        @('policy_verify','research:cp41:policy:verify')
    )) { $null = Run-Npm 'RESEARCH' $pair[0] $pair[1] }
    $null = Run-Npm 'DEMO' 'demo_gate' 'demo:gate'

    # Emulator runs strictly against the reviewed demo project and local loopback.
    if ($WithEmulator) {
        $null = Run-Native 'EMULATOR' 'firebase_cli' @('firebase','--version')
        $null = Run-Npm 'EMULATOR' 'firestore_security_emulator' 'test:rules:emulator'
    } else {
        Add-Row 'EMULATOR' 'firestore_security_emulator' 'BLOCKED' 2 '' 'Not enabled: re-run with -WithEmulator'
    }

    if ($WithBrowserPreflight -or $RunBrowser) {
        $preflight = Run-Npm 'BROWSER' 'browser_qa_preflight' 'qa:cp73:mvp:preflight'
        if ($RunBrowser -and $preflight -eq 'PASS') {
            if ($env:CLA_E2E_QA_ACK -eq 'I_USE_SYNTHETIC_QA_ACCOUNTS' -and $env:CLA_E2E_STUDENT_EMAIL -and $env:CLA_E2E_STUDENT_PASSWORD) {
                $null = Run-Npm 'BROWSER' 'browser_qa_full' 'qa:cp73:mvp'
            } else {
                Add-Row 'BROWSER' 'browser_qa_full' 'BLOCKED' 2 '' 'QA acknowledgement / synthetic account credentials missing'
            }
        } else {
            Add-Row 'BROWSER' 'browser_qa_full' 'BLOCKED' 2 '' 'Preflight only, or preflight not PASS, or -RunBrowser not selected'
        }
    } else {
        Add-Row 'BROWSER' 'browser_qa_full' 'BLOCKED' 2 '' 'Browser stage was not requested'
    }
} catch {
    $message = $_.Exception.Message
    Add-Row 'FATAL' 'runner_exception' 'FAIL' 1 '' $message
    Write-Host ("[FATAL] $message") -ForegroundColor Red
} finally {
    Write-Reports
}

$failures = @($script:Rows | Where-Object Status -eq 'FAIL').Count
$blocked = @($script:Rows | Where-Object Status -eq 'BLOCKED').Count
if ($failures -gt 0) { exit 1 }
if ($blocked -gt 0) { exit 2 }
exit 0
