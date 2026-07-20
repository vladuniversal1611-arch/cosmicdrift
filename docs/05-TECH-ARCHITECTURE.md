# AETHER DRIFT — Technical Architecture

> HTML5 + CSS3 + **vanilla JavaScript**, Canvas 2D (pseudo-3D). No frameworks, no external
> libraries. Single self-contained file for portability; modular internal architecture.

---

## 1. Module Map

Central `Game` orchestrates decoupled systems (each an object/closure with `init/update/render`):

| System | Responsibility |
|---|---|
| `Loop` | fixed-timestep accumulator + interpolated render, rAF driver |
| `Input` | keyboard + touch/swipe → intent events; buffering & coyote time |
| `Camera` | springs, trauma-shake, dynamic FOV/tilt/bounce (see `03`) |
| `Director` | mode sequencing, difficulty budget, boss/flight scheduling |
| `Generator` | procedural module stream + solvability validation |
| `World` | active world palette/sky/parallax config |
| `Player` | kinematics, states, procedural animation, hitbox |
| `Spawner` | instantiates obstacles/pickups from pools along the stream |
| `Pools` | object pools (obstacles, pickups, particles, ghosts) |
| `Collisions` | broadphase by z-window, narrow per-mode checks |
| `FX` | particle emitters, speed lines, ghost trails, flashes |
| `Audio` | music per world + SFX bus (WebAudio), ducking |
| `Save` | versioned `localStorage` schema + migrations |
| `Economy` | currencies, unlocks, shop transactions |
| `Missions` | daily/weekly/achievement tracking |
| `UI` | DOM/CSS screen stack over the canvas |

---

## 2. Game Loop (fixed timestep)

```js
const STEP = 1/60;            // deterministic sim
let acc = 0, last = 0;
function frame(t){
  const dt = Math.min(0.05, (t - last)/1000); last = t;
  acc += dt;
  while (acc >= STEP){ update(STEP); acc -= STEP; }   // fixed sim (stable physics)
  render(acc / STEP);                                 // interpolate leftover
  requestAnimationFrame(frame);
}
```

Fixed sim = deterministic collisions and consistent feel across devices; render interpolates for smoothness.

---

## 3. Rendering (pseudo-3D on Canvas 2D)

- **Projection:** perspective `p = 1/(1 + z·k)`; `screenY = horizon + (ground−horizon)·p`,
  `screenX = cx + worldX·laneW·p`, size ∝ `p`. `k` is driven by the Camera (dynamic FOV).
- **Layers (painter's order):** sky gradient → far islands (parallax) → track quads → cross-rungs
  → entities (z-sorted far→near) → player + ghost trails → foreground FX → HUD (CSS, shake-immune).
- **DPR-aware:** backing store scaled by `devicePixelRatio` (capped at 2–3), CSS size fixed —
  crisp on retina without over-drawing.
- **Batching:** group draws by layer/material; pre-bake static gradients; avoid per-frame `createGradient` in hot paths (cache by key).
- **Culling:** skip entities with `z<0` or `z>Zmax`; recycle to pool immediately.

---

## 4. Performance Budget (60 FPS mid-tier Android)

- **Object pooling** for every spawned thing — zero per-frame allocation in the hot loop.
- **Particle cap** (global), oldest-recycled; disabled tiers on Low quality.
- **Quality tiers** (Auto/High/Low): toggle ghost-blur, particle density, god-rays, blur filters.
- **No layout thrash:** HUD updates via cached element refs & `textContent`, not innerHTML.
- **Off-thread-friendly:** heavy generation validation amortized across frames (chunked).
- **Frame guard:** clamp `dt`; if long stalls, skip catch-up beyond N steps (avoid spiral of death).

---

## 5. Save Schema (`localStorage`)

```
aether.save.v1 = {
  version, coins, crystals, xp, level,
  ownedBoards[], equippedBoard, ownedChars[], equippedChar, ownedWings[], ownedTrails[],
  worldsUnlocked[], bestByWorld{}, settings{music,sfx,haptics,quality,reduceMotion,lang},
  missions{daily[],weekly[],rerollUsedAt}, achievements{}, pass{tier,xp,premium,season},
  dailyReward{streak,lastClaim}, stats{...}, onboarded
}
```
Loader validates + runs `migrate(oldVersion→new)`; corrupt save falls back to defaults (never hard-crash).

---

## 6. Content = Data

Worlds, boards, modules, obstacles, bosses, missions, pass tiers, and shop items are declarative
tables. Adding content = adding a row. Engine systems read tables; **no gameplay constant is
hardcoded in a system**. This is what makes the game live-ops scalable.

---

## 7. Build & Delivery

- **Dev:** single `aether_drift.html` (or split source concatenated at build). Runs from `file://`
  and any static host — trivial to test on device.
- **PWA:** inline manifest + service worker for install/offline.
- **Store:** wrap in a WebView shell (e.g. Capacitor/TWA) for Google Play; native bridges for ads,
  IAP, haptics, and leaderboards behind a thin `Platform` adapter (no-op fallbacks on web).
- **Analytics hooks:** thin event bus (`track(event, props)`) — funnel, retention, economy sinks.

---

## 8. Quality & Testing

- **Deterministic sim** enables replay-based regression tests of the generator (seeded RNG).
- **Solvability tests:** generator fuzzed with seeds; assert every module is completable.
- **Headless smoke test:** load page in headless Chromium, drive input, assert no console errors,
  mode transitions fire, economy persists. (Used during development.)
- **Perf probes:** in-dev FPS meter + draw-call counter behind a debug flag.

---

## 9. Coding Standards

Modular closures/objects; each major system commented with its contract; no TODOs in shipped code;
expandable data tables; no external deps; strict mode; guard clauses over deep nesting; pooled
allocations in hot paths.
