# SCANLINE — Game Design & Technical Document

**Codename:** Scanline (alt: Interceptor)
**Platform:** Mobile (iOS / Android), portrait, 2D
**Genre:** Tactical single-input arcade / precision-timing
**Engine:** Unity 2022 LTS+, URP (2D Renderer)
**Session Length:** 60–120 seconds per run

---

## 1. Vision & Pillars

Scanline is a premium, minimalist precision game built around a single mechanic:
freeze a sweeping line at the exact right moment to intersect multiple targets.
It reads less like a "game" and more like an instrument panel — closer to a
Bloomberg terminal or a drone targeting HUD than to hyper-casual mobile fare.

**Design Pillars**

1. **One input, total mastery.** Tap is the only verb. All depth comes from timing,
   trajectory-reading, and risk calculus — never from control complexity.
2. **Stillness as tension.** The screen is calm and dark by default. Motion (targets,
   the sweep) is the only thing that draws the eye. Juice is earned, not ambient.
3. **Precision instruments, not toys.** Every visual and audio cue should feel
   engineered — vector-sharp lines, monospace numerals, mechanical sound design.
   No rounded mascots, no particle confetti, no saturated color.
4. **Legible risk.** The player should always be able to explain, in one sentence,
   why they won or lost the last second of play.

---

## 2. Art Direction — "Tactical HUD"

### 2.1 Palette (default theme: "Graphite Ops")

| Role                    | Hex        | Usage                                   |
|--------------------------|------------|------------------------------------------|
| Background               | `#1A1A1A`  | Base canvas, matte, no gradient          |
| Grid overlay              | `#262626`  | 1px coordinate lines, ~8–12% opacity     |
| Scanline (idle)           | `#E8E8E8`  | Thin sweeping line, 1–2px               |
| Scanline (frozen/pulse)   | `#FFFFFF`  | Brief bloom-free flash on freeze         |
| Standard target            | `#9AA0A6`  | Hollow circle / crosshair, 1.5px stroke |
| Bonus target               | `#D8D8D8`  | Brighter stroke, smaller radius          |
| Protected node             | `#F2C14E` → prefer `#C9CDD3` neutral warning | Thin warning glyph, no fill |
| Trajectory trail           | `#3A3A3A`  | Dotted, 4–6 dashes, fades with distance  |
| Positive feedback text     | `#FFFFFF`  | Monospace combat text                    |
| Critical/reboot flash      | `#E5484D` used only as a 120ms desaturated pulse, never as a resting color |

Rule: **no color exists at rest that isn't grayscale.** The only saturation
allowed on screen is a transient (<150ms) reboot flash and shop-unlocked
accent chips. This is what keeps the "financial terminal" read intact.

### 2.2 Typography

- **JetBrains Mono** (or Space Mono as fallback) for all numerals, score,
  coordinates, and HUD labels. Tabular figures only — scores must not jitter
  in width as digits change.
- All-caps for labels ("SYSTEM REBOOT", "LOCKED", "SHIELD"), tracked out
  (+40–80 letter-spacing units) to read as stenciled/military.

### 2.3 Shape Language

- Targets: hollow circles (Ø 12–20px), thin crosshairs, single dots. No fills,
  no drop shadows, no soft glows.
- Protected nodes: a distinct silhouette family (bracketed square `[ ]`,
  triangle warning outline) so they're distinguishable from targets even
  color-blind / at a glance, at sweep speed.
- Scanline: 1–2px hairline with a very faint (6–10% opacity) vertical gradient
  falloff instead of a glow, to avoid any synthwave/neon read.
- Motion trails: dotted/dashed guide lines, opacity falloff over ~0.4s, never
  a solid comet trail.

### 2.4 Unlockable Optics (cosmetic palettes — see §7)

| Optic Name            | Background | Accent    | Feel                         |
|------------------------|------------|-----------|-------------------------------|
| Graphite Ops (default) | `#1A1A1A`  | `#E8E8E8` | Stock tactical                |
| Swiss Chronograph      | `#F5F5F2`  | `#111111` | Inverted, watchmaker precision |
| Deep Marine             | `#10151C`  | `#8FA6B8` | Sonar / navy                  |
| Carbon Matte            | `#131313`  | `#B8B8B8` | Near-monochrome, brushed metal |

Palettes are purely cosmetic re-skins of the same shape/motion system — no
new mechanics, so they're safe to gate behind soft currency without affecting
balance.

---

## 3. Core Gameplay Loop

### 3.1 Moment-to-moment (the "sweep loop", ~1–4s per cycle)

```
READ  →  the scanline sweeps; targets drift in from the edges on shallow angles
PLAN  →  player mentally projects target trajectories against the sweep line
COMMIT →  single tap: scanline freezes, fires a horizontal pulse
RESOLVE →  0–N targets intersected; combo multiplier computed; score/DF awarded
RECOVER →  brief cooldown, scanline resumes sweeping; player re-reads the field
```

### 3.2 Session loop (~60–120s)

```
BOOT   → 1s terminal-style intro ("SIGNAL ACQUIRED"), minimal
RAMP    → target density and speed increase on a fixed curve (§4.5)
SUSTAIN → mid-run, mixed standard/bonus/node traffic, combo-chasing
CRISIS  → late-run, tighter node spacing, higher speed variance, shields matter
REBOOT/END → 3 reboots without shields (or timer/life-based end) → run summary
```

### 3.3 Meta loop (cross-session)

```
PLAY RUN → earn Data Fragments (DF) + best-combo/score →
SPEND DF → Optics (cosmetic) / Hardware Modules (passive power) →
RETURN   → daily contract refresh, leaderboard delta, new best-score chase
```

---

## 4. Mechanics Specification

### 4.1 The Scanline

- Sweeps vertically, constant speed, ping-pong between `minY`/`maxY`
  (no easing at the turnaround — a linear tactical sweep, not a bouncy one).
- Base sweep speed: **~3.0 world-units/sec** (tuned so a full sweep ≈ 2.6s on a
  16-unit-tall play field). Speed increases modestly with session ramp (§4.5).
- **Tap → Freeze:** scanline locks its Y instantly (0-frame response — input
  latency is the one place we cannot compromise). Freeze duration: **180ms**.
- **Pulse width:** the effective hit-band around the frozen Y, default
  **0.12 world units** half-width (i.e., ~0.24 total band before adding each
  target's own collision radius). This is the one stat "Pulse Width" hardware
  modules scale (§7.2).
- **Cooldown:** 80ms non-freezable window after resuming, purely to keep taps
  from feeling spam-able and to sell the "recalibrating" read.
- Taps during `Frozen` or `Cooldown` state are ignored (not queued) — this
  is a deliberate anti-mash decision; the game rewards one deliberate tap,
  not rapid-fire retries.

### 4.2 Targets

| Type              | Behavior                                             | Score weight |
|--------------------|-------------------------------------------------------|--------------|
| Standard            | Enters from left/right edge, shallow angle (±20°), speed band 0.6–2.2 u/s | 1x base |
| Bonus (rare)         | Smaller radius, faster, brighter stroke — higher risk to land, higher reward | 3x base |
| Protected Node       | Same spawn logic, distinct silhouette, never "shatters" — hitting one is a fail state | n/a (penalty) |

All targets move in a straight line at constant velocity (no homing, no
acceleration) — trajectories must be mentally extrapolatable at a glance,
which is the entire skill test. Faint dotted trajectory line shows ~0.6s of
projected path ahead, fading with distance from the target (readability aid,
tunable/removable at higher difficulty tiers for expert mode).

### 4.3 Scoring & Combo

- Base score per standard target: **100**.
- Simultaneous-hit multiplier table:

  | Targets hit in one pulse | Multiplier |
  |---|---|
  | 1 | x1 (base) |
  | 2 | x2 |
  | 3 | x3 |
  | 4+ | x5 |

- `Score = hitCount × baseScorePerTarget × multiplier` (bonus targets apply
  their own weight before the multiplier).
- **Data Fragments (DF)** earned per resolved pulse: `hitCount × multiplier`
  (a separate, smaller-magnitude currency track from score, so leaderboard
  score and shop currency don't feel like the same number).
- Consecutive successful pulses (no reboot in between) build a **Streak**
  counter, shown as a small tally, used for daily-contract and cosmetic-unlock
  pacing — it does not alter the score formula itself, keeping scoring easy
  to reason about mid-run.

### 4.4 Failure State — Protected Nodes

- If the frozen pulse band intersects a Protected Node: **System Reboot**.
  - Streak resets to 0 immediately.
  - If the player holds a shield charge (from the Frequency Stabilizer
    module, §7.2), consume it instead of ending the run — no other penalty.
  - Otherwise, lose one life. Default run has **3 lives**; 0 lives ends the
    run and shows the summary screen.
- Reboot is a hard, unambiguous read: screen desaturates further for ~120ms,
  a single low warning glyph flashes, heavy muffled thud plays. No shake-heavy
  "juice" here — the tone is "system fault," not "game over cartoon explosion."

### 4.5 Difficulty Ramp (fixed curve per run, re-rolled seed each run)

| Time in run | Spawn interval | Speed band | Protected node chance |
|---|---|---|---|
| 0–20s | 1.0–1.4s | 0.6–1.4 u/s | 10% |
| 20–50s | 0.8–1.2s | 0.8–1.8 u/s | 16% |
| 50–90s | 0.6–1.0s | 1.0–2.2 u/s | 22% |
| 90s+ | 0.5–0.8s | 1.2–2.4 u/s | 28% |

Curve is intentionally shallow — Scanline's difficulty comes from the
player's *decision fatigue and field density*, not from raw reflex speed.

### 4.6 Input & Feel Budget

- Touch-to-freeze latency target: **<1 frame at 60fps (~16ms)**. This is
  non-negotiable — the entire game is "prove your timing was correct," so the
  system's own latency must not be a variable the player has to compensate for.
- No input buffering/queueing: a tap during cooldown is dropped, not deferred,
  so players always know a miss was their read, not the system's.
- Optional light haptic tick (mobile) on freeze; heavier haptic on reboot.

---

## 5. Audio Direction

Layered, mostly diegetic-feeling "machine" audio — nothing musical/melodic
during core play; tension comes from mix density, not a music track.

| Layer | Sound | Trigger |
|---|---|---|
| Bed | Deep, low-frequency analog hum, very slow amplitude drift | Constant, ducked during UI |
| Freeze | Short, dry mechanical "click" (like a camera shutter/relay) | On successful freeze |
| Lock | Crisp, short digital chirp, pitch rises slightly per simultaneous target in the same pulse | Per target hit, layered/stacked for combos |
| Combo resolve | A distinct "confirm" tone, pitch/brightness scales with multiplier tier | On 2x/3x/5x resolution |
| Reboot | Heavy, muffled low thud + brief hum dropout | On reboot |
| Shield consumed | Softer metallic "deflect" tick, no thud | Shield absorbs a node hit |
| Menu/shop | Subtle relay clicks, no ambient music bed change beyond LPF sweep | UI navigation |

No layered pop/orchestral stingers, no cartoon "wrong buzzer." The reboot
sound should feel like a piece of hardware faulting, not a game telling you
"no."

---

## 6. Economy & Progression

### 6.1 Currency — Data Fragments (DF)

Earned exclusively through gameplay (per-pulse, see §4.3) plus run-end bonus
(score milestones, streak milestones, daily contract completion). No paid
currency track in the core design — see §6.4 on monetization stance.

### 6.2 Shop

**Scanline Optics** (cosmetic-only palettes) — unlock via flat DF cost,
no gameplay effect. See §2.4 for the palette set. This is the primary
"collect and personalize" hook without touching balance.

**Hardware Modules** (passive, mechanically meaningful upgrades):

| Module | Effect | Notes |
|---|---|---|
| Frequency Stabilizer | Grants 1 shield charge per run (absorbs one Protected Node hit) | Stackable to 2–3 charges at higher tiers, with steep DF cost curve to avoid trivializing risk |
| Pulse Width+ | Widens pulse half-width by +0.02u per tier (3 tiers max) | Capped increase (~+50% total) so simultaneous-hit skill still matters — this is "assist," not "auto-win" |
| Recalibration Speed | Shortens cooldown window by ~15% | Slight QoL, not a power spike |
| Trajectory Clarity | Extends the dotted projection line duration | Pure readability aid; useful for newer players, low priority for experts |

Design guardrail: **no module should let a player stop reading the field.**
Everything is a small percentage nudge, never a mechanic replacement (e.g.
never "auto-fire on best trajectory").

### 6.3 Progression Pacing

- Early sessions (first ~5 runs): DF income tuned so the first Optic or
  Module unlock lands within 2–3 runs — fast, legible first reward.
- Mid-game: costs scale so a dedicated daily player unlocks roughly one
  cosmetic or one module tier every 1–2 days.
- No energy/lives-gating on *attempts* — sessions are short by design, so
  Scanline should never throttle play frequency, only reward depth.

### 6.4 Monetization Stance

Premium-positioned: either a paid unlock or non-intrusive IAP limited to
**cosmetic Optics bundles** and a **DF pass** (time-saver, not power). No ads
interrupting the core loop (a rewarded-optional ad for a bonus post-run DF
trickle is acceptable but never mandatory). This preserves the "premium
instrument" tone — nothing about the presentation should feel like it's
selling attention.

---

## 7. Retention Mechanics

1. **Session micro-length (60–120s):** designed for "one more sweep" —
   low commitment cost per attempt is the primary retention lever, not forced
   engagement hooks.
2. **Daily Contracts ("Signal Logs"):** 2–3 rotating daily objectives
   (e.g. "Land three 3x+ combos," "Clear a run without a reboot," "Intercept
   5 Bonus targets"). Reward: DF + a small cosmetic-track currency. Framed as
   terminal-issued tasking, not a cartoon quest log.
3. **Best Sweep / Leaderboard:** local best score + optional Game Center /
   Play Games leaderboard. A persistent "your best: 4,820 — beat it" ghost
   stat shown on the pre-run screen is a stronger pull than push notifications.
4. **Streak-based unlock pacing:** consecutive-run-without-reboot streaks
   feed a slower cosmetic-only unlock track, rewarding mastery without
   affecting the DF economy.
5. **Soft-fail forgiveness (Shields):** exists specifically to reduce
   frustration-churn on a skill-heavy game — losing a shielded run should
   feel like "close call," not "unfair."
6. **Notifications (opt-in, low frequency):** at most one per day, styled as
   a terminal alert ("Anomaly logged. New contract available."), never
   guilt/streak-loss framed ("come back or lose your streak" patterns are
   explicitly out of scope — inconsistent with the premium, respectful tone).

---

## 8. Narrative / Theme

No characters, no dialogue, no cutscenes. The player is an unnamed operator
of an orbital deep-space monitoring array. All narrative delivery is
environmental/textual, in the same monospace HUD language as the UI:

- Boot: `SIGNAL ACQUIRED — STANDBY FOR SWEEP`
- Combo: floating coordinate-style score text, e.g. `+300 :: X3`
- Reboot: `NODE BREACH — SYSTEM REBOOT`
- Run end: a terminal-style debrief — duration, targets cleared, best combo,
  DF earned — framed as a mission log, not a "Game Over" screen.

This keeps every piece of UI copy doing double duty as both information and
atmosphere, with zero production overhead for character art or writing.

---

## 9. Technical Architecture Overview

### 9.1 Engine & Rendering

- Unity 2022 LTS, **URP 2D Renderer**, orthographic camera.
- All gameplay geometry is procedural vector line rendering (`LineRenderer` /
  custom mesh, anti-aliased via MSAA or a signed-distance shader) rather than
  sprite art — keeps the "sharp vector HUD" look crisp at any resolution and
  avoids an art pipeline entirely for the core shape set.
- Safe-area-aware UI layout (Canvas Scaler, `Screen.safeArea`) for notch/punch
  -hole devices; play field is defined in world units and letterboxed to
  preserve aspect on outlier screens rather than stretched.

### 9.2 Architectural Pattern

- **Centralized deterministic tick.** Gameplay subsystems (`ScanlineController`,
  `TargetManager`) do **not** run their own `Update()`. A single
  `GameManager.Update()` calls `Tick(deltaTime)` on each subsystem in a fixed
  order. This buys: trivial pause/slow-mo, deterministic replay/testing, and
  no cross-system update-order bugs.
- **Event-driven decoupling.** Systems communicate via C# events
  (`Action`/`Action<T>`), not direct references to "what happens next" —
  e.g. `ScanlineController.OnPulseFired` is consumed by `GameManager`, which
  then calls the stateless `IntersectionDetector`, then `ComboSystem`. No
  system reaches backward into another's internals.
- **Data-driven tuning.** All the numbers in §4 (sweep speed, freeze duration,
  spawn bands, difficulty curve) live in `ScriptableObject` configs
  (`ScanlineConfig`, `TargetConfig`), not hardcoded — designers iterate on
  values without touching code or leaving the editor.
- **Zero-allocation hot path.** The per-tap intersection check reuses
  pre-allocated buffers instead of allocating lists — the only "hot,"
  frequent-ish operation in the game (target movement + occasional tap) must
  not trigger GC on low-end Android hardware.
- **Object pooling** for targets (and, in the full implementation, floating
  combat text and hit VFX) — runs spawn/despawn targets continuously for
  60–120s, so pooling avoids Instantiate/Destroy churn entirely.

### 9.3 System Diagram

```
TapInputController ──(OnTap)──▶ GameManager
                                     │
                                     ▼
                          ScanlineController.TryFire()
                                     │ (OnPulseFired: y, halfWidth)
                                     ▼
                          IntersectionDetector.Evaluate(
                              TargetManager.ActiveTargets, y, halfWidth)
                                     │ (hitStandard[], hitNodes[])
                                     ▼
                              ComboSystem.Resolve()
                                     │ (ComboResult)
                                     ▼
                     GameManager updates Score / DF / Shields / Streak
                                     │
                                     ▼
                     TargetManager.Despawn(hit targets) → pool release
```

### 9.4 Data Flow For a Single Tap

1. `TapInputController` detects touch/mouse-down, raises `OnTap`.
2. `GameManager.HandleTap()` calls `scanline.TryFire()` (no-op if not
   currently `Sweeping`).
3. `ScanlineController` transitions to `Frozen`, raises
   `OnPulseFired(currentY, halfPulseWidth)`.
4. `GameManager` calls `IntersectionDetector.Evaluate(...)` against
   `TargetManager.ActiveTargets`, writing into two reusable buffers
   (standard hits, node hits) — no allocation.
5. Node hits (if any) trigger `HandleReboot()` (shield consumption or life
   loss) and reset the combo streak.
6. Standard/bonus hits feed `ComboSystem.Resolve(hitCount, baseScore)`,
   returning a pure `ComboResult` (score, multiplier, DF) — `ComboSystem`
   has no Unity dependency and is unit-testable in isolation.
7. `GameManager` applies score/DF, fires `OnComboResolved` (consumed by
   presentation-layer code — floating text, audio, screen feedback — which
   is intentionally **not** part of this core loop's dependency graph).
8. All resolved targets are despawned back to their `ObjectPool`.

### 9.5 Performance Budget (target: mid-tier Android, 60fps)

- Core loop (`GameManager.Update`) must stay allocation-free every frame.
- Intersection check is `O(activeTargets)` per **tap**, not per frame —
  with expected on-screen populations of a few dozen targets, this is well
  under budget without needing spatial partitioning; noted in code as the
  first place to add a Y-sorted/bucketed structure if population scales up
  by an order of magnitude.
- All rendering is vector/line based with a small, fixed material set (no
  per-target unique materials) to keep draw calls flat regardless of
  on-screen target count (GPU instancing / batching friendly).

---

## 10. Code Architecture Reference

See `Assets/Scripts/` for the foundational implementation:

| File | Responsibility |
|---|---|
| `Data/ScanlineConfig.cs` | Tunable sweep/freeze/pulse values (ScriptableObject) |
| `Data/TargetConfig.cs` | Tunable spawn timing, speed bands, population, node chance |
| `Pooling/ObjectPool.cs` | Generic pooling for target instances |
| `Gameplay/Target.cs` | Runtime target: kind, trajectory, bounds check |
| `Gameplay/ScanlineController.cs` | Sweep motion, freeze/pulse state machine |
| `Gameplay/TargetManager.cs` | Spawning, per-frame movement, pooled lifecycle |
| `Gameplay/IntersectionDetector.cs` | Pure, allocation-free hit-testing at tap time |
| `Gameplay/ComboSystem.cs` | Multiplier table + scoring, Unity-independent |
| `Gameplay/GameManager.cs` | Central tick, event wiring, lives/shields/state |
| `Input/TapInputController.cs` | Touch/mouse tap detection |

---

## 11. Appendix — Tuning Reference (defaults)

| Parameter | Default |
|---|---|
| Sweep speed | 3.0 u/s |
| Freeze duration | 0.18s |
| Pulse half-width | 0.12 u |
| Cooldown | 0.08s |
| Base score / target | 100 |
| Combo multiplier (1/2/3/4+) | x1 / x2 / x3 / x5 |
| Starting lives | 3 |
| Starting shields | 0 (module-granted) |
| Standard target speed band | 0.6–2.2 u/s |
| Protected node chance (open) | 10% → 28% over a run |
