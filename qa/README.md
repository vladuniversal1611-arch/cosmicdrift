# QA harness (dev only)

Not part of the game build. Runs `hill_rush.html` in headless Chromium and checks
boot, menus, gameplay smoke test, pause/resume, background pause, fuel/death flow,
duplicate rewards, save persistence, old-save migration, corrupted save, viewports,
and console errors. Screenshots go to `qa/out/` (or the dir passed as argument).

    npm i --no-save playwright      # one-time, outside the game
    node qa/qa.js [outDir]

Set `CHROME=/path/to/chrome` to use a specific Chromium build.
