@echo off
setlocal EnableExtensions DisableDelayedExpansion
rem CP93 HF02: Windows cmd.exe safe deployment; do not deploy Firestore Rules.
rem No parenthesized IF/ECHO blocks: CMD parses literal parentheses within echo badly.
cd /d "%~dp0"
if not exist "package.json" goto :missing_root
if not exist "dist\index.html" goto :missing_frontend
if not exist "firebase.gemini.json" goto :missing_config
if not exist "functions-gemini\dist\chat.mjs" goto :missing_backend
if not exist "functions-gemini\dist\lumen.mjs" goto :missing_backend
if not exist "functions-gemini\dist\admission.mjs" goto :missing_backend
where firebase >nul 2>nul
if errorlevel 1 goto :missing_cli
node tools\claFirebaseGeminiGate.cjs
if errorlevel 1 goto :failed_gate

echo.
echo [SAFE DEPLOY] Project cognitive-learn-ai
 echo Step 1: Gemini Cloud Functions only - codebase cla-gemini.
 echo Step 2: Firebase Hosting only - dist and API rewrites.
 echo NO deploy of Firestore Rules, Auth, Admin, Privacy, or Push functions.
echo.
set "ACCEPT="
set /p "ACCEPT=Type DEPLOY-GEMINI-CP93 to deploy the Gemini function: "
if not "%ACCEPT%"=="DEPLOY-GEMINI-CP93" goto :cancelled
call firebase deploy --only functions:cla-gemini --config firebase.gemini.json --project cognitive-learn-ai
if errorlevel 1 goto :functions_failed

echo.
echo [OK] Gemini Functions deployed. Hosting API rewrites not active yet.
set "ACCEPT2="
set /p "ACCEPT2=Type HOSTING-CP93 to publish Hosting frontend and API rewrites: "
if not "%ACCEPT2%"=="HOSTING-CP93" goto :hosting_cancelled
call firebase deploy --only hosting --project cognitive-learn-ai
if errorlevel 1 goto :hosting_failed

echo.
echo [VERIFY] Checking both production Gemini status endpoints...
node tools\verify-cp93-production.mjs
if errorlevel 1 goto :runtime_failed

echo.
echo [DEPLOY DONE] Gemini status is configured on both Hosting domains.
echo Next: test authenticated Gemini chat and Lumen with a real student account.
exit /b 0

:runtime_failed
echo [FAIL] Hosting deploy command completed, but production Gemini smoke check failed.
echo Check Functions deployment, Hosting rewrite, and Firebase Secret Manager. Do not mark Gemini ready.
exit /b 1

:missing_root
echo [FAIL] Not in the Cognitive-Learn project folder with package.json.
exit /b 2
:missing_frontend
echo [FAIL] Missing dist\index.html. Run BUILD_CLA_CP93_FIREBASE_GEMINI.cmd first.
exit /b 2
:missing_backend
echo [FAIL] Missing Gemini backend dist. Run BUILD_CLA_CP93_FIREBASE_GEMINI.cmd first.
exit /b 2
:missing_config
echo [FAIL] Missing firebase.gemini.json.
exit /b 2
:missing_cli
echo [FAIL] Firebase CLI unavailable. Run firebase --version in this terminal.
exit /b 2
:failed_gate
echo [FAIL] Firebase Gemini config gate; nothing was deployed.
exit /b 2
:cancelled
echo [CANCELLED] No deployment performed.
exit /b 2
:functions_failed
echo [FAIL] Gemini Functions deploy failed. Hosting was NOT deployed.
exit /b 1
:hosting_cancelled
echo [PARTIAL] Gemini Functions deployed; Hosting unchanged. Rerun after reviewing.
exit /b 2
:hosting_failed
echo [PARTIAL] Gemini Functions deployed; Hosting failed. Review Firebase CLI log.
exit /b 1
