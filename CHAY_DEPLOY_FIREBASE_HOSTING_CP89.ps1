param(
    [switch]$Live,
    [switch]$FrontendOnly
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root

function Require-ExitZero([string]$step) {
    if ($LASTEXITCODE -ne 0) {
        throw "$step FAIL (exit $LASTEXITCODE). Khong deploy site live."
    }
}

if (-not (Test-Path -LiteralPath '.\package.json')) {
    throw 'Khong tim thay package.json. Copy kit vao dung thu muc goc Cognitive-Learn.'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'Can Node.js va npm.'
}
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    throw 'Can Firebase CLI. Chay: npm install -g firebase-tools ; firebase login'
}
if (-not (Test-Path -LiteralPath '.\tools\verify-cp89-snapshot.cjs')) {
    throw 'Can ma nguon CP89 goc. Khong deploy nham version.'
}

Write-Host '=== CLA CP89: FIREBASE HOSTING DEPLOY GATE ===' -ForegroundColor Cyan
Write-Host 'Project: cognitive-learn-ai | Chuc nang: chi Hosting (KHONG deploy Rules, Functions, Auth)' -ForegroundColor Yellow

& node '.\tools\verify-cp89-snapshot.cjs'
Require-ExitZero 'SOURCE SNAPSHOT'

$gateArgs = @('.\tools\claHostingDeployGate.cjs')
if ($FrontendOnly) { $gateArgs += '--frontend-only' }
& node @gateArgs
Require-ExitZero 'FIREBASE LIVE CONFIG + GEMINI BACKEND'

if (-not (Test-Path -LiteralPath '.\node_modules\.bin\vite.cmd')) {
    Write-Host 'Chua co dependencies; dang chay npm ci...' -ForegroundColor Yellow
    & npm ci
    Require-ExitZero 'NPM CI'
}

& npm run check:layout
Require-ExitZero 'LAYOUT'
& node --experimental-strip-types --test '.\tests\cp89-lumen-vi-clarity.test.cjs'
Require-ExitZero 'LUMEN REGRESSION'
& npm test
Require-ExitZero 'FULL NPM TEST'
& npm run test:rules:emulator
Require-ExitZero 'FIRESTORE EMULATOR GATE'

& npm run build -- --mode live
Require-ExitZero 'BUILD LIVE'
if (-not (Test-Path -LiteralPath '.\dist\index.html')) {
    throw 'Build khong tao dist/index.html. Khong deploy.'
}

Write-Host '=== DEPLOY PREVIEW (khong ghi de website chinh) ===' -ForegroundColor Cyan
& firebase hosting:channel:deploy 'cla-cp89-review' --expires '7d' --project 'cognitive-learn-ai'
Require-ExitZero 'FIREBASE PREVIEW'

if (-not $Live) {
    Write-Host 'DA DEPLOY PREVIEW. Mo link Preview Firebase CLI in ra, kiem tra login/6 phan he va Gemini truoc khi deploy live.' -ForegroundColor Green
    Write-Host 'Khi da nghiem thu Preview, chay: .\CHAY_DEPLOY_FIREBASE_HOSTING_CP89.ps1 -Live' -ForegroundColor Yellow
    exit 0
}

Write-Host 'LIVE DEPLOY SE GHI DE NOI DUNG WEBSITE FIREBASE HOSTING HIEN TAI.' -ForegroundColor Yellow
Write-Host 'KHONG TU DONG deploy Firestore Rules hay Cloud Functions. Gemini can backend rieng da duoc ket noi.' -ForegroundColor Yellow
$approval = Read-Host 'Da kiem tra Preview va quyen truy cap? Go DEPLOY-CP89 de xac nhan phat hanh'
if ($approval -cne 'DEPLOY-CP89') {
    throw 'Nguoi dung chua xac nhan; da dung truoc khi deploy live.'
}

& firebase deploy --only hosting --project 'cognitive-learn-ai'
Require-ExitZero 'FIREBASE LIVE HOSTING'
Write-Host 'Firebase Hosting deploy command PASS. Van can kiem tra login, Gemini va an toan du lieu tren site live.' -ForegroundColor Green
Write-Host 'https://cognitive-learn-ai.web.app' -ForegroundColor Cyan
