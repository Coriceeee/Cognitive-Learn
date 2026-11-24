@echo off
setlocal EnableExtensions
chcp 65001 >nul

rem CLA CP92 full website/API build + offline validation. No Firebase deployment.
rem Run from C:\Gao\Cognitive-Learn (current directory) or copy script there.
if exist "%CD%\package.json" (
  set "CLA_ROOT=%CD%"
) else (
  if exist "%~dp0package.json" (
    set "CLA_ROOT=%~dp0"
  ) else (
    echo [FAIL] Cannot find package.json. Open PowerShell in your Cognitive-Learn root.
    exit /b 2
  )
)
cd /d "%CLA_ROOT%" || exit /b 2
if not exist ".build-reports" mkdir ".build-reports"

where node >nul 2>&1
if errorlevel 1 goto NO_NODE
where npm >nul 2>&1
if errorlevel 1 goto NO_NODE

echo.
echo ==== CLA CP92 FULL BUILD (LIVE) ====
echo Project directory: %CD%
echo Firebase files, user accounts, Firestore rules and secrets are NOT changed.
echo Stop previous Vite/npm dev terminals before continuing.
node --version
call npm --version

echo.
echo [1/8] Verify CP92 source snapshot...
node tools\verify-cp92-snapshot.cjs > ".build-reports\01-source.log" 2>&1
if errorlevel 1 goto FAIL_SOURCE
type ".build-reports\01-source.log"

echo.
echo [2/8] Check/install dependencies using package-lock.json...
if not exist "node_modules\.bin\tsc.cmd" goto INSTALL
if not exist "node_modules\.bin\vite.cmd" goto INSTALL
if not exist "node_modules\@types\node\index.d.ts" goto INSTALL
if not exist "node_modules\@types\react\index.d.ts" goto INSTALL
if not exist "node_modules\firebase\package.json" goto INSTALL
echo Dependency entrypoints present. Existing node_modules reused.
goto DEP_READY
:INSTALL
echo Missing/incomplete node_modules. Running npm ci...
call npm ci --no-audit --no-fund > ".build-reports\02-npm-ci.log" 2>&1
if errorlevel 1 goto FAIL_INSTALL
echo npm ci PASS.
:DEP_READY

echo.
echo [3/8] Validate Firebase LIVE target (never print API key)...
node --input-type=module -e "import {loadEnv} from 'vite'; const e=loadEnv('live',process.cwd(),'VITE_'); const bad=[]; if(e.VITE_FIREBASE_PROJECT_ID!=='cognitive-learn-ai')bad.push('Wrong project'); if(e.VITE_USE_FIREBASE_EMULATORS!=='false')bad.push('Emulator enabled'); if(!e.VITE_FIREBASE_API_KEY||/^(fake|demo|your)/i.test(e.VITE_FIREBASE_API_KEY))bad.push('API key missing or fake'); console.log('Project:',e.VITE_FIREBASE_PROJECT_ID||'MISSING'); console.log('Emulator:',e.VITE_USE_FIREBASE_EMULATORS||'MISSING'); console.log('Web API key:',bad.some(s=>s.includes('API key'))?'MISSING_OR_FAKE':'SET'); bad.forEach(s=>console.error('BLOCKED:',s)); if(bad.length)process.exit(2);" > ".build-reports\03-live-env.log" 2>&1
if errorlevel 1 goto FAIL_LIVE
type ".build-reports\03-live-env.log"

echo.
echo [4/8] Verify CLA layout...
call npm run check:layout > ".build-reports\04-layout.log" 2>&1
if errorlevel 1 goto FAIL_LAYOUT
echo Layout PASS.

echo.
echo [5/8] Test CP92 linked PULSE data + security rules...
node --experimental-strip-types --test tests\cp92-pulse-linked-data.test.mjs > ".build-reports\05-pulse.log" 2>&1
if errorlevel 1 goto FAIL_PULSE
call npm run test:rules:static > ".build-reports\05-rules.log" 2>&1
if errorlevel 1 goto FAIL_RULES
echo CP92 PULSE and rules tests PASS.

echo.
echo [6/8] Run complete npm test suite (may take time)...
call npm test > ".build-reports\06-all-tests.log" 2>&1
if errorlevel 1 goto FAIL_TESTS
echo npm test PASS.

echo.
echo [7/8] Validate Firebase Functions source syntax...
for /r "functions" %%F in (*.mjs) do (
  node --check "%%F" >> ".build-reports\07-functions.log" 2>&1
  if errorlevel 1 goto FAIL_FUNCTIONS
)
for /r "functions-admin" %%F in (*.mjs) do (
  node --check "%%F" >> ".build-reports\07-functions.log" 2>&1
  if errorlevel 1 goto FAIL_FUNCTIONS
)
for /r "functions-privacy" %%F in (*.mjs) do (
  node --check "%%F" >> ".build-reports\07-functions.log" 2>&1
  if errorlevel 1 goto FAIL_FUNCTIONS
)
echo Functions syntax PASS. (Not deployed or live-tested.)

echo.
echo [8/8] Full TypeScript + API types + Vite production build in LIVE mode...
call npm run build -- --mode live > ".build-reports\08-build.log" 2>&1
if errorlevel 1 goto FAIL_BUILD
if not exist "dist\index.html" goto FAIL_BUILD
echo Full production build PASS.

echo Creating distributable archive (dist only, NOT source secrets)...
powershell -NoProfile -Command "Compress-Archive -Path '.\dist\*' -DestinationPath '.\CLA_CP92_DIST_LIVE.zip' -Force" > ".build-reports\09-package.log" 2>&1
if errorlevel 1 goto FAIL_PACKAGE

echo.
echo ================================================================
echo [PASS] CLA CP92 COMPLETE LOCAL BUILD
 echo ZIP: %CD%\CLA_CP92_DIST_LIVE.zip
 echo Web build output: %CD%\dist
 echo Logs: %CD%\.build-reports
 echo Firebase deployment was NOT performed.
 echo Gemini backend was NOT live-verified.
echo ================================================================
exit /b 0

:NO_NODE
echo [FAIL] Node.js/npm is not in PATH. Install Node.js 22 and retry.
exit /b 2
:FAIL_SOURCE
set "FAIL_LOG=01-source.log"
goto FAIL
:FAIL_INSTALL
set "FAIL_LOG=02-npm-ci.log"
goto FAIL
:FAIL_LIVE
set "FAIL_LOG=03-live-env.log"
goto FAIL
:FAIL_LAYOUT
set "FAIL_LOG=04-layout.log"
goto FAIL
:FAIL_PULSE
set "FAIL_LOG=05-pulse.log"
goto FAIL
:FAIL_RULES
set "FAIL_LOG=05-rules.log"
goto FAIL
:FAIL_TESTS
set "FAIL_LOG=06-all-tests.log"
goto FAIL
:FAIL_FUNCTIONS
set "FAIL_LOG=07-functions.log"
goto FAIL
:FAIL_BUILD
set "FAIL_LOG=08-build.log"
goto FAIL
:FAIL_PACKAGE
set "FAIL_LOG=09-package.log"
goto FAIL
:FAIL
echo.
echo [FAIL] Build stopped. Last 40 lines of .build-reports\%FAIL_LOG%:
powershell -NoProfile -Command "Get-Content -LiteralPath '.build-reports\%FAIL_LOG%' -Tail 40" 2>nul
echo.
echo Full log: %CD%\.build-reports\%FAIL_LOG%
echo No deployment was performed. Do NOT upload dist to Hosting.
exit /b 1
