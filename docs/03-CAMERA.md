# AETHER DRIFT — Camera System

> The camera is a gameplay system, not a passive viewport. Its job: **make the player feel speed,
> weight, and danger every single frame.** All motion is spring-interpolated — never snappy, never laggy.

---

## 1. Model

A virtual chase camera in world space with these tracked, independently-smoothed properties:

| Property | Meaning | Smoothing |
|---|---|---|
| `follow` (x,y,z) | target position behind/above player | critically-damped spring |
| `distance` | how far behind the player | eased toward speed-driven target |
| `height` | vertical offset above track | eased, higher in flight |
| `fov` / `zoom` | projection scale (`PROJ_K`) | eased, widens with speed |
| `tilt` (roll) | roll into turns | spring, driven by lateral velocity |
| `pitch` | look-down amount | eased, steeper in flight |
| `shakeX/Y` | trauma-based offset | decays each frame |
| `bounce` | vertical impulse | spring, fired on landing |

**Implementation note:** we use a *critically-damped spring* (`x += (target-x)*k*dt; v` blend) so the
camera catches up fast without oscillating. Every value has its own `k` (stiffness) tuned by feel.

---

## 2. Behaviors

### 2.1 Smooth Follow
Camera lags the player's lane position slightly (spring), so quick lane changes read as *the world
sliding*, not a teleport. Vertical follow tracks jumps with a softer spring (player leads the frame).

### 2.2 Dynamic Distance & FOV (speed feel)
`distanceTarget` and `zoomTarget` scale with current speed:
- slow → camera close, narrow FOV (calm);
- fast/boost → camera pulls back + FOV widens → peripheral streaks accelerate → **visceral speed**.
Mapped through a smoothstep so the change is felt, not jarring.

### 2.3 Tilt / Roll on Turn
Lateral velocity drives a roll: swipe left → world tilts right a few degrees and settles. Sells
carving. Doubled subtly on narrow bridges for tension.

### 2.4 Landing Bounce
On jump-land, fire a downward `bounce` impulse that springs back — the whole frame dips and
recovers, giving the board *weight*. Paired with a dust ring + light haptic.

### 2.5 Camera Shake (trauma model)
A `trauma` scalar (0–1) that decays; actual shake = `trauma² × maxShake` (so small hits are subtle,
big hits violent). Sources: crash (max), boss stomp, hard landing, explosions. Prevents constant jitter.

### 2.6 Boost Zoom (punch-in)
Hitting a boost pad: quick FOV punch-in then pull-back-and-widen as speed spikes; chromatic edge +
speed lines ramp. Reads as *slingshot*.

### 2.7 Obstacle Anticipation
When a dangerous hazard is about to activate near the player, the camera *nudges* toward it (tiny
framing shift) and time micro-dilates (~0.92× for 150 ms) on genuine near-misses — draws the eye,
rewards skill, and makes close calls thrilling.

### 2.8 Flight Transition
On flight transform: camera **pulls back and up**, pitch steepens to reveal the sky vista, brief
slow-mo + wing-burst bloom, then re-frames wider for free movement. Landing back: dive-in + bounce.

### 2.9 Motion Blur (faked)
Canvas 2D has no real motion blur, so we fake it: (a) trailing **ghost draws** of the board at
reduced alpha along its velocity; (b) **radial speed lines** whose density scales with speed;
(c) slight per-frame **persistence** of the fast-moving background layer. Disabled on Low quality.

---

## 3. Tuning Table (starting values)

| Param | Slow | Cruise | Boost | Flight |
|---|---|---|---|---|
| distance | 1.0 | 1.3 | 1.8 | 2.2 |
| height | 0.9 | 1.0 | 1.1 | 1.6 |
| FOV (PROJ_K) | 0.050 | 0.055 | 0.070 | 0.060 |
| pitch | low | low | low | high |
| max tilt (°) | 4 | 6 | 8 | 5 |

Springs: follow `k≈14`, distance/FOV `k≈4`, tilt `k≈10`, bounce `k≈18`, trauma decay `≈1.6/s`.

---

## 4. Integration Contract

- `Camera.update(dt, player, world)` — advances all springs, decays trauma.
- `Camera.addTrauma(amount)` — hazards/events call this.
- `Camera.bump(force)` — landings call this.
- `Camera.apply(ctx)` — pushes tilt (rotate), shake (translate), bounce (translate) onto the 2D
  context before world render; `Camera.zoom` feeds the perspective `PROJ_K`.
- Render order: sky (least parallax) → far islands → track → entities → player (+ghosts) → FX → HUD (unaffected by shake).

## 5. Accessibility
Settings expose **Reduce Camera Motion** (caps shake/tilt/blur) and **Reduce Flashing** for
photosensitivity — required for store compliance and good practice.
