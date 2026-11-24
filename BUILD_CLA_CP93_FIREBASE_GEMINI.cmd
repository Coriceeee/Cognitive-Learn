@echo off
setlocal EnableExtensions
chcp 65001 >nul
if not exist "package.json" (
  echo [FAIL] Run at Cognitive-Learn project root.
  exit /b 2
)
if not exist ".build-reports" mkdir ".build-reports"
echo ==== CLA CP93 FULL BUILD: FIREBASE GEMINI ====
node tools\verify-cp93-snapshot.cjs || exit /b 1
node --test tests\cp93-gemini-firebase-routes.test.mjs || exit /b 1
node tools\claFirebaseGeminiGate.cjs || exit /b 1
call npm test > ".build-reports\cp93-all-tests.log" 2>&1
if errorlevel 1 (
  echo [FAIL] Full npm test - see .build-reports\cp93-all-tests.log
  exit /b 1
)
echo Full npm test PASS.
call npm run build -- --mode live > ".build-reports\cp93-vite-build.log" 2>&1
if errorlevel 1 (
  echo [FAIL] Frontend build - see .build-reports\cp93-vite-build.log
  exit /b 1
)
echo Frontend production build PASS.
if not exist "functions-gemini\node_modules\.bin\esbuild.cmd" (
  call npm install --prefix functions-gemini --include=dev --no-audit --no-fund
  if errorlevel 1 exit /b 1
)
call npm --prefix functions-gemini run build > ".build-reports\cp93-gemini-build.log" 2>&1
if errorlevel 1 (
  echo [FAIL] Gemini backend bundle - see .build-reports\cp93-gemini-build.log
  exit /b 1
)
if not exist "functions-gemini\dist\chat.mjs" exit /b 1
if not exist "functions-gemini\dist\lumen.mjs" exit /b 1
if not exist "functions-gemini\dist\admission.mjs" exit /b 1
echo ==================================================
echo [PASS] CP93 FRONTEND + GEMINI BACKEND LOCAL BUILD
echo NO FIREBASE DEPLOY PERFORMED.
echo ==================================================
