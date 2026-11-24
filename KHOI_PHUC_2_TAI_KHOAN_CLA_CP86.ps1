# CLA CP86: independent live-local login session for the two existing Firebase accounts.
# Never deploys, edits student records, deletes accounts, or changes QA .env files.
[CmdletBinding()]
param(
    [string]$ProjectRoot = 'C:\Gạo\Cognitive-Learn',
    [ValidateRange(1024,65535)][int]$Port = 5174,
    [switch]$CheckOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-PublicEnvFile([string]$Path) {
    $result = @{}
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $result }
    foreach ($line in [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8)) {
        if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -match '^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)$') {
            $value = $matches[2].Trim().Trim('"').Trim("'")
            $result[$matches[1]] = $value
        }
    }
    return $result
}

function Check-PublicConfig($settings) {
    $required = @('VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID','VITE_FIREBASE_MESSAGING_SENDER_ID')
    foreach ($name in $required) {
        if (-not $settings.ContainsKey($name) -or [string]::IsNullOrWhiteSpace([string]$settings[$name])) {
            throw "Thieu gia tri $name. Lay trong Firebase Console > Project settings > Your apps > Web App."
        }
        if ([string]$settings[$name] -match '(?i)^(fake|your|example|demo|placeholder|xxx)') {
            throw "$name dang la gia tri gia lap. Khong the dung cho hai tai khoan cu."
        }
    }
    if ($settings['VITE_FIREBASE_PROJECT_ID'] -ne 'cognitive-learn-ai') {
        throw 'Sai Firebase project. Chi dung project goc cognitive-learn-ai cho phien nay.'
    }
    if ($settings['VITE_USE_FIREBASE_EMULATORS'] -ne 'false') {
        throw 'VITE_USE_FIREBASE_EMULATORS phai la false trong phien tai khoan cu.'
    }
    if ($settings['VITE_FIREBASE_AUTH_DOMAIN'] -eq 'demo-cla-mvp.firebaseapp.com') {
        throw 'Auth domain van la Firebase Demo. Dung cau hinh Web App goc.'
    }
    if ($settings['VITE_CLA_STUDENT_CONSENT_GATE'] -ne 'true') {
        throw 'Can giu consent gate = true de khong ha cap bao ve quyen du lieu.'
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'package.json') -PathType Leaf)) {
    throw "Khong tim thay package.json tai $ProjectRoot"
}
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$livePath = Join-Path $ProjectRoot '.env.live.local'
$settings = Read-PublicEnvFile $livePath
if ($settings.Count -gt 0 -and -not $settings.ContainsKey('VITE_CLA_STUDENT_CONSENT_GATE')) {
    # Do not silently disable the consent gate when a previous template omitted it.
    $settings['VITE_CLA_STUDENT_CONSENT_GATE'] = 'true'
}
if ($settings.Count -gt 0) {
    try { Check-PublicConfig $settings }
    catch {
        Write-Host 'File .env.live.local hien tai chua dung cau hinh Firebase goc.' -ForegroundColor Yellow
        if ($CheckOnly) { throw }
        $answer = (Read-Host 'Sao luu file cu va tao lai cau hinh LIVE? (Y/N)').Trim()
        if ($answer -notin @('Y','y')) { throw 'Da giu nguyen file cu. Khong thay doi Firebase.' }
        $bak = $livePath + '.backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Copy-Item -LiteralPath $livePath -Destination $bak -ErrorAction Stop
        Write-Host 'Da sao luu cau hinh cu (khong in gia tri).' -ForegroundColor Green
        $settings = @{}
    }
}
if ($settings.Count -eq 0) {
    # Use a pre-existing dedicated production env file if it has real public Web App config.
    $candidate = Read-PublicEnvFile (Join-Path $ProjectRoot '.env.production.local')
    if ($candidate.ContainsKey('VITE_FIREBASE_PROJECT_ID') -and
        $candidate['VITE_FIREBASE_PROJECT_ID'] -eq 'cognitive-learn-ai' -and
        $candidate.ContainsKey('VITE_FIREBASE_API_KEY') -and
        $candidate.ContainsKey('VITE_FIREBASE_APP_ID')) {
        Write-Host 'Tim thay cau hinh Web App goc trong .env.production.local (khong sao chep khoa server).' -ForegroundColor Cyan
        $settings = $candidate
    } else {
        Write-Host ''
        Write-Host 'CHU Y: Chi can lay 2 gia tri Web App cong khai tu Firebase Console:' -ForegroundColor Cyan
        Write-Host 'Project cognitive-learn-ai > Project settings > Your apps > Web App > Config'
        Write-Host 'Khong nhap mat khau, service account key hay Gemini API key vao day.'
        Write-Host ''
        $apiKey = (Read-Host 'Nhap apiKey cua Firebase Web App goc').Trim()
        $appId = (Read-Host 'Nhap appId cua Firebase Web App goc').Trim()
        if ($appId -notmatch '^1:([0-9]+):web:[A-Za-z0-9]+') {
            throw 'appId khong dung dinh dang Firebase Web App. Kiem tra lai Firebase Console.'
        }
        $senderId = $matches[1]
        $bucket = (Read-Host 'storageBucket (co the de trong neu chi can dang nhap)').Trim()
        $settings = @{
            VITE_FIREBASE_API_KEY = $apiKey
            VITE_FIREBASE_AUTH_DOMAIN = 'cognitive-learn-ai.firebaseapp.com'
            VITE_FIREBASE_PROJECT_ID = 'cognitive-learn-ai'
            VITE_FIREBASE_STORAGE_BUCKET = $bucket
            VITE_FIREBASE_MESSAGING_SENDER_ID = $senderId
            VITE_FIREBASE_APP_ID = $appId
        }
    }
    $settings['VITE_USE_FIREBASE_EMULATORS'] = 'false'
    # Keep the existing student-data consent boundary enabled.
    $settings['VITE_CLA_STUDENT_CONSENT_GATE'] = 'true'
    Check-PublicConfig $settings
    $order = @('VITE_USE_FIREBASE_EMULATORS','VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_APP_ID',
      'VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_CLA_STUDENT_CONSENT_GATE')
    $rows = foreach ($name in $order) { $name + '=' + [string]$settings[$name] }
    [System.IO.File]::WriteAllText($livePath, ($rows -join "`n") + "`n", ([System.Text.UTF8Encoding]::new($false)))
    Write-Host 'Da tao .env.live.local (file nay duoc .gitignore, khong dong cham .env QA).' -ForegroundColor Green
}

Check-PublicConfig $settings
Write-Host ''
Write-Host 'CLA CP86 / TAI KHOAN GOC:' -ForegroundColor Green
Write-Host '  Firebase project: cognitive-learn-ai'
Write-Host '  Emulators: OFF'
Write-Host "  Website: http://127.0.0.1:$Port"
Write-Host '  QA 5173: khong thay doi'
Write-Host '  Khong chay E2E, khong tao du lieu gia lap trong phien tai khoan goc.'
Write-Host ''
if ($CheckOnly) { Write-Host 'LIVE CONFIG CHECK PASS' -ForegroundColor Green; exit 0 }

$keys = @('VITE_USE_FIREBASE_EMULATORS','VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_CLA_STUDENT_CONSENT_GATE')
$saved = @{}
foreach ($key in $keys) {
    $saved[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, [string]$settings[$key], 'Process')
}
try {
    Push-Location $ProjectRoot
    try {
        & npm run dev -- --mode live --host 127.0.0.1 --port $Port --strictPort
        if ($LASTEXITCODE -ne 0) { throw "Vite thoat voi code $LASTEXITCODE" }
    } finally { Pop-Location }
} finally {
    foreach ($key in $keys) {
        [Environment]::SetEnvironmentVariable($key, $saved[$key], 'Process')
    }
}
