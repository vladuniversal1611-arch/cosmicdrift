/**
 * AuthoredLevels.js
 * -----------------------------------------------------------------------------
 * A hand-tuned opening — the "first-hour hook". The procedural generator is
 * great for depth, but the very first levels decide whether a player stays, so
 * these are authored deliberately: dead-simple to start, one new idea at a time,
 * a gentle difficulty ramp. Beyond the authored range the game falls back to the
 * procedural world/mechanic progression.
 *
 * Each entry (keyed by level number) may specify:
 *   objectives  explicit [{ id, goal }] for this level (overrides the random set)
 *   tiles       explicit tile placements [{ type, col, row }] (defaults to none)
 *   drift       false to keep the board static this level (defaults to on)
 *
 * Level 1 is intentionally the calmest possible board: no drift, no special
 * tiles, just "place pieces" so the core interaction is learned first.
 * -----------------------------------------------------------------------------
 */
export const AuthoredLevels = Object.freeze({
  1: { objectives: [{ id: 'clearLines', goal: 2 }] },       // learn: place AND clear (not just place a few pieces)
  2: { objectives: [{ id: 'clearLines', goal: 4 }] },       // reinforce
  3: { objectives: [{ id: 'clearLines', goal: 5 }] },       // reinforce
  4: { objectives: [{ id: 'clearLines', goal: 6 }, { id: 'collectEnergy', goal: 24 }] }, // two goals
  5: { objectives: [{ id: 'collectEnergy', goal: 30 }] },   // breather
  6: { objectives: [{ id: 'clearLines', goal: 7 }] },       // ramp
});

/** True while the hand-authored opening is in effect for `level`. */
export function isAuthored(level) { return level in AuthoredLevels; }
