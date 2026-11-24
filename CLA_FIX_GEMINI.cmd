@echo off
setlocal
cd /d "%~dp0"
node "%~dp0CLA_FIX_GEMINI.mjs"
echo.
if errorlevel 1 echo Fix not completed. Read the message above before retrying.
pause
