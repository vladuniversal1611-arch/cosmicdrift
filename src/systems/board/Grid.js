/**
 * Grid.js
 * -----------------------------------------------------------------------------
 * The board's data model: a 2D array of Cells, the geometry that maps between
 * grid coordinates and logical screen coordinates, and the pure placement /
 * line-detection rules that gameplay is built on.
 *
 * "Rules" here are deliberately pure and side-effect-light so they are trivial
 * to reason about and test: can a piece fit? which lines are full? Animation
 * and scoring live in the systems that call these.
 * -----------------------------------------------------------------------------
 */
import { Cell } from './Cell.js';
import { Rect } from '../../utils/Rect.js';
import { Random } from '../../utils/Random.js';
import { RUNE_COUNT } from './Runes.js';

export class Grid {
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;

    // Stable per-cell rune + idle phase, seeded so the artifact looks the same
    // every session (part of its "identity") but still varied cell-to-cell.
    const rng = new Random(0xC0FFEE);
    /** @type {Cell[][]} indexed [row][col]. */
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      const rowArr = [];
      for (let c = 0; c < columns; c++) {
        rowArr.push(new Cell(c, r, rng.int(0, RUNE_COUNT - 1), rng.range(0, Math.PI * 2)));
      }
      this.cells.push(rowArr);
    }

    // Geometry, filled in by layout().
    this.bounds = new Rect();
    this.cellSize = 0;
    this.gutter = 0;
  }

  /** Distance between adjacent cell origins. */
  get stride() { return this.cellSize + this.gutter; }

  /**
   * Compute pixel geometry to fit the grid inside `area`, centring it and
   * choosing the largest square cell size that fits.
   */
  layout(area, gutter) {
    this.gutter = gutter;
    const usableW = area.w - gutter * (this.columns - 1);
    const usableH = area.h - gutter * (this.rows - 1);
    this.cellSize = Math.floor(Math.min(usableW / this.columns, usableH / this.rows));

    const gridW = this.cellSize * this.columns + gutter * (this.columns - 1);
    const gridH = this.cellSize * this.rows + gutter * (this.rows - 1);
    this.bounds.set(
      area.x + (area.w - gridW) * 0.5,
      area.y + (area.h - gridH) * 0.5,
      gridW,
      gridH,
    );
  }

  /** Top-left logical position of a cell. */
  cellToPixel(col, row) {
    return {
      x: this.bounds.x + col * this.stride,
      y: this.bounds.y + row * this.stride,
    };
  }

  /** Centre logical position of a cell. */
  cellCenter(col, row) {
    const p = this.cellToPixel(col, row);
    return { x: p.x + this.cellSize * 0.5, y: p.y + this.cellSize * 0.5 };
  }

  /** Map a logical point to a cell, or null if outside the grid. */
  pixelToCell(px, py) {
    if (!this.bounds.contains(px, py)) return null;
    const col = Math.floor((px - this.bounds.x) / this.stride);
    const row = Math.floor((py - this.bounds.y) / this.stride);
    return this.inRange(col, row) ? { col, row } : null;
  }

  inRange(col, row) {
    return col >= 0 && col < this.columns && row >= 0 && row < this.rows;
  }

  get(col, row) {
    return this.inRange(col, row) ? this.cells[row][col] : null;
  }

  // --- Placement rules -------------------------------------------------------

  /**
   * Can `piece` be placed with its bounding-box origin at (col,row)?
   * Every block must be in range and land on an empty, non-clearing cell.
   */
  canPlace(piece, col, row) {
    for (const [bc, br] of piece.blocks) {
      const cell = this.get(col + bc, row + br);
      if (!cell || cell.filled || cell.isClearing) return false;
      // Living Board: some tiles (frozen, corruption, tree, fog) block placement.
      if (cell.tile && cell.tile.blocksPlacement) return false;
    }
    return true;
  }

  /**
   * Place `piece` at (col,row), filling cells with its material and starting
   * each cell's landing animation. Returns the list of affected cells.
   * Caller must have validated with canPlace first.
   */
  place(piece, col, row, landDuration) {
    const filled = [];
    for (const [bc, br] of piece.blocks) {
      let cell = this.get(col + bc, row + br);
      // Living Board: a tile may redirect where this block actually lands
      // (Portal tiles teleport the block to their linked partner cell).
      const redirect = cell.tile && cell.tile.redirectPlacement(cell, this);
      if (redirect) cell = redirect;
      cell.fill(piece.materialKey, landDuration);
      filled.push(cell);
    }
    return filled;
  }

  /** Is there any (col,row) at which `piece` fits? Used for game-over checks. */
  canPlaceAnywhere(piece) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        if (this.canPlace(piece, c, r)) return true;
      }
    }
    return false;
  }

  // --- Line detection --------------------------------------------------------

  /**
   * Find every fully-filled row and column. Returns lines as ordered cell
   * arrays so the clear animation can travel along each one; the flat `cells`
   * set is the union (a cell shared by a row+column clears once).
   * @returns {{ lines: Cell[][], cells: Set<Cell> }}
   */
  findFullLines() {
    const lines = [];
    const cells = new Set();

    for (let r = 0; r < this.rows; r++) {
      if (this.cells[r].every((cell) => cell.filled && !cell.isClearing)) {
        const line = this.cells[r].slice();
        lines.push(line);
        line.forEach((cell) => cells.add(cell));
      }
    }
    for (let c = 0; c < this.columns; c++) {
      let full = true;
      const line = [];
      for (let r = 0; r < this.rows; r++) {
        const cell = this.cells[r][c];
        line.push(cell);
        if (!cell.filled || cell.isClearing) { full = false; break; }
      }
      if (full) {
        lines.push(line);
        line.forEach((cell) => cells.add(cell));
      }
    }
    return { lines, cells };
  }

  clearAll() { this.forEach((cell) => cell.clear()); }

  forEach(fn) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) fn(this.cells[r][c], c, r);
    }
  }

  // --- Persistence -----------------------------------------------------------
  serialize() {
    return this.cells.map((row) => row.map((cell) => cell.serialize()));
  }

  deserialize(data) {
    if (!Array.isArray(data)) return;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        const key = data[r]?.[c] ?? null;
        if (key) this.cells[r][c].fill(key);
        else this.cells[r][c].clear();
      }
    }
  }
}
