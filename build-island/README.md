# Build Island

A cozy isometric island-building game for mobile browsers, written in pure HTML5, CSS3, vanilla JavaScript and the Canvas 2D API. It uses no engine, no libraries and no image or audio files.

## Core loop: production chains

```
GATHER raw ─► REFINE at stations ─► BUILD with materials ─► AUTOMATE ─► UNLOCK new islands (new raw resources) ─► …
```

| Station | Recipe |
|---|---|
| 🪚 Sawmill | 3 wood → 2 planks |
| 🧱 Stone Workbench | 3 stone → 2 bricks |
| 🔥 Furnace | 3 sand → 2 glass · 2 iron ore + 1 coal → 2 iron bars · 3 iron ore + 4 wood → 1 iron bar |
| 🛠️ Workshop | 2 planks + 1 iron bar → 1 tools |
| 🔬 Crystal Lab | 3 crystals + 1 glass → 1 energy core |

- Tap a station to open its panel. Queue jobs (×1 / ×5, 2 slots); they craft in real time, even while the game is closed.
- Buildings cost refined materials: a house needs planks, a stone house needs bricks + glass, a tower needs bricks + glass + iron bars.
- Gatherers farm raw resources for you: Lumber Camp (wood), Quarry (stone), Mine (iron ore), Crystal Generator (crystals).
- Every island has its own raw resources. Unlocking an island costs materials, for example a "boat" made of planks and bricks.

| Island | Raw resources | Unlock |
|---|---|---|
| 🌿 Green | wood, stone, crystal | start |
| 🏜️ Desert | **sand**, wood, stone | Lv 2 · 20 planks, 10 bricks, 150 coins |
| ❄️ Ice | **iron ore**, wood, stone | Lv 4 · planks, bricks, glass |
| 🌋 Volcano | **coal**, iron ore, stone | Lv 5 · bricks, glass, iron bars |
| 🌃 Neon | crystals, coal, wood | Lv 7 · glass, iron bars, crystals |
| ☁️ Sky | wood, sand, crystals | Lv 9 · iron bars, tools, energy cores |
| 🪐 Space | iron ore, crystals, coal | Lv 11 · energy cores, tools, iron bars |

- The 🎒 Bag lists everything you own. Sell goods for coins there; crafted goods are worth far more than raw ones.

## How to run

Open `index.html` in a modern browser (Chrome, Safari, Firefox or Edge). Double-clicking the file works: no server or build step is needed.

The scripts are plain `<script>` files rather than ES modules on purpose. Browsers block module scripts loaded from `file://`, and plain scripts keep the game working when opened straight from disk. Each file adds one object to a shared `window.BI` namespace.

For phone testing on the same Wi-Fi, run `npx serve .` in this folder and open the printed address.

To produce the one-file version (everything inlined), run `python3 tools/build_single.py`.

## Controls

| Action | Touch | Desktop |
|---|---|---|
| Move | Virtual joystick (bottom-left, floats under your thumb) | WASD / arrow keys |
| Walk to a spot | Tap the ground | Click the ground |
| Collect | Tap the resource, or the **COLLECT** button when near | Click, or `E` / `Space` |
| Collect building income | Walk past it, or tap its bubble | Click |
| Craft | Tap a station (Sawmill, Furnace…) → CRAFT ×1 / ×5 | Click |
| Bag & selling | 🎒 BAG button | Click |
| Build menu | 🔨 **BUILD** | `B` |
| Move the building ghost | Drag the ghost, or tap a tile | Mouse hover, or WASD |
| Pan the camera (build mode) | Drag empty space | Drag |
| Rotate / Build / Cancel | ↻ / ✓ (or tap the ghost again) / ✕ | `R` / `Enter` / `Esc` |
| Zoom | – | Mouse wheel |

## File structure

```
index.html        DOM screens (menu, HUD, sheets, popups) + one <canvas>
style.css         Mobile-first UI: rem-based scaling, safe areas, glossy buttons
js/
  audio.js        Web Audio placeholder SFX (playClick/Collect/Build/Reward/LevelUp) + generative music
  ads.js          AdManager: showRewardedAd(cb) / showInterstitial() — simulated, SDK-ready
  save.js         saveGame() / loadGame() / resetGame() — localStorage
  draw.js         Canvas helpers: iso boxes, cylinders, cones, shading, sprite cache
  items.js        All items (raw + crafted), SVG icons, sell prices
  island.js       Iso math, 7 themes, island generation, expansion, terrain cache
  resources.js    Trees, rocks, crystals, sand, iron ore, coal: data + themed procedural art
  buildings.js    18 building definitions (homes, stations, gatherers, decor), recipes, procedural art
  crafting.js     Station job queues: start / update (real time, offline-safe) / collect
  player.js       Adventurer character, movement and collisions
  progression.js  XP curve, levels, blueprint unlocks, islands, completion + unlocks
  quests.js       28-step tutorial quest chain through the production tree + endless quests
  renderer.js     Camera, background, clouds, depth-sorted entities, particles, floating text
  input.js        Keyboard, floating joystick, tap/drag gestures, scroll prevention
  ui.js           HUD, menus, build menu, blueprints, shop, popups, toasts, fly-to-HUD
  game.js         State manager + gameplay actions (collect, build, expand, travel)
  main.js         Boot + requestAnimationFrame loop: update(dt) → render()
```

## Architecture

- **One canvas** draws the world: ocean, clouds, island, resources, buildings, player and particles. **DOM** draws every menu and HUD element. The DOM only changes on events, never every frame.
- **The game loop** (`main.js`) calls `Game.update(dt)`, then `Renderer.render(Game)`, with `dt` clamped.
- **The state manager** (`game.js`) is a stack. Base states (`MAIN_MENU`, `GAMEPLAY`, `BUILD_MODE`) replace the stack. Overlays (`BUILD_MENU`, `BLUEPRINTS`, `ISLAND_SELECT`, `ISLAND_PROGRESS`, `SHOP`, `SETTINGS`, `QUEST_COMPLETE`, `ISLAND_COMPLETE`, `REWARD`) are pushed on top. `UI.sync(stack)` toggles `.screen[data-state]` elements with CSS transitions, so screen changes never reload the page.
- **Isometric grid:** grid `(x, y)` maps to world pixels `((x − y)·32, (x + y)·16)`. `toGrid()` inverts this for taps.
- **Performance:**
  - Island terrain is pre-rendered into one offscreen canvas, rebuilt only on expansion or travel.
  - Trees, rocks, crystals and the static parts of buildings are cached sprites. Only animated parts (windmill blades, flags, fountain water, generator crystal) are drawn live.
  - Particles and floating text use fixed pools, so they allocate nothing per frame.
- **Save data:** everything lives in `BI.state` and is serialised to `localStorage` (`buildIsland.save.v1`). The game saves after every important action, every 15 s, and when the page is hidden.
- **Ads:** game code only calls `AdManager.showRewardedAd(cb)` and `AdManager.showInterstitial(cb)`. To ship, swap their bodies for a real SDK call. Interstitials are frequency-capped: none in the first 3 minutes, then at most one every 4 minutes.

## Implemented features

- Main menu with a live animated floating island, PLAY, Shop, Blueprints, Island and Settings.
- Isometric floating island:
  - grass tiles, dirt and rock underside, hanging vines;
  - two animated waterfalls;
  - drifting clouds and an animated themed background.
- An original player character with walk bob, blinking, a facing direction and a chopping animation.
- Joystick, keyboard and tap-to-walk movement, with collisions against the island edge, buildings and resources.
- Six raw resources (wood, stone, sand, iron ore, coal, crystal), each found on specific islands:
  - COLLECT button, particles, floating text, icons that fly to the HUD;
  - respawn timers with a pop-in animation.
- 18 buildings, with menu tabs All, Homes, Production and Decor:
  - homes and income: wooden house, stone house, farm, windmill, tower;
  - crafting stations: sawmill, stone workbench, furnace, workshop, crystal lab;
  - gatherers: lumber camp, quarry, mine, crystal generator;
  - decor: flower bed, lamp post, bridge, fountain.
- Crafting stations with job queues, live progress rings on the island, a "ready" bubble, and real-time / offline crafting.
- Build mode:
  - ghost snapped to the grid, green for valid and red for invalid placement;
  - the reason is shown when invalid;
  - rotate, cancel and confirm;
  - building pops in from 80% to 100% scale with dust and sparkles.
- Passive production: homes make coins; gatherers make raw resources. Walk past a building or tap it to collect.
- 🎒 Bag (inventory) for all six raw resources and six crafted materials, with selling for coins.
- Blueprints screen with previews, costs and locked states (unlocked by level).
- Island expansion: 12×12 → 20×20 in four steps (100 / 250 / 500 / 1000 coins), with a bounce animation, particles, new resources and a reward popup.
- Quests: a 28-quest tutorial chain through the whole production tree (gather → sawmill → planks → …), then endless generated quests. Three are active at once, with completion popups and rewards.
- XP and levels with the curve `50·L^1.35`, plus a level-up popup with coin rewards and new blueprints.
- Island completion: five production tasks per island and a percentage. At 100% you get +300 coins, +20 planks, +20 bricks and +10 crystals.
- 7 themed islands (Green, Desert, Ice, Volcano, Neon, Sky, Space), each with its own raw resources and art. Each is unlocked by level plus a material cost.
- Shop:
  - simulated rewarded ads (+100 coins, +5 crystals);
  - a market for buying raw materials with coins;
  - placeholder coin packs with no real payments.
- Settings: music and SFX toggles, Save now, and Reset progress with a confirmation.
- Responsive layout from small phones to desktop:
  - safe-area insets;
  - no page scrolling, pinch-zoom or text selection while playing.

## Ideas for later

- Daily login rewards and a timed event island.
- Demolish and move placed buildings, plus an undo for the last placement.
- Villagers walking between houses; a day/night cycle with lamps lighting up.
- Building upgrades (level 2/3 art and income).
- Real AdMob / IAP via a Capacitor wrapper; cloud save.
- Pathfinding for tap-to-walk around obstacles.
- Achievements, a collection book and island decoration scores.
- Real music and SFX assets with an audio sprite.
