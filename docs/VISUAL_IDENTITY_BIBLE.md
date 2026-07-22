# Cosmic Drift — Visual Identity Bible

**Status:** SUPREME AUTHORITY on visual style. Every asset, illustration, icon,
button, panel, character and background must follow this exactly. No improvising.

**Authority stack (how the four docs relate):**
1. **Visual Identity Bible** (this) — *how everything looks and is rendered*:
   identity, shape, light, materials, color rendering, outlines, particles,
   characters, backgrounds. Wins on style; supersedes the art sections of the
   Design Bible where they overlap.
2. **`DESIGN_BIBLE.md`** — UI design language / component behavior.
3. **`DESIGN_SYSTEM.md`** — exact tokens, grid, measurements (wins on numbers).
4. **`UX_PSYCHOLOGY.md`** — attention, placement, hierarchy (wins on emphasis).

If an asset does not match this Bible, it is redesigned before implementation.

---

## 1. Game identity

Opening the game must instantly communicate: **Premium · Bright · Friendly ·
Magical · Relaxing · Addictive · Alive · High Quality.** The single success test:
**the player smiles when the game opens.** Warm sunlight, a living sky, a friendly
dragon, gold sparkle — joy at first frame.

---

## 2. Shape language

- **No sharp edges anywhere.** Rounded corners on every object.
- Minimum corner radius: **16 vpx** (UI), pills fully rounded (h/2).
- **Chunky, generous proportions** — slightly oversized, toy-like, huggable.
- **Friendly silhouettes** — every object is recognizable by outline alone.
- **Large, readable shapes** — must read at small size (≥ 48 vpx icons). One
  clear idea per shape; simplify until the silhouette is instantly legible.
- Soft curves preferred over straight runs; corners ease, never miter.

---

## 3. Lighting

- **Global key light: top-left, 45°, warm** (sunlight `#fff6d6`). Every
  highlight, gloss and cast shadow obeys it, project-wide.
- **Soft ambient fill** from the sky (cool `#bfe0ff`) lifts shadow sides so
  nothing goes dark.
- **Glossy highlights**: a bright specular in the upper-left third of glossy
  materials.
- **Golden rim light** on premium objects (gold-framed buttons, reward items,
  crystals) — a warm edge catch on the light side.
- **Never harsh**: no hard black shadows, no blown speculars, no high-key glare.
  Shadows are soft, cool and low-opacity (`Shadow` token).

---

## 4. Materials

Faked with the §3 one-light model. Each recipe = base ramp + gloss + glow.

| Material | Base ramp (light→deep) | Gloss | Glow | Character |
|---|---|---|---|---|
| **Gold** | `#fff3c4 → #ffcf5e → #e0891e` (frame line `#a75c0c`) | sharp warm streak, top-left | Glow 1–2 warm | polished, warm, premium; the "expensive" cue |
| **Crystal** | `#e2fffb → #3aa8ff/#18d0c0 → deep` | facet specular | Glow 1–2 cyan aura | transparent, glowing, blue/cyan |
| **Wood** | `#d9b98a → #b07a45` | soft sheen | none | clean, bright, stylized planks (never muddy) |
| **Stone** | `#fbfdff → #c6ddf6` (light gray-blue) | soft top bevel | none | light gray, soft, friendly — never gritty |
| **Grass** | `#8be86a → #3fae5a` | faint | Glow 1 green rim | rich green, rounded, lush |
| **Water** | `#e2fffb → #18d0c0` translucent | bright streaks + sparkles | faint | bright turquoise, animated, sparkling |
| **Clouds** | `#ffffff / #f2f8ff` | matte | faint | large, soft, fluffy, rounded stacks |

Never: photoreal textures, metal sci-fi surfaces, gritty/dark fantasy.

---

## 5. Outlines

- **Never black.** Use a **darker shade of the object's own hue**.
- Thickness: a **consistent ~2–4 px equivalent** (≈ 4% of the object's short
  side; identical within an asset set). Rounded caps and joins.
- Outlines are for readability, applied evenly — never as heavy dark frames.
  (White text over scenes uses the soft dark text-outline from the Design System.)

---

## 6. Color palette

Exact tokens (aligned to shipped `Palette.js`; **Pink Accent** is new and is
added to code when the next asset lands). Dark values are for **shadows only**.

| Token | HEX (ramp) | Use | Never |
|---|---|---|---|
| **Primary Blue** | `#2f8fe0` (`#8fd2ff→#2f8fe0`) | nav, info, structure, sky UI | error states |
| **Primary Green** | `#3fc86a` (`#9cf07a→#37a83f`) | PLAY / go / nature | body text, big flat fills |
| **Golden Yellow** | `#ffcf5e` (light `#fff3c4`, deep `#e0891e`) | frames, rewards, premium emphasis | backgrounds, body text |
| **Crystal Cyan** | `#18d0c0` (light `#93f1e2`) | magic, energy, water, gems | warnings, plain text |
| **Warm White** | `#fdf6ea` / panels `rgba(255,255,255,0.96)` | panels, glass, light text bg | glow color, danger |
| **Orange Accent** | `#ff9422` | festive/decorative highlights, coins | success, primary CTA |
| **Pink Accent** | `#ff6aa8` (light `#ffb2d3`) | dragons, playful accents, "fun" tags | errors, large fills, body text |
| **Success Green** | `#2fb85a` | complete ✓, claimed, positive delta | primary CTA, backgrounds |
| **Warning Orange** | `#ff9d2e` | timers, soft alerts, streaks | success, large fills |
| **Danger Red** | `#ff4d5e` | warnings/errors ONLY, invalid | backgrounds, decoration, text blocks |
| **Shadow (dark)** | `rgba(40,74,130,0.35)` | soft cool shadows ONLY | large backgrounds, fills, UI |

Backgrounds are always the bright sky (`#5bb4ff → #9ad7ff → #e6f6ff`). **Dark
colors are never used for large areas — only for soft shadows.**

---

## 7. Particles

- **Small, soft, glowing** — rounded motes/sparkles, never hard specks.
- **Never chaotic** — gentle counts, eased motion, purposeful bursts (rewards,
  taps, clears). Respect the particle budget (`Quality.maxParticles`).
- **Colors always match the environment / source** — a green clear throws green
  sparks; a gold reward throws gold; sky motes are warm-white. Never off-palette.

---

## 8. Button style

Every button: **glossy, rounded, soft top highlight, visible depth (soft cool
shadow), strong readability.** Body is a vertical color ramp with a top gloss
band. **Gold frame ONLY on important buttons** (primary/reward/premium);
secondary/utility buttons use a lighter own-hue rim, not gold. Labels are bold,
white with the soft dark outline. Never flat, never tiny (≥ 96 vpx touch).

---

## 9. Panel style

Rounded corners, **glass effect** (translucent Warm-White body + top gloss),
soft gradients, **light borders**, optional **crystal corner decorations**, soft
cool drop shadow. **No heavy dark frames, no gray fills.** Titles ride a gold
ribbon where emphasis is needed.

---

## 10. Icon style

**Hand-painted, bright, simple, readable.** Identical rules across the whole set:
one consistent front-on perspective, the §3 top-left light on every icon, a small
upper-left gloss, a soft own-hue shadow, max ~3 shapes + 1 accent, colored only
from §6 tokens. Must read as a clean silhouette at 48 vpx. **Never thin-line
icons.**

---

## 11. Character style

Mascots (dragons, NPCs) are **cute, expressive, friendly**: **large eyes**,
**rounded body shapes**, soft bellies, short limbs, readable emotions (joy,
surprise, cheer) via big eyes + mouth + brows. Brand-hued (`#3aa8ff`, `#ff6aa8`,
green). Gentle idle motion (breathe, blink, wing-flap). **Never realistic, never
scary.** The companion dragon should feel like a friend.

---

## 12. Background style

**Always alive — nothing is ever fully static.** The sky drifts, clouds move,
water flows and sparkles, leaves fall, birds glide, dragons arc, light rays sweep
and magic motes float. Subtle parallax gives depth. A still background is a bug.

---

## 13. Negative rules (hard bans)

Never use, anywhere: **dark fantasy · black UI · gray menus · sharp metallic /
sci-fi interfaces · flat design · photorealism · thin icons · tiny buttons ·
muddy browns · dark purple · harsh lighting · black outlines · chaotic
particles.** Any of these = automatic redesign.

---

## 14. Governance — final rule

Every future screen and asset must look like it belongs to the **same game**,
made by the **same art team**. Before implementation, each asset is checked
against this Bible; anything that doesn't match is redesigned first. Consistency
of identity, shape, light, material, color, outline and motion is non-negotiable.

**Asset ship-check:** rounded shapes? · top-left warm light? · correct material
recipe? · own-hue (non-black) outline? · palette-only colors (dark = shadow
only)? · readable silhouette at small size? · alive/animated if ambient? · passes
the negative rules? → only then may it ship.
