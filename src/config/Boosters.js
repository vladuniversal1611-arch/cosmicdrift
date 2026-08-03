/**
 * Boosters.js
 * -----------------------------------------------------------------------------
 * In-level power-ups. Each is a limited-count help the player triggers for a
 * "clutch" moment — additive to the core rules (never required, never changes
 * balance). `target: 'cell'` boosters arm and then apply to a tapped board cell;
 * `target: 'none'` apply immediately.
 * -----------------------------------------------------------------------------
 */
export const Boosters = Object.freeze([
  { id: 'hammer', name: 'Hammer', target: 'cell', desc: 'Smash a single block', start: 3 },
  { id: 'bomb', name: 'Bomb', target: 'cell', desc: 'Blast a 3×3 area', start: 2 },
  { id: 'shuffle', name: 'Shuffle', target: 'none', desc: 'Get a fresh set of pieces', start: 3 },
]);

export const BoosterById = Object.freeze(Object.fromEntries(Boosters.map((b) => [b.id, b])));
