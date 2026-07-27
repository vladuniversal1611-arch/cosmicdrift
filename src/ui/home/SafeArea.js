/**
 * SafeArea.js
 * -----------------------------------------------------------------------------
 * The logical safe-area model for full-screen UI. Physical display cutouts are
 * already handled by the `#stage` CSS padding (env(safe-area-inset-*)), which
 * insets the whole canvas so nothing can render under a notch or status bar.
 * This module layers a *logical* inset on top so header/nav content keeps a
 * comfortable margin from the edges on every aspect ratio (16:9 → 20:9, tablet,
 * foldables) without hard-coding numbers into each component.
 *
 * It also exposes the canonical vertical bands the Home Screen lays out into:
 * a fixed-height header at the top and a fixed-height navigation bar at the
 * bottom, with the flexible play area between them. Bands scale with the safe
 * insets so they never collide with the edges.
 * -----------------------------------------------------------------------------
 */
export class SafeArea {
  /**
   * @param {number} w logical width  (1080)
   * @param {number} h logical height (2400)
   * @param {object} [insets] extra logical insets { top,right,bottom,left }
   */
  constructor(w, h, insets = {}) {
    this.w = w;
    this.h = h;
    // Modest default logical margins on top of the CSS physical safe area.
    this.top = insets.top ?? 20;
    this.right = insets.right ?? 16;
    this.bottom = insets.bottom ?? 20;
    this.left = insets.left ?? 16;
    /** Fixed band heights (logical px) from the spec. */
    this.headerH = 180;
    this.navH = 210;
  }

  /** Update dynamic insets (e.g. from device cutout metrics). */
  set(insets) { Object.assign(this, insets); return this; }

  /** Content rectangle inside the safe insets. */
  get contentLeft() { return this.left; }
  get contentRight() { return this.w - this.right; }
  get contentWidth() { return this.w - this.left - this.right; }
  get centerX() { return this.w / 2; }

  /** Header band: { x, y, w, h } just below the top safe inset. */
  get header() {
    return { x: this.left, y: this.top, w: this.contentWidth, h: this.headerH };
  }

  /** Bottom navigation band. */
  get nav() {
    const y = this.h - this.bottom - this.navH;
    return { x: 0, y, w: this.w, h: this.navH + this.bottom };
  }

  /** Flexible play area between the header and the nav. */
  get play() {
    const y = this.top + this.headerH;
    const bottom = this.h - this.bottom - this.navH;
    return { x: this.left, y, w: this.contentWidth, h: bottom - y };
  }
}
