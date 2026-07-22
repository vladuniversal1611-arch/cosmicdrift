# Cosmic Drift — Main Menu Wireframe

**Fidelity:** Low (structure + usability only — no visual styling).
**Reference:** 1080 × 2400, portrait. **Conforms to:** `docs/DESIGN_SYSTEM.md`.
**Status:** Draft for approval. Visual UI is implemented ONLY after sign-off.

> This wireframe fixes *where things go and how they behave*. Colors, glow,
> illustration and animation polish are deferred to the visual pass and must
> follow the Design System. All positions/sizes are in virtual px (vpx) on the
> 8-point grid; spacing uses only the DS tokens (XS 8 · S 16 · M 24 · L 32 · XL
> 48 · XXL 64). Safe area: Top 64 · Bottom 40 · Left 32 · Right 32 → safe rect
> **x 32–1048 (1016 wide)**, **y 64–2360**.

---

## 0. Section map (heights sum to 2400)

| # | Section | Y range | Height | Purpose |
|---|---|---|---|---|
| 1 | Header | 0 – 392 | 392 | logo + identity + system entries |
| 2 | Resource Bar | 392 – 520 | 128 | coins / gems / energy |
| 3 | Hero Area | 520 – 1240 | 720 | animated background only — breathing room |
| 4 | Main Action | 1240 – 1480 | 240 | PLAY (uncontested) |
| 5 | Secondary Actions | 1480 – 1800 | 320 | 5 navigation icons |
| 6 | Events Area | 1800 – 2296 | 496 | horizontal card carousel |
| 7 | Footer | 2296 – 2400 | 104 | low-priority utilities |

Total = 392+128+720+240+320+496+104 = **2400** ✅ (every band a multiple of 8).

### ASCII layout (not to scale)
```
┌──────────────────────── 1080 ────────────────────────┐
│ safe-top 64                                           │
│ [Avatar+Lvl]                     [🔔 Notif] [⚙ Set]   │ 1 HEADER
│                  ┌──────────────┐                     │   0–392
│                  │  GAME  LOGO  │                     │
│                  └──────────────┘                     │
├───────────────────────────────────────────────────── │
│  ( Coins )       ( Gems )       ( Dragon Energy )     │ 2 RESOURCES 392–520
├───────────────────────────────────────────────────── │
│                                                       │
│         HERO — animated background ONLY               │ 3 HERO 520–1240
│              (no interactive elements)                │
│                                                       │
├───────────────────────────────────────────────────── │
│                 ┌───────────────┐                     │ 4 MAIN 1240–1480
│                 │     PLAY      │                     │
│                 └───────────────┘                     │
├───────────────────────────────────────────────────── │
│  [Island][Dragons][Collection][Events•][Shop]         │ 5 SECONDARY 1480–1800
├───────────────────────────────────────────────────── │
│  ┌Daily┐ ┌Season┐ ┌Event┐ ┌Luck…   →→ scroll         │ 6 EVENTS 1800–2296
│  └─────┘ └──────┘ └─────┘ └───     • • • •            │
├───────────────────────────────────────────────────── │
│ v1.0                              [News] [Help]       │ 7 FOOTER 2296–2400
└───────────────────────────────────────────────────────┘
```

---

## 1. Header (0–392)

A top utility row (identity + system), then the game logo centered below it.

| Element | Anchor | x | y | w | h | Radius | Align | z | Hit area |
|---|---|---|---|---|---|---|---|---|---|
| Avatar + Level pill | TL(safe) | 0 | 0 | 232 | 88 | 44 | start | 80 | 232×96 |
| Notifications button | TR(safe) | −104 | 0 | 88 | 88 | 44 | center | 80 | 96×96 |
| Settings button | TR(safe) | 0 | 0 | 88 | 88 | 44 | center | 80 | 96×96 |
| Game Logo | TC(safe) | 0 | 104 | 560 | 180 | — | center | 80 | none (decorative) |

Absolute check: utility row y 64–152; Settings x 960–1048; Notifications x
856–944 (gap S=16 to Settings); logo x 260–820, y 168–348 (gap M=24 above; 44
below to Resource Bar). Level pill = avatar disc (72) + "LV 12" + thin XP sliver.

---

## 2. Resource Bar (392–520)

Three **identical** capsules, mathematically even. This is the whole spacing law
for the row:

```
safe width           = 1016
capsules             = 3
inter-capsule gap    = S (16), count 2  → 32 total
capsule width        = (1016 − 32) / 3  = 328   (multiple of 8 ✓)
capsule height       = 88     radius 44
row vertical center  = 460    → y 416–504 (top pad M=24, bottom pad S=16)
```

| Capsule | Anchor | x | y | w | h | Content (L→R) | Tap |
|---|---|---|---|---|---|---|---|
| Coins | TL(safe) | 0 | 352 | 328 | 88 | icon(S) · value · "＋" | → Shop (coins) |
| Gems | TL(safe) | 344 | 352 | 328 | 88 | icon(S) · value · "＋" | → Shop (gems) |
| Dragon Energy | TL(safe) | 688 | 352 | 328 | 88 | icon(S) · value · mini-fill | → info popup |

(x within safe: 0, 344, 688 → absolute 32, 376, 720.) Values use the Counter
animation. "＋" affordance only on Coins/Gems.

---

## 3. Hero Area (520–1240) — 720 tall

**No interactive elements. Background animation only.** Reserved breathing space
where the floating island, dragons, clouds and light rays play. Guarantees the
logo (above) and PLAY (below) each get isolation so nothing competes. Wireframe
content: empty region, labeled "HERO / animated bg". Any decorative dragon/island
motion must never overlap the PLAY hit area or the resource capsules.

---

## 4. Main Action (1240–1480) — PLAY only

| Element | Anchor | x-off | cy | w | h | Radius | z |
|---|---|---|---|---|---|---|---|
| PLAY button | MC(section) | 0 | 1360 | 540 | 170 | 40 | 80 |

Center-anchored at **cy = 1360** → y 1275–1445, x 270–810. It is the **only**
element in this band: nothing else may be placed in 1240–1480. Largest control on
the screen; label "PLAY" (Button type, but upsized). This section's isolation is
what makes PLAY win the eye after the logo.

---

## 5. Secondary Actions (1480–1800)

Single row of **5** equal icon tiles — no Settings here (it lives in the Header).
"Do not overload": one balanced row, generous gaps.

```
tiles = 5   tile = 184×184   radius 40   gap = M (24), count 4 → 96
5×184 + 96 = 1016 ✓   → x: 32, 240, 448, 656, 864 (absolute)
tiles y = 1528–1712 (top pad 48)     labels y = 1740 (Caption)
```

| Slot | Label | Anchor | x | y | w | h | Badge | Tap → |
|---|---|---|---|---|---|---|---|---|
| 1 | Island | TL(safe) | 0 | 1464 | 184 | 184 | — | World Map (`ui:openWorldMap`) |
| 2 | Dragons | TL(safe) | 208 | 1464 | 184 | 184 | — | Collection/Dragons (`ui:openCollection`) |
| 3 | Collection | TL(safe) | 416 | 1464 | 184 | 184 | "x/y" | Collection (`ui:openCollection`) |
| 4 | **Events** | TL(safe) | 624 | 1464 | 184 | 184 | **timer + dot** | Events (`ui:openEvents`) |
| 5 | Shop | TL(safe) | 832 | 1464 | 184 | 184 | — | Shop (`ui:openShop`) |

(x within safe 0,208,416,624,832 → absolute 32,240,448,656,864.) Each tile: icon
(Large 112) + label beneath. Badges use the DS Notification Badge (40). Events
carries a live badge/timer to earn its hierarchy rank (#4).

---

## 6. Events Area (1800–2296) — horizontal carousel

**One row, horizontally scrollable.** Four cards; the row is wider than the safe
width so a partial 3rd card **peeks** to signal scrollability.

```
card = 456 × 384   radius 32   gap = M (24)
cards y = 1832–2216 (top pad L=32)   scroll dots y = 2256 (Caption)
resting scroll shows: card1 full (32–488), card2 full (512–968), card3 peek (992–1080)
snap: one card per swipe; dots reflect index
```

| Order | Card | Content (wireframe) | Tap → |
|---|---|---|---|
| 1 | **Daily Reward** | streak · next reward · "CLAIM"/timer · ready-badge | Daily Hub (`ui:openDaily`) |
| 2 | Season Pass | tier track · current reward · progress bar | Season Pass (new: `ui:openSeasonPass`) |
| 3 | Special Event | event art slot · name · "ENDS IN" chip | Events (`ui:openEvents`) |
| 4 | Lucky Chest | chest slot · "free in HH:MM" / "OPEN" | Chest flow (new: `ui:openLuckyChest`) |

Scroll affordances: momentum + snap, a peeking card, and 4 page dots centered at
y 2256. Cards are equal size (consistency); Daily Reward is first (reading order
+ hierarchy rank #5) and shows a ready-badge when claimable.

---

## 7. Footer (2296–2400) — low priority

| Element | Anchor | x | y | w | h | Tap → |
|---|---|---|---|---|---|---|
| Version caption | BL(safe) | 0 | −48 | 200 | 40 | none |
| News button | BR(safe) | −80 | −48 | 64 | 64 | News panel |
| Help button | BR(safe) | 0 | −48 | 64 | 64 | Help/FAQ |

Content sits y 2312–2360 (respects bottom safe 40). Intentionally quiet — never
competes with content above. Hit areas expand to 96×96.

---

## 8. Visual hierarchy — how each rank is earned

The player must notice in this order. Each rank is achieved structurally
(position, size, isolation, motion), not by decoration:

| Rank | Element | Mechanism |
|---|---|---|
| 1 | **Logo** | top-center, largest static mark, isolated in Header, gentle float |
| 2 | **Play** | alone in its 240-tall band, biggest control, center line, idle pulse |
| 3 | **Resources** | high on screen, bright capsules, animated counters draw the eye |
| 4 | **Events** | icon badge/timer + the first bottom card ("Special Event") |
| 5 | **Daily Reward** | first (leftmost) carousel card + ready-badge |
| 6 | **Shop** | present but lowest-emphasis nav tile, no badge unless an offer is live |

Isolation is the key tool: Hero (720) and Main Action (240) bands keep Logo and
Play from competing with anything.

---

## 9. White space / breathing budget

| Gap | Size | Token |
|---|---|---|
| Utility row → Logo | 16 | S |
| Logo → Resource Bar | 44 | (M+half) |
| Resource Bar → Hero | full Hero band | — |
| Hero → Play | isolation | — |
| Play → Secondary | 35 | (center-anchored) |
| Secondary tiles gap | 24 | M |
| Carousel card gap | 24 | M |
| Screen side margins | 32 | L |

No band exceeds ~65% content density; the Hero and the isolation around PLAY
carry the "premium, uncrowded" feel. If any future element would fill the Hero or
crowd PLAY, it is rejected.

---

## 10. Interaction & touch rules

- **Minimum touch target: 96 × 96 vpx.** Smaller visual controls (Notifications,
  Settings, News, Help, "＋") expand their hit area to 96 without moving visually.
- Every tappable follows the DS interaction contract: press → 0.95 → elastic
  bounce → spark → soft SFX → haptic.
- Carousel: horizontal drag with momentum + snap; vertical drags are ignored by
  the carousel and pass through (the menu itself does not scroll vertically —
  everything fits one screen).
- Back/hardware-back on the menu = no-op (root screen) or quit-confirm dialog.
- Reduced-Motion: idle floats/pulses damp to near-zero; transitions keep a
  minimal 100 ms (per DS §10).

---

## 11. Navigation map (exits from the menu)

| Control | Destination | Event (existing / new) |
|---|---|---|
| PLAY | Gameplay | `ui:playPressed` (exists) |
| Island | World Map | `ui:openWorldMap` (exists) |
| Dragons / Collection | Collection | `ui:openCollection` (exists) |
| Events / Special Event card | Events | `ui:openEvents` (exists) |
| Shop / Coins＋ / Gems＋ | Shop | `ui:openShop` (exists) |
| Settings | Settings | `ui:openSettings` (exists) |
| Daily Reward card | Daily Hub | `ui:openDaily` (exists) |
| Notifications | News/Notifications | `ui:openNews` (**new**) |
| Season Pass card | Season Pass | `ui:openSeasonPass` (**new**) |
| Lucky Chest card | Chest flow | `ui:openLuckyChest` (**new**) |
| Avatar/Level | Profile | `ui:openProfile` (**new**) |

New destinations are stubs to define when those features land; the menu wires the
events now so the layout is final.

---

## 12. Deviations from the earlier Main-Menu blueprint (intentional)

- **Settings moved to the Header** (top-right), not the nav grid.
- **Secondary nav is 5 tiles in one row** (Island, Dragons, Collection, Events,
  Shop) — was a 3×2 grid of 6.
- **Bottom section is a 4-card horizontal carousel** (Daily, Season Pass, Special
  Event, Lucky Chest) — was 3 static cards.
- **Resource Bar is its own band below the logo**, not merged into a top bar.

---

## 13. Open questions for approval

1. **Header identity:** avatar+level pill top-left as spec'd — or move player
   level into the Resource Bar and keep the top-left for a menu/news button?
2. **Energy capsule:** show as a value + mini-fill (spec'd) or a full progress
   capsule with "time to next"?
3. **Footer:** keep the quiet News/Help + version strip, or drop the Footer band
   entirely and give that 104 vpx back to the carousel?

Approve §0–§11 (and pick on §13) and the visual pass can begin, styled strictly
per `docs/DESIGN_SYSTEM.md`.
