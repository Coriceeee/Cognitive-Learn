@echo off
setlocal
cd /d "%~dp0"
echo CLA CP85 LOCAL QA - NEVER DEPLOYS PRODUCTION
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP85_ONECLICK.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
echo CP85 acceptance exit code: %RC%
echo Check reports\acceptance-cp85\run-YYYYMMDD-HHMMSS\
exit /b %RC%
