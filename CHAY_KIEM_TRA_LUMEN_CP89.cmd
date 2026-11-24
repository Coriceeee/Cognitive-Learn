@echo off
setlocal
cd /d "%~dp0"
echo ==================================================
echo   CLA CP89 - LUMEN UI CHECK - NO PRODUCTION DEPLOY
 echo ==================================================
node tools\verify-cp89-snapshot.cjs
if errorlevel 1 goto :fail
call npm run check:layout
if errorlevel 1 goto :fail
node --experimental-strip-types --test tests\cp89-lumen-vi-clarity.test.cjs tests\cp86-evidence-versioning.test.mjs tests\cp87-navigation-priority.test.cjs tests\cp88-full-bundle.test.cjs
if errorlevel 1 goto :fail
call npm run build
if errorlevel 1 goto :fail
echo CP89 LUMEN CHECK: PASS ^(source, layout, targeted tests, build^)
exit /b 0
:fail
echo CP89 LUMEN CHECK: FAIL ^(inspect the error above^)
exit /b 1
