# FALLSHIFT

Vertical sci-fi arcade roguelite for mobile browsers. Pure HTML5 Canvas 2D + JavaScript, no libraries, no server.

## Run
Open `index.html` in a browser (works from `file://`, no server needed).
Best on a phone in portrait; on desktop it shows a 9:16 column.

## Controls
| Action | Touch | Keyboard |
|---|---|---|
| Rotate tower | swipe left / right anywhere | A / D or ← / → |
| DASH — plunge, smash glass blocks | DASH button | Space / S / ↓ |
| GRAVITY — flip up, ride the ceiling | GRAVITY button | W / ↑ |
| BREAK — shatter a shaft (needs full charge) | BREAK button | E |
| Pause | ⏸ | Esc / P |

## Systems
- **Core loop**: rotate → fall through gaps → combo → FEVER (smash through everything).
- **Platforms**: normal, spikes, breakable glass, moving spike block, self-rotating floors, energy, coin, combo gate (+3), portal (warps 3 floors), fake (crumbles), pulse (phases in/out).
- **Resources**: Energy (abilities), Shield (hits), Break charge (filled by falling), Phase charges.
- **Roguelite power-ups** every 6–9 floors (choose 1 of 3): Overdrive, Phase, Magnet, Breaker+, Energy Core, Combo Master, Void Dash, Shockwave, Lucky Core, Multiplier, Aegis.
- **Worlds** every 20 floors: Neon Tower, Reactor, Void, Cyber Core, Collapse — each with its own palette, skyline, ambient FX, music key/tempo and new hazards.
- **Modifiers** from floor 30: Low Gravity, High Speed, Chaos Rotation, Dark Mode, Laser Mode, Collapse.
- **Boss** every 50 floors: REACTOR CORE — lasers, falling debris, spike waves, overload with safe zones. Land on glowing weak points (DASH = double damage) or use BREAK.
- **Endless mode** after floor 100.
- **Meta**: permanent upgrades (coins/crystals), skins, missions, settings — all saved in `localStorage`.
- **Revive**: once per run via `FS.Ads.showRewarded()` in `js/main.js` (placeholder for a rewarded-ad SDK).

## Structure
```
index.html, style.css
js/storage.js        namespace, math utils, save system
js/audio.js          procedural Web Audio SFX + step-sequenced music
js/particles.js      pooled particles, texts, shockwaves, shake, ambient FX
js/input.js          swipe / keyboard
js/upgrades.js       permanent upgrades, power-ups, skins, missions
js/levelGenerator.js worlds, modifiers, procedural floor generator + validator
js/tower.js          floor storage and pseudo-3D tower renderer
js/player.js         energy core state + rendering
js/abilities.js      DASH / GRAVITY / BREAK
js/boss.js           REACTOR CORE boss
js/ui.js             HUD, menus, overlays
js/game.js           game loop, physics, collisions, scoring, flow
js/main.js           bootstrap, layout, ads placeholder
tests/generator-test.js   node tests/generator-test.js
```

## Generator guarantee
Every floor is validated: at least one permanent opening, at least two safe platforms, moving hazards never cover an opening, and early floors never put spikes directly under the previous floor's openings. `node tests/generator-test.js` checks 80,000 floors.
