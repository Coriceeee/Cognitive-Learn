@echo off
setlocal
cd /d "%~dp0"
echo CLA CP87 LOCAL QA - NEVER DEPLOYS PRODUCTION
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP87_ONECLICK.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
echo CP87 acceptance exit code: %RC%
echo Check reports\acceptance-cp87\run-YYYYMMDD-HHMMSS\
exit /b %RC%
