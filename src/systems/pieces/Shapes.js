/**
 * Shapes.js
 * -----------------------------------------------------------------------------
 * Data-only catalogue of piece shapes. Each shape is a list of [col,row] block
 * offsets relative to the piece origin (0,0 = top-left of its bounding box).
 *
 * Keeping shapes as pure data (not code) means designers can add, remove or
 * reweight pieces for events/difficulty without touching logic. The PieceSystem
 * and future spawn/difficulty systems read from this catalogue.
 *
 * `weight` biases random selection; higher = more common.
 * -----------------------------------------------------------------------------
 */
export const Shapes = Object.freeze({
  single: { blocks: [[0, 0]], weight: 6 },

  // Straight bars in BOTH orientations. The weights split each bar across
  // horizontal + vertical so overall bar frequency stays balanced but the tray
  // is no longer horizontal-only.
  duo: { blocks: [[0, 0], [1, 0]], weight: 4 },
  duoV: { blocks: [[0, 0], [0, 1]], weight: 4 },
  trio: { blocks: [[0, 0], [1, 0], [2, 0]], weight: 4 },
  trioV: { blocks: [[0, 0], [0, 1], [0, 2]], weight: 4 },
  quad: { blocks: [[0, 0], [1, 0], [2, 0], [3, 0]], weight: 2 },
  quadV: { blocks: [[0, 0], [0, 1], [0, 2], [0, 3]], weight: 2 },

  square: { blocks: [[0, 0], [1, 0], [0, 1], [1, 1]], weight: 6 },

  // Corner (L / J) pieces + their rotations for variety.
  lShape: { blocks: [[0, 0], [0, 1], [1, 1]], weight: 3 },
  lShapeR: { blocks: [[0, 0], [1, 0], [0, 1]], weight: 3 },
  jShape: { blocks: [[1, 0], [1, 1], [0, 1]], weight: 3 },
  jShapeR: { blocks: [[0, 0], [1, 0], [1, 1]], weight: 3 },

  // T pieces, horizontal + vertical.
  tShape: { blocks: [[0, 0], [1, 0], [2, 0], [1, 1]], weight: 3 },
  tShapeV: { blocks: [[1, 0], [0, 1], [1, 1], [1, 2]], weight: 3 },

  // S / Z pieces, horizontal + vertical.
  sShape: { blocks: [[1, 0], [2, 0], [0, 1], [1, 1]], weight: 2 },
  sShapeV: { blocks: [[0, 0], [0, 1], [1, 1], [1, 2]], weight: 2 },
  zShape: { blocks: [[0, 0], [1, 0], [1, 1], [2, 1]], weight: 2 },
  zShapeV: { blocks: [[1, 0], [0, 1], [1, 1], [0, 2]], weight: 2 },

  // Big showpieces (both diagonals) + the plus.
  bigL: { blocks: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], weight: 2 },
  bigJ: { blocks: [[2, 0], [2, 1], [2, 2], [1, 2], [0, 2]], weight: 2 },
  cross: { blocks: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], weight: 2 },
});

/** Flat list of shape keys, for convenient iteration. */
export const ShapeKeys = Object.freeze(Object.keys(Shapes));
