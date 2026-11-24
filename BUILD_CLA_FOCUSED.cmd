@echo off
setlocal EnableExtensions
cd /d "%~dp0"
if not exist package.json exit /b 2
if not exist node_modules\typescript\package.json (
  call npm ci
  if errorlevel 1 exit /b 1
)
call npm run verify:focused || exit /b 1
call npm test || exit /b 1
call npm run build -- --mode live || exit /b 1
echo Build completed locally. No Firebase deployment performed.
