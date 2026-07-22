# Cosmic Drift — Asset Production Pipeline

**Status:** MANDATORY for all art assets. Built to scale past **1000 assets**
while staying clean, themeable and zero-code-swap. No artwork is generated here —
this is the *architecture, naming and folder standard* the art team fills.

Runtime seam: `src/ui/assets/AssetManager.js` (registry + loader + theme base
path) and `src/ui/assets/manifest.js` (logical key → relative path). Everything
falls back to procedural placeholders until a file is registered.

---

## 1. Naming convention (one rule, no exceptions)

`snake_case`, lowercase, ASCII. Pattern:

```
<category>_<name>[_<variant>][_<state>][_<size>].png
```

- **category prefix** (required): `btn_ panel_ card_ badge_ icon_ bg_ fx_ tile_
  dragon_ char_ booster_ mission_ reward_ tab_ bar_ win_ pop_ mus_ sfx_`
- **state** (interactive): `_idle _hover _pressed _disabled _locked _selected`
- **animation state**: `_idle _happy _sleep _fly _victory _failure`
- **size**: `_small _medium _large _hero`
- **nine-slice frames** end `.9.png` (stretchable frames: buttons, panels, bars).
- **sprite sheets / frame sequences**: `<name>_<state>_<frame##>.png` or a strip
  `<name>_<state>_sheet.png` + a `.json` describing frames.

Examples (canonical):
```
btn_play_idle.9.png   btn_play_pressed.9.png   btn_play_disabled.9.png
panel_large_glass.9.png   panel_small_glass.9.png   card_reward.9.png
icon_coin.png   icon_gem.png   icon_energy.png   badge_notification.png
bg_main_menu.png   bg_gameplay.png   bg_world_map.png
fx_sparkle_small.png   fx_sparkle_large.png
dragon_blue_idle.png   dragon_blue_happy.png   dragon_blue_sleep.png
```

**Logical keys** (used in code, stable forever) map to files in `manifest.js`:
`'icon:coins' → 'ui/icons/icon_coin.png'`. Code never references file paths.

---

## 2. Folder structure (`assets/`)

```
assets/
├── backgrounds/     bg_main_menu.png · bg_gameplay.png · bg_world_map.png · bg_*_parallax_far/near.png
├── gameplay/        board, socket, ghost, clear-fx pieces for the play field
├── ui/
│   ├── buttons/     btn_<name>_<state>.9.png   (play, nav×6, back, claim, purchase…)
│   ├── icons/       icon_*.png                 (coin, gem, energy, chest, dragon, rune…)
│   ├── frames/      panel_*_glass.9.png        (large/small/popup/dialog)
│   ├── panels/      full panel art (non nine-slice hero panels)
│   ├── cards/       card_*.9.png               (daily, season, event, store, collection)
│   ├── badges/      badge_notification.png · badge_new.png · badge_count.9.png
│   ├── windows/     win_*.png                  (modal chrome)
│   ├── popups/      pop_*.png                  (toast / dialog chrome)
│   ├── progressbars/ bar_track.9.png · bar_fill_*.9.png · bar_xp.9.png
│   └── tabs/        tab_active.9.png · tab_inactive.9.png
├── tiles/           tile_<type>_<state>.png    (10 living-board types × idle/activate/destroy)
├── dragons/         dragon_<species>_<state>.png
├── characters/      char_avatar_*.png · char_npc_*.png · butterfly, bird
├── effects/         fx_* one-shot burst art
├── particles/       fx_sparkle_*.png · particle atlases
├── boosters/        booster_<name>_idle/active.png
├── missions/        mission_<type>_icon.png
├── rewards/         reward_<name>.png · chest_open_sheet.png
├── animations/      frame sequences, grouped by state:
│   ├── idle/ hover/ pressed/ victory/ failure/ collection/ reward/ dragon/ world/
├── fonts/           display + body fonts (woff2) — see §5
└── audio/
    ├── music/       mus_<biome>.ogg · mus_menu.ogg
    └── sfx/         sfx_<name>.ogg  (tap, place, clear, reward, win, fail…)
```

Empty folders keep a `.gitkeep` so the tree ships before art does.

---

## 3. Planned catalog (how it scales past 1000)

Representative counts per category (the manifest grows as files land):

| Category | Naming | Est. count |
|---|---|---|
| Icons | `icon_*` (currencies, objectives, rewards, ui glyphs) | ~60 |
| Buttons | `btn_<name>_<5 states>.9` × ~14 buttons | ~70 |
| Panels/frames/cards/windows/popups | `panel_/card_/win_/pop_*` | ~50 |
| Badges/tabs/progress bars | `badge_/tab_/bar_*` | ~30 |
| Tiles | `tile_<10 types>_<idle/activate/destroy>` | ~30 |
| Crystals (gems) | `icon_crystal_<5>` + facet variants | ~15 |
| Dragons | `dragon_<~10 species>_<idle/happy/sleep/fly>` | ~40 |
| Characters/NPC/ambient | `char_*`, butterfly, bird | ~30 |
| Backgrounds + parallax layers | `bg_*` × ~8 screens × ~4 layers | ~40 |
| Effects/particles | `fx_*` bursts + atlases | ~60 |
| Boosters/missions/rewards | `booster_/mission_/reward_*` | ~60 |
| **Animations (frame sequences)** | 9 states × many actors × N frames | **~500+** |
| Audio (music + sfx) | `mus_*`, `sfx_*` | ~80 |
| Fonts | display + body | ~4 |

Animations dominate the count — a single dragon `dragon_blue_fly` at 12 frames is
12 files; ten dragons × four states pushes hundreds. The flat key→path manifest
handles any number without code growth.

---

## 4. Theme system (swap = replace PNGs, zero code)

- Every asset is addressed by a **logical key**; the physical file lives under a
  **theme base path** (`AssetManager._base`, default `assets/`).
- **Reskin in place:** replace the PNGs at the same paths → done.
- **Multiple themes:** mirror the folder layout under `assets/themes/<name>/`
  and call `AssetManager.setTheme('winter')` (or `setBasePath(...)`) at boot.
  Same keys, same manifest, different folder. No gameplay/UI code changes.
- Structural style (radii, fonts, frame insets, colour aliases) swaps via
  `Theme.apply({...})`; colours via `Palette`. Art + theme are fully decoupled
  from logic.

---

## 5. Rules

1. **One convention** (§1) — every file matches it; CI/reviewer rejects strays.
2. **Code uses keys, never paths** — only `manifest.js` knows file locations.
3. **Every asset has a placeholder** — nothing blocks on missing art.
4. **Nine-slice for anything resizable** (buttons, panels, bars) — never fixed
   bitmaps that stretch.
5. **Group by category folder**; animations grouped by state folder.
6. **Power-of-two / trimmed atlases** for particles & sequences where possible
   (perf); keep source at 2× reference for crisp scaling.
7. **New asset type → add the folder + convention entry here first**, then use it.
