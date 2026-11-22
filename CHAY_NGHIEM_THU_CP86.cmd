@echo off
setlocal
cd /d "%~dp0"
echo CLA CP86 LOCAL QA - NEVER DEPLOYS PRODUCTION
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP86_ONECLICK.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
echo CP86 acceptance exit code: %RC%
echo Check reports\acceptance-cp86\run-YYYYMMDD-HHMMSS\
exit /b %RC%
