# Cosmic Drift — Engineering Workflow (mandatory)

**Status:** MANDATORY for every feature, system and non-trivial change.
**Rule zero:** never jump straight to code. Work through the phases below, in
order, thinking like the Technical Director of a AAA live mobile game. The
codebase must stay scalable enough for years of updates.

This process wraps the design authorities (`VISUAL_IDENTITY_BIBLE.md`,
`DESIGN_BIBLE.md`, `DESIGN_SYSTEM.md`, `UX_PSYCHOLOGY.md`) and the AAA UI review
pipeline (build → art-director scores ≥ 9.5 → editor lens), which run *inside*
Phases 5–7 for anything with UI.

---

## Phase 1 — Understand (no code)
Before touching anything, write:
- **What** is being built (scope, boundaries, out-of-scope).
- **Why** it exists (player/product reason).
- **How** it improves the player experience (the felt benefit).
- **Which existing systems it affects** — name them (EventBus events consumed/
  emitted, `SystemManager` registration/order, other systems queried).
- **Which files will be modified / created.**
- **Which files must NOT be touched** (stable contracts, unrelated systems).

Deliverable: a short written brief. Do not proceed until it is clear.

## Phase 2 — Risk analysis (no code)
Enumerate risks; each gets a concrete mitigation:
- **Bugs / logic** — init ordering (defer cross-system talk to `game:ready` /
  microtask), event races, null systems (optional-chain `getSystem`).
- **UI conflicts** — screen-stack/z-order overlaps, modal focus, input routing
  (tap vs drag), badge/state desync.
- **Performance** — per-frame allocation (pool via `ObjectPool`), gradient/glow
  cost, particle counts vs `Quality.maxParticles`, 60 FPS budget.
- **Save compatibility** — new `registerSlice` defaults, `schemaVersion`
  migration, backup-slot safety, never break old documents.
- **Animation conflicts** — competing tweens on one property, celebration vs
  input, `Quality.animationScale` / Reduced Motion.
- **Mobile scaling** — author in 1080×2400 logical space; respect safe area;
  verify phone *and* tablet portrait; ≥ 96 vpx touch targets.
- **Maintenance / scalability** — data-driven config over hard-coding, no hidden
  coupling (talk via events), clear ownership of state.

## Phase 3 — Implementation plan (approve before coding)
Break into small, ordered, independently-verifiable steps, e.g.:
1. **Data** (config/registry, tokens) 2. **Logic** (a `System`, pure/testable)
3. **Rendering** 4. **Animation** 5. **Audio** (hooks) 6. **Save** (slice +
migration) 7. **Optimization** (pool, cull, quality flags) 8. **Testing**.
Only after the plan is agreed does coding begin.

## Phase 4 — Implementation
Production quality only. **No shortcuts, no placeholder logic, no temporary
hacks.** Follow house style: systems extend `System` and use `listen()` for
auto-cleanup; cross-system comms via the EventBus; state persisted through
`SaveSystem` slices; visuals read design tokens; localized strings via `t()`;
respect `Quality`. Comment the "why", match surrounding code.

## Phase 5 — Self review
Re-read the diff as a reviewer. Check: **readability, performance (frame budget /
allocation), maintainability, scalability, code duplication, memory usage
(pools, listener teardown in `onDestroy`/`onExit`).** Remove anything unjustified.

## Phase 6 — QA (adversarial)
Test as the QA team would, and verify (headless Node DOM-shim harness + Chromium
via Playwright, checking console errors + FPS):
- **Fast / slow / spam tapping**, double-fire, tap-during-animation.
- **Low FPS** (fixed-timestep determinism; Low-Performance mode).
- **Screen resize** / different aspect ratios (phone + tablet portrait).
- **Restart game · lose · win**, mid-run state transitions.
- **Resume from background** (visibility change, audio resume, save flush).
- **Rotate device** (future landscape support — no crashes now).
- **Corrupted save** (primary corrupt → backup recovery → fresh doc).
- **Interrupted animations** (navigate away mid-tween; no leaks/stuck state).

## Phase 7 — Polish
Final pass on **animations, particles, UI transitions, timing, visual
consistency (all four design docs), and performance.** Confirm the feeling
matches the intended player emotion. For UI, run the AAA review pipeline until
every category ≥ 9.5 and the 2 s / 0.5 s psychology gates pass.

---

## Final rule
Never skip a phase. Never jump to code. Every change leaves the codebase more
scalable than it found it. Verified (headless + browser, 60 FPS, no console
errors), then committed with a clear message and pushed.
