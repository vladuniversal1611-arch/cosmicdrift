/**
 * Structure.js
 * -----------------------------------------------------------------------------
 * One completed magical structure occupying a set of board cells. It owns its
 * cinematic "rise" animation, a gentle idle float/glow, and its rendering: a
 * unified glowing platform across its footprint plus a central emblem that
 * identifies the type. Pure presentation + a little animation state — the
 * StructureSystem decides when it forms, bonuses, and when it dissolves.
 * -----------------------------------------------------------------------------
 */
import { Config } from '../../config/Config.js';
import { Palette } from '../../config/Palette.js';
import { Easing } from '../../utils/Easing.js';

const RISE_DUR = 0.7;

export class Structure {
  /**
   * @param {object} pattern A StructurePatterns entry.
   * @param {import('../board/Cell.js').Cell[]} cells The cells it occupies.
   */
  constructor(pattern, cells) {
    this.pattern = pattern;
    this.cells = cells;
    this.riseT = 0;
    this.idlePhase = Math.random() * Math.PI * 2;
  }

  get rising() { return this.riseT < RISE_DUR; }

  update(dt) {
    if (this.riseT < RISE_DUR) this.riseT += dt;
  }

  render(renderer, grid, time) {
    const size = grid.cellSize;
    const col = Palette.structures[this.pattern.id];
    const rise = Math.min(1, this.riseT / RISE_DUR);
    const e = Easing.backOut(rise);

    // Rise = emerge upward with a shrinking drop-shadow, then a soft idle float.
    const lift = (1 - e) * size * 0.5 + Math.sin(time * 1.6 + this.idlePhase) * size * 0.03;
    const scale = 0.55 + 0.45 * e;
    const glow = (this.rising ? 0.6 + rise * 0.8 : 0.55 + 0.2 * Math.sin(time * 2.4 + this.idlePhase));
    const flash = this.rising ? (1 - rise) : 0;

    // Footprint platform: one glowing rounded block per cell, lifted together.
    for (const cell of this.cells) {
      const { x, y } = grid.cellToPixel(cell.col, cell.row);
      const s = size * scale;
      const ox = x + (size - s) / 2;
      const oy = y + (size - s) / 2 - lift;

      // Shadow on the board beneath the risen block.
      renderer.setAlpha(0.35 * e);
      renderer.fillRoundRect(x + 3, y + 5, size - 6, size - 6, Config.board.cellRadius, 'rgba(0,0,0,0.6)');
      renderer.setAlpha(1);

      const g = renderer.linearGradient(ox, oy, ox + s, oy + s,
        [[0, col.glow], [0.5, col.core], [1, col.core]]);
      renderer.withGlow(col.glow, 14 * glow, () => {
        renderer.fillRoundRect(ox, oy, s, s, Config.board.cellRadius, g);
      });
      renderer.strokeRoundRect(ox, oy, s, s, Config.board.cellRadius, col.glow, 1.5);
    }

    // Centre emblem at the shape's centroid.
    let cx = 0, cy = 0;
    for (const cell of this.cells) {
      const c = grid.cellCenter(cell.col, cell.row);
      cx += c.x; cy += c.y;
    }
    cx /= this.cells.length; cy /= this.cells.length; cy -= lift;
    this._drawEmblem(renderer, cx, cy, size * 0.9 * scale, col, time, glow);

    // Completion flash.
    if (flash > 0) {
      renderer.setAlpha(flash * 0.6);
      renderer.fillCircle(cx, cy, size * (1 + (1 - flash) * 2), '#ffffff');
      renderer.setAlpha(1);
    }
  }

  _drawEmblem(renderer, cx, cy, s, col, time, glow) {
    const ctx = renderer.ctx;
    const pulse = 0.85 + 0.15 * Math.sin(time * 3 + this.idlePhase);
    renderer.withGlow(col.glow, 12 * glow, () => {
      switch (this.pattern.emblem) {
        case 'crystal': {
          // A tall faceted diamond.
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, cy - s * 0.34 * pulse);
          ctx.lineTo(cx + s * 0.2, cy);
          ctx.lineTo(cx, cy + s * 0.34 * pulse);
          ctx.lineTo(cx - s * 0.2, cy);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'tower': {
          // Stacked battlements.
          ctx.fillStyle = '#ffffff';
          renderer.fillRoundRect(cx - s * 0.16, cy - s * 0.28, s * 0.32, s * 0.5, 2, '#ffffff');
          for (let i = -1; i <= 1; i++) {
            renderer.fillRoundRect(cx + i * s * 0.13 - s * 0.05, cy - s * 0.36, s * 0.1, s * 0.12, 1, '#ffffff');
          }
          break;
        }
        case 'shrine': {
          // A gabled shrine / gate.
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(cx, cy - s * 0.3);
          ctx.lineTo(cx + s * 0.28, cy - s * 0.02);
          ctx.lineTo(cx - s * 0.28, cy - s * 0.02);
          ctx.closePath();
          ctx.fill();
          renderer.fillRoundRect(cx - s * 0.2, cy - s * 0.02, s * 0.4, s * 0.26, 2, '#ffffff');
          break;
        }
        case 'bridge': {
          // An arch.
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = s * 0.12;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy + s * 0.12, s * 0.28, Math.PI, 0);
          ctx.stroke();
          break;
        }
        case 'core':
        default: {
          // Pulsing orb with a soft ring.
          renderer.fillCircle(cx, cy, s * 0.2 * pulse, '#ffffff');
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
      }
    });
  }
}
