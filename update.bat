@echo off
rem Bulbik Run: pulls the latest version of the game from GitHub.
rem Double-click it (or run "update.bat" in a terminal inside this folder).
chcp 65001 >nul
cd /d "%~dp0"
set BRANCH=claude/frog-endless-runner-game-jz030o

echo === Downloading updates...
git fetch origin %BRANCH% || goto :fail
git checkout %BRANCH% || goto :fail
git pull --ff-only origin %BRANCH% || goto :conflict

if exist app\node_modules (
  echo === Updating the Android project...
  pushd app
  call npm install --no-audit --no-fund
  call npm run sync
  popd
)
echo.
echo === Done! Latest version:
git log -1 --format="%%h  %%ad  %%s" --date=format:"%%d.%%m.%%Y %%H:%%M"
pause
exit /b 0

:conflict
echo.
echo !!! You changed some files in this folder yourself, so git did not overwrite them.
echo     To throw your local changes away and take the version from GitHub, run:
echo        git reset --hard origin/%BRANCH%
pause
exit /b 1

:fail
echo.
echo !!! Could not download. Check the internet and that git is installed (git --version).
pause
exit /b 1
