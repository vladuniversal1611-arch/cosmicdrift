# Cosmic Drift — Feature Pack Process (mandatory)

**Status:** MANDATORY. From here on the project is in **Feature Pack
Development**. No random features. Every new feature is a **production-ready,
independent module** delivered as a Feature Pack that satisfies the 10 sections
below before it is called complete.

**How this composes with the other docs (no duplication):**
- **This doc** = the *packaging & acceptance standard* (what a finished feature
  must contain and pass).
- **`ENGINEERING_WORKFLOW.md`** = the *how-to* (the 7 phases you execute to
  produce a pack). Feature Pack §1–2 ≈ Phases 1–2; §3–4 ≈ Phase 3; §5 ≈ Phase 4;
  §6 ≈ Phases 5+7; §7–8 ≈ Phase 6; §9–10 ≈ Phase 7 + final approval.
- **Design authorities** — `VISUAL_IDENTITY_BIBLE` › `DESIGN_BIBLE` ›
  `DESIGN_SYSTEM` › `UX_PSYCHOLOGY` — are the review targets in §9.
- **AAA UI pipeline** (scores ≥ 9.5 + 2 s/0.5 s gates) is part of §9–10.

---

## The 10 required sections

1. **Purpose** — why it exists, the player problem it solves, how it improves the
   experience.
2. **Dependencies** — files affected · systems affected (events in/out,
   `SystemManager` order) · UI components affected · **save-system impact** (new
   slices, migration) · performance impact.
3. **Design Specification** — the complete UX: every interaction, every
   animation, every sound hook, and the visual hierarchy (per `UX_PSYCHOLOGY`).
4. **Technical Specification** — classes · managers · objects · events · data
   flow · public APIs · **future expansion points**.
5. **Implementation** — production quality only. **No temporary code, no `TODO`
   comments, no placeholder assets, no hacks.**
6. **Optimization** — memory · CPU · rendering · object pooling · animation
   batching (respect the 60 FPS budget and `Quality`).
7. **Testing** — unit (headless) · gameplay · stress · edge cases · device
   compatibility (phone + tablet portrait), verified headless + Chromium.
8. **QA Checklist** — nothing overlaps · nothing flickers · nothing blocks input
   · everything scales · animations never interrupt gameplay.
9. **Art Review** — pass Visual Identity Bible · Design System · Art Direction ·
   UI Bible; run the AAA UI review pipeline.
10. **Final Approval** — NOT complete until **Gameplay · UI · Performance ·
    Animation · Audio · Accessibility · Code Quality** all pass review.

---

## Global rule — independence

Every Feature Pack is **self-contained and additive**. It communicates through
the EventBus and `SaveSystem` slices, never by reaching into another system's
internals. A future update must be able to add, change or remove a pack **without
rewriting previous systems.** Feature flags (`Config.features`) gate optional
packs. Removing a pack must leave the game running.

Acceptance gate: independence proven (pack can be feature-flagged off and the
game still boots clean), backward-compatible save, and every §10 category green.

---

## Feature Pack template (copy per feature → `docs/packs/PACK_<name>.md`)

```md
# Feature Pack: <Name>

## 1. Purpose
- Problem / why / player benefit:

## 2. Dependencies
- Files (modify / create):
- Files that must NOT be touched:
- Systems affected (events in / out, registration order):
- UI components affected:
- Save impact (slices, schemaVersion/migration):
- Performance impact:

## 3. Design Specification
- UX flow:
- Interactions:
- Animations (duration / easing / delay per DESIGN_SYSTEM §10):
- Sound hooks:
- Visual hierarchy (eye-path, hero, 2s/0.5s per UX_PSYCHOLOGY):

## 4. Technical Specification
- Classes / managers / objects:
- Events (emitted / listened):
- Data flow:
- Public API:
- Future expansion points:

## 5. Implementation notes
- (production-quality; no TODO/placeholder/hacks)

## 6. Optimization
- Memory / CPU / rendering / pooling / batching:

## 7. Testing
- Unit / gameplay / stress / edge cases / devices:

## 8. QA checklist
- [ ] no overlap  [ ] no flicker  [ ] no input block
- [ ] scales (phone+tablet)  [ ] never interrupts gameplay

## 9. Art review
- [ ] Visual Identity Bible  [ ] Design System  [ ] Art Direction  [ ] UI Bible
- [ ] AAA pipeline: all categories ≥ 9.5

## 10. Final approval
- [ ] Gameplay  [ ] UI  [ ] Performance  [ ] Animation
- [ ] Audio  [ ] Accessibility  [ ] Code Quality
- [ ] Independence proven (flag off → game still boots)  [ ] Save back-compat
```

Think like a AAA mobile studio: modular, scalable, additive, and never "good
enough" — only shipped when every gate is green.
