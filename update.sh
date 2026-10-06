#!/usr/bin/env bash
# Bulbik Run: pulls the latest version of the game from GitHub.
# Run in a terminal inside this folder:  ./update.sh
set -e
cd "$(dirname "$0")"
BRANCH=claude/frog-endless-runner-game-jz030o

echo "=== Downloading updates..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
if ! git pull --ff-only origin "$BRANCH"; then
  echo
  echo "!!! You changed some files in this folder yourself, so git did not overwrite them."
  echo "    To throw your local changes away and take the version from GitHub, run:"
  echo "       git reset --hard origin/$BRANCH"
  exit 1
fi

if [ -d app/node_modules ]; then
  echo "=== Updating the Android project..."
  (cd app && npm install --no-audit --no-fund && npm run sync)
fi
echo
echo "=== Done! Latest version:"
git log -1 --format="%h  %ad  %s" --date=format:"%d.%m.%Y %H:%M"
