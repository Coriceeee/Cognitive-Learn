<#
 CLA CP83 Local Acceptance (PowerShell 5.1+)
 Verified immutable source plus generated-report checks; NO deploy.
 Uses the Node/Python actually available on the current machine.
 Does not change any CP31 historical research fingerprints.
#>
[CmdletBinding()]
param([switch]$SkipInstall,[switch]$SkipEmulator,[switch]$SkipPython)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$report=Join-Path $root ("reports\acceptance-cp83\run-$stamp")
$logDir=Join-Path $report 'logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$items=New-Object 'System.Collections.Generic.List[object]'
$count=0
function Run-Step {
  param([string]$Name,[string[]]$Command,[string]$Kind='REQUIRED')
  $script:count++
  $log=Join-Path $logDir ('{0:d2}_{1}.log' -f $script:count, ($Name -replace '[^a-zA-Z0-9-]','_'))
  $exe=$Command[0]
  $argsForCommand=@()
  if($Command.Count -gt 1){$argsForCommand=@($Command[1..($Command.Count-1)])}
  $status='BLOCKED';$exit=2;$reason=''
  Write-Host "[RUN] $Name" -ForegroundColor Cyan
  if(-not (Get-Command $exe -ErrorAction SilentlyContinue)) {
    $reason="Executable missing: $exe"
    $reason | Set-Content -LiteralPath $log -Encoding UTF8
  } else {
    $prev=$ErrorActionPreference
    try {
      $ErrorActionPreference='Continue'
      $global:LASTEXITCODE=2
      & $exe @argsForCommand 2>&1 | Out-File -LiteralPath $log -Encoding UTF8 -Width 400
      $exit=[int]$global:LASTEXITCODE
      $status=if($exit -eq 0){'PASS'}elseif($exit -eq 2){'BLOCKED'}else{'FAIL'}
    } catch {
      $reason=$_.Exception.Message
      ('Runner exception: ' + $reason) | Add-Content -LiteralPath $log -Encoding UTF8
      $exit=1;$status='FAIL'
    } finally {$ErrorActionPreference=$prev}
  }
  $script:items.Add([pscustomobject]@{Name=$Name;Status=$status;ExitCode=$exit;Kind=$Kind;Log=$log;Reason=$reason})
  Write-Host "[$status] $Name" -ForegroundColor $(if($status -eq 'PASS'){'Green'}elseif($status -eq 'BLOCKED'){'Yellow'}else{'Red'})
  if($status -ne 'PASS') {
    Get-Content -LiteralPath $log -Tail 5 -ErrorAction SilentlyContinue | ForEach-Object {Write-Host "  $_"}
  }
  return $status
}
function Block-Step {
  param([string]$Name,[string]$Note)
  $script:items.Add([pscustomobject]@{Name=$Name;Status='BLOCKED';ExitCode=2;Kind='REQUIRED';Log='';Reason=$Note})
  Write-Host "[BLOCKED] $Name - $Note" -ForegroundColor Yellow
}
function Skip-Step {
  param([string]$Name,[string]$Note)
  $script:items.Add([pscustomobject]@{Name=$Name;Status='NOT_RUN';ExitCode=$null;Kind='MANUAL';Log='';Reason=$Note})
  Write-Host "[NOT_RUN] $Name - $Note" -ForegroundColor Yellow
}
Write-Host '==========================================================='
Write-Host ' CLA CP83 | SOURCE + BUILD + TEST + RESEARCH + SECURITY'
Write-Host ' SAFETY: NO PRODUCTION DEPLOY | NO REAL-STUDENT DATA'
Write-Host '==========================================================='
Write-Host "SOURCE: $root"
Write-Host "LOGS: $report"
$passSource=Run-Step 'cp83_snapshot' @('node','tools/verify-cp83-snapshot.cjs')
if($passSource -ne 'PASS') { Write-Host 'SOURCE MISMATCH: no build/test from unverified tree.' -ForegroundColor Red }
else {
  $layout=Run-Step 'layout' @('npm.cmd','run','check:layout')
  $deps=(Test-Path (Join-Path $root 'node_modules\typescript')) -and (Test-Path (Join-Path $root 'node_modules\vite'))
  if(-not $deps -and -not $SkipInstall) {
    $inst=Run-Step 'npm_ci' @('npm.cmd','ci','--no-audit','--no-fund')
    $deps=$inst -eq 'PASS'
  }
  if($deps){
    $b=Run-Step 'production_build' @('npm.cmd','run','build')
    $t=Run-Step 'npm_test_full' @('npm.cmd','test')
    $x=Run-Step 'cp83_ops_tests' @('npm.cmd','run','test:cp83:ops')
  }else {
    Skip-Step 'production_build' 'node_modules unavailable or installation skipped'
    Skip-Step 'npm_test_full' 'node_modules unavailable or installation skipped'
    Skip-Step 'cp83_ops_tests' 'node_modules unavailable or installation skipped'
  }
  $r=Run-Step 'rules_static' @('npm.cmd','run','test:rules:v5:static')
  if(-not $SkipEmulator -and $deps) {
    $s=Run-Step 'rules_emulator' @('npm.cmd','run','test:rules:emulator')
    if($s -ne 'PASS') { Run-Step 'emulator_diagnostic' @('node','tools/cla_cp83_emulator_triage.cjs') | Out-Null }
    foreach($f in @('firestore_emulator_gate.json','firestore_emulator_gate.log','firestore_emulator_debug.log','firebase_emulator_debug.log')) {
      $source=Join-Path $root ('reports\security\'+$f)
      if(Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $report $f) -Force }
    }
  }else {Skip-Step 'rules_emulator' 'requires Firebase CLI, Java and installed dependencies; or explicitly skipped'}
  $s=Run-Step 'cp82_synthetic_generate' @('npm.cmd','run','research:cp82:generate')
  if($s -eq 'PASS') {$v=Run-Step 'cp82_synthetic_verify' @('npm.cmd','run','research:cp82:verify')}
  else {Skip-Step 'cp82_synthetic_verify' 'generate failed'}
  if(-not $SkipPython) {
    # Ensure a Unicode folder (e.g. C:\Gạo) does not crash the diagnostic in a cp1252 console.
    $env:PYTHONIOENCODING='utf-8:backslashreplace'
    $env:PYTHONUTF8='1'
    $p=Run-Step 'ml_environment' @('python','tools/cla_cp82_ml_preflight.py','--check')
    # Keep the research gate honest: if the ML native dependencies do not import,
    # dependent tests are BLOCKED (not mislabeled as broken model implementations).
    if($p -eq 'PASS') {
      Run-Step 'python_research' @('python','-m','unittest','discover','-s','research/tests','-v') | Out-Null
    } else {
      Block-Step 'python_research' 'Native ML dependencies unavailable; inspect ml_environment.json and logged import errors'
    }
    foreach($group in @('research/oulad/tests','research/cognitive_validation/tests','research/adaptive_study/tests')) {
      $n='python_' + (($group -split '/')[-2])
      Run-Step $n @('python','-m','unittest','discover','-s',$group,'-v') | Out-Null
    }
  }else {Skip-Step 'ml_environment_and_research' 'explicitly skipped'}
}
# A second integrity check must PASS after tests regenerate their reports.
if($passSource -eq 'PASS') { Run-Step 'cp83_snapshot_after_tests' @('node','tools/verify-cp83-snapshot.cjs') | Out-Null }
try {
  $items | Export-Csv -NoTypeInformation -Encoding UTF8 -LiteralPath (Join-Path $report 'status.csv')
  ConvertTo-Json -InputObject @($items.ToArray()) -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $report 'status.json')
  $pass=@($items|Where-Object Status -eq 'PASS').Count
  $fail=@($items|Where-Object Status -eq 'FAIL').Count
  $blocked=@($items|Where-Object Status -eq 'BLOCKED').Count
  $notRun=@($items|Where-Object Status -eq 'NOT_RUN').Count
  $summary=@('# CLA CP83 LOCAL ACCEPTANCE','','Source: ' + $root, 'PASS=' + $pass + ' FAIL=' + $fail + ' BLOCKED=' + $blocked + ' NOT_RUN=' + $notRun,'',
    '| Gate | Result | Exit |','|---|---|---|')
  foreach($e in $items){$summary+=('|' + $e.Name + '|' + $e.Status + '|' + $e.ExitCode + '|')}
  $summary+=@('','## Limits','',
   '- SOURCE integrity != verified deployment. Source-bound synthetic replay != research validation.',
   '- Legacy CP31 hashes remain locked; do not relabel CP31 evidence as CP83.',
   '- CP82 synthetic replay remains synthetic-only (NOT a new CP83 study).',
   '- Security gate must PASS real Firestore authorization tests, not just static tests.',
   '- Firebase/browser staging E2E, university coverage, ML validity and live Gemini are not certified here.',
   '- NEVER deploy production on the basis of this script alone.',
   '- Review failures before sending logs; remove secrets or student information.')
  [IO.File]::WriteAllText((Join-Path $report 'SUMMARY.md'),($summary -join "`r`n")+"`r`n",(New-Object Text.UTF8Encoding($false)))
  Write-Host "`nCP83 RESULT: PASS=$pass FAIL=$fail BLOCKED=$blocked NOT_RUN=$notRun" -ForegroundColor Cyan
  Write-Host "REPORT: $report"
} catch {Write-Host "Unable to write acceptance summary: $($_.Exception.Message)" -ForegroundColor Red;exit 2}
if($passSource -ne 'PASS' -or $fail -gt 0 -or $blocked -gt 0 -or $notRun -gt 0){exit 1}
exit 0
