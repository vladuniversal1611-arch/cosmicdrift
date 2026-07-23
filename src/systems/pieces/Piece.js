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
import { Easing } from '../../utils/Easing.js';

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
    /** Tilt (radians) following finger movement while dragging. */
    this.tilt = 0;
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
    const ctx = renderer.ctx;
    const radius = Config.board.cellRadius * this.scale;

    // Intro pop-in (back-ease overshoot) + gentle idle breathing while resting.
    // Both are purely visual: `this.scale` (used for hit-testing) is untouched.
    const appear = Math.max(0, Math.min(1, this._appear ?? 1));
    const introEase = Easing.backOut(appear);
    const breathe = this.dragging ? 1 : 1 + 0.02 * Math.sin(time * 2 + this.glowPhase);
    const vis = introEase * breathe;

    // Tilt the held relic toward finger movement, pivoting on its centre.
    const tilt = this.dragging ? this.tilt : 0;
    const pcx = this.x + (this.width * size) / 2 + shakeX;
    const pcy = this.y + (this.height * size) / 2;
    ctx.save();
    // Pivot both the intro/breathing scale and the drag tilt about the centre.
    ctx.translate(pcx, pcy);
    if (tilt) ctx.rotate(tilt);
    if (vis !== 1) ctx.scale(vis, vis);
    ctx.translate(-pcx, -pcy);

    // Soft drop-shadow beneath a lifted relic gives it weight.
    if (this.dragging) {
      renderer.setAlpha(0.3);
      for (const [bc, br] of this.blocks) {
        const bx = this.x + bc * size + shakeX;
        const by = this.y + br * size;
        renderer.fillRoundRect(bx + size * 0.12, by + size * 0.22, size - 2, size - 2, radius, 'rgba(0,0,0,1)');
      }
      renderer.setAlpha(1);
    }

    for (const [bc, br] of this.blocks) {
      const bx = this.x + bc * size + shakeX;
      const by = this.y + br * size;
      drawCrystal(renderer, bx, by, size, this.material, { glow, radius });
    }

    // Occasional tiny sparkle drifting over a resting relic — pure sugar.
    if (!this.dragging && appear >= 1) {
      const sp = Math.sin(time * 0.7 + this.glowPhase * 1.7);
      if (sp > 0.9) {
        const t = (sp - 0.9) / 0.1;               // 0..1 across the twinkle
        const a = Math.sin(t * Math.PI) * 0.8;     // fade in/out
        const seed = this.glowPhase;
        const sx = this.x + (0.3 + 0.5 * (Math.sin(seed * 3.1) * 0.5 + 0.5)) * this.width * size;
        const sy = this.y + (0.2 + 0.5 * (Math.cos(seed * 2.3) * 0.5 + 0.5)) * this.height * size;
        const r = size * 0.14;
        renderer.setAlpha(a);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r * 0.28, sy - r * 0.28);
        ctx.lineTo(sx + r, sy); ctx.lineTo(sx + r * 0.28, sy + r * 0.28);
        ctx.lineTo(sx, sy + r); ctx.lineTo(sx - r * 0.28, sy + r * 0.28);
        ctx.lineTo(sx - r, sy); ctx.lineTo(sx - r * 0.28, sy - r * 0.28);
        ctx.closePath();
        ctx.fill();
        renderer.setAlpha(1);
      }
    }
    ctx.restore();
  }
}
