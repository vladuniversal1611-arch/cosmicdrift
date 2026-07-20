/**
 * Random.js
 * -----------------------------------------------------------------------------
 * A small, seedable pseudo-random number generator (mulberry32).
 *
 * Determinism matters for a puzzle game: daily challenges, replays and
 * reproducible bug reports all require that the same seed yields the same
 * sequence. Never call Math.random() directly in gameplay code — go through
 * an instance of this class instead.
 * -----------------------------------------------------------------------------
 */
export class Random {
  /**
   * @param {number} [seed] 32-bit unsigned seed. If omitted, a time-based
   *                        seed is used (non-deterministic).
   */
  constructor(seed) {
    this.seed(seed ?? (Date.now() >>> 0));
  }

  /** Reset the generator to a specific seed. */
  seed(seed) {
    this._state = seed >>> 0;
    return this;
  }

  /** Next float in [0, 1). */
  next() {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min, max) { return min + this.next() * (max - min); }

  /** Integer in [min, max] inclusive. */
  int(min, max) { return Math.floor(this.range(min, max + 1)); }

  /** Return a random element of `arr`. */
  pick(arr) { return arr[this.int(0, arr.length - 1)]; }

  /** True with probability `p` (0..1). */
  chance(p) { return this.next() < p; }
}
