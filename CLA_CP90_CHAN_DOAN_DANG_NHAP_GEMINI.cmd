@echo off
setlocal
cd /d "%~dp0"
echo ===== CLA CP90: FIREBASE AUTH AND GEMINI CHECK =====
echo (Read-only. No password, API key, data, or Rules changes.)
echo.
node --experimental-strip-types --test tests/cp90-auth-connection.test.mjs tests/cp90-gemini-local-contract.test.mjs
if errorlevel 1 (
 echo CHECK FAILED: please send test error text only.
 exit /b 1
)
echo.
echo ----- Browser Firebase login triage -----
python CLA_CP88_KIEM_TRA_DANG_NHAP.py --url http://127.0.0.1:3000/
echo.
echo ----- Local Gemini status (safe, never prints key) -----
curl.exe --silent --show-error --max-time 8 http://127.0.0.1:3000/api/cla-gemini-status
echo.
echo.
echo If Gemini status reports missing, update local untracked .env.gemini.local.
echo The status probe does not prove a real Gemini analysis call works.
endlocal
