# AETHER DRIFT — Art Direction

> Target quality bar: **Dream Games / Royal Match** UI polish, **Stumble Guys / Subway Surfers**
> readability and saturation, with a premium "living light" fantasy identity of our own.

---

## 1. Visual Identity

**Theme:** *bright cartoon sky-fantasy.* Sunny daytime skies, fluffy clouds, and lush grassy
floating islands drifting over a candy-colored world. Clean, chunky, toy-like shapes with soft
shading — the mood of Stumble Guys / Subway Surfers / Dream Games, **not** a dark neon look.
Boards, trails, wings and crystals still glow, but they sit on a **light, cheerful** backdrop.

**Three words:** *Bright · Playful · Premium.*

> **Style rule:** daytime and colorful by default. No near-black backgrounds in gameplay — every
> world reads as a happy, sunny place. Contrast comes from saturated candy hues on light skies,
> not from darkness.

**Silhouette-first rule:** every gameplay object must be identifiable in pure black silhouette.
The player, hazards, pickups, and platforms each own a distinct shape language:
- Player/board: **sleek chevron / arrow**.
- Pickups: **spinning diamond** (orb) / **faceted gem** (crystal).
- Hazards: **hard angular / spiked** — visually "dangerous", never confusable with rewards.
- Platforms: **soft rounded slabs** with glowing rims.

---

## 2. Color

**Global principles:** high saturation, **high value/brightness**; light, sunny backdrops (no
near-black); focal elements pop through hue and warm glow rather than darkness; each **World owns a
signature palette** so players instantly know where they are.

| Role | Guidance |
|---|---|
| Background sky | bright daytime gradient (light top → lighter horizon) + soft sun + fluffy clouds |
| Track/platform | bright candy world hue, white lane lines, crisp rim |
| Player board | white-hot core + world-contrast accent |
| Pickups — Orbs | warm gold `#ffd24d` (consistent across all worlds = learnable) |
| Pickups — Crystals | cyan-white `#8ff5ff` |
| Hazards | high-alarm red/orange `#ff5a6e` regardless of world (safety-critical readability) |
| UI accent | electric blue `#3a6bff` (brand color) |

> **Accessibility:** hazards and pickups are separated by *hue + shape + motion*, never color alone
> (colorblind-safe). Minimum 4.5:1 contrast on all HUD text.

**Per-world signature hues** (see `04` §Worlds): Sky Kingdom = azure/gold · Floating Jungle =
emerald · Crystal Peaks = magenta/cyan · Cyber Islands = neon violet · Ancient Ruins = amber/teal ·
Frozen Kingdom = ice-blue · Volcano Realm = ember · Galaxy World = deep-space iridescent.

---

## 3. Lighting

- **Key light:** soft directional "sun" per world, sets warm/cool mood.
- **Emissive-driven:** boards, trails, orbs and crystal veins are their own light sources — faked
  with radial glows + additive blending.
- **Bloom:** strong on emissives (core stays white, halo carries the color). Faked via layered
  low-alpha blurred draws.
- **God rays:** volumetric shafts from the sun through cloud gaps, subtle and animated.
- **Ambient occlusion (faked):** soft dark gradient where platforms meet, grounds floating geometry.
- **Rim light:** every solid object gets a bright world-hue rim for pop and silhouette.

---

## 4. Camera Feel (see `03-CAMERA.md` for full spec)

Cinematic chase cam: dynamic distance & FOV tied to speed, tilt into turns, shake on impact,
bounce on landing, punch-in on boost, pull-back-and-up on flight transform, subtle motion blur
(speed lines + trailing ghosts) so the player *always feels velocity*.

---

## 5. Effects & Particles

| FX | Look | Trigger |
|---|---|---|
| Board thruster | additive plume in board's accent color | always |
| Trail ribbon | tapering light ribbon (per-board style) | movement |
| Coin/Orb pickup | gold spark burst + upward tick + count pop | collect |
| Crystal pickup | cyan shatter-sparkle + multiplier flash | flight collect |
| Wing burst | radial light bloom + feather-shards | flight transform |
| Landing | dust/light ring + camera bounce | jump land |
| Boost | forward speed-lines + chromatic edge + zoom | boost pad |
| Near-miss | slow-mo micro-pulse + "swoosh" | passing hazard closely |
| Crash | white flash + debris burst + screen crack | death |
| Ambient | drifting motes, pollen, embers per world | world idle |

All particles run through a **pooled, capped emitter** (perf-safe): global cap enforced,
oldest recycled first.

---

## 6. Animation Principles

**12-principles casual polish:** heavy use of *anticipation → action → overshoot → settle*.

- **Squash & stretch** on the board during jump/land (never on the rider's silhouette so it stays readable).
- **Overshoot + settle** on every UI element (buttons, panels, number pops) with spring easing.
- **Anticipation** on hazards: wind-up telegraph (blade retracts, hammer rears back, laser hums+blinks) before the dangerous frame — timing tuned per difficulty.
- **Idle life:** board bobs, rider shifts weight, clouds drift, crystals rotate — nothing is ever static.
- **Secondary motion:** trails, cloth, wings lag behind the body for weight.

**Player states to animate:** Idle · Hover-bob · Lean-Left/Right · Jump · Double-Jump ·
Land (squash) · Slide · Boost (crouch-forward) · Glide · Wings-out · Trick (barrel roll) ·
Crash · Victory.

---

## 7. Environment & Set Dressing

- **Floating islands** at parallax depths (3 layers) drifting slowly — establishes the "sky kingdom" scale.
- **Animated sky:** scrolling cloud bands, moving god-rays, twinkling stars/aurora depending on world.
- **Waterfalls** pouring off island edges into cloud (animated, per world where fitting).
- **Volumetric fog** at the horizon to hide spawn pop-in and add depth.
- **Landmark architecture** per world (temples, cyber-spires, ice palaces) in the far parallax layer.
- **Foreground flourishes:** occasional near-camera elements (a vine, a banner, a floating lantern) that whoosh past for speed and depth.

---

## 8. Materials (faked in 2D via gradients + rim + specular streak)

| Material | Recipe |
|---|---|
| Energy/light | white core → color halo, additive, animated flicker |
| Crystal | faceted flat shading + bright edge + inner glow + slow rotation sparkle |
| Metal/cyber | vertical spec streak + dark base + neon seam lines |
| Ancient stone | matte gradient + carved emissive glyph accents |
| Glass bridge | translucent tint + edge highlight + crack-on-step reveal |
| Cloud | soft blurred blobs, layered alpha, gentle drift |

---

## 9. UI Art (see `02-UI-UX.md`)

Rounded-rectangle "candy" panels, soft drop-shadows, glossy top-highlight, frosted-glass blur,
tactile 3D buttons with press-depth, gold/gem iconography, spring-animated everything.
Consistent 8-pt spacing grid, one type family, generous safe-area padding for notched phones.

---

## 10. Do / Don't

**Do:** bright sunny skies, soft cartoon shading, readable chunky silhouettes, warm glow on focal points, constant subtle motion, world-distinct candy palettes, telegraphed danger.
**Don't:** near-black gameplay backgrounds, dark/edgy neon-on-black moods, muddy mid-tones, color-only signaling, static screens, realistic textures, clutter near the player lane, anything that hurts 60 FPS.
