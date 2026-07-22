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
import { Quality } from '../config/Quality.js';

export class Renderer {
  /**
   * @param {import('./Canvas.js').Canvas} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.ctx;
    /** Per-frame screen-shake offset (logical px), set by gameplay each frame. */
    this.shakeX = 0;
    this.shakeY = 0;
    /** Cinematic camera zoom about the screen centre (1 = none). */
    this.zoom = 1;
  }

  /** Begin a frame: apply the logical transform and clear the backing store. */
  begin() {
    const { ctx } = this;
    // Clear in device space, then switch to logical space for drawing.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.el.width, this.canvas.el.height);
    this.canvas.applyTransform();
    // Apply screen shake to the whole scene. The WorldSystem overfills its
    // gradient so the shifted viewport never reveals bare edges.
    if (this.shakeX || this.shakeY) ctx.translate(this.shakeX, this.shakeY);
    // Cinematic zoom about the logical centre (combo finales).
    if (this.zoom !== 1) {
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;
      ctx.translate(cx, cy);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-cx, -cy);
    }
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
   * Build a linear gradient from stops `[[offset,color], ...]`. Returned value
   * can be passed anywhere a colour string is accepted (fillRoundRect etc.).
   */
  linearGradient(x0, y0, x1, y1, stops) {
    const g = this.ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [offset, color] of stops) g.addColorStop(offset, color);
    return g;
  }

  /** Build a radial gradient from stops (see linearGradient). */
  radialGradient(x, y, r, stops) {
    const g = this.ctx.createRadialGradient(x, y, 0, x, y, r);
    for (const [offset, color] of stops) g.addColorStop(offset, color);
    return g;
  }

  /** Draw a 4-point sparkle/star — used for clear sparks and specular pops. */
  sparkle(x, y, r, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    // Concave 4-point star.
    const inner = r * 0.28;
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI / 4) * i;
      const rad = i % 2 === 0 ? r : inner;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
      // Optional soft dark outline — keeps white text readable over the bright
      // sky/board. Pass `outline` a colour and `outlineWidth` a px width.
      outline = null,
      outlineWidth = 3,
    } = opts;
    this.ctx.font = font;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    if (outline) {
      this.ctx.lineJoin = 'round';
      this.ctx.lineWidth = outlineWidth;
      this.ctx.strokeStyle = outline;
      this.ctx.strokeText(str, x, y);
    }
    this.ctx.fillStyle = color;
    this.ctx.fillText(str, x, y);
  }

  /**
   * Run `drawFn` with a soft glow applied, honouring the high-quality flag so
   * weak devices can skip the expensive shadow blur.
   */
  withGlow(color, blur, drawFn) {
    if (!Quality.highQuality) return drawFn();
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

  /**
   * Trace a rounded-rect sub-path without filling/stroking it, so callers can
   * clip to it (e.g. faceting a crystal). Leaves the path current on the ctx.
   */
  roundRectPath(x, y, w, h, r) { this._roundRectPath(x, y, w, h, r); }

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
