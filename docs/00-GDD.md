# AETHER DRIFT — Game Design Document

> **Ride the sky.** A hoverboard sky-runner set in the floating world of Aetheria.
> Casual-core mobile title for Google Play. Original IP — inspired by the *feeling*
> of endless-runner and precision-platformer games, copying none of them.

**Version:** 1.0 · **Platform:** Web (HTML5/Canvas) → PWA / Play Store wrapper · **Orientation:** Portrait · **Target:** 60 FPS mobile

---

## 1. Vision & Pillars

**One-line pitch:** *Carve through crumbling sky-islands on a hoverboard, then sprout wings and take flight — a runner whose track keeps reinventing itself.*

**Design pillars (every feature must serve at least one):**

1. **FLOW** — momentum never stops; controls are one-touch, forgiving, and readable in 200 ms.
2. **VARIETY** — the track constantly changes gameplay *mode* so it never feels repetitive.
3. **WOW** — first 5 seconds sell the game: speed, light, camera motion, and the flight transformation.
4. **FAIRNESS** — skill and cosmetics only. Zero pay-to-win. Every death feels earned.

**Fantasy:** you are a *Drifter* — a sky-courier who rides living light-boards across a shattered floating kingdom.

---

## 2. Core Loop

```
MAIN MENU ──▶ pick World / Board ──▶ RUN (60–120 s) ──▶ VICTORY or DEFEAT
   ▲                                                          │
   └──── spend Coins/Crystals ◀── Shop / Missions / Pass ◀────┘
```

- **Session length:** 60–120 s per run; 3–8 runs per sit-down.
- **Retention hooks:** daily reward streak, daily/weekly missions, season pass tiers, world unlocks, cosmetic collection.
- **Compulsion:** "one more run" driven by near-miss deaths, mission progress bars, and next-unlock previews.

---

## 3. Controls

| Input (touch) | Input (keyboard) | RUN mode | FLIGHT mode |
|---|---|---|---|
| Swipe ◀ / ▶ | ← / → | Change lane / steer bridge | Steer horizontal |
| Swipe ▲ / tap | ↑ / Space | Jump → double-jump | Ascend + trick |
| Swipe ▼ | ↓ | Slide under | Dive |
| Hold | Shift | — | Glide (slow-fall) |

- **Coyote time:** 90 ms after leaving an edge you can still jump.
- **Input buffer:** 120 ms — a swipe fired just before landing still registers.
- **One-thumb friendly:** everything reachable with a single thumb, no precise taps required.

---

## 4. Gameplay Modes (the "mode-switch" identity)

A run is a **stitched sequence of modules**, each in one of these modes. Transitions are seamless (no loading), announced by a HUD banner + camera move. See `04-GAMEPLAY-SYSTEMS.md` for full spec.

| Mode | Core verb | Fail state |
|---|---|---|
| **RUN** (3 lanes) | Dodge / jump / slide | Hit obstacle |
| **PRECISION BRIDGE** | Balance on narrow path | Fall into void |
| **MOVING PLATFORMS** | Time your lane hops | Miss the platform |
| **GLIDE / FLIGHT** | Free 2-axis flight | Hit flying hazard |
| **BOOST TUNNEL** | Hold line at 2× speed | Clip the wall |
| **BOSS EVENT** | Survive environmental attacks | Get caught |

**Rule:** never repeat the same mode twice in a row; a boss caps each world.

---

## 5. Flight Mode (marquee feature)

1. Collect **Energy Orbs** during RUN → fills the **Aether Bar**.
2. Full bar → board **transforms**: wings unfurl, world tilts, camera pulls back and up.
3. During flight (~8 s): free 2-axis movement, collect **Crystals** at a **2×–4× score multiplier**, dodge flying hazards, chain **aerial tricks** (barrel roll on double-swipe) for bonus.
4. Flight ends with a **dive-back** landing that triggers a camera bounce and speed burst.

This is the emotional peak — the reward for playing well, and the moment shown in every ad.

---

## 6. Progression

**Currencies:** `Coins` (soft, from every run), `Crystals` (premium-ish, from flight & missions), `XP` (drives player Level).

**Unlock tracks:**
- **Worlds** — gated by Level + a key-crystal cost (see §Worlds in systems doc).
- **Characters** — 6 Drifters (cosmetic + a small passive flavor stat, capped so it's never P2W).
- **Hoverboards** — 8 boards, cosmetic trails/particles only (see `04` §Hoverboards).
- **Wings & Trails** — cosmetic flight effects.
- **Skill nodes** — small, capped quality-of-life (e.g. +1 revive/day, longer coyote time) — never raw power that breaks fairness.

**Missions:** 3 daily (reroll 1×/day), 5 weekly, plus a lifetime **Achievements** grid.

**All state persists in `localStorage`** under a versioned schema (`aether.save.v1`), with a migration hook for future versions.

---

## 7. Economy & Monetization (fair, cosmetics-only)

| Source | Coins | Crystals |
|---|---|---|
| Finishing a run | distance + pickups | flight pickups |
| Daily reward (7-day loop) | ✔ escalating | ✔ day 7 |
| Missions | ✔ | ✔ |
| Rewarded ad (2× run reward) | ✔ | — |
| Rewarded ad (continue/revive, 1×/run) | — | — |

**Spend sinks:** boards, wings, trails, characters, world keys, mission rerolls, cosmetic chests.

**Monetization (all optional, no gameplay advantage):**
- **Rewarded video** — double coins, one revive per run.
- **Season Pass** — free + premium cosmetic track, 30 tiers, resets monthly.
- **Starter Pack** — one-time cosmetic bundle + coin boost.
- **Remove-ads IAP** — kills interstitials, keeps rewarded opt-in.
- **Interstitial** — only between runs, capped at 1 per 3 runs, never mid-run.

**Golden rule:** a free player can unlock 100% of *gameplay*; money only buys *cosmetics, convenience, and time*.

---

## 8. Difficulty & Level Flow

- **Difficulty axes:** scroll speed, obstacle density, lane-narrowing, module mix, hazard telegraph time.
- **Ramp:** speed climbs slowly and continuously; density steps up at module boundaries.
- **Fairness guarantees:** every obstacle has an *anticipation animation* and a guaranteed reachable gap; the generator never spawns an impossible pattern (validated at generation time).
- **World structure:** each world = 8–12 stitched modules + 1 boss event + finish gate; endless mode unlocks after clearing a world once.

---

## 9. Technical Architecture (summary — full spec in `05`)

- **Stack:** HTML5 + CSS3 + **vanilla JS**, Canvas 2D (pseudo-3D perspective projection); no frameworks, no external libraries; single self-contained file for portability.
- **Pattern:** modular systems behind a central `Game` object — `Input`, `Camera`, `World`, `Generator`, `Player`, `Spawner`, `Pools`, `FX`, `Audio`, `Save`, `UI`, `Economy`.
- **Loop:** fixed-timestep update (accumulator) + interpolated render; `requestAnimationFrame`.
- **Perf:** object pooling for obstacles/pickups/particles; off-screen culling; pre-baked gradients; draw-call batching by layer; DPR-aware canvas scaling; target 60 FPS on mid-tier Android.
- **Data-driven:** worlds, boards, modules, obstacles, and missions are declared as data tables so content scales without touching engine code.

---

## 10. Content Roadmap (build order)

| Phase | Scope |
|---|---|
| **P0 — Foundation (this build)** | Engine, camera system, RUN + BRIDGE + FLIGHT modes, procedural generator, 1–2 worlds, economy + save, full UI shell |
| **P1** | Remaining modes (moving platforms, boost tunnel), 4 worlds, board/wing shop live |
| **P2** | All 8 worlds, 12 obstacle types, 5 boss events, season pass, missions/achievements |
| **P3** | Audio pass, juice pass, store assets, Play Store wrapper, live-ops calendar |

See sibling docs: `01-ART-DIRECTION.md`, `02-UI-UX.md`, `03-CAMERA.md`, `04-GAMEPLAY-SYSTEMS.md`, `05-TECH-ARCHITECTURE.md`.
