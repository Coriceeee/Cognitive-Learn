@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo ERROR: Khong tim thay .venv\Scripts\python.exe trong thu muc du an.
  exit /b 2
)
".venv\Scripts\python.exe" "%~dp0CLA_CP88_KIEM_TRA_DANG_NHAP.py" %*
exit /b %ERRORLEVEL%
