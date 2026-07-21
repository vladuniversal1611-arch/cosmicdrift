/**
 * Cell.js
 * -----------------------------------------------------------------------------
 * A single board cell: occupancy + the transient animation state that makes the
 * board feel alive. Rules (what can go where) live elsewhere; this holds only
 * state and small self-contained timers advanced by the BoardSystem.
 *
 * Animation channels:
 *   place   — squash/pop when a crystal lands (0..1, eased on read)
 *   clear   — ignite→burst timeline when a line clears (0 = idle, >0 running)
 *   phase   — per-cell offset so idle motes/runes don't pulse in lockstep
 * -----------------------------------------------------------------------------
 */
export class Cell {
  /**
   * @param {number} col Column index (0-based).
   * @param {number} row Row index (0-based).
   * @param {number} runeId Which engraved glyph this socket carries.
   * @param {number} phase  Idle-animation phase offset (radians).
   */
  constructor(col, row, runeId = 0, phase = 0) {
    this.col = col;
    this.row = row;
    this.runeId = runeId;
    this.phase = phase;

    /**
     * The Living Board tile occupying this slot (terrain), or null for plain
     * Ancient Stone. Set/managed by the TileSystem; it persists across crystal
     * clears (clearing a line empties the crystal, not the tile beneath it).
     */
    this.tile = null;

    /**
     * The Structure this cell belongs to (Structure Patterns), or null. Set by
     * the StructureSystem when placed crystals form a recognised shape; the
     * cell stays `filled` while it's part of a structure.
     */
    this.structure = null;

    /** True when a crystal block occupies this cell. */
    this.filled = false;
    /** Material key (see Palette.materials) when filled, else null. */
    this.materialKey = null;

    // --- Animation state ---
    /** Landing animation progress, seconds (counts up, then rests). */
    this.placeT = 0;
    this.placeDur = 0;      // 0 when no landing animation active
    /** Clear animation: -1 idle; otherwise seconds since this cell ignited. */
    this.clearT = -1;
    this.clearDur = 0;
    /** Delay (s) before this cell ignites, for the travelling-energy wave. */
    this.clearDelay = 0;
    /** Retained material during the clear animation (drawn as it dissolves). */
    this.clearMaterial = null;
    /** One-shot guards so the burst/spark FX fire exactly once per clear. */
    this.igniteFired = false;
    this.sparkFired = false;
  }

  /** Fill with a material and kick off the landing animation. */
  fill(materialKey, landDuration = 0) {
    this.filled = true;
    this.materialKey = materialKey;
    this.placeDur = landDuration;
    this.placeT = 0;
  }

  /** Empty the cell and reset animation channels. */
  clear() {
    this.filled = false;
    this.materialKey = null;
    this.placeDur = 0;
    this.placeT = 0;
    this.clearT = -1;
    this.clearDur = 0;
    this.clearDelay = 0;
    this.clearMaterial = null;
    this.igniteFired = false;
    this.sparkFired = false;
  }

  /** True while a clear animation is scheduled or running. */
  get isClearing() { return this.clearT >= 0; }

  /**
   * Begin the clear timeline for this cell. It stays visually filled until the
   * wave reaches it (after `delay`), then ignites and dissolves over `dur`.
   */
  beginClear(delay, dur) {
    this.clearMaterial = this.materialKey;
    this.clearDelay = delay;
    this.clearT = 0;
    this.clearDur = dur;
    this.igniteFired = false;
    this.sparkFired = false;
  }

  /** Compact form for the SaveSystem. */
  serialize() {
    return this.filled ? this.materialKey : null;
  }
}
