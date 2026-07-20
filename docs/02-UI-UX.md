# AETHER DRIFT — UI/UX Specification

> Modern rounded AAA mobile UI. Every element springs, every transition is smooth,
> nothing is a placeholder. 8-pt grid, one type family, safe-area aware.

---

## 1. UX Principles

1. **≤2 taps to play** from cold launch (Splash → auto to Menu → PLAY).
2. **Thumb-zone first** — primary actions in the bottom third.
3. **Diegetic feedback** — every tap gives visual + (optional) audio + haptic response within 80 ms.
4. **No dead ends** — every screen has an obvious back/close; hardware back is handled.
5. **Progress always visible** — currencies, level bar, and next unlock are glanceable.
6. **Respect the player** — ads are opt-in/rewarded; never interrupt a run; settings persist.

---

## 2. Design System

- **Panels:** 20–28 px radius, frosted-glass fill `rgba(6,10,32,.82)` + blur, 1 px inner light border, soft outer shadow, glossy top highlight.
- **Buttons:** 14–16 px radius, gradient fill, `inset` top highlight + bottom shadow, **press-depth 2 px**, spring overshoot on appear. States: default / pressed / disabled / loading.
- **Type:** one geometric family; sizes 8 / 10 / 12 / 15 / 22 / 44 px; letter-spacing wide on labels, tight on numbers.
- **Motion:** spring easing (overshoot+settle) for panels & numbers; 180–260 ms; staggered children (+30 ms each).
- **Iconography:** rounded, filled, gem/coin/star metaphors; consistent 24 px grid.
- **Currency HUD chip:** icon + count + `+` button (routes to shop), animated count roll-up.
- **Safe areas:** honor `env(safe-area-inset-*)`; nothing under the notch or home indicator.

---

## 3. Screen Inventory & Flow

```
SPLASH → LOADING → MAIN MENU ─┬─ PLAY → HUD → (PAUSE) → VICTORY / DEFEAT → MENU
                              ├─ SHOP (Boards / Wings / Trails / Characters / Chests)
                              ├─ CHARACTER SELECT
                              ├─ BOARD SELECT
                              ├─ WORLD / LEVEL SELECT
                              ├─ MISSIONS (Daily / Weekly / Achievements)
                              ├─ SEASON PASS
                              ├─ DAILY REWARD (modal)
                              ├─ STATISTICS / INVENTORY
                              └─ SETTINGS
```

---

## 4. Screen Specs

### 4.1 Splash
Studio + game logo bloom-in over animated sky; ≤1.5 s; preloads core assets; auto-advances.

### 4.2 Loading
Animated (never a frozen bar): drifting board across a progress ribbon, rotating world art,
lore tip line. Real progress from asset/pool init.

### 4.3 Main Menu
- Hero: live 3D-feel diorama of current board hovering over the selected world (parallax reacts to device tilt / pointer).
- Big **PLAY** (bottom-center, pulsing).
- Left rail: Daily Reward (badge if claimable), Missions (badge), Season Pass.
- Top: currency chips (Coins, Crystals), Level bar, Settings gear.
- Bottom rail: Shop · Boards · Characters · World Select.
- First-launch: auto-open Daily Reward if claimable.

### 4.4 World / Level Select
Horizontal carousel of world cards (locked cards show unlock requirement + preview). Each card:
art, name, difficulty stars, best distance, "Endless" toggle if cleared. Swipe to browse, tap to select.

### 4.5 Gameplay HUD
Minimal, non-intrusive, top & edges only (center kept clear):
- Top-left: **Distance** chip. Top-right: **Coins this run** chip.
- Top-center: **Aether Bar** (fills toward flight) with orb count.
- Under bar: **Mode banner** (RUN / FLIGHT / BRIDGE…) appears 1.6 s on transition.
- Right edge: active power-up timers (magnet/shield/boost) as vertical pips.
- Combo/multiplier flourish center-top during flight.
- Pause button top-corner (small, out of thumb-swipe path).

### 4.6 Pause
Dim + blur run; large Resume, Restart, Settings, Quit; music/SFX quick-toggles; current run stats.
3-2-1 countdown on resume.

### 4.7 Victory
Confetti/light-burst; big distance number roll-up; coins+crystals tally animate into HUD chips;
**mission progress bars advance live**; buttons: **2× Reward (ad)**, Next, Menu; new-unlock callout if any.

### 4.8 Defeat
"Signal Lost" title; distance + best; **Continue? (rewarded revive, 1×/run)** with countdown ring;
Run Again; Menu. Near-miss "so close!" flavor if within X of best.

### 4.9 Daily Reward
7-day escalating strip, today highlighted & claimable with a satisfying claim animation; streak counter;
day-7 = Crystals + cosmetic.

### 4.10 Shop
Tabs: **Boards · Wings · Trails · Characters · Chests · Special (Pass/Starter/Remove-Ads)**.
Each item card: animated preview, rarity frame, price (Coins/Crystals/IAP), Owned/Equip/Buy state.
Confirm modal for premium spends. **No power stats shown — cosmetics only.**

### 4.11 Season Pass
Free + Premium dual track, 30 tiers, current-tier marker, XP-to-next bar, time-left countdown,
"Unlock Premium" CTA, claim-all button.

### 4.12 Character / Board Select
Grid of owned + locked; big rotating preview of selection; equip button; locked items show
source (shop/pass/mission). Selection persists to save.

### 4.13 Missions
Daily (3, one reroll/day), Weekly (5), Achievements grid (lifetime, tiered). Each: icon,
description, progress bar, reward, Claim when done.

### 4.14 Statistics / Inventory
Lifetime: total distance, runs, coins earned, best world, flight time, tricks landed.
Inventory: owned cosmetics gallery.

### 4.15 Settings
Music / SFX sliders, Haptics toggle, Quality (Auto/High/Low), Language, Reset progress (confirm),
Restore purchases, Credits, Privacy/Support links.

---

## 5. Feedback & Juice

- **Haptics:** light tick on tap, medium on pickup milestone, heavy on crash / flight transform.
- **Number pops:** every reward count animates (roll-up + scale overshoot).
- **Screen transitions:** cross-fade + slight scale; never a hard cut.
- **Empty/again states:** encouraging copy, not blank panels.
- **Badges:** claimable rewards surface as pulsing dots on their entry point.

---

## 6. Onboarding (First-Time UX)

Teach by doing, inside the first run: contextual swipe prompts appear exactly when the first
lane-change / jump / slide / flight is needed, then never again. No blocking tutorial wall.
`onboarded` flag stored in save.

---

## 7. Responsiveness & Platform

- Portrait-locked; game field letterboxes to device aspect, UI anchors to safe area.
- DPR-aware canvas; UI in DOM/CSS layer over canvas for crispness and accessibility.
- Hardware back button → context-appropriate close/back; double-back-to-exit on menu.
- All copy externalized for localization (Ukrainian + English at launch).
