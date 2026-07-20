/**
 * PieceFactory.js
 * -----------------------------------------------------------------------------
 * Creates Piece instances from the Shapes catalogue. Centralising creation
 * keeps randomness deterministic (it takes a seeded Random) and gives future
 * difficulty/event systems one hook to bias which shapes and colours appear.
 * -----------------------------------------------------------------------------
 */
import { Piece } from './Piece.js';
import { Shapes, ShapeKeys } from './Shapes.js';
import { MaterialKeys } from '../../config/Palette.js';

export class PieceFactory {
  /**
   * @param {import('../../utils/Random.js').Random} rng Seeded RNG for
   *        reproducible piece sequences (daily challenges, replays).
   */
  constructor(rng) {
    this.rng = rng;
    // Precompute the weighted selection table once.
    this._weighted = [];
    for (const key of ShapeKeys) {
      const w = Shapes[key].weight ?? 1;
      for (let i = 0; i < w; i++) this._weighted.push(key);
    }
  }

  /** Create a piece of a specific shape and (optional) material. */
  create(shapeKey, materialKey = null) {
    const def = Shapes[shapeKey];
    if (!def) throw new Error(`Unknown shape "${shapeKey}"`);
    const material = materialKey ?? this.rng.pick(MaterialKeys);
    // Clone the blocks so instances never share the catalogue arrays.
    const blocks = def.blocks.map((b) => [b[0], b[1]]);
    return new Piece(shapeKey, blocks, material);
  }

  /** Create a weighted-random piece with a random material. */
  createRandom() {
    return this.create(this.rng.pick(this._weighted));
  }

  /** Create a batch of `n` random pieces (e.g. to refill a tray). */
  createBatch(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(this.createRandom());
    return out;
  }
}
