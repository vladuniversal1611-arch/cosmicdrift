# Cosmic Drift — UI Architecture (asset-swappable, future-proof)

**Goal:** integrate final premium artwork later **without rewriting UI or
gameplay**. Today's visuals are procedural placeholders behind stable seams.

## Layer separation (never mixed)
| Layer | Owns | Where |
|---|---|---|
| **Game logic** | rules, state, progression | `src/systems/**`, `src/core/**` |
| **UI logic** | screens, widgets, input routing | `src/ui/**` (Screen/Widget/PremiumButton…) |
| **Visual assets** | images (icons, frames, backgrounds, fx) | `AssetManager` + `assets/` + `manifest.js` |
| **Animation** | tweens, easings, per-widget motion | `Easing`, widget update loops, `Quality.animationScale` |
| **Audio** | buses, sfx/music hooks | `AudioSystem` (event-driven) |
| **Configuration** | tokens, balancing, theme | `Palette`, `Theme`, `Config`, `config/**` |

Systems talk only via the **EventBus**; UI reads state and emits `ui:*` intents.
Colours live in `Palette`, structural style in `Theme`, art in `AssetManager`.

## The swap seams (the important part)
Three shared primitives consult art first and fall back to procedural drawing, so
the **whole existing UI is already skinnable** with no screen edits:

1. **Icons** — `drawObjectiveIcon(r, key, …)` → `AssetManager.drawIcon('icon:'+key)`
   → procedural glyph if absent. Every icon in every screen is swappable.
2. **Frames** — `UITheme.button` / `glassPanel` → `NineSlice.drawFrame(Theme.frame(style).key)`
   → procedural glossy body if absent. Buttons/panels/cards re-skin via nine-slice PNGs.
3. **Backgrounds** — `MenuBackground` / `WorldSystem` are procedural now; the
   `bg:*` namespace + parallax/particle layering are reserved for image layers.

`Theme` centralises style variables (frame→asset mapping + inset, radii, spacing,
fonts, shadow/glow levels) and offers `Theme.apply(overrides)` to re-skin at once.

## How to ship final art (zero logic change)
1. Drop files under `assets/` (e.g. `assets/icons/coins.png`, `assets/frames/button.9.png`).
2. Add keys to `src/ui/assets/manifest.js`:
   ```js
   'icon:coins':   'assets/icons/coins.png',
   'frame:button': 'assets/frames/button.9.png',   // nine-slice, inset per Theme
   ```
3. Done. `AssetManager.load()` (already called at boot in `main.js`) fetches them
   and the seams start using art automatically; anything without art stays
   procedural. Adjust a frame's corner inset in `Theme.frames` if needed.

To swap an entire visual style, register a new art set and/or call
`Theme.apply({ frames: {...}, radii: {...}, fonts: {...} })` — no component or
gameplay code changes.

## Component capabilities
- **Button** (`PremiumButton` + `UITheme.button`): nine-slice PNG background,
  text, icon (animated via update), shadow, glow, idle float, **pressed**
  (scale/bounce), **disabled**, rotate-on-press; **locked** and **notification
  badge** are supported patterns (see menu/daily) and can be promoted to
  first-class button options as screens migrate.
- **Panel/Card/Popup/Dialog** (`UITheme.glassPanel` + `PanelScreen`/screens):
  custom frame (nine-slice), shadow, decorations (crystal corners), resizable
  layout; content laid out on the grid.
- **ResourceBar / ProgressBar / RewardSlot / Tooltip / Notification**: composed
  from the same primitives (capsule = pill frame + icon + `Rolling` counter;
  progress = track + fill; reward slot = frame + `icon:` art).

## Status & migration path
- **In place now:** AssetManager + manifest + nine-slice + Theme; icon and
  button/panel frame seams live project-wide; boot-time asset load wired.
- **Verified:** game boots and renders identically (all fallbacks), 60+ FPS,
  no console errors — a pure additive, non-breaking refactor.
- **Incremental (as needed):** promote `locked`/`badge` to formal button opts;
  add `bg:*` image/parallax layers to the background system; extract a thin
  `Component` base if screens grow. None of this blocks dropping in art today.

## Rules for new UI code
- Never hardcode an icon drawing → use `drawObjectiveIcon` / `AssetManager`.
- Never hardcode a frame → use `UITheme.button`/`glassPanel` (they route through `Theme`+art).
- Never hardcode colours → use `Palette` / `Theme.color`.
- Never mix layers → logic in systems, presentation in `src/ui`, art via manifest.
