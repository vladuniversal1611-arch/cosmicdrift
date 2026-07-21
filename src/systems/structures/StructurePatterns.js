/**
 * StructurePatterns.js
 * -----------------------------------------------------------------------------
 * Data-only catalogue of the shapes that placed crystals can form, and the
 * magical structure each becomes. Everything about a structure type lives in
 * one entry here, so adding a future structure is a single object — no code
 * changes elsewhere. This is the modular heart of the Structure Patterns system.
 *
 * Each pattern lists its block offsets (normalised to the top-left). The four
 * rotations are generated automatically at load, so definitions stay tiny.
 *
 * Fields:
 *   id      unique key (matches Palette.structures)
 *   name    player-facing name shown in the build callout
 *   emblem  which centre glyph to draw (see Structure.js)
 *   cells   base block offsets [[col,row], ...]
 *   mult    permanent score-multiplier bonus added on completion
 *   energy  Dragon Energy granted on completion
 * -----------------------------------------------------------------------------
 */

/** Rotate an offset list 90° clockwise and re-normalise to (0,0). */
function rotate(cells) {
  const rot = cells.map(([x, y]) => [y, -x]);
  const minX = Math.min(...rot.map((c) => c[0]));
  const minY = Math.min(...rot.map((c) => c[1]));
  return rot.map(([x, y]) => [x - minX, y - minY]);
}

/** Unique rotations of a shape, keyed by a canonical string, up to 4. */
function rotations(cells) {
  const seen = new Map();
  let cur = cells.map(([x, y]) => [x, y]);
  for (let i = 0; i < 4; i++) {
    const key = cur.map((c) => c.join(',')).sort().join(';');
    if (!seen.has(key)) seen.set(key, cur);
    cur = rotate(cur);
  }
  return [...seen.values()];
}

const RAW = {
  // Order matters for detection: larger / rarer shapes are matched first so a
  // cross is never mistaken for the square hiding inside it.
  energyCore: {
    name: 'Energy Core', emblem: 'core', mult: 0.30, energy: 26,
    cells: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],   // plus / cross
  },
  dragonShrine: {
    name: 'Dragon Shrine', emblem: 'shrine', mult: 0.25, energy: 22,
    cells: [[0, 0], [1, 0], [2, 0], [1, 1]],           // T
  },
  towerFoundation: {
    name: 'Tower Foundation', emblem: 'tower', mult: 0.20, energy: 16,
    cells: [[0, 0], [0, 1], [0, 2], [1, 2]],           // L
  },
  bridge: {
    name: 'Bridge', emblem: 'bridge', mult: 0.20, energy: 16,
    cells: [[0, 0], [1, 0], [2, 0], [3, 0]],           // long line
  },
  magicCrystal: {
    name: 'Magic Crystal', emblem: 'crystal', mult: 0.15, energy: 14,
    cells: [[0, 0], [1, 0], [0, 1], [1, 1]],           // 2x2 square
  },
};

/** Detection-ordered list, each with precomputed rotations. */
export const StructurePatterns = Object.keys(RAW).map((id) => ({
  id,
  ...RAW[id],
  rotations: rotations(RAW[id].cells),
}));

/** Lookup by id, for metadata. */
export const StructureById = Object.freeze(
  Object.fromEntries(StructurePatterns.map((p) => [p.id, p])),
);
