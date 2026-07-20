/**
 * Piece.js
 * -----------------------------------------------------------------------------
 * A placeable magical relic: a small cluster of crystal blocks carved from one
 * material. Holds its layout, material and transient render/interaction state
 * (position, scale, drag). It knows how to draw itself as faceted crystal with
 * an idle glow pulse; placement rules and clearing live in the board/grid.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';
import { drawCrystal } from '../../render/Crystal.js';

export class Piece {
  /**
   * @param {string} shapeKey    Key into the Shapes catalogue.
   * @param {number[][]} blocks   Array of [col,row] offsets.
   * @param {string} materialKey  Key into Palette.materials.
   */
  constructor(shapeKey, blocks, materialKey) {
    this.shapeKey = shapeKey;
    this.blocks = blocks;
    this.materialKey = materialKey;

    // Bounding box in cells.
    this.width = Math.max(...blocks.map((b) => b[0])) + 1;
    this.height = Math.max(...blocks.map((b) => b[1])) + 1;

    // Transient render/interaction state (logical px).
    this.x = 0;
    this.y = 0;
    this.scale = 1;        // eased between tray size and full board size
    this.dragging = false;
    /** Invalid-drop shake amplitude (px); tweened back to 0 by the system. */
    this.shake = 0;
    /** Home position/scale in the tray, to spring back to on invalid drops. */
    this.homeX = 0;
    this.homeY = 0;
    this.homeScale = 1;
    /** Per-piece idle-glow phase so relics don't pulse in unison. */
    this.glowPhase = Math.random() * Math.PI * 2;
  }

  get material() { return Palette.materials[this.materialKey]; }
  get blockCount() { return this.blocks.length; }

  /** Remember the current transform as the tray "home". */
  storeHome() {
    this.homeX = this.x;
    this.homeY = this.y;
    this.homeScale = this.scale;
  }

  /**
   * Draw the relic at (this.x, this.y) using `cellSize` logical px per block.
   * `time` drives the idle glow pulse and the invalid-drop shake.
   */
  render(renderer, cellSize, time = 0) {
    const size = cellSize * this.scale;
    const period = Config.fx.idleGlowPeriod;
    const pulse = 0.5 + 0.32 * Math.sin((time / period) * Math.PI * 2 + this.glowPhase);
    // Held relics glow noticeably hotter than resting ones.
    const glow = this.dragging ? 0.9 + 0.2 * pulse : 0.45 + 0.35 * pulse;
    // Fast horizontal jitter while a rejected relic springs home.
    const shakeX = this.shake ? Math.sin(time * 46) * this.shake : 0;

    for (const [bc, br] of this.blocks) {
      const bx = this.x + bc * size + shakeX;
      const by = this.y + br * size;
      drawCrystal(renderer, bx, by, size, this.material, {
        glow,
        radius: Config.board.cellRadius * this.scale,
      });
    }
  }
}
