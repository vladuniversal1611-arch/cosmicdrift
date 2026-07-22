# Cosmic Drift — Design System

**Status:** Mandatory. Single source of truth for every screen.
**Reference resolution:** 1080 × 2400 (portrait, 9:20).
**Owner:** UI/UX. **Last updated:** 2026-07-22.

> **Law of the project:** No UI is created without following this document. No raw
> hex values, no off-grid positions, no ad-hoc font sizes, no one-off easings.
> Everything below is a *token*; screens compose tokens, they never invent values.
> When a token is missing for a real need, add it here first, then use it.

When implemented in code, these tokens live in `src/config/DesignSystem.js`
(to be created) and reuse the existing `Palette`, `UITheme.UI`, and `Easing`
modules. Hex values here are already consistent with the shipped bright palette.

---

## 1. Virtual coordinate system

- All layout is authored in a **virtual space of 1080 × 2400**, origin at
  **top-left**, +X right, +Y down. Units are "virtual px" (vpx).
- Rendered through **one uniform scale** `S = min(deviceW / 1080, deviceH / 2400)`,
  result centered → letterbox/pillarbox. One scale for both axes ⇒ **no
  distortion** on any device.
- The engine's logical canvas (`Config.render`) must be **1080 × 2400** so vpx
  map 1:1 to logical px. (Migration note: engine currently 720×1280; adopting
  1080×2400 makes this document exact and gives modern tall-portrait proportions.)
- **Full-bleed layers** (background) overscan by **+48 vpx** on all sides so
  parallax/shake never reveal an edge.

### 1.1 Anchors
Every element declares an **anchor** (one of 9 points) and an **X/Y offset** from
that anchor. Anchors reference the **Safe Area rectangle** by default (content
reflows with device insets); background/full-bleed elements may anchor to the
**Screen rectangle**.

```
TL — TC — TR
|         |
ML   MC   MR
|         |
BL — BC — BR
```

Element spec fields (all mandatory, none approximate):

| Field | Meaning |
|---|---|
| `anchor` | one of TL,TC,TR,ML,MC,MR,BL,BC,BR |
| `ref` | `safe` (default) or `screen` |
| `x`,`y` | offset in vpx from the anchor |
| `w`,`h` | size in vpx |
| `radius` | corner radius in vpx |
| `padding` | inner padding token (XS…XXL) |
| `margin` | outer margin token (XS…XXL) |
| `z` | layer order (see §4) |
| `align` | text/content alignment: start / center / end |
| `anim` | idle animation token (§10) |
| `state` | interaction states supported (§8) |

---

## 2. Safe area

Grid-aligned insets from the screen edge. **Device OS insets (notch, home bar)
are added on top of these** at runtime.

| Inset | vpx |
|---|---|
| Top | **64** |
| Bottom | **40** |
| Left | **32** |
| Right | **32** |

Safe content rectangle: **x 32 → 1048 (width 1016)**, **y 64 → 2360 (height 2296)**.

---

## 3. Grid system

- **Primary: 8-point grid.** Every position, size, padding and margin is a
  **multiple of 8**. Type and hairline strokes may use the **4 vpx half-step**.
- **Layout grid: 4 columns.** Margin 32, gutter 24 (M), column width **236**.
  `4×236 + 3×24 = 1016` = safe width. Cards/tiles snap to 1, 2, or 4 columns.

| Columns spanned | Width (vpx) |
|---|---|
| 1 | 236 |
| 2 | 496 (236·2 + 24) |
| 3 | 756 |
| 4 | 1016 (full) |

- Vertical rhythm: **baseline grid = 8**. Section gaps use spacing tokens only.
- **Rule:** nothing sits off the 8-grid. If a value isn't a multiple of 8 (or 4
  for type), it's wrong.

---

## 4. Layer order (Z-index)

| z | Layer | Contents |
|---|---|---|
| 0 | Background sky | gradient + sun bloom |
| 10 | Sky FX | slow light rays |
| 20 | Far parallax | far clouds, distant dragons |
| 30 | Midground | floating island, waterfalls, trees, flowers |
| 40 | Near parallax | near clouds, hero dragons |
| 50 | Ambient particles | wind, leaves, motes |
| 60 | Gameplay | board, crystals, pieces, structures |
| 70 | HUD | score, meters, objectives, chrome buttons |
| 80 | Screen content | menu buttons, cards, panels |
| 90 | Popups / dialogs | modal panels + scrim |
| 95 | Reward / celebration | reward window, chest, confetti |
| 99 | Toasts / FX overlay | flash, banners, top-most sparkle |

Scrim behind any z≥90 modal: **warm veil**, `Color.scrim` (never black).

---

## 5. Spacing system

**Only these values may be used** for padding, margin, and gaps.

| Token | vpx | Typical use |
|---|---|---|
| XS | 8 | icon-to-label, chip inner |
| S | 16 | inside small cards, capsule gaps |
| M | 24 | grid gutter, control spacing |
| L | 32 | safe side margin, card padding |
| XL | 48 | section spacing, popup padding |
| XXL | 64 | hero/section separation |

(Micro half-step **4** is allowed only for hairlines/optical text nudges.)

---

## 6. Typography

**Family:** rounded, heavy display face — intended `"Baloo 2"/"Nunito"`; runtime
falls back to `system-ui, sans-serif` at heavy weights (no external fonts:
offline / CSP). **All headings are white with a soft dark outline** for
legibility over bright scenes; body/labels on light panels use ink.

Colors reference §9 tokens. Outline = stroke drawn under the fill (round join).
Shadow = offset drop shadow.

| Role | Size (vpx) | Weight | Color | Outline | Shadow |
|---|---|---|---|---|---|
| **H1** (logo-scale / hero title) | 96 | 900 | `Text.white` | `Text.outline` 6 | y8 blur16 `Shadow` |
| **H2** (screen / section title) | 64 | 900 | `Text.white` | `Text.outline` 5 | y6 blur12 |
| **H3** (card / group title) | 44 | 800 | `Text.white` on scenes / `Text.ink` on panels | 4 (white only) | y4 blur8 |
| **Body** | 32 | 600 | `Text.ink` (light) / `Text.white` (dark) | none / 3 | none |
| **Caption** | 24 | 600 | `Text.inkSoft` | none | none |
| **Button** | 44 | 900 | `Text.white` | `Text.outline` 4 | y3 blur6 |
| **Reward** (big amounts) | 88 | 900 | `Text.white` + gold gloss | `Text.outline` 6 | y6 blur14 gold |
| **Popup title** | 56 | 900 | `Text.white` | `Text.outline` 5 | y5 blur10 |

- Line-height: **1.1** headings, **1.3** body/caption.
- Numerals in counters/rewards use tabular alignment; roll via Counter anim (§10).
- Min on-screen size after scaling: never below **20 vpx**.

---

## 7. Color system

Exact variables. **No color outside this table.** (Ramp = light→base→deep for
glossy 3D fills.)

| Variable | Hex | Ramp / notes |
|---|---|---|
| `Sky` | `#5bb4ff` | gradient `#5bb4ff → #9ad7ff → #e6f6ff` |
| `Grass` | `#3fc06a` | deep `#2f9e4f` |
| `Gold` | `#ffcf5e` | light `#fff3c4`, deep `#e0891e`, line `#a75c0c` |
| `MagicBlue` | `#22b7ff` | glow `#bfe4ff` |
| `MagicGreen` | `#3fc86a` | ramp top `#9cf07a`, base `#37a83f` |
| `Crystal` | `#3aa8ff` | glow `#bfe4ff` |
| `Turquoise` | `#18d0c0` | light `#93f1e2` |
| `Warning` | `#ff9d2e` | orange highlight |
| `Error` | `#ff4d5e` | **warnings only** |
| `Reward` | `#ffcf5e` | with `#ffe08a` sparkle |
| `Background` | sky gradient | panel base `rgba(255,255,255,0.96)` |
| `Shadow` | `rgba(40,74,130,0.35)` | soft cool drop shadow |
| `Highlight` | `rgba(255,255,255,0.60)` | top gloss; pure `#ffffff` spec |
| `Text.white` | `#ffffff` | |
| `Text.ink` | `#173a72` | body on light |
| `Text.inkSoft` | `#2f5487` | captions/muted on light |
| `Text.outline` | `rgba(20,44,92,0.55)` | soft dark outline for white text |
| `Scrim` | `rgba(30,90,160,0.60)` | modal veil (warm blue, never black) |

Button ramps: Primary=`MagicGreen`, Purchase=`MagicGreen`/`Gold`, Danger=`Error`,
Reward=`Gold`, Secondary=per-tile accent. Frame always `Gold` (bevelled).

---

## 8. Button system

Base anatomy for **every** button: soft `Shadow` → glossy vertical gradient body
(color ramp) → top `Highlight` gloss (upper ~52%) → bevelled **Gold** frame →
label (Button type) → optional icon. Radius and size per variant below.

| Variant | W×H (vpx) | Radius | Padding | Body | Glow | Shadow |
|---|---|---|---|---|---|---|
| **Primary** (PLAY) | 540 × 170 | 40 | H:XL V:L | `MagicGreen` ramp | Gold, 24 | y12 blur24 |
| **Secondary** (nav tile) | 220 × 220 | 48 | S | per-accent ramp | accent, 12 | y8 blur16 |
| **Standard** (dialog) | 320 × 112 | 32 | H:L V:M | context ramp | 10 | y6 blur12 |
| **Danger** | 320 × 112 | 32 | H:L V:M | `Error` ramp | red, 12 | y6 blur12 |
| **Reward** | 360 × 120 | 32 | H:L V:M | `Gold` ramp | gold, 16 | y6 blur12 |
| **Purchase** | 300 × 96 | 28 | H:M V:S | `MagicGreen` + price chip | 10 | y5 blur10 |

### 8.1 States (all buttons)

| State | Visual | Animation |
|---|---|---|
| **Default** | full body + gloss + frame + idle breathe | breathe ±1.5% @ 1.4 s (§10 Floating/Glow) |
| **Hovered** (pointer) | +8% brightness, glow +30% | scale → 1.03, 120 ms easeOut |
| **Pressed** | body dim 6%, gloss compress | scale → **0.95**, 60 ms easeIn |
| **Release** | — | scale → 1.0, **600 ms elasticOut** + 7-spark burst + SFX + haptic |
| **Disabled** | grayscale 60% + `rgba(255,255,255,0.4)` veil, no glow | none; taps ignored |
| **Locked** | disabled look + lock icon (Medium) overlay | tap → shake ±8px 300 ms + "locked" SFX |

Interaction contract (mandatory for every tappable): **press 0.95 → elastic
bounce → spark particles → soft tap SFX → `navigator.vibrate(10)`** (gated by
`settings.haptics`; no-op where unsupported).

---

## 9. Icon system

Square footprints, snapped to 8-grid, hand-painted style, high contrast.

| Size | vpx | Use |
|---|---|---|
| **Small** | 48 | inline with text, capsule caps, list rows |
| **Medium** | 72 | buttons, chips, toolbar |
| **Large** | 112 | secondary-button illustration, card headers |
| **Hero** | 200 | reward reveal, empty states, feature art |
| **Notification badge** | 40 disc | count text 24 (Caption), color `Error`, top-right anchor, offset (−8,+8) |

Badge: `Error` disc, `Text.white` count, thin white ring; idle pulse ±10% @ 0.9 s.

---

## 10. Animation system

Durations in ms. Easings reference the `Easing` util. **Nothing is static.**

| Animation | Duration | Easing | Spec |
|---|---|---|---|
| **Button Press** | 60 | easeIn | scale 1 → 0.95 |
| **Button Release** | 600 | elasticOut | scale 0.95 → 1.0 + spark burst |
| **Popup Open** | 320 | backOut | scale 0.85→1.0, fade 0→1, scrim fade 0→1 |
| **Popup Close** | 200 | easeInCubic | scale 1→0.9, fade 1→0, scrim fade→0 |
| **Reward** | 350 icon + 500 count | backOut / easeOut | icon spring-in, numbers roll, rays continuous |
| **Chest Opening** | 700 total | backOut lid | lid 400 backOut → white flash → 60-particle burst |
| **Panel Slide** | 300 | easeOutCubic | translate 100 vpx + fade |
| **Counter** | ≤500 | easeOut (lerp k≈7/s) | tabular roll to target |
| **Glow (pulse)** | 1400 loop | sine | intensity ±0.3 |
| **Floating (bob)** | 3000 loop | sine | UI ±6 vpx; icons ±3 vpx (phase-offset per element) |
| **Camera Shake** | ~300 | trauma decay 1.5/s | max ±16 vpx, quadratic falloff |

Global motion honors **Reduced Motion** (`Quality.animationScale`): amplitudes and
non-essential loops scale toward 0; functional transitions keep a minimal 100 ms.

---

## 11. Panel system

One design language: soft `Shadow` → glass/gradient body (`Background` panel base)
→ top `Highlight` gloss → **Gold** frame → optional crystal corner decorations →
title ribbon (Gold) where titled. Radius/padding per type; content on the layout
grid (§3).

| Panel | W×H (vpx) | Radius | Padding | Title | Notes |
|---|---|---|---|---|---|
| **Small Card** | 236 × 300 (1 col) | 32 | S | H3 | collection/store grid unit |
| **Large Card** | 1016 × auto (4 col) | 40 | L | H3 | feature/banner |
| **Popup** | 880 × auto, anchor MC | 48 | XL | Popup title | scrim z90; open/close anim |
| **Dialog** | 720 × 480, anchor MC | 40 | XL | H2 | confirm/2-button |
| **Reward Window** | 880 × 1040, anchor MC | 48 | XL | H2 | rays + Hero icon + chest |
| **Mission Panel** | 1016 × 160 (row) | 24 | M | H3 | icon + text + progress + claim |
| **Store Card** | 320 × 440 | 32 | M | H3 | art + price (Purchase button) |
| **Collection Card** | 236 × 300 | 32 | S | Caption | icon Hero-ish + name + owned state |

Card gutter = **M (24)**; card outer margin = **L (32)**. Locked panels use the
Locked treatment (§8.1). Highlight sweep on cards = 4 s loop.

---

## 12. Governance rules

1. **Tokens only.** No raw hex, sizes, or easings in screen code — reference §5–§11.
2. **8-grid.** Every position/size is a multiple of 8 (4 for type/hairlines).
3. **Anchors + safe area.** Position via anchor + offset; content stays in the
   safe rectangle; only background is full-bleed.
4. **Typography roles.** Text uses a role from §6, never an arbitrary size/weight.
5. **One button/panel/icon language.** Compose the systems in §8/§9/§11; new
   variants are added *here first*.
6. **Motion is mandatory** (§10) and Reduced-Motion aware.
7. **Color discipline.** `Error` red is warnings only; never dark UI, never muddy.
8. **Every interactive element** implements the full interaction contract (§8.1).

### 12.1 Code mapping (for implementation)
| Doc concept | Code home |
|---|---|
| Color tokens | `Palette`, `UITheme.UI` (extend into `DesignSystem.color`) |
| Spacing/grid/type/anim tokens | new `src/config/DesignSystem.js` |
| Button variants | `PremiumButton` (opts per variant) |
| Panels | `UITheme.glassPanel` / `PanelScreen` + panel presets |
| Icons | `drawObjectiveIcon` + new illustrated set |
| Easings | `src/utils/Easing.js` |
| Counters | `UITheme.Rolling` |
| Reduced motion | `Quality.animationScale` |
