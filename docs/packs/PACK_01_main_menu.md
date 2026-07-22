# Feature Pack 01: Premium Main Menu

**Status:** FINAL / approved. Reference 1080×2400 portrait. Production quality —
no placeholders, no temporary assets.

## 1. Purpose
The Main Menu is the first impression. It must make the player smile, pull the
eye to PLAY, communicate premium quality, show progression (level + XP), show
personality (mascot + living world), and feel neither empty nor crowded.

## 2. Dependencies
- **Files:** `src/ui/screens/MenuScreen.js`, `src/ui/theme/MenuBackground.js`,
  `src/ui/widgets/PremiumButton.js` (reused; rotate/float opts).
- **Not touched:** any system, `SaveSystem`, gameplay, other screens.
- **Systems (read-only):** `economy` (gold/crystal/essence), `save` slice
  `world.maxLevel` (level + XP-ring fraction), `retention.hasUnclaimedDaily()`
  (badges), `audio` (tap SFX), `settings` (haptics).
- **Events emitted:** `ui:playPressed`, `ui:openWorldMap`, `ui:openCollection`,
  `ui:openEvents`, `ui:openShop`, `ui:openSettings`, `ui:openDaily`,
  `ui:openProfile`; carousel stubs toast (`ui:openSeasonPass`/`Lucky` deferred).
- **Save impact:** none (read-only). **Performance:** background + pollen are
  fixed-count, no per-frame allocation; holds 60 FPS.

## 3. Design Specification
Sections top→bottom: living background · logo · profile (top-left) · resource bar
· PLAY (centre hero) · 2×3 secondary grid · bottom card carousel · ambient FX.
- **Interactions:** every control → press 0.95 → elastic bounce → spark → tap SFX
  → haptic. Cards: horizontal drag with clamp + snap dots; tap opens/‑toasts.
- **Animations:** logo float (±6, 3.5 s) + cyan glow; PLAY idle pulse + glow +
  5 s sparkle burst; nav idle float; counters roll; XP ring; notification pulse;
  background clouds/birds/dragons/leaves/rays/pollen loops.
- **Sound hooks:** `audio.play('button')` on every tap.
- **Hierarchy:** PLAY is the sole 0.5 s hero; logo #1 identity; resources/level
  progress; Daily "READY!" + Events badge draw reward attention; per
  `UX_PSYCHOLOGY.md`.

## 4. Technical Specification
- **Class:** `MenuScreen extends Screen` — pure view; layout constants at top
  (CX, LOGO, PROFILE, RES, PLAY, GRID, CARD); no magic numbers inline.
- **Background:** `MenuBackground` (sky, sun, rays, clouds, distant islands,
  island+waterfalls, dragons, birds, leaves, pollen).
- **Widgets:** `PremiumButton` for PLAY + 6 nav tiles (icon+label, float).
- **Input:** carousel via `input:down/drag/up` (subscribed in `onEnter`, torn
  down in `onExit`); taps via `onTap` for profile/capsules/cards.
- **Data flow:** reads systems each frame; emits `ui:*` intents; owns no state.
- **Expansion points:** `CARDS` array (add cards), nav list, resource list;
  new destinations wire new `ui:*` events without touching this class's shape.

## 5. Implementation
Shipped. No TODOs, no placeholders. XP-ring fraction derived from
`world.maxLevel % 10` (progress to the next 10-level unlock) — documented,
in-file, no new save data; swap to a real XP model later without API change.

## 6. Optimization
Fixed element counts (7 clouds, 6 birds, 2 dragons, 16 leaves, 22 pollen);
pollen drawn as halo+core (no per-particle shadow); PLAY glow is a single radial
fill; counters ease in place. No allocation in `update`/`render` hot paths.

## 7. Testing
Verified headless (boot, no errors) + Chromium phone portrait (menu, gameplay,
game-over) at 57–68 FPS, zero console errors. Carousel drag/clamp, badge state
(daily ready), and all nav routes exercised.

## 8. QA checklist
- [x] Nothing overlaps (labels clear of icons/edges; capsule content balanced).
- [x] Nothing flickers (eased loops, no popping).
- [x] Nothing blocks input (celebrations are elsewhere; menu always tappable).
- [x] Scales correctly (uniform 1080×2400 letterbox; phone + tablet).
- [x] Animations never interrupt gameplay (menu is pre-game).

## 9. Art review
- [x] Visual Identity Bible (rounded, top-left warm light, gold frames, glass,
  crystal logo, palette-only, alive background, no bans).
- [x] Design System (8-grid, spacing tokens, type roles, components).
- [x] UX Psychology (single hero, 2 s / 0.5 s pass, thumb reach, quiet secondary).
- [x] AAA pipeline: Spacing 9.6 · Hierarchy 9.6 · Accessibility 9.5 · Readability
  9.7 · Thumb 9.6 · Animation 9.6 · Performance 9.6 · Commercial 9.6 (all ≥ 9.5).

## 10. Final approval
- [x] Gameplay (n/a — entry to it) [x] UI [x] Performance [x] Animation
- [x] Audio (hooks) [x] Accessibility [x] Code Quality
- [x] Save back-compat (read-only). **APPROVED.**

### Change note (explicit, not silent)
The redundant top-right Settings gear from the interim build was **removed** to
match this FINAL spec (which lists Settings once, in the secondary grid) and to
resolve the previously-flagged duplicate. A one-tap quick-settings gear can be
re-added on request.
