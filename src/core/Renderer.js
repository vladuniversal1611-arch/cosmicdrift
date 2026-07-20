/**
 * Renderer.js
 * -----------------------------------------------------------------------------
 * A thin drawing façade over the Canvas 2D context.
 *
 * Systems draw through these helpers instead of touching ctx directly. That
 * keeps draw code terse, gives us one place to add batching / quality toggles
 * later, and decouples systems from the raw canvas API. All coordinates are
 * logical units (see Canvas).
 * -----------------------------------------------------------------------------
 */
import { Config } from '../config/Config.js';

export class Renderer {
  /**
   * @param {import('./Canvas.js').Canvas} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.ctx;
  }

  /** Begin a frame: apply the logical transform and clear the backing store. */
  begin() {
    const { ctx } = this;
    // Clear in device space, then switch to logical space for drawing.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.el.width, this.canvas.el.height);
    this.canvas.applyTransform();
  }

  /** End a frame. Reserved for future post-processing / present logic. */
  end() {}

  // --- Context state helpers -------------------------------------------------
  save() { this.ctx.save(); }
  restore() { this.ctx.restore(); }
  translate(x, y) { this.ctx.translate(x, y); }
  rotate(rad) { this.ctx.rotate(rad); }
  scale(x, y) { this.ctx.scale(x, y); }
  setAlpha(a) { this.ctx.globalAlpha = a; }

  // --- Primitives ------------------------------------------------------------
  fillRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  /** Fill a rounded rectangle. `r` may be a number or per-corner array. */
  fillRoundRect(x, y, w, h, r, color) {
    this._roundRectPath(x, y, w, h, r);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  strokeRoundRect(x, y, w, h, r, color, lineWidth = 1) {
    this._roundRectPath(x, y, w, h, r);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.stroke();
  }

  fillCircle(x, y, radius, color) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }

  /**
   * Draw text. `opts` accepts { font, color, align, baseline }.
   * Fonts are described in logical pixels.
   */
  text(str, x, y, opts = {}) {
    const {
      font = '16px system-ui, sans-serif',
      color = '#fff',
      align = 'left',
      baseline = 'alphabetic',
    } = opts;
    this.ctx.font = font;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(str, x, y);
  }

  /**
   * Run `drawFn` with a soft glow applied, honouring the high-quality flag so
   * weak devices can skip the expensive shadow blur.
   */
  withGlow(color, blur, drawFn) {
    if (!Config.render.highQuality) return drawFn();
    const { ctx } = this;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    drawFn();
    ctx.restore();
  }

  /** Paint a vertical gradient over the full logical viewport. */
  fillBackgroundGradient(stops) {
    const g = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    const step = 1 / Math.max(1, stops.length - 1);
    stops.forEach((c, i) => g.addColorStop(i * step, c));
    this.fillRect(0, 0, this.canvas.width, this.canvas.height, g);
  }

  // --- Internal --------------------------------------------------------------
  _roundRectPath(x, y, w, h, r) {
    const ctx = this.ctx;
    const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x + w, y, x + w, y + tr, tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x, y + h, x, y + h - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  }
}
