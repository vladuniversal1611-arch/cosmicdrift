# Bubble Bloom

A premium casual bubble-shooter for Android (HTML5, one offline file).
Shoot, match and drop bubbles to free Green Valley from the Bubble Storm,
rescue creatures, rebuild the village and follow Lumi through 8 areas and
160 levels to the Final Castle.

**Play / ship:** `web/index.html` — a single self-contained file (no CDN, no
network, no build tools needed at runtime). Open it in Chrome, or wrap it in
an APK (see *Android build* below).

> The `Assets/` folder holds an early Unity prototype (Phase 1) and is not
> used by the HTML game.

---

## The core loop

```
LEVEL → WIN → stars + coins + materials → story moment → RESTORE a building
      → area restored → new area + new mechanic → NEXT LEVEL
COME BACK tomorrow → daily reward → quests → chests → weekly adventure
```

| Layer | What the player feels | Where it lives |
|---|---|---|
| Gameplay | "One more level" — combos, drops, praise, boss fights | `03_core.js`, `08_game.js` |
| Restoration | "I want to rebuild that house" — 3 objects × 3 stages per area | `05_state.js` (`objectInfo/build`), `10_screens.js` (home) |
| Story | "What happens to Murk?" — 1–3 line beats after key levels | `02_data.js` → `DATA.STORY` |
| Map | "3 more levels to the next area" — 8 areas, gates | `10_screens.js` (map) |
| Collection | 30 creatures, rescued in levels or found in chests | `DATA.CREATURES` |
| Daily return | 7-day calendar, 3 daily quests + bonus chest, weekly track | `05_state.js` |

### Progression gates (no hard locks)
* Next **level** unlocks on a win.
* Next **area** opens when the area boss is beaten **and** its 3 buildings are fully restored.
* Restoration costs **stars** (2 per stage, ≤ 18 per area) and **materials**.
  20 levels always give ≥ 20 stars, so even 1-star players can't get stuck.
  Missing materials can be bought with coins.

### First session (designed for the first 5 minutes)
Splash → 4-panel story intro → Level 1 with a tutorial hand → reward →
Level 2 rescues Milo → Level 3 introduces Nia and the first rebuild →
Level 4 grants the first booster (Hammer) → Level 5 unlocks the Map and
shows "Clear Green Valley to open the road". Menus appear one at a time:
Restoration (3), Daily (4), Map + Star Chest (5), Shop (6), Quests +
Collection (7), Weekly (10).

---

## Systems

* **Mechanics** (each introduced once with a "NEW" card): Stone (L11), Ice
  (L21), Chains (L31), Bombs (L41), Rainbow (L51), Spinners (L61), Locks +
  Key (L71), Shadow bubbles (L81). Bosses every 20 levels.
* **Objectives:** clear all, clear top row, rescue creatures, collect stars,
  free butterflies, break crystals, break chains, collect N of a colour, defeat boss.
* **Boosters:** in-level Hammer, Bomb, Shuffle, Color Blast; pre-level
  Rainbow Start, Fireball, +3 Moves. First copies are free when unlocked.
* **Stars:** 3★ if finished within 70 % of the move budget, 2★ within 88 %.
* **Combo:** consecutive matching shots multiply score; COMBO x5 gives a
  free Rainbow bubble. Leftover moves become a "Bonus Blast".
* **Lives:** 5, one regenerates every 20 min. Wins never cost a life
  (taken at start, refunded on win — quitting the app counts as a loss).
* **Chests:** Wooden → Legendary. Sources: boss wins, every 15 stars, daily
  calendar, quest bonus, weekly milestones, collection milestones, area completion.
* **Save:** everything in `localStorage` (`bubblebloom.save.v1` + backup copy),
  versioned and migrated on load.
* **Live events:** date-driven (`DATA.EVENTS`), e.g. Spring Festival gives
  +50 % flowers. Test any event with `index.html?event=spring`.
* **Languages:** English + Ukrainian (auto-detected, switchable in Settings).
* **Accessibility:** optional colour-blind symbols on bubbles.

---

## Editing content

All content is data. Edit, then rebuild with `python3 web/tools/build.py`.

### Create / change levels — `web/src/js/04_levels.js`
Levels are generated deterministically from the difficulty curve, so all
160 exist without hand-authoring. To hand-author any level, add it to `HAND`:

```js
42: { colors: [0, 1, 2, 4], objective: { type: 'rescue' },
      layout: ['aabbccddaab',   // even rows: 11 cells
               'abbccddaab',    // odd rows: 10 cells
               '??S??M??S??'] },
```
Legend: `.` empty · `a`–`f` palette colour · `?` random · `S` stone ·
`I` ice · `C` chain · `B` bomb · `W` rainbow · `R` spinner · `L` locked ·
`K` key · `D` shadow · `M` creature · `F` butterfly · `T` star · `X` crystal.

### Balance difficulty
* Curve: `difficulty()` in `04_levels.js` (anchor points per level).
* Board size, colours, cluster size, obstacle counts: `build()` in the same file.
* Mechanic & objective introduction levels: `DATA.MECHANIC_INTRO`,
  `DATA.OBJECTIVE_INTRO` in `02_data.js`.
* Boss HP: `DATA.AREAS[n].boss.hp`.
* **Move budgets are measured, not guessed.** A "novice" bot (no swap, no
  planning, ±3° aim error) plays every level 20× without a limit; the budget
  is the smallest move count at which it wins the target share of runs:
  L1–10 90 %, L11–30 70 %, L31–60 55 %, L61+ 45 % (hard levels −10 %).
  Real players swap and plan, so they win more often than the bot.
  ```
  node web/tools/validate.js                 # structure check of all levels
  node web/tools/calibrate.js 1 160 20       # novice calibration → MOVES={...}
  node web/tools/novice.js 1 20              # novice win-rate with current budgets
  node web/tools/balance.js                  # expert bot (upper-skill reference)
  ```
  Paste the `MOVES={...}` line into `const MOVES = {...}` in `04_levels.js`.
  Win-rate targets are in `target()` in `tools/calibrate.js`; a level with
  `moves:` in `HAND` keeps its hand-set budget.

### Add a new area
1. Append an entry to `DATA.AREAS` (name, sky/hill colours, `props` style,
   2 materials, boss, 3 restoration objects with `unlock` levels).
2. Optionally add creatures with `area: <index>` and story beats
   (`'win:N'`, `'boss:N'`, `'area:<index>'`).
`DATA.MAX_LEVEL` grows automatically (20 levels per area).

### Economy
Prices, chest contents, daily calendar, quests and weekly milestones are in
`02_data.js` (`DATA.BOOSTERS`, `DATA.CHESTS`, `DATA.DAILY`, `DATA.QUESTS`,
`DATA.WEEKLY`, `DATA.LIVES`). Level rewards: `State.recordWin()`.

---

## Monetization hooks (off by default)
No ad or purchase button is shown unless a provider is registered before the
game script runs (e.g. from a Capacitor AdMob / Google Play Billing plugin):

```js
window.BubbleBloomMonetization = {
  ads: true, iap: true,
  showRewarded(placement) { /* 'continue'|'double'|'lives'|'freeCoins' */ return Promise.resolve(true); },
  showInterstitial() {},
  products: [{ sku: 'coins_small', title: '1,200 coins', price: '$0.99', reward: { coins: 1200 } }],
  purchase(sku) { return Promise.resolve(true); },
};
```
Rewarded ads are always optional (extra moves, double coins, extra life).
Interstitials: never before level 12, never after a loss, max 1 per 4 wins.

## Android build (Capacitor)
```
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Bubble Bloom" com.yourstudio.bubblebloom --web-dir=www
mkdir www && cp web/index.html www/
npx cap add android && npx cap sync && npx cap open android   # build AAB in Android Studio
```
Set the activity to portrait (`android:screenOrientation="portrait"`).

## Project layout
```
web/
  index.html            ← the shippable game (generated)
  src/shell.html        ← HTML skeleton
  src/styles.css        ← UI design system
  src/js/00_util.js     ← RNG, easing, dates
  src/js/01_i18n.js     ← EN/UK strings
  src/js/02_data.js     ← ALL content & balance tables
  src/js/03_core.js     ← pure hex-grid engine (no DOM)
  src/js/04_levels.js   ← level generator + hand levels + measured budgets
  src/js/05_state.js    ← save + every meta system + monetization hooks
  src/js/06_audio.js    ← synthesized SFX + music + haptics
  src/js/07_art.js      ← procedural art (bubbles, creatures, scenes…)
  src/js/08_game.js     ← gameplay screen
  src/js/09_ui.js       ← HUD, panels, flows
  src/js/10_screens.js  ← home, map, splash, intro
  src/js/11_main.js     ← boot + loop
  assets/               ← Nunito font (SIL OFL) embedded at build
  tools/                ← build.py, validate.js, calibrate.js, novice.js, balance.js, e2e.js
```

Font: Nunito © The Nunito Project Authors, SIL Open Font License 1.1 (`web/assets/OFL.txt`).
