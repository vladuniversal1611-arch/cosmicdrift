/**
 * Grid.js
 * -----------------------------------------------------------------------------
 * The board's data model: a 2D array of Cells plus the geometry that maps
 * between grid coordinates (col/row) and logical screen coordinates (px).
 *
 * This class is pure model + geometry — it has no notion of pieces, matching or
 * scoring. That separation lets the BoardSystem, PieceSystem and future rule
 * systems all share one authoritative grid without stepping on each other.
 * -----------------------------------------------------------------------------
 */
import { Cell } from './Cell.js';
import { Rect } from '../../utils/Rect.js';

export class Grid {
  /**
   * @param {number} columns
   * @param {number} rows
   */
  constructor(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    /** @type {Cell[][]} indexed [row][col]. */
    this.cells = [];
    for (let r = 0; r < rows; r++) {
      const rowArr = [];
      for (let c = 0; c < columns; c++) rowArr.push(new Cell(c, r));
      this.cells.push(rowArr);
    }

    // Geometry, filled in by layout().
    this.bounds = new Rect();
    this.cellSize = 0;
    this.gutter = 0;
  }

  /**
   * Compute pixel geometry to fit the grid inside `area` (a Rect in logical
   * px), centring it and choosing the largest square cell size that fits.
   * @param {Rect} area
   * @param {number} gutter Gap between cells in logical px.
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
      x: this.bounds.x + col * (this.cellSize + this.gutter),
      y: this.bounds.y + row * (this.cellSize + this.gutter),
    };
  }

  /**
   * Map a logical point to a cell coordinate, or null if outside the grid.
   * @returns {{col:number,row:number}|null}
   */
  pixelToCell(px, py) {
    if (!this.bounds.contains(px, py)) return null;
    const stride = this.cellSize + this.gutter;
    const col = Math.floor((px - this.bounds.x) / stride);
    const row = Math.floor((py - this.bounds.y) / stride);
    if (col < 0 || col >= this.columns || row < 0 || row >= this.rows) return null;
    return { col, row };
  }

  /** Bounds-checked cell accessor. */
  get(col, row) {
    if (col < 0 || col >= this.columns || row < 0 || row >= this.rows) return null;
    return this.cells[row][col];
  }

  /** Run a callback for every cell. */
  forEach(fn) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) fn(this.cells[r][c], c, r);
    }
  }

  /** Empty every cell. */
  clear() {
    this.forEach((cell) => cell.clear());
  }

  /** Serialise occupancy for the SaveSystem. */
  serialize() {
    return this.cells.map((row) => row.map((cell) => cell.serialize()));
  }

  /** Restore occupancy from serialised data. */
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
