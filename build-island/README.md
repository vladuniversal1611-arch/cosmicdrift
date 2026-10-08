# Build Island

A cozy isometric island-building game for mobile browsers, written in pure HTML5, CSS3, vanilla JavaScript and the Canvas 2D API. It uses no engine, no libraries and no image or audio files.

## How to run

Open `index.html` in a modern browser (Chrome, Safari, Firefox or Edge). Double-clicking the file works: no server or build step is needed.

The scripts are plain `<script>` files rather than ES modules on purpose. Browsers block module scripts loaded from `file://`, and plain scripts keep the game working when opened straight from disk. Each file adds one object to a shared `window.BI` namespace.

For phone testing on the same Wi-Fi, run `npx serve .` in this folder and open the printed address.

## Controls

| Action | Touch | Desktop |
|---|---|---|
| Move | Virtual joystick (bottom-left, floats under your thumb) | WASD / arrow keys |
| Walk to a spot | Tap the ground | Click the ground |
| Collect | Tap the resource, or the **COLLECT** button when near | Click, or `E` / `Space` |
| Collect building income | Walk past it, or tap its bubble | Click |
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
  island.js       Iso math, 7 themes, island generation, expansion, terrain cache
  resources.js    Trees / rocks / crystals: data + themed procedural art
  buildings.js    11 building definitions, footprints, procedural art + animation
  player.js       Adventurer character, movement and collisions
  progression.js  XP curve, levels, blueprint unlocks, islands, completion + unlocks
  quests.js       Quest chain + endless generated quests (3 active)
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
- Resources (wood +5, stone +3, crystal +1):
  - COLLECT button, particles, floating text, icons that fly to the HUD;
  - respawn timers with a pop-in animation.
- 11 buildings in four categories:
  - wooden house, stone house, farm, windmill, bridge, tower, workshop, crystal generator, flower bed, lamp post, fountain;
  - menu tabs: All, Houses, Decoration, Functional.
- Build mode:
  - ghost snapped to the grid, green for valid and red for invalid placement;
  - the reason is shown when invalid;
  - rotate, cancel and confirm;
  - building pops in from 80% to 100% scale with dust and sparkles.
- Passive production: houses, farms, windmills and towers make coins, the workshop makes stone, the generator makes crystals.
- Blueprints screen with previews, costs and locked states (unlocked by level).
- Island expansion: 12×12 → 20×20 in four steps (100 / 250 / 500 / 1000 coins), with a bounce animation, particles, new resources and a reward popup.
- Quests: a 16-quest chain followed by endless generated quests, three active at once, with completion popups and rewards.
- XP and levels with the curve `50·L^1.35`, plus a level-up popup with coin rewards and new blueprints.
- Island completion: five tasks per island and a percentage. At 100% you get +200 coins, +50 wood, +30 stone and +10 crystals.
- 7 themed islands, each with its own trees, rocks, crystals, terrain, background and unlock rule:
  - Green, Desert, Ice, Volcano, Neon, Sky, Space.
- Shop:
  - simulated rewarded ads (+100 coins, +5 crystals);
  - a coin-to-material market;
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
