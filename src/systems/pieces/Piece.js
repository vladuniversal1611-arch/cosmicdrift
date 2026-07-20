/**
 * Piece.js
 * -----------------------------------------------------------------------------
 * A placeable shape instance: its block layout, colour family and current
 * position/scale for rendering and dragging. This is a model + self-render unit;
 * it knows how to draw itself given a cell size, but placement rules (can it go
 * here? does it clear a line?) live outside, in gameplay systems added later.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';

export class Piece {
  /**
   * @param {string} shapeKey  Key into the Shapes catalogue.
   * @param {number[][]} blocks Array of [col,row] offsets.
   * @param {string} colorKey  Key into Palette.pieces.
   */
  constructor(shapeKey, blocks, colorKey) {
    this.shapeKey = shapeKey;
    this.blocks = blocks;
    this.colorKey = colorKey;

    // Bounding box in cells.
    this.width = Math.max(...blocks.map((b) => b[0])) + 1;
    this.height = Math.max(...blocks.map((b) => b[1])) + 1;

    // Transient render/interaction state.
    this.x = 0;          // logical px (top-left of bounding box)
    this.y = 0;
    this.scale = 1;      // used for tray vs. drag sizing and pop animations
    this.dragging = false;
  }

  /** Number of blocks — used for scoring hooks later. */
  get blockCount() { return this.blocks.length; }

  /**
   * Draw the piece at (this.x, this.y) using `cellSize` logical px per block.
   * Pure presentation; callers set position/scale beforehand.
   */
  render(renderer, cellSize) {
    const color = Palette.pieces[this.colorKey] ?? Palette.pieces.nebula;
    const size = cellSize * this.scale;
    const r = Config.board.cellRadius * this.scale;
    for (const [bc, br] of this.blocks) {
      const bx = this.x + bc * size;
      const by = this.y + br * size;
      renderer.withGlow(color.glow, 10 * this.scale, () => {
        renderer.fillRoundRect(bx + 1, by + 1, size - 2, size - 2, r, color.fill);
      });
    }
  }
}
