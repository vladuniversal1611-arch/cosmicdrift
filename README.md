# Bulbik Run

Гра: `frog-endless-runner.html` (відкривається в браузері). Додаток для Android/iOS з рекламою — у папці `app/` (див. `app/README.md`).

## Як отримувати оновлення

**Перший раз** (потрібен Git: https://git-scm.com/downloads):
```
git clone -b claude/frog-endless-runner-game-jz030o https://github.com/vladuniversal1611-arch/cosmicdrift.git
```
Зʼявиться папка `cosmicdrift` з грою. Git попросить увійти в GitHub — увійди своїм акаунтом (один раз).

**Кожне наступне оновлення** — нічого не видаляй, просто:
- Windows: двічі клацни `update.bat` у папці `cosmicdrift`;
- macOS / Linux: у терміналі в папці `cosmicdrift` виконай `./update.sh`.

Або вручну в терміналі в папці `cosmicdrift`: `git pull`.

Скрипт завантажує лише змінене, а якщо налаштований додаток (`app/node_modules`) — одразу оновлює і його (`npm run sync`), тож в Android Studio достатньо натиснути ▶.
