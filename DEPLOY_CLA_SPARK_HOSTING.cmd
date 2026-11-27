@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
echo ==== CLA SPARK + VERCEL SAFE RELEASE ====
if not exist "package.json" goto :missing_root
if not exist ".env.live.local" goto :missing_live_env
where node >nul 2>nul
if errorlevel 1 goto :missing_node
where npm >nul 2>nul
if errorlevel 1 goto :missing_npm
where firebase >nul 2>nul
if errorlevel 1 goto :missing_firebase
echo [1/4] Verify deployed Vercel Gemini backend and Firebase-origin CORS...
node tools\verify-cp93-production.mjs
if errorlevel 1 goto :vercel_failed
echo [2/4] Run Spark/Vercel security and routing contracts...
call npm run test:cp98:spark-vercel
if errorlevel 1 goto :tests_failed
echo [3/4] Build Firebase Hosting frontend using .env.live.local...
call npm run build -- --mode live
if errorlevel 1 goto :build_failed
if not exist "dist\index.html" goto :missing_dist
echo [4/4] Deploy Firebase Hosting ONLY. No Functions, Rules, Auth or Firestore changes.
call firebase deploy --only hosting --project cognitive-learn-ai
if errorlevel 1 goto :deploy_failed
echo [VERIFY] Recheck Vercel status endpoint and CORS after Hosting deploy...
node tools\verify-cp93-production.mjs
if errorlevel 1 goto :postcheck_failed
echo [PASS] Firebase Hosting deployed. Gemini backend remains on Vercel. Firebase Spark retained.
exit /b 0
:missing_root
echo [FAIL] Run from the Cognitive-Learn project root.
exit /b 2
:missing_live_env
echo [FAIL] Missing .env.live.local. Preserve Firebase config and add VITE_API_BASE_URL.
exit /b 2
:missing_node
echo [FAIL] Node.js is unavailable.
exit /b 2
:missing_npm
echo [FAIL] npm is unavailable.
exit /b 2
:missing_firebase
echo [FAIL] Firebase CLI is unavailable.
exit /b 2
:vercel_failed
echo [STOP] Vercel backend is not ready. Hosting was NOT deployed.
exit /b 1
:tests_failed
echo [STOP] CP98 tests failed. Hosting was NOT deployed.
exit /b 1
:build_failed
echo [STOP] Production build failed. Hosting was NOT deployed.
exit /b 1
:missing_dist
echo [STOP] dist\index.html is missing. Hosting was NOT deployed.
exit /b 1
:deploy_failed
echo [FAIL] Firebase Hosting deploy failed. No other Firebase services were targeted.
exit /b 1
:postcheck_failed
echo [WARNING] Hosting deploy completed, but Vercel status/CORS check failed. Do not mark Gemini ready.
exit /b 1
