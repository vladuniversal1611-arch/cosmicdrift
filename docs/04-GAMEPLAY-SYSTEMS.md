# AETHER DRIFT — Gameplay Systems

Covers: gameplay modes & sequencing, procedural generation, player & animation, hoverboards,
flight, worlds, obstacles, and boss events. Data-driven throughout.

---

## 1. Mode Sequencing (never repetitive)

A run is a **playlist of modules**. The Director stitches modules so gameplay constantly shifts:

```
RUN → PRECISION BRIDGE → MOVING PLATFORMS → JUMP PADS → GLIDE/FLIGHT
    → BOOST TUNNEL → OBSTACLE GAUNTLET → BOSS EVENT → FINISH  (then harder loop)
```

**Director rules:**
- Never the same mode twice in a row.
- Difficulty budget per module rises over distance (speed, density, telegraph time shrinks).
- Guarantee a "breather" module after any high-intensity one (boss, gauntlet).
- Flight is *earned* (Aether bar) but the Director also seeds a scripted flight beat once per world for guaranteed wow.
- A boss caps each world; a finish gate ends story runs; endless mode loops with rising budget.

---

## 2. Procedural Generation

### 2.1 Module library (reusable, hand-authored + parametrized)
Straight · Curve L/R · Split Road · Merge · Moving Platforms · Glass Bridge · Ancient Bridge ·
Wind Zone · Boost Pad · Teleport Gate · Spiral Road · Loop · Broken Road (gaps) · Elevator ·
Floating-Island hop · Rotating Platform.

Each module is a **template** exposing knobs: length, lane-mask, obstacle slots, pickup lane,
hazard density, entry/exit lane constraints, tag (mode, intensity).

### 2.2 Algorithm
1. **Weighted pick** a next module compatible with the previous module's *exit lane* and the
   Director's current *mode* + *intensity budget* (avoid recent-repeat via a short history queue).
2. **Parametrize** it against the budget (density, speed, gap widths).
3. **Validate solvability:** simulate a "ghost runner" through the module's obstacle/gap layout to
   prove a reachable path exists (reachable lane at every z-slice, jump/slide gaps within player
   kinematics). Reject + repick on failure. *No impossible patterns ship.*
4. **Bake** obstacle/pickup instances from a pool and append to the world stream.
5. **Recycle** modules once fully behind the camera (return instances to pools).

### 2.3 Anti-repetition
Short history window (last N modules) forbids identical templates; a "spice" counter forces a rare
module (loop/spiral/teleport) every M modules for surprise.

---

## 3. Player & Animation

**Kinematics:** lane-based in ground modes (discrete lanes, spring-interpolated x), free 2-axis in
flight. Jump = impulse + gravity; double-jump allowed once airborne; slide lowers hitbox for 0.55 s.

**Hitbox:** forgiving — slightly smaller than the visual; near-misses feel skillful. Coyote time +
input buffer (see GDD §3).

**Animation states** (all with anticipation/overshoot): Idle · Hover-bob · Lean L/R · Jump ·
Double-Jump · Land(squash) · Slide · Boost(crouch) · Glide · Wings-out · Trick(barrel roll) ·
Crash · Victory · Turn. In 2D these are procedural (skew/scale/rotate the board + rider rig)
rather than sprite sheets, so they're resolution-independent and cheap.

---

## 4. Hoverboards (cosmetic only — no pay-to-win)

| Board | Signature FX |
|---|---|
| Crystal | prismatic refraction trail, faceted body |
| Fire | ember plume + heat-haze trail |
| Lightning | arcing bolts + crackle sparks |
| Galaxy | starfield body + nebula ribbon |
| Ancient | glyph glow + rune particles |
| Dragon | scaled body + flame-wing trail |
| Rainbow | shifting-hue ribbon |
| Cyber | neon seams + data-stream trail |

Boards differ **only** in trail, particle color, body material, and thruster shape. Identical
handling. Unlocked via coins/crystals/pass. Data-driven table drives the renderer.

---

## 5. Flight Mode (spec)

- **Charge:** each Orb adds to `aether` (0→1). At 1.0, auto-trigger (or tap the glowing prompt).
- **Transform:** wings unfurl (feather-shard burst), board lifts, camera pulls back/up, brief slow-mo.
- **Flight (~8 s, extendable by mid-air orbs):** free steer X/Y within bounds; collect **Crystals**
  at **2× base, +1× per trick chain (cap 4×)**; dodge flying hazards; barrel-roll trick on
  double-swipe adds multiplier + style points.
- **Exit:** dive-back landing → camera bounce + short speed boost + confetti of collected value.
- **Fairness:** flight hazards are sparse and telegraphed; flight is a *reward*, not a difficulty spike.

---

## 6. Worlds (8)

Each world: unique palette, sky, clouds, lighting, music, architecture, obstacle skin set, ambient
particles, and a signature boss. Data-driven `WORLDS[]` table (palette, fog, star/aurora config,
island silhouettes, hazard skins, boss id, unlock cost).

| # | World | Signature hue | Boss |
|---|---|---|---|
| 1 | Sky Kingdom | azure/gold | Sky Dragon |
| 2 | Floating Jungle | emerald | Storm Titan |
| 3 | Crystal Peaks | magenta/cyan | Crystal Golem |
| 4 | Cyber Islands | neon violet | Mechanical Guardian |
| 5 | Ancient Ruins | amber/teal | Ancient Golem |
| 6 | Frozen Kingdom | ice-blue | Frost Wyrm |
| 7 | Volcano Realm | ember | Phoenix |
| 8 | Galaxy World | iridescent | Storm Titan (ascended) |

---

## 7. Obstacle System (12+ types, all telegraphed)

| Obstacle | Behavior | Telegraph |
|---|---|---|
| Swinging Hammer | pendulum sweep across lanes | rears back + creak |
| Rotating Blade | spins, blocks a lane on beat | spin-up glint |
| Moving Wall | slides to seal a lane | groan + shadow |
| Laser Gate | on/off beam across lanes | hum + blink |
| Wind Cannon | pushes player sideways | gust particles + whistle |
| Rolling Stone | rolls toward player down lane | rumble + dust |
| Electric Tower | arcs between towers periodically | charge glow |
| Falling Column | drops to block, then crumbles | crack + dust puff |
| Crystal Explosion | crystal charges then bursts outward | pulsing glow |
| Flying Creature | swoops across (flight/air) | shadow + screech |
| Moving Bridge | segments shift/rotate under you | segment rattle |
| Spikes / Void Gap | static hazard / fall | edge glow / abyss shimmer |

**Contract:** every hazard has an *anticipation* phase (safe) → *active* phase (dangerous) →
*recovery*, with a guaranteed reachable gap during the active phase. Telegraph duration scales with
difficulty (shorter = harder) but never below a floor that keeps it fair.

---

## 8. Boss Events (movement/reflex, no combat)

Bosses reshape the environment; the player survives by movement:

- **Sky Dragon** — strafes fire lines across lanes; leave gaps to weave through.
- **Storm Titan** — lightning strikes telegraphed circles; avoid marked lanes.
- **Ancient Golem** — fists smash lanes, shockwaves you must jump; falling debris.
- **Mechanical Guardian** — sweeping lasers + closing walls; timing puzzle.
- **Phoenix** — waves of fire pillars + updrafts that force flight segments.

Structure: intro cinematic beat → 3 escalating attack waves (each telegraphed) → defeat/flee →
big reward. Purely reflex + pattern reading; death is always readable and fair.

---

## 9. Power-ups (run-scoped, fair)

Magnet (auto-collect radius), Shield (absorb one hit), Boost (temporary speed + score), Score-x2,
Orb-surge (faster flight charge). Spawn as rare pickups; timers shown as HUD pips. Cosmetic-neutral,
skill-supportive, never purchasable as a run advantage (only via in-run pickup / occasional daily).

---

## 10. Data Tables (engine reads, never hardcodes)

`WORLDS[]`, `BOARDS[]`, `MODULES[]`, `OBSTACLES[]`, `BOSSES[]`, `MISSIONS[]`, `PASS_TIERS[]`,
`SHOP[]` — all declarative so designers add content without touching engine systems. This is what
makes the title *scalable* to live-ops.
