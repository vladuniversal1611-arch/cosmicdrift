# Cosmic Drift — Architecture

A premium, mobile-first shape-placement puzzle built with **HTML5 + CSS +
vanilla ES6 + Canvas 2D**. No external libraries, no build step required to
run, engineered for a stable **60 FPS** and clean **Android WebView** export.

This document describes the project *foundation*. No gameplay rules are
implemented yet — the goal is a production-quality skeleton that later updates
extend without reshaping.

---

## Design principles

1. **Every system is independent.** Systems never import one another. They
   communicate through a central `EventBus` (`namespace:action` events). When a
   direct query is unavoidable, a system uses `game.getSystem(name)` and never
   stores the reference.
2. **Object-oriented, uniform lifecycle.** Every system extends `System`
   (`init → update → render → destroy`) so the `SystemManager` treats them
   identically and the frame pipeline stays explicit.
3. **Data-driven content.** Shapes, missions, shop items, currencies, zones and
   live events are declared as data, so balancing and live-ops need no code
   changes.
4. **Deterministic where it matters.** All randomness flows through a seedable
   `Random`, enabling daily challenges, replays and reproducible bug reports.
5. **Allocation-aware.** Particles and tweens are pooled (`ObjectPool`) to keep
   the GC quiet and frame times smooth.
6. **Resolution independence.** The game is authored against one fixed logical
   resolution; `Canvas` letterboxes it to any device and maps input back to
   logical coordinates, so all layout/draw code is device-agnostic.
7. **Accessibility & platform respect.** Reduced-motion is honoured by the
   animation and particle systems; audio unlocks on first gesture; saves flush
   when the app is backgrounded.

---

## Folder structure

```
/
├── index.html                  # Entry document (mobile viewport, full-bleed canvas)
├── ARCHITECTURE.md             # This file
├── README.md
└── src/
    ├── main.js                 # Bootstrap: build Game, wire lifecycle events
    │
    ├── config/
    │   ├── Config.js           # Single source of truth for tunable constants
    │   └── Palette.js          # Colour / theme tokens
    │
    ├── core/                   # The engine. Knows nothing about gameplay.
    │   ├── Game.js             # Root: owns services + SystemManager, drives frames
    │   ├── GameLoop.js         # Fixed-timestep rAF loop (deterministic sim)
    │   ├── Time.js             # Delta, elapsed, timescale, smoothed FPS
    │   ├── Canvas.js           # DPR + letterbox scaling, logical<->device mapping
    │   ├── Renderer.js         # Drawing façade over Canvas 2D
    │   ├── InputManager.js     # Pointer events -> logical coords + gestures
    │   ├── EventBus.js         # Pub/sub backbone (system decoupling)
    │   ├── System.js           # Abstract base class for all systems
    │   └── SystemManager.js    # Registry + ordered update/render/destroy
    │
    ├── systems/                # Independent feature systems (one folder each)
    │   ├── save/               # SaveSystem + Storage (versioned, debounced)
    │   ├── settings/           # Player preferences (persistent slice)
    │   ├── audio/              # Web Audio buses, mute, autoplay unlock
    │   ├── animation/          # AnimationSystem + Tween (pooled)
    │   ├── particles/          # ParticleSystem + Particle (pooled, capped)
    │   ├── board/              # BoardSystem + Grid + Cell (playfield model)
    │   ├── pieces/             # PieceSystem + Piece + PieceFactory + Shapes
    │   ├── world/              # Parallax starfield + cosmic zones
    │   ├── dragon/             # Signature companion-dragon meta feature
    │   ├── economy/            # EconomySystem + Wallet (currencies)
    │   ├── missions/           # MissionSystem + Mission (event-driven quests)
    │   ├── events/             # Live-ops events / seasonal scheduling
    │   └── shop/               # ShopSystem + ShopItem (catalogue + fulfilment)
    │
    ├── ui/                     # Canvas-drawn UI (scales with the game)
    │   ├── UISystem.js         # Screen stack + input routing
    │   ├── Screen.js           # Base full-screen state
    │   ├── Widget.js           # Base widget (tree, hit-testing)
    │   ├── widgets/            # Button, Label, Panel, ProgressBar
    │   └── screens/            # BootScreen (title) — more added with features
    │
    └── utils/                  # Stateless helpers
        ├── Vec2.js  Rect.js  MathUtils.js  Easing.js
        ├── Random.js  (seedable RNG)
        ├── ObjectPool.js  (GC-free reuse)
        └── Logger.js  (level-filtered logging)
```

---

## Frame pipeline

```
requestAnimationFrame
   └─ GameLoop: accumulate real time, step simulation in fixed 1/60s slices
         ├─ Game._update(dt)
         │     └─ SystemManager.updateAll(dt)   # registration order
         └─ Game._render(alpha)
               ├─ Renderer.begin()              # clear + apply logical transform
               ├─ SystemManager.renderAll()     # world → board → pieces → anim → particles → ui
               └─ Renderer.end()
```

Registration order (declared in one place, `Game._registerSystems`) defines
both update order and draw order: state systems first, presentation last.

---

## How to extend (future updates)

- **Add a system:** create `src/systems/<name>/<Name>System.js` extending
  `System`, set a unique `name`, then register it in `Game._registerSystems`.
  Gate it behind a `Config.features` flag if optional. It should talk to other
  systems only through events.
- **Add gameplay to the board:** placement/matching/scoring rules operate on the
  existing `Grid`. The seams are already present: `PieceSystem` marks where
  drag-and-drop input listeners attach, and gameplay should emit descriptive
  events (`game:piecePlaced`, `game:linesCleared`) that missions/economy/dragon
  already know how to consume.
- **Add content:** append to `Shapes`, `Currencies`, mission definitions, the
  shop catalogue, or `WorldSystem` zones — all pure data.
- **Add a screen:** extend `Screen`, compose widgets, and `push()` it via the
  `UISystem` (e.g. from `BootScreen`'s play handler).

---

## Running & Android WebView export

**Run locally** (ES modules require an HTTP origin, not `file://`):

```bash
cd cosmicdrift
python3 -m http.server 8080
# open http://localhost:8080/
```

**Android WebView:** modern WebViews support ES modules over `http(s)://`, but
loading modules from `file://` can hit CORS restrictions on older versions. For
a robust export, bundle `src/` into a single script (any bundler, e.g. esbuild)
and reference it with a plain `<script>` tag, or serve the assets from a local
`WebViewAssetLoader`. The engine itself is bundler-agnostic — only `main.js`
touches the DOM.
