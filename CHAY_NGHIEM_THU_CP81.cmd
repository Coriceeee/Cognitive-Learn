@echo off
setlocal
cd /d "%~dp0"
echo.
echo === CLA CP81 COMPLETE LOCAL ACCEPTANCE - NO DEPLOY ===
echo This runs tests/build and logs failures without modifying production.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP81_ONECLICK.ps1" -AllTests -WithEmulator -WithBrowserPreflight
set CODE=%ERRORLEVEL%
echo.
echo Acceptance exit code: %CODE%
echo Check reports\acceptance\CLA_CP81_... for the full status and logs.
exit /b %CODE%
