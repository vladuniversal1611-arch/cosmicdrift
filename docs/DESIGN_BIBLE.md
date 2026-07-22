# Cosmic Drift — Master UI Design Bible

**Status:** MANDATORY. Top-level art authority for the entire game.
**Relationship:** This Bible governs *look, feel and consistency* (the "why" and
"how it should feel"). Exact coordinates, tokens, grid and component measurements
live in **`docs/DESIGN_SYSTEM.md`** (the "how much / where"). When the two are
read together, the Bible wins on style; the System wins on numbers. Neither may
be violated. If a screen conflicts with either, it is redesigned before it ships.

> One world-class art team made this game. Every screen must look like it came
> from the same hands: same light, same materials, same roundness, same joy.

---

## 1. Design philosophy

The game must always feel: **Premium · Warm · Magical · Bright · Welcoming ·
Juicy · Expensive · Modern · Easy to understand · Comfortable for long sessions.**

Operating principles:
- **Joy & adventure first.** Every screen answers "why is this delightful?"
- **Clarity over decoration.** A player understands any screen in < 2 seconds.
- **Comfort for long play.** No harsh contrast, no vibrating saturation, no
  pure-black, no glare. Backgrounds recede; content invites.
- **Everything is alive.** Nothing is ever fully static (see §5).
- **Handcrafted, not generated.** Soft light, rounded forms, tactile materials.

---

## 2. Visual language

- **Rounded everything.** No sharp corners anywhere. Minimum corner radius on any
  UI rectangle = **16 vpx**; buttons/cards 32–48; pills fully rounded (h/2).
- **Soft curves & friendly proportions.** Chunky, slightly oversized, toy-like.
  Icons and mascots use generous rounding and big readable silhouettes.
- **Large touch targets.** Minimum **96 × 96 vpx** interactive area (DS §10).
- **Comfortable spacing.** Only the DS spacing scale (XS 8 … XXL 64). Screens
  breathe; density never exceeds ~65%.
- **Handcrafted read.** Every object has a light side, a shade side, a gloss and
  a soft shadow — never a flat fill.
- **One light source:** top-left, warm. All highlights, gloss and shadows obey it.

---

## 3. Color language

Exact palette (matches shipped `Palette.js` / `UITheme.UI`). "Max %" is the
approximate share of a screen's colored area a token may occupy.

| Token | HEX (ramp) | Use for | Max % | NEVER use for |
|---|---|---|---|---|
| **Primary Blue** | `#2f8fe0` (ramp `#8fd2ff→#2f8fe0`) | primary nav, info, sky UI, structure | 25% | error/warning states |
| **Primary Green** | `#3fc86a` (ramp `#9cf07a→#37a83f`) | the PLAY CTA, nature, "go" | 15% | text bodies, large flat fills |
| **Golden Accent** | `#ffcf5e` (light `#fff3c4`, deep `#e0891e`, line `#a75c0c`) | frames, rewards, premium emphasis, titles | **10%** | backgrounds, body text, large areas |
| **Crystal Cyan** | `#18d0c0` (light `#93f1e2`) | magic energy, turquoise gems, bridges | 12% | warnings, error, plain text |
| **Warm White** | `#fdf6ea` / panels `rgba(255,255,255,0.96)` | panel fills, glass, reward windows | 30% | glow color, danger |
| **Success Green** | `#2fb85a` | completion ✓, claimed, positive deltas | 8% | primary CTA (use Primary Green), backgrounds |
| **Warning Orange** | `#ff9d2e` | timers, "almost", soft alerts, streak | 8% | success, primary CTA, large fills |
| **Danger Red** | `#ff4d5e` | **warnings/errors ONLY**, invalid, badges | **2%** | backgrounds, buttons(unless destructive), text blocks, decoration |
| **Shadow** | `rgba(40,74,130,0.35)` | soft cool drop shadows | — | as a fill or text color; never pure black |
| **Background** | sky `#5bb4ff → #9ad7ff → #e6f6ff` | full-screen backdrop | ~45% | on top of content; never darkened to navy/black |
| **Highlight** | `rgba(255,255,255,0.60)` / spec `#ffffff` | gloss on glass/buttons/gems | 10% | as a text color on light panels |

Global bans (whole project): **dark purple, dark grey, black UI, muddy brown,
neon/acid saturation, flat single-tone fills.** Text on bright scenes is white
with the DS soft outline; text on light panels is ink `#173a72`.

Palette budget per screen (guideline): Background ≥40%, blues/whites dominate,
green + cyan as life, **gold ≤10% (accents only)**, red ≤2% (warnings only).

---

## 4. Depth system — nothing is flat

Every element declares an **elevation**, which fixes its shadow + optional glow.
Light is top-left, so shadows fall bottom-right.

### Shadows
| Level | Offset (x,y) | Blur | Color/α | For |
|---|---|---|---|---|
| **Shadow 1** | 0, 4 | 8 | `Shadow` ×0.6 | chips, resting icons, small cards |
| **Shadow 2** | 0, 8 | 16 | `Shadow` ×0.8 | buttons, standard cards, capsules |
| **Shadow 3** | 0, 14 | 28 | `Shadow` ×1.0 | popups, reward windows, the board |

### Glows (additive, warm/brand-tinted)
| Level | Blur | α | For |
|---|---|---|---|
| **Glow 1** | 8 | 0.25 | idle badges, gem specular, small emphasis |
| **Glow 2** | 16 | 0.40 | active buttons, energized meters, hovered tiles |
| **Glow 3** | 28 | 0.60 | PLAY, reward reveals, celebration focus |

### Elevation map
| Layer | Shadow | Glow | Notes |
|---|---|---|---|
| Panel / card | Shadow 2 | — | glass body + gold frame |
| Button (rest) | Shadow 2 | Glow 1 idle | Glow 2 on hover/press |
| Popup / dialog | Shadow 3 | — | over warm scrim |
| Reward window | Shadow 3 | Glow 3 | rays behind |
| Floating object (logo, mascot, drifting art) | Shadow 1 (soft, offset by float) | Glow 1 | bobbing motion sells the float |

Shadows are **cool and soft**, never hard or black. Glows are **warm/brand**,
never used to fake a dark vignette.

---

## 5. Motion system — everything is alive

Standard easings (from `Easing`): `backOut` (arrivals), `elasticOut` (button
release), `cubicOut` (slides/fades), `sine` (loops). All motion is
Reduced-Motion aware (amplitudes → ~0, transitions keep a 100 ms minimum).

| Element | Trigger | Duration | Easing | Delay | Scale | Opacity | Movement |
|---|---|---|---|---|---|---|---|
| **Buttons** | press | 60 ms | easeIn | 0 | 1→0.95 | — | — |
| | release | 600 ms | elasticOut | 0 | 0.95→1 | — | +spark burst |
| | idle | 1.4 s loop | sine | phase/btn | ±1.5% | — | — |
| **Panels** | open | 320 ms | backOut | 0 | 0.85→1 | 0→1 | — |
| | close | 200 ms | easeInCubic | 0 | 1→0.9 | 1→0 | — |
| | slide | 300 ms | cubicOut | 0 | — | 0→1 | 100 vpx |
| **Cards** | enter (stagger) | 300 ms | backOut | 60 ms × index | 0.9→1 | 0→1 | +20 vpx up |
| | idle gloss sweep | 4 s loop | linear | — | — | — | sweep |
| **Rewards** | reveal | 350 ms icon + 500 ms count | backOut / easeOut | icon→count | 0.2→1 spring | 0→1 | rays continuous |
| **Counters** | value change | ≤500 ms | easeOut (k≈7/s) | 0 | — | — | tabular roll |
| **Particles** | burst | 0.9–1.4 s | easeOut + gravity | 0 | fade | 1→0 | radial + fall |
| **Camera** | shake | ~300 ms | trauma decay 1.5/s | 0 | — | — | ≤±16 vpx quad falloff |
| **Floating objects** | idle | 3 s loop | sine | phase | — | — | ±6 vpx (UI) / ±3 (icons) |

Rhythm rule: celebratory motion escalates (combo x2→x3→x5→x8) but never blocks
input for more than the reveal beat; the player is always back in control fast.

---

## 6. Iconography

Every icon obeys identical rules so the set looks like one hand drew it.

- **Silhouette first:** readable as a solid shape at Small (48 vpx). One idea per
  icon; **max complexity ≈ 3 shapes + 1 accent.**
- **Outline:** soft, optional. If used, thickness = **8% of icon size**, rounded
  caps/joins, color = a darker shade of the icon's own hue (never pure black).
- **Perspective:** flat, front-on (no isometric). Slight top-down tilt only for
  3D objects (chests, buildings).
- **Lighting:** top-left; a lighter top facet and a softer bottom facet.
- **Gloss:** one small white specular in the upper-left third.
- **Shadow:** Shadow 1 beneath when resting on a surface; none when inside a
  colored button (the button carries the depth).
- **Materials:** pull from §8. Icons are colored from §3 tokens only.
- **Sizes:** Small 48 · Medium 72 · Large 112 · Hero 200 (DS §9).

---

## 7. Illustration style

All scene art shares one rendering language: **soft gradient fills, rounded
silhouettes, top-left warm light, gentle gloss, no hard black outlines, soft
occlusion shadows.** Everything looks plush and sunlit.

| Subject | Rendering rules |
|---|---|
| **Trees** | rounded canopy blobs, 2-stop green gradient (`#6fd07f→#3fc06a`), warm rim light, soft trunk `#9a6b3f` |
| **Clouds** | stacked white circles + a rounded base bar, 55–90% opacity, no outline, drift slowly |
| **Grass** | bright ellipse cap (`#8be86a→#3fae5a`) with a soft green glow rim |
| **Water / waterfalls** | cyan-white vertical gradient, translucent, animated droplet dots, never dark |
| **Mountains / rock** | warm sandy stone gradient (`#f0cf9e→#c2925a`), soft top light — **never muddy brown** |
| **Dragons** | friendly, big-eyed, rounded bodies; brand-hued (`#3aa8ff`, `#ff6a8a`); flapping wings, gentle glow |
| **Buildings** | warm cream walls (`#fbeccb`), bright roofs (`#ff7a4d`), rounded, toy-like |
| **Magic** | crystal-cyan/blue energy, additive glow, sparkles and rays — the "wonder" layer |
| **Crystals** | faceted gems: light facet, saturated core, shaded facet, specular sparkle, aura (see §8) |

Never: photoreal textures, harsh outlines, gritty/dark fantasy, desaturation.

---

## 8. Material library

Every material is faked with the one-light model (top-left). Values guide fills,
gloss and glow — not real textures.

| Material | Texture | Roughness | Reflection | Glow | Lighting |
|---|---|---|---|---|---|
| **Wood** | smooth planks, subtle grain hint | med | low | none | warm top light, soft edge |
| **Stone** | smooth sandy stone, no grit | med-high | low | none | bright top bevel, soft bottom |
| **Gold** | polished bevel frame | very low | **high** (light→mid→deep ramp + line) | Glow 1–2 | sharp top gloss streak |
| **Crystal** | faceted, translucent | low | high | Glow 1–2 aura | facet split + specular |
| **Glass** | clear panel, top gloss band | very low | high sheen | none | 55% white top highlight |
| **Leaves** | flat rounded, 2-stop green | high | none | Glow 1 rim | translucent edge |
| **Magic energy** | soft additive plasma | none | none | **Glow 2–3** | self-lit, cyan/blue |
| **Clouds** | soft, matte-fluffy | high | none | faint | lit from the sun (top) |
| **Water** | translucent, glossy sheen | low | med | faint | bright highlight streaks |

---

## 9. UI component library

Each component composes DS tokens + this Bible. No component invents values.

| Component | Composition (Bible + `DESIGN_SYSTEM.md`) |
|---|---|
| **Buttons** | glossy ramp body → gold frame → gloss → label (Button type); Shadow 2 + Glow 1 idle; variants Primary/Secondary/Standard/Danger/Reward/Purchase (DS §8) |
| **Panels** | glass Warm-White body → gold frame → top gloss → optional crystal corners; Shadow 2 |
| **Cards** | panel + illustration slot + H3 title + status; gloss sweep; Shadow 2; enter-stagger |
| **Popups / Dialogs** | centered panel, Shadow 3, over `Scrim`; open/close motion (§5) |
| **Resource bars** | pill capsules (fully rounded), colored ramp, icon disc + rolling counter + "＋"; Coins=Gold, Gems=Blue, Energy=Cyan |
| **Progress bars** | rounded track (ink 14%) + brand fill + soft inner gloss; animated to target |
| **Mission panels** | full-width row: Large icon + text + progress bar + claim pill |
| **Booster slots** | rounded square, gold frame, item icon (Large) + count badge; empty = dashed gold ghost |
| **Reward windows** | Reward Window panel + rays (Glow 3) + Hero icon spring + rolling amounts + chest |
| **Offer cards** | Store Card: art + title + Purchase button (price chip); "BEST"/"FREE" ribbon |
| **Collection cards** | small card: Hero-ish item art + name + owned/locked state (Locked treatment) |

Locked/disabled states are standardized in DS §8.1 (never a new grey style).

---

## 10. Player emotion — what the UI must reinforce

| Moment | Target emotion | UI reinforcement |
|---|---|---|
| **Opening the game** | Curiosity | living sky, floating logo, a waiting daily gift badge |
| **Playing** | Focus | calm HUD, high-contrast pieces, minimal chrome, no clutter |
| **Winning / clearing** | Excitement | combo escalation, screen flash, particles, camera pop |
| **Unlocking** | Pride | full reward window, rays, Hero icon spring, dragon reaction |
| **Collecting** | Satisfaction | collection fills, "98/100 — almost there!", tick animations |
| **Returning tomorrow** | Anticipation | streak calendar, ready-badges, "something new every 10 levels" |

Emotion is engineered, never manipulative: no FOMO timers, no punishment, nothing
owned is ever taken away.

---

## 11. Governance — the final rule

1. Every screen **must** satisfy this Bible **and** `DESIGN_SYSTEM.md`.
2. **No new styles later.** New needs extend the token tables *here/there first*,
   then get used — never improvised inline.
3. Color discipline (§3 max % + bans), depth on every element (§4), motion on
   everything (§5), one icon/illustration/material language (§6–§8).
4. **Auto-redesign:** if a produced screen violates the Bible, it is corrected
   *before* being presented — not shipped and patched later.
5. The finished product must read as the work of a single world-class art team.
