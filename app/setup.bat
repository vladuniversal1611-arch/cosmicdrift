@echo off
rem Bulbik Run: first-time setup of the Android app. Double-click it.
chcp 65001 >nul
cd /d "%~dp0"
set LOG=%~dp0setup-log.txt

echo === 1/4 Checking Node.js...
where node >nul 2>nul || goto :nonode
for /f "tokens=1 delims=." %%v in ('node -v') do set NODEMAJ=%%v
set NODEMAJ=%NODEMAJ:v=%
node -v
if %NODEMAJ% LSS 22 goto :oldnode

echo === 2/4 Checking npm...
call npm -v || goto :nonpm

echo === 3/4 Installing packages (1-3 min)...
call npm install --no-audit --no-fund > "%LOG%" 2>&1
if errorlevel 1 goto :npmfail
echo OK

echo === 4/4 Copying the game into the app...
call npm run sync >> "%LOG%" 2>&1
if errorlevel 1 goto :syncfail
echo OK
echo.
echo === All good! Now open the project in Android Studio:
echo     run "npm run android" here, or in Android Studio: File - Open - folder app\android
pause
exit /b 0

:nonode
echo !!! Node.js is not installed. Download the LTS version from https://nodejs.org ,
echo     install it, then CLOSE this window and run setup.bat again.
pause & exit /b 1
:oldnode
echo !!! Node.js is too old (need version 22 or newer). Install the LTS from https://nodejs.org
pause & exit /b 1
:nonpm
echo !!! npm does not start. Reinstall Node.js from https://nodejs.org
pause & exit /b 1
:npmfail
echo !!! npm install failed. The last lines of the log:
powershell -NoProfile -Command "Get-Content -Tail 25 '%LOG%'"
echo.
echo     Full log: %LOG%  - send it (or a screenshot of this window) to Claude.
pause & exit /b 1
:syncfail
echo !!! Copying the game failed. The last lines of the log:
powershell -NoProfile -Command "Get-Content -Tail 25 '%LOG%'"
echo.
echo     Full log: %LOG%  - send it (or a screenshot of this window) to Claude.
pause & exit /b 1
