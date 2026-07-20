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

  duo: { blocks: [[0, 0], [1, 0]], weight: 8 },
  trio: { blocks: [[0, 0], [1, 0], [2, 0]], weight: 7 },
  quad: { blocks: [[0, 0], [1, 0], [2, 0], [3, 0]], weight: 4 },

  square: { blocks: [[0, 0], [1, 0], [0, 1], [1, 1]], weight: 6 },

  lShape: { blocks: [[0, 0], [0, 1], [1, 1]], weight: 5 },
  jShape: { blocks: [[1, 0], [1, 1], [0, 1]], weight: 5 },
  tShape: { blocks: [[0, 0], [1, 0], [2, 0], [1, 1]], weight: 4 },
  sShape: { blocks: [[1, 0], [2, 0], [0, 1], [1, 1]], weight: 3 },

  bigL: { blocks: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], weight: 2 },
  cross: { blocks: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], weight: 2 },
});

/** Flat list of shape keys, for convenient iteration. */
export const ShapeKeys = Object.freeze(Object.keys(Shapes));
