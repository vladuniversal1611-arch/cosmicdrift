# Cosmic Drift — Production Pipeline Charter (mandatory)

**Status:** MANDATORY. The rules of engagement for all work. Sits above the
process docs and design authorities; when in doubt, this charter's clarification
rule wins over "just proceed".

Related: `FEATURE_PACK_PROCESS.md`, `ENGINEERING_WORKFLOW.md`,
`VISUAL_IDENTITY_BIBLE.md`, `DESIGN_BIBLE.md`, `DESIGN_SYSTEM.md`,
`UX_PSYCHOLOGY.md`.

---

## 0. No assumptions — clarification protocol
**Forbidden to invent solutions for unclear requirements.** When anything is
ambiguous, STOP and:
1. **State exactly what is unclear.**
2. **List all viable implementation options.**
3. **Give advantages / disadvantages of each.**
4. **Recommend the best option** (with reasoning).
5. **Wait for approval** before changing architecture.

Applies to architecture, gameplay, UI, balancing and data shape. Sensible,
reversible, in-file defaults may proceed *if noted*; anything structural,
outward-facing, or that touches a contract waits for approval.

## 1. Implementation rules (compatibility is sacred)
- Never rewrite an existing system unless the task requires it.
- Never rename a system/event/slice without a stated reason + migration.
- Never break backward compatibility (saves, event contracts, public APIs).
- Never **silently** change gameplay, UI or balancing — call out every such
  change explicitly and get sign-off.

## 2. Visual rules (the look is locked)
- Never redesign an existing screen unless requested.
- Never change colors, spacing, animation style, or button sizes off-hand.
- All visuals conform to: Visual Identity Bible · UI Bible · Design System · Art
  Direction. Changes to those tokens happen *in the docs first*, then in code.

## 3. Programming rules
- **One responsibility per class.** No giant files — split by concern.
- No duplicated logic (extract shared helpers).
- **No magic numbers** — name constants (config/tokens).
- Descriptive names; comment the *why* of non-obvious logic only.
- House style: extend `System`, `listen()` for auto-cleanup, EventBus for
  cross-system comms, `SaveSystem` slices for state, `t()` for strings, read
  `Quality` for perf/accessibility.

## 4. Player-experience gate
Before implementing anything, ask: **does this improve the player experience?**
If not, do not implement it. Features exist for players, not for the backlog.

## 5. Performance budget
Every feature justifies its CPU/GPU cost: **every particle system, animation,
update loop and event.** Rules: no per-frame allocation (pool it), cull
off-screen work, gate heavy passes behind `Quality`, hold 60 FPS on phone and
tablet portrait. If a cost isn't justified, cut or optimize it.

## 6. Final quality check (answer before finishing anything)
- Is the code **scalable**?
- Is the UI **consistent** (all four design docs)?
- Is the gameplay **fun**?
- Is **performance** still excellent (60 FPS, no leaks)?
- Would I **ship this to millions of players**?

Any "no" ⇒ improve it before calling the task done. Verified (headless +
Chromium, 60 FPS, no console errors), then committed and pushed.
