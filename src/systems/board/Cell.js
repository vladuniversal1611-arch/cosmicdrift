/**
 * Cell.js
 * -----------------------------------------------------------------------------
 * A single board cell. Holds only state (occupancy + which piece colour fills
 * it) — never rendering or rules. Concrete gameplay meaning is layered on top
 * by future updates; the foundation just needs a clear, serialisable unit.
 * -----------------------------------------------------------------------------
 */
export class Cell {
  /**
   * @param {number} col Column index (0-based).
   * @param {number} row Row index (0-based).
   */
  constructor(col, row) {
    this.col = col;
    this.row = row;
    /** True when a piece block occupies this cell. */
    this.filled = false;
    /** Colour family key (see Palette.pieces) when filled, else null. */
    this.colorKey = null;
  }

  /** Fill the cell with a colour family. */
  fill(colorKey) {
    this.filled = true;
    this.colorKey = colorKey;
  }

  /** Empty the cell. */
  clear() {
    this.filled = false;
    this.colorKey = null;
  }

  /** Compact form for the SaveSystem. */
  serialize() {
    return this.filled ? this.colorKey : null;
  }
}
