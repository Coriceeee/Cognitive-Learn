@echo off
setlocal
cd /d "%~dp0"
echo CLA CP84 LOCAL QA - NEVER DEPLOYS PRODUCTION
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP84_ONECLICK.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
echo CP84 acceptance exit code: %RC%
echo Check reports\acceptance-cp84\run-YYYYMMDD-HHMMSS\
exit /b %RC%
