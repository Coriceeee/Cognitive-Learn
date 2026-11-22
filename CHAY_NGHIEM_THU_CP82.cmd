@echo off
setlocal
cd /d "%~dp0"
echo CLA CP82 FULL LOCAL ACCEPTANCE - NEVER DEPLOYS PRODUCTION
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP82_ONECLICK.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
echo CP82 acceptance exit code: %RC%
echo Check reports\acceptance-cp82\run-YYYYMMDD-HHMMSS\
exit /b %RC%
