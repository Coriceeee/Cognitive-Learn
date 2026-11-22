@echo off
setlocal
cd /d "%~dp0"
echo CLA CP83 LOCAL QA - NEVER DEPLOYS PRODUCTION
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0CLA_CP83_ONECLICK.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
echo CP83 acceptance exit code: %RC%
echo Check reports\acceptance-cp83\run-YYYYMMDD-HHMMSS\
exit /b %RC%
