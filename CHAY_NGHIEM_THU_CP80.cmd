@echo off
setlocal EnableExtensions
set "SCRIPT=%~dp0CLA_CP80_ONECLICK.ps1"
if not exist "%SCRIPT%" (
  echo ERROR: Missing CLA_CP80_ONECLICK.ps1 next to this CMD.
  exit /b 3
)
if /i "%~1"=="/audit" goto AUDIT
if /i "%~1"=="/browser" goto BROWSER
if /i "%~1"=="/force-install" goto FORCEINSTALL
if /i "%~1"=="/help" goto HELP

echo ==============================================================
echo  CLA CP80 FULL ACCEPTANCE - LOCAL - NO PRODUCTION DEPLOY
echo ==============================================================
echo  Mode: full source already patched; no automatic source changes;
echo        run build, npm tests, research and emulator checks.
echo  All results logged in reports\acceptance\...\status.csv.
echo  For audit-only, run: CHAY_NGHIEM_THU_CP80.cmd /audit
echo ==============================================================
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPT%" -AllTests -WithEmulator -WithBrowserPreflight
set "CODE=%ERRORLEVEL%"
goto END

:AUDIT
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPT%" -AllTests -WithEmulator -WithBrowserPreflight
set "CODE=%ERRORLEVEL%"
goto END

:BROWSER
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPT%" -AllTests -WithEmulator -WithBrowserPreflight -RunBrowser
set "CODE=%ERRORLEVEL%"
goto END

:FORCEINSTALL
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%SCRIPT%" -AllTests -WithEmulator -WithBrowserPreflight -ForceInstall
set "CODE=%ERRORLEVEL%"
goto END

:HELP
echo  CHAY_NGHIEM_THU_CP80.cmd               - Run full technical and research checks on fixed code
 echo  CHAY_NGHIEM_THU_CP80.cmd /audit        - No source edits
 echo  CHAY_NGHIEM_THU_CP80.cmd /browser      - Opt-in local synthetic browser QA
 echo  CHAY_NGHIEM_THU_CP80.cmd /force-install - Force npm ci, may hit EPERM
exit /b 0

:END
echo.
echo Acceptance runner exit code: %CODE%
echo Reports: reports\acceptance\CLA_CP80_YYYYMMDD-HHMMSS\
echo PASS=0, FAIL=1, BLOCKED=2. BLOCKED does NOT equal PASS.
exit /b %CODE%
