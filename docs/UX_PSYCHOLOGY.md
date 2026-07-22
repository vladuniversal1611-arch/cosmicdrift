# Cosmic Drift — UX & Player-Psychology Playbook

**Status:** MANDATORY. Governs *why* every element exists and *how* it guides the
player. Read with `docs/DESIGN_BIBLE.md` (look/feel) and `docs/DESIGN_SYSTEM.md`
(exact tokens). Style/number conflicts defer to those; **placement, emphasis and
attention are governed here.** No element ships that cannot justify its existence.

> Rule zero: never place a UI element because it "fits". Every element earns its
> place by serving attention, comprehension, comfort or emotion — or it is cut.

---

## 1. Attention order (the eye-path)

The eye must travel, on every screen, in this priority:

1. **Main Objective** — what this screen is about ("where am I")
2. **Primary Action** — the one thing to do next
3. **Rewards** — what the player can get
4. **Progress** — how far along they are
5. **Secondary Features** — everything else

Layout must *cooperate* with natural scan patterns (top→center→bottom, left→right
for a right-thumb device). Never force the eye to fight the layout. Rank every
element 1–5; anything unranked is a candidate for removal (§7).

---

## 2. The 2-second rule

Within 2 seconds a new player must be able to answer:
- **Where am I?** (screen identity — title/logo/context)
- **What should I do?** (the primary action is obvious)
- **What reward can I get?** (a visible carrot)

If a screen fails any of the three, it is redesigned before it ships. Test:
glance for 2 s, look away, write the three answers — all must be correct.

---

## 3. The 0.5-second rule — ONE hero

In the first half-second the eye must land on **exactly one hero element** (Play
button, reward chest, victory chest, dragon, …). **Never two competing heroes.**

Enforce the single hero with a *stack* of signals — the hero wins on most/all:
- **Size** — clearly the largest.
- **Motion** — the strongest/most rhythmic animation (pulse, sparkle). Secondary
  motion is smaller and calmer.
- **Glow / contrast** — highest (Glow 3); everything else Glow ≤1.
- **Isolation** — its own breathing space; nothing crowds it.
- **Color** — a decisive, saturated CTA hue against a calmer field.

Anti-patterns (auto-fail): two glowing elements of similar size; a loud rainbow
of equally-saturated tiles; a headline that out-shouts the CTA; particles firing
somewhere other than the hero.

---

## 4. Touch comfort (one-thumb ergonomics)

- **Thumb reach:** the primary action lives in the natural thumb arc (lower-center
  of a portrait phone). Destructive/rare controls go to the top corners (hard to
  hit by accident).
- **Minimum interactive size 96×96 vpx**; comfortable target ≥ 120.
- **Minimum gap between distinct actions ≥ 24 vpx (M)** so a thumb never
  ambiguously straddles two. Never cluster important buttons edge-to-edge.
- No primary action within 40 vpx of a screen edge or a device inset.

---

## 5. Focus system — quiet everything that isn't the objective

Attention is a budget. Whatever isn't the current objective is actively *quieted*:
- **Lower contrast** (toward the background)
- **Lower glow** (Glow 0–1)
- **Smaller size**
- **Less / slower animation**

Techniques: dim/blur the field behind a modal (warm scrim), desaturate inactive
options, shrink non-focus icons, pause non-essential loops during a celebration.
Guide the eye — never rely on the player hunting.

---

## 6. Visual-noise budget

Every non-interactive element must pass one test: **does it improve gameplay or
support immersion?** Ambient world life (clouds, dragons, light rays) *supports
immersion* and stays. Pure decoration that does neither is **removed**. Duplicated
affordances (two ways to the same place with no reason) are consolidated. Empty
space is allowed **only when purposeful** (isolating the hero, breathing room);
never as filler and never as accidental gaps inside components.

---

## 7. Reward psychology — earned, never instant

Rewards must feel *earned*, so they are never dumped on screen. Fixed sequence
(timings per `DESIGN_SYSTEM.md` §10):

1. **Light** — a glow/ray blooms where the reward will appear.
2. **Particles** — a burst draws the eye to the spot.
3. **Sound** — a rising chime lands with the reveal.
4. **Bounce** — the reward springs in (backOut).
5. **Celebrate** — rays, confetti, counter roll, a dragon reaction.
6. **Collect** — the player taps to "take" it (agency = ownership).

Anticipation (steps 1–2) before payoff (3–5) is what makes it feel valuable.
Never skip to step 5. Non-manipulative always: no FOMO, no punishment, nothing
owned is taken away.

---

## 8. Button hierarchy

| Tier | Size | Saturation | Glow | Rule |
|---|---|---|---|---|
| **Primary** | Largest | Brightest, decisive CTA hue | Glow 2–3, pulsing | exactly one per screen; wins the 0.5 s test |
| **Secondary** | Smaller | Calmer / less saturated than primary | Glow ≤1, subtle idle only | a tidy cluster; never a rainbow louder than primary |
| **Settings / utility** | Tiny | Muted | none | top corner; must NEVER compete for attention |

If a secondary set starts to rival the primary, quiet it (size/saturation/glow)
until the primary clearly wins.

---

## 9. Emotional design map

| Moment | Target emotion | How the UI delivers it |
|---|---|---|
| Opening the game | **Wonder** | living sky reveal, floating logo, gentle sound swell |
| Main Menu | **Comfort** | warm, uncrowded, one obvious PLAY, familiar rhythm |
| Gameplay | **Focus** | calm chrome, high-contrast pieces, minimal noise |
| Winning | **Celebration** | flash, particles, combo escalation, camera pop |
| Unlock | **Excitement** | full reward window, rays, Hero spring, dragon reaction |
| Collection | **Pride** | filling sets, "almost there", satisfying ticks |
| Returning tomorrow | **Curiosity** | streak, ready-badges, "something new every 10 levels" |

---

## 10. Per-screen justification checklist (ship-gate)

For **every** screen, before approval, fill this out; any "no"/blank ⇒ redesign:

- [ ] Every element has an **attention rank 1–5** (§1); nothing unranked.
- [ ] The **2-second** three questions are answered (§2).
- [ ] Exactly **one hero** wins the **0.5-second** test (§3).
- [ ] Primary action is in the **thumb arc**; gaps ≥ M; targets ≥ 96 (§4).
- [ ] Non-objective elements are **quieted** (§5).
- [ ] No element is pure decoration or a **duplicate** without reason (§6).
- [ ] Any reward uses the **earned sequence** (§7).
- [ ] **Button hierarchy** holds: one primary, calmer secondary, tiny utility (§8).
- [ ] The intended **emotion** (§9) is legible in the first glance.

---

## Appendix A — Worked audit: Main Menu (current build)

The live Main Menu run through this playbook:

**Eye-path (§1):** ① Logo "COSMIC DRIFT" (where am I) → ② **PLAY** (primary) →
③ bottom reward cards (Daily "READY!") → ④ resource counters / level (progress)
→ ⑤ secondary nav tiles. Matches the required order. ✅

**2-second (§2):** *Where* = branded logo; *What* = giant green PLAY; *Reward* =
Daily Reward card badged "READY!". All three answerable. ✅

**0.5-second hero (§3):** PLAY wins on every signal — largest control, only
pulsing glow (Glow 3), warm green against a cool sky, isolated in its own band,
plus a 5 s sparkle. No second element pulses or glows at that strength. ✅

**Touch (§4):** PLAY sits in the lower-center thumb arc; Settings is a tiny
top-right utility; nav tiles are 210 with 32/28 gaps; cards are large. ✅

**Focus / hierarchy (§5, §8):** PLAY is primary; nav tiles are a tidy secondary
cluster with only subtle idle float (no strong glow); Settings gear is muted and
corner-parked. ✅

**Finding (§6 — flagged, not yet changed):** **Settings appears twice** — a
top-right gear *and* a Settings tile in the 2×3 grid. That is a duplicate
affordance with no added value. The top-right gear is the canonical, convention-
correct entry; the grid's Settings tile is the redundant one. Recommended fix:
replace the grid tile with a distinct high-value destination (e.g., a "Friends",
"News", or "Rewards" hub) so all six tiles earn their place. *Not changed
unilaterally because a prior explicit spec listed Settings in the grid — awaiting
your call.*

**Verdict:** Passes the ship-gate except the flagged duplicate, which is a
recommendation pending approval.

---

## Governance

Every future screen is built, then run through the AAA review pipeline **and**
this checklist. A screen that cannot justify every pixel is redesigned before it
is ever presented. The interface must guide the player without conscious thought.
